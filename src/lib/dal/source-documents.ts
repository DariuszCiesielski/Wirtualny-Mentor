/**
 * Data Access Layer - Source Documents
 *
 * CRUD + semantic search for uploaded course materials.
 * Pattern follows src/lib/dal/notes.ts.
 */

import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/embeddings';
import type {
  CourseSourceDocument,
  CreateSourceDocumentInput,
  SourceChunkSimilarityResult,
} from '@/types/source-documents';

// ============================================================================
// DOCUMENT CRUD
// ============================================================================

export async function createSourceDocument(
  userId: string,
  input: CreateSourceDocumentInput
): Promise<CourseSourceDocument> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('course_source_documents')
    .insert({
      user_id: userId,
      course_id: input.course_id ?? null,
      filename: input.filename,
      file_type: input.file_type,
      file_size: input.file_size,
      storage_path: input.storage_path,
      processing_status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create source document: ${error.message}`);
  }

  return data as CourseSourceDocument;
}

export async function updateDocumentStatus(
  documentId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  processingError?: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('course_source_documents')
    .update({
      processing_status: status,
      processing_error: processingError ?? null,
    })
    .eq('id', documentId);

  if (error) {
    throw new Error(`Failed to update document status: ${error.message}`);
  }
}

export async function updateDocumentText(
  documentId: string,
  data: {
    extracted_text: string;
    text_summary: string;
    page_count?: number;
    word_count: number;
  }
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('course_source_documents')
    .update({
      extracted_text: data.extracted_text,
      text_summary: data.text_summary,
      page_count: data.page_count ?? null,
      word_count: data.word_count,
    })
    .eq('id', documentId);

  if (error) {
    throw new Error(`Failed to update document text: ${error.message}`);
  }
}

export async function getDocumentsForCourse(
  courseId: string
): Promise<CourseSourceDocument[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('course_source_documents')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get documents for course: ${error.message}`);
  }

  return data as CourseSourceDocument[];
}

export async function getDocumentsByIds(
  documentIds: string[]
): Promise<CourseSourceDocument[]> {
  if (documentIds.length === 0) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('course_source_documents')
    .select('*')
    .in('id', documentIds);

  if (error) {
    throw new Error(`Failed to get documents by IDs: ${error.message}`);
  }

  return data as CourseSourceDocument[];
}

export async function deleteDocument(
  documentId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  // Delete from storage first
  const { data: doc } = await supabase
    .from('course_source_documents')
    .select('storage_path')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single();

  if (doc?.storage_path) {
    await supabase.storage.from('course-materials').remove([doc.storage_path]);
  }

  // Delete from DB (CASCADE will remove chunks)
  const { error } = await supabase
    .from('course_source_documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

// ============================================================================
// LINK DOCUMENTS TO COURSE
// ============================================================================

export async function linkDocumentsToCourse(
  documentIds: string[],
  courseId: string,
  userId: string
): Promise<void> {
  if (documentIds.length === 0) return;

  const supabase = await createClient();

  // Update documents
  const { error: docError } = await supabase
    .from('course_source_documents')
    .update({ course_id: courseId })
    .in('id', documentIds)
    .eq('user_id', userId);

  if (docError) {
    throw new Error(`Failed to link documents to course: ${docError.message}`);
  }

  // Update chunks
  const { error: chunkError } = await supabase
    .from('course_source_chunks')
    .update({ course_id: courseId })
    .in('document_id', documentIds);

  if (chunkError) {
    throw new Error(`Failed to link chunks to course: ${chunkError.message}`);
  }
}

// ============================================================================
// CHUNK OPERATIONS
// ============================================================================

export async function insertChunks(
  chunks: Array<{
    document_id: string;
    course_id?: string | null;
    content: string;
    chunk_index: number;
    start_char: number;
    end_char: number;
    embedding: number[];
    metadata?: Record<string, unknown>;
  }>
): Promise<void> {
  if (chunks.length === 0) return;

  const supabase = await createClient();

  // Insert in batches of 50 to avoid request size limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE).map((chunk) => ({
      document_id: chunk.document_id,
      course_id: chunk.course_id ?? null,
      content: chunk.content,
      chunk_index: chunk.chunk_index,
      start_char: chunk.start_char,
      end_char: chunk.end_char,
      embedding: JSON.stringify(chunk.embedding),
      metadata: chunk.metadata ?? {},
    }));

    const { error } = await supabase
      .from('course_source_chunks')
      .insert(batch);

    if (error) {
      throw new Error(`Failed to insert chunks batch ${i}: ${error.message}`);
    }
  }
}

// ============================================================================
// SEMANTIC SEARCH
// ============================================================================

export async function searchChunksSemantic(
  courseId: string,
  queryText: string,
  threshold = 0.5,
  limit = 10
): Promise<SourceChunkSimilarityResult[]> {
  const supabase = await createClient();

  const queryEmbedding = await generateEmbedding(queryText);

  const { data, error } = await supabase.rpc('search_source_chunks_semantic', {
    p_course_id: courseId,
    p_embedding: JSON.stringify(queryEmbedding),
    p_match_threshold: threshold,
    p_match_count: limit,
  });

  if (error) {
    throw new Error(`Failed to search source chunks: ${error.message}`);
  }

  return data as SourceChunkSimilarityResult[];
}
