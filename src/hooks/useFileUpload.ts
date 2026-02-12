/**
 * useFileUpload - Custom hook for managing file uploads during course creation
 *
 * Handles uploading files to /api/curriculum/upload, tracking per-file status,
 * and collecting document IDs of completed uploads.
 */

import { useState, useCallback } from "react";
import type {
  FileProcessingState,
  FileUploadStatus,
  UploadedSourceFile,
} from "@/types/source-documents";

const MAX_FILES = 10;

export function useFileUpload() {
  const [files, setFiles] = useState<FileProcessingState[]>([]);

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

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const newFiles = Array.from(fileList);

      // Check total limit
      setFiles((prev) => {
        const totalCount = prev.length + newFiles.length;
        if (totalCount > MAX_FILES) {
          // Only take what fits
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
              error: "Nie udało się przetworzyć pliku",
              documentId: result.documentId,
            });
          } else {
            updateFileStatus(fileIndex, {
              status: "completed",
              progress: 100,
              documentId: result.documentId,
              extractedTextPreview: result.extractedTextPreview,
              wordCount: result.wordCount,
            });
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
    [files.length, updateFileStatus]
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
    isProcessing,
    completedDocumentIds,
    hasFiles,
  };
}
