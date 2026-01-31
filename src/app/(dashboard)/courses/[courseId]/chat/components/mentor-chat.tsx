'use client';

/**
 * Mentor Chat Component
 *
 * Chat interface for Socratic mentor chatbot.
 * Uses useChat hook with streaming for real-time AI responses.
 */

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { useMemo, useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Loader2, Bot, User, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MentorChatProps {
  courseId: string;
  courseTitle: string;
}

/**
 * Extract text content from UIMessage parts
 */
function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text)
    .join('');
}

export function MentorChat({ courseId, courseTitle }: MentorChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat/mentor',
        body: { courseId },
      }),
    [courseId]
  );

  // Initial welcome message
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input.trim() });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const content = getMessageText(message.parts);

          return (
            <div
              key={message.id}
              className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
            >
              {!isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <Card
                className={cn(
                  'px-4 py-3 max-w-[80%]',
                  isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{content}</p>
              </Card>
              {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading indicator during streaming */}
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

        {/* Error display */}
        {error && (
          <div className="text-destructive text-sm text-center">
            Wystapil blad. Sprobuj ponownie.
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zadaj pytanie mentorowi..."
            disabled={isLoading}
            className="min-h-[60px] resize-none"
            rows={2}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {/* Stop button during streaming */}
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
