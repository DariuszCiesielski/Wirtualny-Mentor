/**
 * Extract Text API (Stage 2 of 4)
 *
 * Downloads file from Supabase Storage, extracts text using unpdf/mammoth,
 * and saves extracted text to DB. Has full 60s budget for extraction only.
 *
 * POST /api/curriculum/extract-text
 * Body: { documentId: string }
 */

import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/dal/auth';
import { updateDocumentStatus, updateDocumentText } from '@/lib/dal/source-documents';
import { extractText, generateTextSummary } from '@/lib/documents/extract';
import type { SourceFileType } from '@/types/source-documents';

// Must be nodejs runtime for mammoth/unpdf
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { documentId } = body;

    if (!documentId || typeof documentId !== 'string') {
      return Response.json({ error: 'documentId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get document info (RLS ensures user ownership)
    const { data: doc, error: docError } = await supabase
      .from('course_source_documents')
      .select('id, storage_path, file_type, file_size, processing_status, word_count')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      return Response.json({ error: 'Dokument nie znaleziony' }, { status: 404 });
    }

    // Already extracted — skip
    if (doc.processing_status === 'extracted' || doc.processing_status === 'completed') {
      return Response.json({
        documentId: doc.id,
        wordCount: doc.word_count,
        alreadyExtracted: true,
      });
    }

    // If already processing and has word_count, text is already extracted
    if (doc.processing_status === 'processing' && doc.word_count) {
      return Response.json({
        documentId: doc.id,
        wordCount: doc.word_count,
        alreadyExtracted: true,
      });
    }

    await updateDocumentStatus(documentId, 'processing', undefined, supabase);

    // Download file from Supabase Storage
    console.log(`[ExtractText] Downloading ${doc.storage_path} (${(doc.file_size / 1024 / 1024).toFixed(1)}MB)`);
    const downloadStart = Date.now();

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('course-materials')
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Storage download failed: ${downloadError?.message || 'No data'}`);
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    console.log(`[ExtractText] Downloaded in ${Date.now() - downloadStart}ms`);

    // Extract text (this is the heavy operation)
    const extractStart = Date.now();
    console.log(`[ExtractText] Extracting text (${doc.file_type})`);
    const extracted = await extractText(buffer, doc.file_type as SourceFileType);
    console.log(`[ExtractText] Extracted in ${Date.now() - extractStart}ms: ${extracted.wordCount} words, ${extracted.pageCount ?? '?'} pages`);

    if (!extracted.text || extracted.text.length < 10) {
      throw new Error('Nie udało się wyekstrahować tekstu z pliku lub plik jest pusty');
    }

    // Save extracted text to DB
    const summary = generateTextSummary(extracted.text);
    await updateDocumentText(documentId, {
      extracted_text: extracted.text,
      text_summary: summary,
      page_count: extracted.pageCount,
      word_count: extracted.wordCount,
    }, supabase);

    // Mark as processing (text saved, chunks pending)
    await updateDocumentStatus(documentId, 'processing', undefined, supabase);

    console.log(`[ExtractText] Done: ${documentId} (${extracted.wordCount} words)`);

    return Response.json({
      documentId: doc.id,
      wordCount: extracted.wordCount,
      pageCount: extracted.pageCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Text extraction failed';
    console.error('[ExtractText] Error:', message);

    // Try to mark as failed in DB
    try {
      const body = await req.clone().json().catch(() => null);
      if (body?.documentId) {
        const supabase = await createClient();
        await updateDocumentStatus(body.documentId, 'failed', message, supabase);
      }
    } catch { /* ignore cleanup errors */ }

    return Response.json({ error: message }, { status: 500 });
  }
}
