"use server";

/**
 * Server Actions - Chapter Progress & Notes
 *
 * Handle chapter completion, navigation, and user notes.
 * Saves progress and notes to database.
 */

import { requireAuth } from "@/lib/dal/auth";
import {
  getProgress,
  markChapterComplete,
  updateProgress,
} from "@/lib/dal/progress";
import { getCourse } from "@/lib/dal/courses";
import { createNote, updateNote, deleteNote } from "@/lib/dal/notes";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CreateNoteInput } from "@/types/notes";

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

// ============================================================================
// NOTES ACTIONS
// ============================================================================

/**
 * Create a new note for the current chapter
 *
 * Server Action - generates embedding synchronously
 */
export async function createNoteAction(formData: FormData) {
  const user = await requireAuth();

  const content = formData.get("content") as string;
  const courseId = formData.get("courseId") as string;
  const chapterId = formData.get("chapterId") as string | null;

  if (!content || content.trim().length === 0) {
    return { error: "Content is required" };
  }

  if (!courseId) {
    return { error: "Course ID is required" };
  }

  try {
    const input: CreateNoteInput = {
      course_id: courseId,
      chapter_id: chapterId || null,
      content: content.trim(),
    };

    const note = await createNote(user.id, input);

    revalidatePath(`/courses/${courseId}`);

    return { data: note };
  } catch (error) {
    console.error("Create note error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to create note",
    };
  }
}

/**
 * Update an existing note
 *
 * Re-generates embedding for updated content
 */
export async function updateNoteAction(formData: FormData) {
  const user = await requireAuth();

  const noteId = formData.get("noteId") as string;
  const content = formData.get("content") as string;
  const courseId = formData.get("courseId") as string;

  if (!noteId) {
    return { error: "Note ID is required" };
  }

  if (!content || content.trim().length === 0) {
    return { error: "Content is required" };
  }

  try {
    const note = await updateNote(noteId, user.id, {
      content: content.trim(),
    });

    revalidatePath(`/courses/${courseId}`);

    return { data: note };
  } catch (error) {
    console.error("Update note error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to update note",
    };
  }
}

/**
 * Delete a note
 */
export async function deleteNoteAction(formData: FormData) {
  const user = await requireAuth();

  const noteId = formData.get("noteId") as string;
  const courseId = formData.get("courseId") as string;

  if (!noteId) {
    return { error: "Note ID is required" };
  }

  try {
    await deleteNote(noteId, user.id);

    revalidatePath(`/courses/${courseId}`);

    return { success: true };
  } catch (error) {
    console.error("Delete note error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete note",
    };
  }
}
