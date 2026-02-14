"use client";

/**
 * File Upload Zone Component
 *
 * Drag & drop zone for uploading course materials (PDF, DOCX, TXT).
 * Shows upload progress and status per file.
 */

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  FileType,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileProcessingState } from "@/types/source-documents";

const ACCEPTED_TYPES = ".pdf,.docx,.txt";
const ACCEPTED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

interface FileUploadZoneProps {
  files: FileProcessingState[];
  onFilesSelected: (files: FileList) => void;
  onFileRemoved: (index: number) => void;
  onRetry?: (index: number) => void;
  isProcessing: boolean;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type }: { type: string }) {
  if (type === "application/pdf" || type.endsWith(".pdf")) {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  if (type.includes("wordprocessingml") || type.endsWith(".docx")) {
    return <FileType className="h-4 w-4 text-blue-500" />;
  }
  return <FileText className="h-4 w-4 text-gray-500" />;
}

function StatusIndicator({ status }: { status: FileProcessingState["status"] }) {
  switch (status) {
    case "uploading":
    case "processing":
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
  }
}

function statusLabel(status: FileProcessingState["status"], progress?: number): string {
  switch (status) {
    case "uploading":
      return "Wysyłanie...";
    case "processing":
      if (progress != null && progress > 50) {
        return `Generowanie embeddingów (${progress}%)...`;
      }
      return "Przetwarzanie tekstu...";
    case "completed":
      return "Gotowy";
    case "error":
      return "Błąd";
  }
}

export function FileUploadZone({
  files,
  onFilesSelected,
  onFileRemoved,
  onRetry,
  isProcessing,
  disabled = false,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const dt = e.dataTransfer;
      if (dt.files.length > 0) {
        // Filter to accepted types
        const validFiles = Array.from(dt.files).filter((f) =>
          ACCEPTED_MIME.includes(f.type) ||
          f.name.endsWith(".txt") ||
          f.name.endsWith(".pdf") ||
          f.name.endsWith(".docx")
        );
        if (validFiles.length > 0) {
          const dataTransfer = new DataTransfer();
          validFiles.forEach((f) => dataTransfer.items.add(f));
          onFilesSelected(dataTransfer.files);
        }
      }
    },
    [disabled, onFilesSelected]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelected(e.target.files);
        // Reset input value to allow re-uploading same file
        e.target.value = "";
      }
    },
    [onFilesSelected]
  );

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">
            Przeciągnij pliki lub kliknij aby wybrać
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, TXT (max 50MB, do 10 plików)
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileState, index) => (
            <div
              key={`${fileState.file.name}-${index}`}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                fileState.status === "error" && "border-destructive/50 bg-destructive/5"
              )}
            >
              <FileIcon type={fileState.file.type || fileState.file.name} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {fileState.file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(fileState.file.size)}</span>
                  {fileState.wordCount && (
                    <>
                      <span>|</span>
                      <span>{fileState.wordCount.toLocaleString("pl")} słów</span>
                    </>
                  )}
                  <span>|</span>
                  <span className={cn(
                    fileState.status === "error" && "text-destructive"
                  )}>
                    {fileState.error || statusLabel(fileState.status, fileState.progress)}
                  </span>
                </div>

                {/* Progress bar */}
                {(fileState.status === "uploading" || fileState.status === "processing") && (
                  <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${fileState.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <StatusIndicator status={fileState.status} />

              {fileState.status === "error" && fileState.documentId && onRetry && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  title="Ponów przetwarzanie"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry(index);
                  }}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileRemoved(index);
                }}
                disabled={fileState.status === "uploading"}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
