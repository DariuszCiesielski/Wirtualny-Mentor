/**
 * Quiz Page
 *
 * Server component that renders the quiz for a chapter.
 * Verifies user ownership and passes context to QuizPageContent.
 *
 * Route: /courses/[courseId]/[levelId]/[chapterId]/quiz
 */

import { notFound } from 'next/navigation';
import { getCourse } from '@/lib/dal/courses';
import { requireAuth } from '@/lib/dal/auth';
import { QuizPageContent } from '@/components/quiz/quiz-page-content';

interface QuizPageProps {
  params: Promise<{
    courseId: string;
    levelId: string;
    chapterId: string;
  }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { courseId, levelId, chapterId } = await params;

  // Auth check
  const user = await requireAuth();

  // Get course for context
  const course = await getCourse(courseId);
  if (!course || course.user_id !== user.id) {
    notFound();
  }

  // Find chapter title
  const level = course.course_levels?.find((l) => l.id === levelId);
  const chapter = level?.chapters?.find((c) => c.id === chapterId);

  if (!chapter) {
    notFound();
  }

  return (
    <QuizPageContent
      courseId={courseId}
      levelId={levelId}
      chapterId={chapterId}
      levelName={level?.name}
      chapterTitle={chapter.title}
    />
  );
}
