/**
 * Chat Page - Server Component
 *
 * Verifies course ownership, loads chat sessions and messages,
 * then renders the chat layout with session panel and MentorChat.
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCourse } from '@/lib/dal/courses';
import { getSessions, getMessages, getSignedUrls } from '@/lib/dal/chat';
import { LazyMentorChat } from './components/lazy-mentor-chat';
import { ChatSessionsPanel } from './components/chat-sessions-panel';
import type { UIMessage } from 'ai';
import type { ChatMessage } from '@/types/chat';

interface ChatPageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ session?: string }>;
}

/**
 * Convert DB messages to UIMessage format for the AI SDK useChat hook
 */
async function messagesToUIMessages(
  messages: ChatMessage[]
): Promise<UIMessage[]> {
  // Collect all file paths for batch signed URL generation
  const allPaths = messages.flatMap((m) => m.files.map((f) => f.path));
  const urlMap = await getSignedUrls(allPaths);

  return messages.map((msg) => {
    const parts: UIMessage['parts'] = [];

    // Add text part
    if (msg.content) {
      parts.push({ type: 'text' as const, text: msg.content });
    }

    // Add file parts with signed URLs
    for (const file of msg.files) {
      parts.push({
        type: 'file' as const,
        url: urlMap[file.path] ?? '',
        mediaType: file.mediaType,
        filename: file.filename,
      });
    }

    return {
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      parts,
    };
  });
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { courseId } = await params;
  const { session: sessionId } = await searchParams;

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get course
  const course = await getCourse(courseId);

  if (!course) {
    notFound();
  }

  // Verify ownership
  if (course.user_id !== user.id) {
    notFound();
  }

  // Load sessions for this course
  const sessions = await getSessions(user.id, courseId);

  // Load messages if a session is selected
  let initialMessages: UIMessage[] = [];
  const activeSessionId = sessionId ?? null;

  if (activeSessionId) {
    // Verify the session belongs to this course
    const sessionExists = sessions.some((s) => s.id === activeSessionId);
    if (sessionExists) {
      const dbMessages = await getMessages(activeSessionId);
      initialMessages = await messagesToUIMessages(dbMessages);
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Chat z mentorem</h1>
        <p className="text-sm text-muted-foreground">{course.title}</p>
      </div>
      <div className="flex-1 overflow-hidden flex relative">
        <ChatSessionsPanel
          courseId={courseId}
          sessions={sessions}
          activeSessionId={activeSessionId}
        />
        <div className="flex-1 overflow-hidden">
          {activeSessionId ? (
            <LazyMentorChat
              key={activeSessionId}
              courseId={courseId}
              courseTitle={course.title}
              sessionId={activeSessionId}
              initialMessages={initialMessages}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <p className="text-muted-foreground mb-4">
                {sessions.length > 0
                  ? 'Wybierz rozmowę z listy lub rozpocznij nową.'
                  : 'Rozpocznij pierwszą rozmowę z mentorem.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
