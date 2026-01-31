"use server";

/**
 * Server Actions - Notes Page
 *
 * Search notes with full-text search for the notes listing page.
 */

import { requireAuth } from "@/lib/dal/auth";
import {
  searchNotesFulltext,
  getNotesWithContext,
} from "@/lib/dal/notes";
import type { NoteWithContext } from "@/types/notes";

/**
 * Search notes using full-text search
 *
 * Returns notes matching the query with context (chapter, level).
 * Uses PostgreSQL tsvector for fast searching.
 */
export async function searchNotesAction(
  courseId: string,
  query: string
): Promise<NoteWithContext[]> {
  const user = await requireAuth();

  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Get search results (basic notes)
    const searchResults = await searchNotesFulltext(
      user.id,
      courseId,
      query.trim(),
      20 // limit
    );

    // Get all notes with context to merge
    const notesWithContext = await getNotesWithContext(user.id, courseId);

    // Create a map for quick lookup
    const contextMap = new Map(notesWithContext.map((n) => [n.id, n]));

    // Merge context into search results
    const resultsWithContext: NoteWithContext[] = searchResults.map((note) => {
      const context = contextMap.get(note.id);
      return {
        ...note,
        chapter_title: context?.chapter_title ?? null,
        level_name: context?.level_name ?? null,
        course_title: context?.course_title ?? null,
      };
    });

    return resultsWithContext;
  } catch (error) {
    console.error("Search notes error:", error);
    return [];
  }
}
