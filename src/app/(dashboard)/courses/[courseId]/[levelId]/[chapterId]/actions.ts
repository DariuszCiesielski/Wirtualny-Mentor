"use server";

/**
 * Server Actions - Chapter Progress
 *
 * Handle chapter completion and navigation.
 * Saves progress to database and redirects to next chapter.
 */

import { requireAuth } from "@/lib/dal/auth";
import {
  getProgress,
  markChapterComplete,
  updateProgress,
} from "@/lib/dal/progress";
import { getCourse } from "@/lib/dal/courses";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Mark current chapter as complete and navigate to next
 *
 * This action:
 * 1. Marks the chapter as complete in user progress
 * 2. Calculates the next chapter (or level/course completion)
 * 3. Updates current position
 * 4. Redirects to next chapter or course page
 */
export async function markComplete(
  courseId: string,
  levelId: string,
  chapterId: string
) {
  const user = await requireAuth();
  const progress = await getProgress(user.id, courseId);
  if (!progress) throw new Error("Progress not found");

  // Get course to find next chapter and validate
  const course = await getCourse(courseId);
  if (!course) throw new Error("Course not found");

  // Mark current chapter as complete
  await markChapterComplete(progress.id, chapterId, course);

  // Find current position in course structure
  const currentLevelIndex = course.course_levels.findIndex(
    (l) => l.id === levelId
  );
  const currentLevel = course.course_levels[currentLevelIndex];
  const currentChapterIndex = currentLevel.chapters.findIndex(
    (c) => c.id === chapterId
  );

  let nextPath: string;

  if (currentChapterIndex < currentLevel.chapters.length - 1) {
    // Next chapter in same level
    const nextChapter = currentLevel.chapters[currentChapterIndex + 1];
    nextPath = `/courses/${courseId}/${levelId}/${nextChapter.id}`;
    await updateProgress(progress.id, {
      current_chapter_id: nextChapter.id,
    });
  } else if (currentLevelIndex < course.course_levels.length - 1) {
    // First chapter of next level
    const nextLevel = course.course_levels[currentLevelIndex + 1];
    const firstChapter = nextLevel.chapters[0];
    nextPath = `/courses/${courseId}/${nextLevel.id}/${firstChapter.id}`;
    await updateProgress(progress.id, {
      current_level_id: nextLevel.id,
      current_chapter_id: firstChapter.id,
    });
  } else {
    // Course completed!
    nextPath = `/courses/${courseId}`;
    await updateProgress(progress.id, {
      completed_at: new Date().toISOString(),
    });
  }

  revalidatePath(`/courses/${courseId}`);
  redirect(nextPath);
}

/**
 * Navigate to a specific chapter (without marking complete)
 *
 * Updates current position in progress tracker.
 * Used for free navigation through previously unlocked chapters.
 */
export async function navigateToChapter(
  courseId: string,
  levelId: string,
  chapterId: string
) {
  const user = await requireAuth();
  const progress = await getProgress(user.id, courseId);
  if (!progress) throw new Error("Progress not found");

  await updateProgress(progress.id, {
    current_level_id: levelId,
    current_chapter_id: chapterId,
  });

  revalidatePath(`/courses/${courseId}`);
}
