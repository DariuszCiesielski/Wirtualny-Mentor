/**
 * Chat Page - Server Component
 *
 * Verifies course ownership and renders MentorChat.
 * MentorChat is lazy-loaded via LazyMentorChat for better initial bundle.
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCourse } from '@/lib/dal/courses';
import { LazyMentorChat } from './components/lazy-mentor-chat';

interface ChatPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { courseId } = await params;

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get course (getCourse only takes courseId - it fetches by id)
  const course = await getCourse(courseId);

  if (!course) {
    notFound();
  }

  // Verify ownership (RLS + defense-in-depth)
  if (course.user_id !== user.id) {
    notFound();
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Chat z mentorem</h1>
        <p className="text-sm text-muted-foreground">{course.title}</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <LazyMentorChat courseId={courseId} courseTitle={course.title} />
      </div>
    </div>
  );
}
