'use client';

/**
 * Inline Mentor Chat Component
 *
 * Compact version of MentorChat for display alongside lesson content.
 * Auto-creates session per chapter, supports file uploads,
 * and accepts prefilled text from text selection.
 */

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
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
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessageFile } from '@/types/chat';
import {
  uploadFile,
  getMessageText,
  getMessageFiles,
  AttachmentPreview,
  MessageFile,
  MAX_FILES,
  MAX_FILE_SIZE,
  ACCEPTED_TYPES,
} from '@/components/chat/chat-utils';

interface InlineMentorChatProps {
  courseId: string;
  courseTitle: string;
  sessionId: string;
  chapterTitle: string;
  chapterContext: string;
  initialMessages?: UIMessage[];
  /** Pre-fill text from text selection or section ask */
  prefillText?: string | null;
  /** Clear prefill after it's been consumed */
  onPrefillConsumed?: () => void;
  onClose: () => void;
}

export function InlineMentorChat({
  courseId,
  courseTitle,
  sessionId,
  chapterTitle,
  chapterContext,
  initialMessages: initialMessagesProp,
  prefillText,
  onPrefillConsumed,
  onClose,
}: InlineMentorChatProps) {
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Consume prefill text
  useEffect(() => {
    if (prefillText) {
      setInput(prefillText);
      onPrefillConsumed?.();
    }
  }, [prefillText, onPrefillConsumed]);

  // Mutable body - DefaultChatTransport holds reference
  const [body] = useState(() => ({
    courseId,
    sessionId,
    chapterContext,
    userFiles: [] as ChatMessageFile[],
  }));

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat/mentor',
        body,
      }),
    [body]
  );

  const defaultMessages: UIMessage[] = useMemo(
    () =>
      initialMessagesProp && initialMessagesProp.length > 0
        ? initialMessagesProp
        : [],
    [initialMessagesProp]
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    transport,
    initialMessages: defaultMessages,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
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

    if ((!hasText && !hasFiles) || isLoading || isUploading) return;

    setUploadError(null);

    // Upload files to Storage first (if any)
    let uploadedFiles: ChatMessageFile[] = [];
    if (hasFiles) {
      setIsUploading(true);
      try {
        const results = await Promise.all(
          attachedFiles.map((f) => uploadFile(f, sessionId))
        );
        uploadedFiles = results.map(({ path, filename, mediaType }) => ({
          path,
          filename,
          mediaType,
        }));
      } catch (err) {
        setIsUploading(false);
        setUploadError(
          err instanceof Error ? err.message : 'Nie udało się przesłać plików'
        );
        return;
      }
      setIsUploading(false);
    }

    // Set file metadata on mutable body before sending
    body.userFiles = uploadedFiles;

    // Send message via AI SDK
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

    // Clear file metadata after send
    body.userFiles = [];

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
    !isLoading &&
    !isUploading &&
    (input.trim().length > 0 || attachedFiles.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Compact header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium truncate">
            Mentor
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const content = getMessageText(message.parts);
          const files = getMessageFiles(message.parts);

          return (
            <div
              key={message.id}
              className={cn(
                'flex gap-2',
                isUser ? 'justify-end' : 'justify-start'
              )}
            >
              {!isUser && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
              )}
              <Card
                className={cn(
                  'px-3 py-2 max-w-[85%]',
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {content && (
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">
                    {content}
                  </p>
                )}
                {files.length > 0 && (
                  <div className="space-y-1">
                    {files.map((file, i) => (
                      <MessageFile key={i} file={file} />
                    ))}
                  </div>
                )}
              </Card>
              {isUser && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-3 w-3" />
                </div>
              )}
            </div>
          );
        })}

        {(isLoading || isUploading) && (
          <div className="flex gap-2 justify-start">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-3 w-3 text-primary" />
            </div>
            <Card className="px-3 py-2 bg-muted">
              <Loader2 className="h-3 w-3 animate-spin" />
            </Card>
          </div>
        )}

        {(error || uploadError) && (
          <div className="flex items-center gap-1 text-destructive text-xs justify-center">
            <AlertCircle className="h-3 w-3" />
            {uploadError || 'Wystąpił błąd. Spróbuj ponownie.'}
          </div>
        )}

      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-3 border-t">
        {/* Attachment previews */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {attachedFiles.map((file, index) => (
              <AttachmentPreview
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => removeFile(index)}
              />
            ))}
          </div>
        )}

        <div className="flex gap-1.5">
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
            className="h-8 w-8 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading || attachedFiles.length >= MAX_FILES}
            title="Dodaj pliki (obrazy, PDF)"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </Button>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zapytaj o lekcję..."
            disabled={isLoading || isUploading}
            className="min-h-[36px] resize-none text-sm"
            rows={1}
          />

          <Button
            type="submit"
            disabled={!canSend}
            size="icon"
            className="h-8 w-8 shrink-0"
          >
            {isLoading || isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={stop}
            className="mt-1.5 w-full h-7 text-xs"
          >
            <Square className="h-2.5 w-2.5 mr-1.5" />
            Zatrzymaj
          </Button>
        )}
      </form>
    </div>
  );
}
