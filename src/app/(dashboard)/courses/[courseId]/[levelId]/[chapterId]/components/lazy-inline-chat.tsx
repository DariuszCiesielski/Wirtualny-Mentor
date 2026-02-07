'use client';

/**
 * Lazy-loaded wrapper for InlineMentorChat.
 *
 * Reduces initial bundle size - chat code is only loaded when panel is opened.
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { UIMessage } from 'ai';

const InlineMentorChat = dynamic(
  () =>
    import('./inline-mentor-chat').then((mod) => ({
      default: mod.InlineMentorChat,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface LazyInlineChatProps {
  courseId: string;
  courseTitle: string;
  sessionId: string;
  chapterTitle: string;
  chapterContext: string;
  initialMessages?: UIMessage[];
  prefillText?: string | null;
  onPrefillConsumed?: () => void;
  onClose: () => void;
}

export function LazyInlineChat(props: LazyInlineChatProps) {
  return <InlineMentorChat {...props} />;
}
