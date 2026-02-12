-- Supabase Migration: Source Documents for Course Materials
-- Created: 2026-02-13
-- Purpose: Upload, process, chunk and embed user-provided materials (PDF, DOCX, TXT)
--          for curriculum generation and mentor chatbot RAG

-- ============================================================================
-- TABLES
-- ============================================================================

-- Source documents - metadata for uploaded files
CREATE TABLE course_source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,  -- nullable: upload before course creation
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- File metadata
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt')),
  file_size INT NOT NULL,
  storage_path TEXT NOT NULL,

  -- Extracted content
  extracted_text TEXT,
  text_summary TEXT,
  page_count INT,
  word_count INT,

  -- Processing status
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Source chunks - chunked text with embeddings for RAG
CREATE TABLE course_source_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES course_source_documents(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

  -- Chunk data
  content TEXT NOT NULL,
  chunk_index INT NOT NULL,
  start_char INT,
  end_char INT,

  -- Vector embedding (halfvec like notes table)
  embedding halfvec(1536),
  embedding_model TEXT DEFAULT 'text-embedding-3-small',

  -- Extra metadata (page_number, heading, etc.)
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE course_source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_source_chunks ENABLE ROW LEVEL SECURITY;

-- Source documents: direct user_id check
CREATE POLICY "Users can view own source documents" ON course_source_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own source documents" ON course_source_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own source documents" ON course_source_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own source documents" ON course_source_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Source chunks: access via document ownership (EXISTS join)
CREATE POLICY "Users can view own source chunks" ON course_source_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_source_documents d
      WHERE d.id = course_source_chunks.document_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own source chunks" ON course_source_chunks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_source_documents d
      WHERE d.id = course_source_chunks.document_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own source chunks" ON course_source_chunks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM course_source_documents d
      WHERE d.id = course_source_chunks.document_id AND d.user_id = auth.uid()
    )
  );

-- ============================================================================
-- INDEXES
-- ============================================================================

-- B-tree indexes for common queries
CREATE INDEX idx_source_docs_course_id ON course_source_documents(course_id);
CREATE INDEX idx_source_docs_user_id ON course_source_documents(user_id);
CREATE INDEX idx_source_chunks_document_id ON course_source_chunks(document_id);
CREATE INDEX idx_source_chunks_course_id ON course_source_chunks(course_id);

-- HNSW index for fast vector similarity search
CREATE INDEX idx_source_chunks_embedding_hnsw ON course_source_chunks
  USING hnsw (embedding halfvec_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Reuse update_updated_at_column() from courses_schema migration
CREATE TRIGGER update_source_docs_updated_at
  BEFORE UPDATE ON course_source_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Vector similarity search for source material chunks
-- Used by curriculum generation (RAG) and mentor chatbot
CREATE OR REPLACE FUNCTION search_source_chunks_semantic(
  p_course_id UUID,
  p_embedding TEXT,  -- JSON array of floats
  p_match_threshold FLOAT DEFAULT 0.5,
  p_match_count INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  similarity FLOAT,
  document_id UUID,
  chunk_index INT,
  metadata JSONB
) AS $$
DECLARE
  v_embedding halfvec(1536);
BEGIN
  v_embedding := p_embedding::halfvec(1536);

  RETURN QUERY
  SELECT
    c.id,
    c.content,
    (1 - (c.embedding <=> v_embedding))::FLOAT as similarity,
    c.document_id,
    c.chunk_index,
    c.metadata
  FROM course_source_chunks c
  WHERE c.course_id = p_course_id
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> v_embedding) > p_match_threshold
  ORDER BY c.embedding <=> v_embedding
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

-- Create storage bucket for course materials (run via Supabase Dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit)
-- VALUES ('course-materials', 'course-materials', false, 52428800);  -- 50MB limit
