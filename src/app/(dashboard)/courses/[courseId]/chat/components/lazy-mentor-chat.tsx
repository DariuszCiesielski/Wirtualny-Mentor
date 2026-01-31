'use client';

/**
 * Lazy Mentor Chat Wrapper
 *
 * Client component that lazy-loads MentorChat for better initial bundle size.
 * Uses ssr: false since MentorChat uses useChat hook.
 */

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load MentorChat - heavy client component with AI SDK
const MentorChat = dynamic(
  () =>
    import('./mentor-chat').then((mod) => ({
      default: mod.MentorChat,
    })),
  {
    loading: () => (
      <div className="flex flex-col h-full">
        <div className="flex-1 space-y-4 p-4">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-16 w-1/2 ml-auto" />
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-16 w-1/2 ml-auto" />
        </div>
        <Skeleton className="h-14 mx-4 mb-4" />
      </div>
    ),
    ssr: false, // Client-only - uses useChat hook
  }
);

interface LazyMentorChatProps {
  courseId: string;
  courseTitle: string;
}

export function LazyMentorChat({ courseId, courseTitle }: LazyMentorChatProps) {
  return <MentorChat courseId={courseId} courseTitle={courseTitle} />;
}
