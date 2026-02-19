/**
 * useFileUpload - Custom hook for managing file uploads during course creation
 *
 * Four-stage processing (each fits within Vercel's 60s limit):
 * 1. Upload file directly to Supabase Storage from browser (bypasses Vercel 4.5MB limit)
 *    + register metadata via /api/curriculum/register-document
 * 2. Extract text via /api/curriculum/extract-text (~40-55s for large PDFs)
 * 3. Chunk text via /api/curriculum/extract-chunks (~5-10s)
 * 4. Embed chunks via /api/curriculum/embed-chunks (looped, ~15-25s/batch)
 *
 * Persists across page refreshes: loads unlinked documents from DB on mount.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  FileProcessingState,
  FileUploadStatus,
  SourceFileType,
} from "@/types/source-documents";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const POLL_INTERVAL = 2000;

const ALLOWED_TYPES: Record<string, SourceFileType> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

function detectFileType(mimeType: string, filename: string): SourceFileType | null {
  if (ALLOWED_TYPES[mimeType]) return ALLOWED_TYPES[mimeType];
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "txt") return "txt";
  return null;
}

/** Map DB processing_status to UI status for documents loaded on mount.
 *  Non-completed docs show as error with retry button (pipeline was interrupted). */
function mapDbStatus(
  dbStatus: string,
  dbError?: string | null
): { status: FileUploadStatus; progress: number; error?: string } {
  switch (dbStatus) {
    case "completed":
      return { status: "completed", progress: 100 };
    case "failed":
      return { status: "error", progress: 100, error: dbError || "Przetwarzanie nie powiodło się" };
    default:
      // pending, processing, extracted — interrupted, user can click retry
      return { status: "error", progress: 100, error: "Przetwarzanie przerwane — kliknij ponów" };
  }
}

interface UploadResponse {
  documentId: string;
  filename: string;
  fileType: string;
  fileSize: number;
}

interface ExtractTextResponse {
  documentId: string;
  wordCount?: number;
  pageCount?: number;
  alreadyExtracted?: boolean;
}

interface ChunkResponse {
  documentId: string;
  chunkCount?: number;
  wordCount?: number;
  status: string;
  alreadyProcessed?: boolean;
}

interface EmbedChunksResponse {
  documentId: string;
  status: "completed" | "in_progress";
  embeddedCount: number;
  remainingCount: number;
  totalChunks: number;
}

/**
 * Safe JSON parse from Response — handles non-JSON responses (e.g. Vercel 504 HTML).
 */
async function safeResponseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      response.status >= 500
        ? `Serwer zwrócił błąd ${response.status}. Spróbuj ponownie.`
        : text.slice(0, 200)
    );
  }
}

