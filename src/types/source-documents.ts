/**
 * Source Documents Types - uploaded materials for course generation
 *
 * Keep in sync with supabase/migrations/20260213000001_source_documents.sql
 */

// ============================================================================
// ENUMS
// ============================================================================

export type SourceFileType = 'pdf' | 'docx' | 'txt';
export type DocumentProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================================================
// BASE ENTITIES
// ============================================================================

export interface CourseSourceDocument {
  id: string;
  course_id: string | null;
  user_id: string;
  filename: string;
  file_type: SourceFileType;
  file_size: number;
  storage_path: string;
  extracted_text: string | null;
  text_summary: string | null;
  page_count: number | null;
  word_count: number | null;
  processing_status: DocumentProcessingStatus;
  processing_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseSourceChunk {
  id: string;
  document_id: string;
  course_id: string | null;
  content: string;
  chunk_index: number;
  start_char: number | null;
  end_char: number | null;
  embedding: number[] | null;
  embedding_model: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// SEARCH RESULTS
// ============================================================================

export interface SourceChunkSimilarityResult {
  id: string;
  content: string;
  similarity: number;
  document_id: string;
  chunk_index: number;
  metadata: Record<string, unknown>;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateSourceDocumentInput {
  course_id?: string | null;
  filename: string;
  file_type: SourceFileType;
  file_size: number;
  storage_path: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface UploadedSourceFile {
  documentId: string;
  filename: string;
  fileType: SourceFileType;
  fileSize: number;
  processingStatus: DocumentProcessingStatus;
  extractedTextPreview?: string;
  wordCount?: number;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type FileUploadStatus = 'uploading' | 'processing' | 'completed' | 'error';

export interface FileProcessingState {
  file: File;
  documentId?: string;
  status: FileUploadStatus;
  progress: number; // 0-100
  error?: string;
  extractedTextPreview?: string;
  wordCount?: number;
}

// ============================================================================
// TOPIC INPUT DATA
// ============================================================================

export interface TopicSubmitData {
  topic: string;
  sourceUrl?: string;
  uploadedDocumentIds: string[];
  useWebSearch: boolean;
}
