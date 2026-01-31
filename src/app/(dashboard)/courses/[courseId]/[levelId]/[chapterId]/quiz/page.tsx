/**
 * Quiz Page
 *
 * Server component that renders the quiz for a chapter.
 * Verifies user ownership and passes context to QuizContainer.
 *
 * Route: /courses/[courseId]/[levelId]/[chapterId]/quiz
 */

import { notFound } from 'next/navigation';
import { getCourse } from '@/lib/dal/courses';
import { requireAuth } from '@/lib/dal/auth';
import { QuizContainer } from '@/components/quiz/quiz-container';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
    <div className="container max-w-3xl py-8">
      {/* Back navigation */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/courses/${courseId}/${levelId}/${chapterId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Wroc do rozdzialu
        </Link>
      </Button>

      <div className="mb-6">
        <div className="text-sm text-muted-foreground mb-2">
          {level?.name}
        </div>
        <h1 className="text-2xl font-bold">Quiz: {chapter.title}</h1>
        <p className="text-muted-foreground">
          Sprawdz swoje zrozumienie materialu
        </p>
      </div>

      <QuizContainer
        chapterId={chapterId}
        courseId={courseId}
        chapterTitle={chapter.title}
      />
    </div>
  );
}
