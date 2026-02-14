/**
 * useFileUpload - Custom hook for managing file uploads during course creation
 *
 * Two-stage processing:
 * 1. Upload + extract + chunk (no embeddings) via /api/curriculum/upload
 * 2. Embed chunks via /api/curriculum/embed-chunks (looped for large files)
 *
 * Stage 2 supports chunked embedding — calls embed-chunks in a loop,
 * each call processes up to 250 chunks (~15-25s), with real progress tracking.
 * Falls back to polling if embed request fails/times out.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  FileProcessingState,
  FileUploadStatus,
  UploadedSourceFile,
} from "@/types/source-documents";

const MAX_FILES = 10;

const POLL_INTERVAL = 2000;

interface EmbedChunksResponse {
  documentId: string;
  status: "completed" | "in_progress";
  embeddedCount: number;
  remainingCount: number;
  totalChunks: number;
}

export function useFileUpload() {
  const [files, setFiles] = useState<FileProcessingState[]>([]);
  const pollTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Cleanup polling on unmount
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
   * Stage 2: Call embed-chunks endpoint in a loop for chunked embedding.
   * Each call processes up to 250 chunks (~15-25s). Loops until all done.
   * Progress updates dynamically: 50% → ... → 95% → 100%.
   * On failure, falls back to polling.
   */
  const embedDocument = useCallback(
    async (documentId: string, fileIndex: number) => {
      let totalEmbedded = 0;
      let knownTotal = 0;

      try {
        updateFileStatus(fileIndex, { status: "processing", progress: 50 });

        while (true) {
          const response = await fetch("/api/curriculum/embed-chunks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId }),
          });

          if (!response.ok) {
            throw new Error("Embed request failed");
          }

          const result: EmbedChunksResponse = await response.json();

          totalEmbedded += result.embeddedCount;
          knownTotal = totalEmbedded + result.remainingCount;

          if (result.status === "completed" || result.remainingCount === 0) {
            updateFileStatus(fileIndex, {
              status: "completed",
              progress: 100,
            });
            return;
          }

          // Update progress: map embedded/total to 50-95% range
          const embedProgress = knownTotal > 0
            ? Math.round(50 + (totalEmbedded / knownTotal) * 45)
            : 55;
          updateFileStatus(fileIndex, { progress: embedProgress });
          // Loop continues — next batch
        }
      } catch {
        console.warn(`[useFileUpload] Embed failed for ${documentId} (embedded: ${totalEmbedded}), falling back to polling`);
        startPolling(documentId, fileIndex);
      }
    },
    [updateFileStatus, startPolling]
  );

  /**
   * Retry embedding for a file that previously failed or got stuck.
   */
  const retryEmbedding = useCallback(
    async (fileIndex: number) => {
      const fileState = files[fileIndex];
      if (!fileState?.documentId) return;
      updateFileStatus(fileIndex, { status: "processing", progress: 50, error: undefined });
      await embedDocument(fileState.documentId, fileIndex);
    },
    [files, updateFileStatus, embedDocument]
  );

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const newFiles = Array.from(fileList);

      // Check total limit
      setFiles((prev) => {
        const totalCount = prev.length + newFiles.length;
        if (totalCount > MAX_FILES) {
          const slotsLeft = MAX_FILES - prev.length;
          newFiles.splice(slotsLeft);
        }
        return prev;
      });

      if (newFiles.length === 0) return;

      // Add files with 'uploading' status
      const startIndex = files.length;
      const newEntries: FileProcessingState[] = newFiles.map((file) => ({
        file,
        status: "uploading" as FileUploadStatus,
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newEntries]);

      // Upload each file sequentially to avoid overwhelming the server
      for (let i = 0; i < newFiles.length; i++) {
        const fileIndex = startIndex + i;
        const file = newFiles[i];

        try {
          updateFileStatus(fileIndex, { status: "uploading", progress: 10 });

          const formData = new FormData();
          formData.append("file", file);

          updateFileStatus(fileIndex, { progress: 30 });

          // Stage 1: Upload + extract + chunk
          const response = await fetch("/api/curriculum/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Upload failed");
          }

          const result: UploadedSourceFile = await response.json();

          if (result.processingStatus === "failed") {
            updateFileStatus(fileIndex, {
              status: "error",
              progress: 100,
              error: result.processingError || "Nie udało się przetworzyć pliku",
              documentId: result.documentId,
            });
          } else if (result.processingStatus === "extracted") {
            // Stage 1 done — trigger stage 2 (embedding loop)
            updateFileStatus(fileIndex, {
              status: "processing",
              progress: 50,
              documentId: result.documentId,
              wordCount: result.wordCount,
            });
            // Don't await — let embedding happen while next file uploads
            embedDocument(result.documentId, fileIndex);
          } else if (result.processingStatus === "completed") {
            // Both stages done (small file, fast processing)
            updateFileStatus(fileIndex, {
              status: "completed",
              progress: 100,
              documentId: result.documentId,
              extractedTextPreview: result.extractedTextPreview,
              wordCount: result.wordCount,
            });
          } else {
            // processing/pending — poll for completion
            updateFileStatus(fileIndex, {
              status: "processing",
              progress: 50,
              documentId: result.documentId,
            });
            startPolling(result.documentId, fileIndex);
          }
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
    [files.length, updateFileStatus, startPolling, embedDocument]
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
    retryEmbedding,
    isProcessing,
    completedDocumentIds,
    hasFiles,
  };
}
