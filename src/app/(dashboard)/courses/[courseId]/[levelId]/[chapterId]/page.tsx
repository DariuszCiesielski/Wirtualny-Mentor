/**
 * Chapter Page
 *
 * Displays chapter content, progress bar, and navigation.
 * Allows users to mark chapters as complete and navigate between chapters.
 */

import { requireAuth } from "@/lib/dal/auth";
import { getCourse } from "@/lib/dal/courses";
import { getProgress, calculateProgressPercentage } from "@/lib/dal/progress";
import { notFound } from "next/navigation";
import { ProgressBar } from "@/components/curriculum/progress-bar";
import { ChapterNavigation } from "@/components/curriculum/chapter-navigation";
import { Button } from "@/components/ui/button";
import { markComplete } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface ChapterPageProps {
  params: Promise<{ courseId: string; levelId: string; chapterId: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { courseId, levelId, chapterId } = await params;
  const user = await requireAuth();

  // Fetch course with all details
  const course = await getCourse(courseId);
  if (!course) return notFound();

  // Verify ownership
  if (course.user_id !== user.id) {
    return notFound();
  }

  // Fetch user's progress
  const progress = await getProgress(user.id, courseId);
  if (!progress) return notFound();

  // Find current level and chapter
  const level = course.course_levels.find((l) => l.id === levelId);
  if (!level) return notFound();

  const chapter = level.chapters.find((c) => c.id === chapterId);
  if (!chapter) return notFound();

  // Calculate progress
  const percentage = calculateProgressPercentage(progress, course);
  const totalChapters = course.course_levels.reduce(
    (sum, l) => sum + l.chapters.length,
    0
  );
  const isCompleted = progress.completed_chapters.includes(chapterId);

  // Calculate prev/next chapters
  const levelIndex = course.course_levels.findIndex((l) => l.id === levelId);
  const chapterIndex = level.chapters.findIndex((c) => c.id === chapterId);

  let prevChapter: { levelId: string; chapterId: string } | null = null;
  let nextChapter: { levelId: string; chapterId: string } | null = null;

  // Previous chapter
  if (chapterIndex > 0) {
    prevChapter = { levelId, chapterId: level.chapters[chapterIndex - 1].id };
  } else if (levelIndex > 0) {
    const prevLevel = course.course_levels[levelIndex - 1];
    prevChapter = {
      levelId: prevLevel.id,
      chapterId: prevLevel.chapters[prevLevel.chapters.length - 1].id,
    };
  }

  // Next chapter
  if (chapterIndex < level.chapters.length - 1) {
    nextChapter = { levelId, chapterId: level.chapters[chapterIndex + 1].id };
  } else if (levelIndex < course.course_levels.length - 1) {
    const nextLevel = course.course_levels[levelIndex + 1];
    nextChapter = { levelId: nextLevel.id, chapterId: nextLevel.chapters[0].id };
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Progress Bar */}
      <ProgressBar
        percentage={percentage}
        completedChapters={progress.completed_chapters.length}
        totalChapters={totalChapters}
        currentLevel={level.name}
      />

      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground mb-4">
        {course.title} / {level.name} / Rozdzial {chapterIndex + 1}
      </div>

      {/* Chapter Content */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {chapter.title}
            {isCompleted && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
          </CardTitle>
          {chapter.description && (
            <p className="text-muted-foreground">{chapter.description}</p>
          )}
          <div className="flex gap-4 text-sm text-muted-foreground">
            {chapter.estimated_minutes && (
              <span>~{chapter.estimated_minutes} min</span>
            )}
            {chapter.topics && chapter.topics.length > 0 && (
              <span>Tematy: {chapter.topics.join(", ")}</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Placeholder dla content - Phase 3 */}
          <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">
            <p>
              Tresc rozdzialu zostanie wygenerowana w Phase 3 (Learning
              Materials).
            </p>
            <p className="text-sm mt-2">
              Na razie mozesz oznaczyc rozdzial jako ukonczony i przejsc dalej.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Complete Button */}
      {!isCompleted && (
        <form action={markComplete.bind(null, courseId, levelId, chapterId)}>
          <Button type="submit" size="lg" className="w-full mb-8">
            Ukoncz rozdzial i przejdz dalej
          </Button>
        </form>
      )}

      {/* Navigation */}
      <ChapterNavigation
        courseId={courseId}
        prevChapter={prevChapter}
        nextChapter={nextChapter}
        isCompleted={isCompleted}
      />
    </div>
  );
}
