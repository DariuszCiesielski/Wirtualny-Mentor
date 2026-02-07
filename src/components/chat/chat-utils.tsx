'use client';

/**
 * Shared chat utilities for MentorChat and InlineMentorChat.
 *
 * Extracted to avoid duplication between full chat page and inline chapter chat.
 */

import { useMemo, useEffect, useState } from 'react';
import type { FileUIPart } from 'ai';
import { Button } from '@/components/ui/button';
import { Copy, Check, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessageFile } from '@/types/chat';

// ============================================================================
// CONSTANTS
// ============================================================================

export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_TYPES =
  'image/png,image/jpeg,image/gif,image/webp,application/pdf';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Upload a file to Supabase Storage via the upload API
 */
export async function uploadFile(
  file: File,
  sessionId: string
): Promise<ChatMessageFile & { signedUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sessionId', sessionId);

  const res = await fetch('/api/chat/files/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Upload failed');
  }

  return res.json();
}

/**
 * Extract text content from UIMessage parts
 */
export function getMessageText(
  parts: Array<{ type: string; text?: string }>
): string {
  return parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text)
    .join('');
}

/**
 * Extract file parts from UIMessage parts
 */
export function getMessageFiles(
  parts: Array<{
    type: string;
    mediaType?: string;
    url?: string;
    filename?: string;
  }>
): FileUIPart[] {
  return parts.filter(
    (p): p is FileUIPart => p.type === 'file' && !!p.url
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * File preview in attachment bar (before sending)
 */
export function AttachmentPreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const isImage = file.type.startsWith('image/');
  const previewUrl = useMemo(
    () => (isImage ? URL.createObjectURL(file) : null),
    [file, isImage]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="relative flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1.5 text-xs">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="h-8 w-8 rounded object-cover"
        />
      ) : (
        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
      )}
      <span className="truncate max-w-[120px]">{file.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-auto rounded-full p-0.5 hover:bg-destructive/10 transition-colors"
        aria-label={`Usuń ${file.name}`}
      >
        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}

/**
 * Inline file display in sent message
 */
export function MessageFile({ file }: { file: FileUIPart }) {
  const isImage = file.mediaType?.startsWith('image/');

  if (isImage) {
    return (
      <img
        src={file.url}
        alt={file.filename || 'Załączony obraz'}
        className="max-w-full max-h-64 rounded-md mt-2"
      />
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2 text-xs opacity-80 border rounded-md px-2 py-1.5">
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{file.filename || 'Dokument'}</span>
    </div>
  );
}
