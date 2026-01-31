/**
 * Chapter Detail Page
 *
 * Server component that displays chapter content with learning materials.
 *
 * WIRING PATTERN (Server -> Client):
 * 1. Server calls getSectionContent(chapterId) to check if content exists
 * 2. Passes result as initialContent prop to ChapterContent client component
 * 3. If initialContent is null, ChapterContent will trigger generation via API
 * 4. If initialContent exists, ChapterContent renders immediately
 *
 * This ensures content is generated only on first visit, not on every page load.
 */

import { Suspense } from "react";
import { requireAuth } from "@/lib/dal/auth";
import { getCourse } from "@/lib/dal/courses";
import { getSectionContent } from "@/lib/dal/materials";
import { getProgress, calculateProgressPercentage } from "@/lib/dal/progress";
import { notFound } from "next/navigation";
import { ProgressBar } from "@/components/curriculum/progress-bar";
import { ChapterNavigation } from "@/components/curriculum/chapter-navigation";
import { ChapterContent } from "@/components/materials/chapter-content";
import { GeneratingState } from "@/components/materials/generating-state";
import { Button } from "@/components/ui/button";
import { markComplete } from "./actions";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

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

  // Get existing content (may be null - triggers lazy generation in client)
  // This is the SERVER-SIDE check - client will handle generation if null
  const existingContent = await getSectionContent(chapterId);

  // Build course context for content generation
  const courseContext = `
Kurs: ${course.title}
Poziom: ${level.name} - ${level.description}
Grupa docelowa: ${course.target_audience || "Nie okreslono"}
`.trim();

  return (
    <div className="container max-w-4xl py-8">
      {/* Progress Bar */}
      <ProgressBar
        percentage={percentage}
        completedChapters={progress.completed_chapters.length}
        totalChapters={totalChapters}
        currentLevel={level.name}
      />

      {/* Back navigation */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/courses/${courseId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Wroc do kursu
        </Link>
      </Button>

      {/* Chapter header */}
      <header className="mb-8">
        <div className="text-sm text-muted-foreground mb-2">
          {level.name} &bull; Rozdzial {chapter.order_index}
          {isCompleted && (
            <CheckCircle2 className="inline ml-2 h-4 w-4 text-green-500" />
          )}
        </div>
        <h1 className="text-3xl font-bold">{chapter.title}</h1>
        <p className="text-muted-foreground mt-2">{chapter.description}</p>
      </header>

      {/* Chapter content with Suspense */}
      <Suspense
        fallback={
          <GeneratingState chapterTitle={chapter.title} phase="searching" />
        }
      >
        <ChapterContent
          chapter={{
            id: chapter.id,
            title: chapter.title,
            description: chapter.description || "",
            topics: chapter.topics || [],
            estimatedMinutes: chapter.estimated_minutes || 15,
          }}
          courseContext={courseContext}
          initialContent={existingContent}
        />
      </Suspense>

      {/* Complete Button */}
      {!isCompleted && (
        <form
          action={markComplete.bind(null, courseId, levelId, chapterId)}
          className="mt-8"
        >
          <Button type="submit" size="lg" className="w-full">
            Ukoncz rozdzial i przejdz dalej
          </Button>
        </form>
      )}

      {/* Navigation */}
      <div className="mt-12">
        <ChapterNavigation
          courseId={courseId}
          prevChapter={prevChapter}
          nextChapter={nextChapter}
          isCompleted={isCompleted}
        />
      </div>
    </div>
  );
}
