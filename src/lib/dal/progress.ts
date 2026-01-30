/**
 * Data Access Layer - Progress
 *
 * Functions for tracking user progress through courses.
 * Handles chapter/level completion and progress calculations.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  UserProgress,
  ProgressUpdate,
  CourseWithDetails,
} from "@/types/database";

/**
 * Get user's progress for a specific course
 *
 * @param userId - The user's ID
 * @param courseId - The course ID
 * @returns Progress record or null if not found
 */
export async function getProgress(
  userId: string,
  courseId: string
): Promise<UserProgress | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get progress: ${error.message}`);
  }

  return data as UserProgress;
}

/**
 * Update user's progress
 *
 * @param progressId - The progress record ID
 * @param updates - Fields to update
 */
export async function updateProgress(
  progressId: string,
  updates: ProgressUpdate
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_progress")
    .update({
      ...updates,
      // last_activity_at is updated automatically by trigger
    })
    .eq("id", progressId);

  if (error) {
    throw new Error(`Failed to update progress: ${error.message}`);
  }
}

/**
 * Mark a chapter as complete
 *
 * This function adds the chapter to completed_chapters array.
 * If all chapters in the level are complete, it also marks the level as complete.
 *
 * @param progressId - The progress record ID
 * @param chapterId - The chapter ID to mark complete
 * @param courseDetails - Full course details to check level completion
 */
export async function markChapterComplete(
  progressId: string,
  chapterId: string,
  courseDetails: CourseWithDetails
): Promise<void> {
  const supabase = await createClient();

  // Get current progress
  const { data: progress, error: fetchError } = await supabase
    .from("user_progress")
    .select("*")
    .eq("id", progressId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch progress: ${fetchError.message}`);
  }

  const currentProgress = progress as UserProgress;

  // Check if chapter already completed
  if (currentProgress.completed_chapters.includes(chapterId)) {
    return; // Already complete, nothing to do
  }

  // Add chapter to completed list
  const updatedCompletedChapters = [
    ...currentProgress.completed_chapters,
    chapterId,
  ];

  // Find which level this chapter belongs to
  let chapterLevel = null;
  for (const level of courseDetails.course_levels) {
    const chapter = level.chapters.find((c) => c.id === chapterId);
    if (chapter) {
      chapterLevel = level;
      break;
    }
  }

  // Check if all chapters in the level are now complete
  let updatedCompletedLevels = [...currentProgress.completed_levels];

  if (chapterLevel) {
    const levelChapterIds = chapterLevel.chapters.map((c) => c.id);
    const allChaptersComplete = levelChapterIds.every((id) =>
      updatedCompletedChapters.includes(id)
    );

    if (
      allChaptersComplete &&
      !currentProgress.completed_levels.includes(chapterLevel.id)
    ) {
      updatedCompletedLevels = [...updatedCompletedLevels, chapterLevel.id];
    }
  }

  // Check if entire course is complete
  const allLevelsComplete = courseDetails.course_levels.every((level) =>
    updatedCompletedLevels.includes(level.id)
  );

  // Update progress
  const { error: updateError } = await supabase
    .from("user_progress")
    .update({
      completed_chapters: updatedCompletedChapters,
      completed_levels: updatedCompletedLevels,
      completed_at: allLevelsComplete ? new Date().toISOString() : null,
    })
    .eq("id", progressId);

  if (updateError) {
    throw new Error(`Failed to mark chapter complete: ${updateError.message}`);
  }
}

/**
 * Move to next chapter and update current position
 *
 * @param progressId - The progress record ID
 * @param nextChapterId - The next chapter ID
 * @param nextLevelId - The level ID (may change if moving to new level)
 */
export async function moveToNextChapter(
  progressId: string,
  nextChapterId: string,
  nextLevelId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_progress")
    .update({
      current_chapter_id: nextChapterId,
      current_level_id: nextLevelId,
    })
    .eq("id", progressId);

  if (error) {
    throw new Error(`Failed to move to next chapter: ${error.message}`);
  }
}

/**
 * Calculate progress percentage
 *
 * @param progress - User progress record
 * @param course - Course with full details
 * @returns Percentage of completion (0-100)
 */
export function calculateProgressPercentage(
  progress: UserProgress,
  course: CourseWithDetails
): number {
  // Count total chapters
  const totalChapters = course.course_levels.reduce(
    (sum, level) => sum + level.chapters.length,
    0
  );

  if (totalChapters === 0) {
    return 0;
  }

  // Calculate percentage
  const completedCount = progress.completed_chapters.length;
  const percentage = Math.round((completedCount / totalChapters) * 100);

  return Math.min(percentage, 100); // Cap at 100%
}

/**
 * Get progress statistics for a course
 *
 * @param progress - User progress record
 * @param course - Course with full details
 * @returns Statistics object
 */
export function getProgressStats(
  progress: UserProgress,
  course: CourseWithDetails
): {
  completedChapters: number;
  totalChapters: number;
  completedLevels: number;
  totalLevels: number;
  percentage: number;
  currentLevelName: string | null;
  isComplete: boolean;
} {
  const totalChapters = course.course_levels.reduce(
    (sum, level) => sum + level.chapters.length,
    0
  );
  const totalLevels = course.course_levels.length;

  const currentLevel = course.course_levels.find(
    (level) => level.id === progress.current_level_id
  );

  return {
    completedChapters: progress.completed_chapters.length,
    totalChapters,
    completedLevels: progress.completed_levels.length,
    totalLevels,
    percentage: calculateProgressPercentage(progress, course),
    currentLevelName: currentLevel?.name ?? null,
    isComplete: progress.completed_at !== null,
  };
}
