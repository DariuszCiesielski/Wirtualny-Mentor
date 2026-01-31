/**
 * Data Access Layer - Notes
 *
 * CRUD operations for user notes with embedding generation.
 * All functions use Supabase server client and require authentication.
 */

import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, EMBEDDING_MODEL_ID } from "@/lib/ai/embeddings";
import type {
  Note,
  NoteWithContext,
  CreateNoteInput,
  UpdateNoteInput,
  NoteSimilarityResult,
  NoteSearchResult,
} from "@/types/notes";

/**
 * Create a new note with embedding
 *
 * Embedding is generated synchronously at write time.
 */
export async function createNote(
  userId: string,
  input: CreateNoteInput
): Promise<Note> {
  const supabase = await createClient();

  // Generate embedding for content
  const embedding = await generateEmbedding(input.content);

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: userId,
      course_id: input.course_id,
      chapter_id: input.chapter_id ?? null,
      content: input.content,
      embedding: JSON.stringify(embedding),
      embedding_model: EMBEDDING_MODEL_ID,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create note: ${error.message}`);
  }

  return data as Note;
}

/**
 * Update a note - re-generates embedding
 */
export async function updateNote(
  noteId: string,
  userId: string,
  input: UpdateNoteInput
): Promise<Note> {
  const supabase = await createClient();

  // Re-generate embedding for updated content
  const embedding = await generateEmbedding(input.content);

  const { data, error } = await supabase
    .from("notes")
    .update({
      content: input.content,
      embedding: JSON.stringify(embedding),
      embedding_model: EMBEDDING_MODEL_ID,
    })
    .eq("id", noteId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update note: ${error.message}`);
  }

  return data as Note;
}

/**
 * Delete a note
 */
export async function deleteNote(
  noteId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete note: ${error.message}`);
  }
}

/**
 * Get all notes for a course
 */
export async function getNotes(
  userId: string,
  courseId: string,
  chapterId?: string
): Promise<Note[]> {
  const supabase = await createClient();

  let query = supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (chapterId) {
    query = query.eq("chapter_id", chapterId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get notes: ${error.message}`);
  }

  return data as Note[];
}

/**
 * Get notes with context (chapter title, level name)
 */
export async function getNotesWithContext(
  userId: string,
  courseId: string
): Promise<NoteWithContext[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .select(
      `
      *,
      chapters!chapter_id (
        title,
        course_levels!level_id (
          name
        )
      ),
      courses!course_id (
        title
      )
    `
    )
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get notes with context: ${error.message}`);
  }

  // Transform nested data
  return (data ?? []).map((note) => ({
    ...note,
    chapter_title: note.chapters?.title ?? null,
    level_name: note.chapters?.course_levels?.name ?? null,
    course_title: note.courses?.title ?? null,
    chapters: undefined,
    courses: undefined,
  })) as NoteWithContext[];
}

/**
 * Full-text search in notes (for UI)
 *
 * Uses PostgreSQL tsvector with 'simple' config
 */
export async function searchNotesFulltext(
  userId: string,
  courseId: string,
  query: string,
  limit = 10
): Promise<NoteSearchResult[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .textSearch("fts", query, {
      type: "plain",
      config: "simple",
    })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search notes: ${error.message}`);
  }

  return data as NoteSearchResult[];
}

/**
 * Vector similarity search (for RAG chatbot)
 *
 * Requires RPC function search_notes_semantic in database.
 */
export async function searchNotesSemantic(
  userId: string,
  courseId: string,
  queryText: string,
  threshold = 0.7,
  limit = 5
): Promise<NoteSimilarityResult[]> {
  const supabase = await createClient();

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(queryText);

  const { data, error } = await supabase.rpc("search_notes_semantic", {
    p_user_id: userId,
    p_course_id: courseId,
    p_embedding: JSON.stringify(queryEmbedding),
    p_match_threshold: threshold,
    p_match_count: limit,
  });

  if (error) {
    throw new Error(`Failed to semantic search notes: ${error.message}`);
  }

  return data as NoteSimilarityResult[];
}

/**
 * Get single note by ID
 */
export async function getNote(
  noteId: string,
  userId: string
): Promise<Note | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", noteId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get note: ${error.message}`);
  }

  return data as Note;
}
