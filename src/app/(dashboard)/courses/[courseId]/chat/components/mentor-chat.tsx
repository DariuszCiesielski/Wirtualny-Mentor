'use client';

/**
 * Mentor Chat Component
 *
 * Chat interface for Socratic mentor chatbot.
 * Supports text messages and file attachments (images, PDFs).
 * Uses useChat hook with streaming for real-time AI responses.
 */

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import type { FileUIPart } from 'ai';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Send,
  Loader2,
  Bot,
  User,
  Square,
  Paperclip,
  X,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MentorChatProps {
  courseId: string;
  courseTitle: string;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES =
  'image/png,image/jpeg,image/gif,image/webp,application/pdf';

/**
 * Extract text content from UIMessage parts
 */
function getMessageText(
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
function getMessageFiles(
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

/**
 * File preview in attachment bar (before sending)
 */
function AttachmentPreview({
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
function MessageFile({ file }: { file: FileUIPart }) {
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

export function MentorChat({ courseId, courseTitle }: MentorChatProps) {
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat/mentor',
        body: { courseId },
      }),
    [courseId]
  );

  const initialMessages: UIMessage[] = useMemo(
    () => [
      {
        id: 'welcome',
        role: 'assistant' as const,
        parts: [
          {
            type: 'text' as const,
            text: `Czesc! Jestem Twoim mentorem dla kursu "${courseTitle}".

Jestem tutaj, zeby pomoc Ci sie uczyc - ale nie przez dawanie gotowych odpowiedzi! Zamiast tego bede zadawal pytania, ktore naprowadza Cie na rozwiazanie.

Mozesz tez wyslac mi zrzuty ekranu lub dokumenty PDF - przeanalizuje je i pomoge Ci zrozumiec material.

O czym chcesz porozmawiać?`,
          },
        ],
      },
    ],
    [courseTitle]
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    transport,
    messages: initialMessages,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > MAX_FILE_SIZE) {
          alert(`Plik "${file.name}" jest za duży (max 10MB).`);
          continue;
        }
        newFiles.push(file);
      }

      setAttachedFiles((prev) => {
        const combined = [...prev, ...newFiles];
        if (combined.length > MAX_FILES) {
          alert(`Maksymalnie ${MAX_FILES} plików na wiadomość.`);
          return combined.slice(0, MAX_FILES);
        }
        return combined;
      });

      // Reset so the same file can be re-selected
      e.target.value = '';
    },
    []
  );

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = input.trim().length > 0;
    const hasFiles = attachedFiles.length > 0;

    if ((!hasText && !hasFiles) || isLoading) return;

    if (hasFiles) {
      const dt = new DataTransfer();
      attachedFiles.forEach((f) => dt.items.add(f));

      if (hasText) {
        await sendMessage({ text: input.trim(), files: dt.files });
      } else {
        await sendMessage({ files: dt.files });
      }
    } else {
      await sendMessage({ text: input.trim() });
    }

    setInput('');
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend =
    !isLoading && (input.trim().length > 0 || attachedFiles.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const content = getMessageText(message.parts);
          const files = getMessageFiles(message.parts);

          return (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                isUser ? 'justify-end' : 'justify-start'
              )}
            >
              {!isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <Card
                className={cn(
                  'px-4 py-3 max-w-[80%]',
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {content && (
                  <p className="text-sm whitespace-pre-wrap">{content}</p>
                )}
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, i) => (
                      <MessageFile key={i} file={file} />
                    ))}
                  </div>
                )}
              </Card>
              {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <Card className="px-4 py-3 bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </Card>
          </div>
        )}

        {error && (
          <div className="text-destructive text-sm text-center">
            Wystąpił błąd. Spróbuj ponownie.
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        {/* Attachment previews */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachedFiles.map((file, index) => (
              <AttachmentPreview
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => removeFile(index)}
              />
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Attach button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || attachedFiles.length >= MAX_FILES}
            title="Dodaj pliki (obrazy, PDF)"
            className="shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zadaj pytanie mentorowi..."
            disabled={isLoading}
            className="min-h-[60px] resize-none"
            rows={2}
          />

          <Button
            type="submit"
            disabled={!canSend}
            size="icon"
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={stop}
            className="mt-2 w-full"
          >
            <Square className="h-3 w-3 mr-2" />
            Zatrzymaj
          </Button>
        )}
      </form>
    </div>
  );
}
