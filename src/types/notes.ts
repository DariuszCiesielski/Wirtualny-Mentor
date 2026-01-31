/**
 * Notes Types - TypeScript types for user notes with embeddings
 *
 * Keep in sync with supabase/migrations/20260131200001_notes_schema.sql
 */

// ============================================================================
// BASE ENTITY
// ============================================================================

/**
 * Note - user note attached to a course/chapter
 */
export interface Note {
  id: string;
  user_id: string;
  course_id: string;
  chapter_id: string | null;
  content: string;
  embedding: number[] | null;
  embedding_model: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

/**
 * Note with context information (for display)
 */
export interface NoteWithContext extends Note {
  chapter_title?: string;
  level_name?: string;
  course_title?: string;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input for creating a note
 */
export interface CreateNoteInput {
  course_id: string;
  chapter_id?: string | null;
  content: string;
}

/**
 * Input for updating a note
 */
export interface UpdateNoteInput {
  content: string;
}

// ============================================================================
// SEARCH RESULT TYPES
// ============================================================================

/**
 * Search result from vector similarity search
 */
export interface NoteSimilarityResult {
  id: string;
  content: string;
  similarity: number;
  chapter_id: string | null;
}

/**
 * Search result from full-text search
 */
export interface NoteSearchResult extends Note {
  rank?: number;
}
