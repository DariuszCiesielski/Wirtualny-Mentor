-- Supabase Migration: Notes Schema with Vector Embeddings
-- Created: 2026-01-31
-- Purpose: User notes with pgvector embeddings for RAG chatbot and full-text search

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable pgvector extension for vector similarity search
-- NOTE: Must be enabled in Supabase Dashboard: Extensions > vector
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Notes table - user notes attached to courses/chapters with embeddings
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,

  -- Note content
  content TEXT NOT NULL,

  -- Vector embedding for RAG (halfvec = 50% storage savings vs vector)
  -- 1536 dimensions for text-embedding-3-small model
  embedding halfvec(1536),

  -- Full-text search vector (auto-generated from content)
  -- Using 'simple' config for better Polish language support
  fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,

  -- Track embedding model version for future re-embedding
  embedding_model TEXT DEFAULT 'text-embedding-3-small',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Notes policies (access through course ownership via EXISTS pattern)
CREATE POLICY "Users can view notes of own courses" ON notes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = notes.course_id AND courses.user_id = auth.uid())
  );

CREATE POLICY "Users can insert notes to own courses" ON notes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM courses WHERE courses.id = notes.course_id AND courses.user_id = auth.uid())
  );

CREATE POLICY "Users can update notes of own courses" ON notes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = notes.course_id AND courses.user_id = auth.uid())
  );

CREATE POLICY "Users can delete notes of own courses" ON notes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = notes.course_id AND courses.user_id = auth.uid())
  );

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Performance indexes for common queries
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_course_id ON notes(course_id);
CREATE INDEX idx_notes_chapter_id ON notes(chapter_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- HNSW index for fast vector similarity search
-- Using halfvec_cosine_ops for cosine distance with halfvec type
CREATE INDEX idx_notes_embedding_hnsw ON notes
  USING hnsw (embedding halfvec_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- GIN index for full-text search
CREATE INDEX idx_notes_fts ON notes USING gin(fts);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Reuse update_updated_at_column() function from courses_schema migration
-- Trigger for notes table to update updated_at on changes
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
