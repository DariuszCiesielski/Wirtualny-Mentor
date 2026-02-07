/**
 * Chapter Detail Page
 *
 * Server component that loads chapter data and delegates rendering
 * to ChapterPageClient which handles inline chat and section notes.
 */

import { requireAuth } from "@/lib/dal/auth";
import { getCourse } from "@/lib/dal/courses";
import { getSectionContent } from "@/lib/dal/materials";
import { getProgress, calculateProgressPercentage } from "@/lib/dal/progress";
import { getNotes } from "@/lib/dal/notes";
import { notFound } from "next/navigation";
import { ChapterPageClient } from "./components/chapter-page-client";

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
  const existingContent = await getSectionContent(chapterId);

  // Get user's notes for this chapter
  const notes = await getNotes(user.id, courseId, chapterId);

  // Build course context for content generation
  const courseContext = `
Kurs: ${course.title}
Poziom: ${level.name} - ${level.description}
Grupa docelowa: ${course.target_audience || "Nie określono"}
`.trim();

  return (
    <ChapterPageClient
      courseId={courseId}
      courseTitle={course.title}
      levelId={levelId}
      levelName={level.name}
      levelDescription={level.description || ""}
      chapter={{
        id: chapter.id,
        title: chapter.title,
        description: chapter.description || "",
        topics: chapter.topics || [],
        estimated_minutes: chapter.estimated_minutes || 15,
        order_index: chapter.order_index,
      }}
      courseContext={courseContext}
      existingContent={existingContent}
      notes={notes}
      percentage={percentage}
      completedChaptersCount={progress.completed_chapters.length}
      totalChapters={totalChapters}
      isCompleted={isCompleted}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
    />
  );
}
