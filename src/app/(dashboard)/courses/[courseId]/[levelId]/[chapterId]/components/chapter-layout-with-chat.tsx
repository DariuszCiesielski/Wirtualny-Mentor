'use client';

/**
 * Chapter Layout with Chat
 *
 * Wraps chapter content with an optional side panel for inline mentor chat.
 * Features:
 * - Floating toggle button for opening/closing chat
 * - Desktop: side panel (384px) on the right
 * - Mobile: Sheet sliding from right
 * - Text selection popover for "Ask mentor" functionality
 * - Session auto-creation on first open
 */

import { useState, useCallback, useRef, useTransition } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { LazyInlineChat } from './lazy-inline-chat';
import { TextSelectionPopover } from './text-selection-popover';
import { ChatContextProvider } from './chat-context';
import {
  getOrCreateInlineSession,
  loadSessionMessagesAction,
} from '../actions';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { UIMessage } from 'ai';

interface ChapterLayoutWithChatProps {
  children: React.ReactNode;
  courseId: string;
  courseTitle: string;
  chapterId: string;
  chapterTitle: string;
  chapterContext: string;
  /** Pre-existing session ID if one exists */
  existingSessionId?: string | null;
  /** Pre-loaded messages if session exists */
  existingMessages?: UIMessage[];
}

export function ChapterLayoutWithChat({
  children,
  courseId,
  courseTitle,
  chapterId,
  chapterTitle,
  chapterContext,
  existingSessionId,
  existingMessages,
}: ChapterLayoutWithChatProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(
    existingSessionId ?? null
  );
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>(
    existingMessages ?? []
  );
  const [prefillText, setPrefillText] = useState<string | null>(null);
  const [isCreatingSession, startTransition] = useTransition();
  const contentRef = useRef<HTMLDivElement>(null);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;

    return new Promise<string>((resolve) => {
      startTransition(async () => {
        const result = await getOrCreateInlineSession(
          courseId,
          chapterId,
          chapterTitle
        );
        setSessionId(result.sessionId);

        if (!result.isNew) {
          // Load existing messages via server action
          try {
            const msgs = await loadSessionMessagesAction(result.sessionId);
            const uiMessages: UIMessage[] = msgs.map((m) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              parts: [{ type: 'text' as const, text: m.content }],
            }));
            setInitialMessages(uiMessages);
          } catch {
            // Ignore - will start with empty messages
          }
        } else {
          // New session - set welcome message
          setInitialMessages([
            {
              id: 'welcome',
              role: 'assistant',
              parts: [
                {
                  type: 'text' as const,
                  text: `Cześć! Czytasz właśnie "${chapterTitle}". Mogę pomóc Ci zrozumieć materiał - pytaj o wszystko!`,
                },
              ],
            },
          ]);
        }

        resolve(result.sessionId);
      });
    });
  }, [sessionId, courseId, chapterId, chapterTitle]);

  const handleOpenChat = useCallback(async () => {
    setIsChatOpen(true);
    await ensureSession();
  }, [ensureSession]);

  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const handleAskAboutSelection = useCallback(
    async (text: string) => {
      setPrefillText(text);
      if (!isChatOpen) {
        setIsChatOpen(true);
        await ensureSession();
      }
    },
    [isChatOpen, ensureSession]
  );

  // Called from ChapterContent via onAskMentor prop
  const handleAskMentorAboutSection = useCallback(
    async (sectionHeading: string) => {
      const text = `Mam pytanie o sekcję "${sectionHeading}":\n\n`;
      setPrefillText(text);
      if (!isChatOpen) {
        setIsChatOpen(true);
        await ensureSession();
      }
    },
    [isChatOpen, ensureSession]
  );

  const handlePrefillConsumed = useCallback(() => {
    setPrefillText(null);
  }, []);

  const chatPanel = sessionId ? (
    <LazyInlineChat
      key={sessionId}
      courseId={courseId}
      courseTitle={courseTitle}
      sessionId={sessionId}
      chapterTitle={chapterTitle}
      chapterContext={chapterContext}
      initialMessages={initialMessages}
      prefillText={prefillText}
      onPrefillConsumed={handlePrefillConsumed}
      onClose={handleCloseChat}
    />
  ) : null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Left column: chapter content */}
      <div
        ref={contentRef}
        className="relative flex-1 min-w-0 overflow-y-auto"
      >
        <ChatContextProvider askMentor={handleAskMentorAboutSection}>
          {children}
        </ChatContextProvider>

        {/* Text selection popover */}
        <TextSelectionPopover
          containerRef={contentRef}
          onAskAboutSelection={handleAskAboutSelection}
        />
      </div>

      {/* Right column: chat panel (desktop only) */}
      {isChatOpen && (
        <div className="hidden lg:block w-96 shrink-0">
          <div className="sticky top-16 h-[calc(100vh-4rem)] border-l bg-background flex flex-col">
            {chatPanel}
          </div>
        </div>
      )}

      {/* Mobile: Sheet (only on screens < lg) */}
      {!isDesktop && (
        <Sheet
          open={isChatOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseChat();
          }}
        >
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            <SheetTitle className="sr-only">Czat z mentorem</SheetTitle>
            {chatPanel}
          </SheetContent>
        </Sheet>
      )}

      {/* Floating toggle button */}
      <Button
        onClick={isChatOpen ? handleCloseChat : handleOpenChat}
        disabled={isCreatingSession}
        size="icon"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-40 lg:bottom-6 lg:right-6"
      >
        {isChatOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}

// Export the ask mentor handler type for use in page.tsx
export type AskMentorHandler = (sectionHeading: string) => void;