export function useFileUpload() {
  const [files, setFiles] = useState<FileProcessingState[]>([]);
  const pollTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const loadedRef = useRef(false);

  // Load existing unlinked documents from DB on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadExistingDocuments = async () => {
      try {
        const supabase = createClient();
        const { data: docs } = await supabase
          .from("course_source_documents")
          .select("id, filename, file_type, file_size, processing_status, processing_error, text_summary, word_count")
          .is("course_id", null)
          .order("created_at", { ascending: true });

        if (!docs || docs.length === 0) return;

        const existing: FileProcessingState[] = docs.map((doc) => {
          const mapped = mapDbStatus(doc.processing_status, doc.processing_error);
          return {
            filename: doc.filename,
            fileSize: doc.file_size,
            fileType: doc.file_type,
            documentId: doc.id,
            status: mapped.status,
            progress: mapped.progress,
            error: mapped.error,
            extractedTextPreview: doc.text_summary?.slice(0, 200),
            wordCount: doc.word_count ?? undefined,
          };
        });

        setFiles(existing);
      } catch (err) {
        console.warn("[useFileUpload] Failed to load existing documents:", err);
      }
    };

    loadExistingDocuments();
  }, []);

  useEffect(() => {
    return () => {
      pollTimers.current.forEach((timer) => clearInterval(timer));
    };
  }, []);

  const updateFileStatus = useCallback(
    (
      index: number,
      updates: Partial<Pick<FileProcessingState, "status" | "progress" | "error" | "documentId" | "extractedTextPreview" | "wordCount">>
    ) => {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const startPolling = useCallback(
    (documentId: string, fileIndex: number) => {
      if (pollTimers.current.has(documentId)) return;

      const supabase = createClient();
      const timer = setInterval(async () => {
        const { data } = await supabase
          .from("course_source_documents")
          .select("processing_status, processing_error, text_summary, word_count")
          .eq("id", documentId)
          .single();

        if (!data) return;

        if (data.processing_status === "completed") {
          clearInterval(timer);
          pollTimers.current.delete(documentId);
          updateFileStatus(fileIndex, {
            status: "completed",
            progress: 100,
            extractedTextPreview: data.text_summary?.slice(0, 200),
            wordCount: data.word_count ?? undefined,
          });
        } else if (data.processing_status === "failed") {
          clearInterval(timer);
          pollTimers.current.delete(documentId);
          updateFileStatus(fileIndex, {
            status: "error",
            progress: 100,
            error: data.processing_error || "Nie udało się przetworzyć pliku",
          });
        }
      }, POLL_INTERVAL);

      pollTimers.current.set(documentId, timer);
    },
    [updateFileStatus]
  );

  /**
   * Stage 4: Embed chunks in a loop. Each call processes up to 250 chunks.
   * On failure, falls back to polling.
   */
  const embedDocument = useCallback(
    async (documentId: string, fileIndex: number) => {
      let totalEmbedded = 0;
      let knownTotal = 0;

      try {
        while (true) {
          const response = await fetch("/api/curriculum/embed-chunks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId }),
          });

          if (!response.ok) {
            const err = await safeResponseJson<{ error?: string }>(response);
            throw new Error(err.error || "Embed request failed");
          }

          const result = await safeResponseJson<EmbedChunksResponse>(response);

          totalEmbedded += result.embeddedCount;
          knownTotal = totalEmbedded + result.remainingCount;

          if (result.status === "completed" || result.remainingCount === 0) {
            updateFileStatus(fileIndex, {
              status: "completed",
              progress: 100,
            });
            return;
          }

          const embedProgress = knownTotal > 0
            ? Math.round(70 + (totalEmbedded / knownTotal) * 25)
            : 75;
          updateFileStatus(fileIndex, { progress: embedProgress });
        }
      } catch {
        console.warn(`[useFileUpload] Embed failed for ${documentId}, falling back to polling`);
        startPolling(documentId, fileIndex);
      }
    },
    [updateFileStatus, startPolling]
  );

  /**
   * Stage 3: Chunk text (reads extracted text from DB — fast).
   */
  const chunkDocument = useCallback(
    async (documentId: string, fileIndex: number): Promise<boolean> => {
      try {
        updateFileStatus(fileIndex, { progress: 55 });

        const response = await fetch("/api/curriculum/extract-chunks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId }),
        });

        if (!response.ok) {
          const err = await safeResponseJson<{ error?: string }>(response);
          throw new Error(err.error || "Chunking failed");
        }

        await safeResponseJson<ChunkResponse>(response);
        updateFileStatus(fileIndex, { progress: 65 });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Chunkowanie tekstu nie powiodło się";
        updateFileStatus(fileIndex, { status: "error", progress: 100, error: message });
        return false;
      }
    },
    [updateFileStatus]
  );

  /**
   * Stage 2: Extract text from uploaded file (downloads from Storage, uses unpdf/mammoth).
   */
  const extractText = useCallback(
    async (documentId: string, fileIndex: number): Promise<boolean> => {
      try {
        updateFileStatus(fileIndex, { status: "processing", progress: 20 });

        const response = await fetch("/api/curriculum/extract-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId }),
        });

        if (!response.ok) {
          const err = await safeResponseJson<{ error?: string }>(response);
          throw new Error(err.error || "Text extraction failed");
        }

        const result = await safeResponseJson<ExtractTextResponse>(response);
        updateFileStatus(fileIndex, { progress: 50, wordCount: result.wordCount });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Ekstrakcja tekstu nie powiodła się";
        updateFileStatus(fileIndex, { status: "error", progress: 100, error: message });
        return false;
      }
    },
    [updateFileStatus]
  );

  /**
   * Retry processing from the beginning (extract → chunk → embed).
   * Each stage is idempotent: skips work already completed.
   */
  const retryProcessing = useCallback(
    async (fileIndex: number) => {
      let documentId: string | undefined;
      setFiles((prev) => {
        documentId = prev[fileIndex]?.documentId;
        return prev;
      });

      if (!documentId) return;
      updateFileStatus(fileIndex, { status: "processing", progress: 15, error: undefined });

      // Re-run all stages — each skips if already done
      const extracted = await extractText(documentId, fileIndex);
      if (!extracted) return;

      const chunked = await chunkDocument(documentId, fileIndex);
      if (!chunked) return;

      updateFileStatus(fileIndex, { status: "processing", progress: 70 });
      embedDocument(documentId, fileIndex);
    },
    [updateFileStatus, extractText, chunkDocument, embedDocument]
  );

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const newFiles = Array.from(fileList);

      let startIndex = 0;
      setFiles((prev) => {
        const totalCount = prev.length + newFiles.length;
        if (totalCount > MAX_FILES) {
          const slotsLeft = MAX_FILES - prev.length;
          newFiles.splice(slotsLeft);
        }
        startIndex = prev.length;
        return prev;
      });

      if (newFiles.length === 0) return;

      const newEntries: FileProcessingState[] = newFiles.map((file) => ({
        file,
        filename: file.name,
        fileSize: file.size,
        fileType: file.type || file.name,
        status: "uploading" as FileUploadStatus,
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newEntries]);

      for (let i = 0; i < newFiles.length; i++) {
        const fileIndex = startIndex + i;
        const file = newFiles[i];

        try {
          // Stage 1a: Validate & upload directly to Supabase Storage
          updateFileStatus(fileIndex, { status: "uploading", progress: 3 });

          const fileType = detectFileType(file.type, file.name);
          if (!fileType) {
            throw new Error(`Nieobsługiwany typ pliku. Dozwolone: PDF, DOCX, TXT`);
          }
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`Plik za duży (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
          }

          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error("Musisz być zalogowany aby przesyłać pliki");
          }

          const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const storagePath = `${user.id}/${crypto.randomUUID()}_${sanitizedName}`;

          updateFileStatus(fileIndex, { progress: 5 });

          const { error: storageError } = await supabase.storage
            .from("course-materials")
            .upload(storagePath, file, {
              contentType: file.type,
              upsert: false,
            });

          if (storageError) {
            throw new Error(`Błąd przesyłania: ${storageError.message}`);
          }

          updateFileStatus(fileIndex, { progress: 12 });

          // Stage 1b: Register metadata in DB (JSON, ~200 bytes)
          const registerResponse = await fetch("/api/curriculum/register-document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              fileType,
              fileSize: file.size,
              storagePath,
            }),
          });

          if (!registerResponse.ok) {
            // Cleanup orphaned file from Storage
            await supabase.storage.from("course-materials").remove([storagePath]);
            const err = await safeResponseJson<{ error?: string }>(registerResponse);
            throw new Error(err.error || "Rejestracja dokumentu nie powiodła się");
          }

          const { documentId } = await safeResponseJson<UploadResponse>(registerResponse);

          updateFileStatus(fileIndex, {
            status: "processing",
            progress: 15,
            documentId,
          });

          // Stage 2: Extract text (downloads from Storage, heavy)
          const extracted = await extractText(documentId, fileIndex);
          if (!extracted) continue;

          // Stage 3: Chunk text (reads from DB, fast)
          const chunked = await chunkDocument(documentId, fileIndex);
          if (!chunked) continue;

          // Stage 4: Embed chunks (don't await — runs in background)
          updateFileStatus(fileIndex, { status: "processing", progress: 70 });
          embedDocument(documentId, fileIndex);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Nieznany błąd";
          updateFileStatus(fileIndex, {
            status: "error",
            progress: 100,
            error: message,
          });
        }
      }
    },
    [updateFileStatus, extractText, chunkDocument, embedDocument]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const isProcessing = files.some(
    (f) => f.status === "uploading" || f.status === "processing"
  );

  const completedDocumentIds = files
    .filter((f) => f.status === "completed" && f.documentId)
    .map((f) => f.documentId!);

  const hasFiles = files.length > 0;

  return {
    files,
    uploadFiles,
    removeFile,
    retryProcessing,
    isProcessing,
    completedDocumentIds,
    hasFiles,
  };
}
