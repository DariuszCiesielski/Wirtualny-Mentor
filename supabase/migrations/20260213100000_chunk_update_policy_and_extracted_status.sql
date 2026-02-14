-- Migration: Add UPDATE policy on chunks + 'extracted' processing status
-- Purpose: Enable two-stage document processing (extract+chunk first, embed second)

-- 1. Add UPDATE policy on course_source_chunks (needed for embedding updates)
CREATE POLICY "Users can update own source chunks" ON course_source_chunks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM course_source_documents d
      WHERE d.id = course_source_chunks.document_id AND d.user_id = auth.uid()
    )
  );

-- 2. Add 'extracted' to processing_status CHECK constraint
ALTER TABLE course_source_documents
  DROP CONSTRAINT IF EXISTS course_source_documents_processing_status_check;

ALTER TABLE course_source_documents
  ADD CONSTRAINT course_source_documents_processing_status_check
  CHECK (processing_status IN ('pending', 'processing', 'extracted', 'completed', 'failed'));
