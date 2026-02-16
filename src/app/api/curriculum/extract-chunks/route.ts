/**
 * Chunk Text API (Stage 2 of 3)
 *
 * Reads already-extracted text from DB, chunks it, and saves chunks (WITHOUT embeddings).
 * Called by frontend after /api/curriculum/upload completes with textExtracted: true.
 *
 * POST /api/curriculum/extract-chunks
 * Body: { documentId: string, courseId?: string }
 */

import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/dal/auth';
import { updateDocumentStatus, insertChunksWithoutEmbeddings } from '@/lib/dal/source-documents';
import { chunkText } from '@/lib/documents/chunk';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { documentId, courseId } = body;

    if (!documentId || typeof documentId !== 'string') {
      return Response.json({ error: 'documentId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get document with extracted text (RLS ensures user ownership)
    const { data: doc, error: docError } = await supabase
      .from('course_source_documents')
      .select('id, extracted_text, processing_status, word_count')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      return Response.json({ error: 'Dokument nie znaleziony' }, { status: 404 });
    }

    // Already has chunks — skip
    if (doc.processing_status === 'extracted' || doc.processing_status === 'completed') {
      return Response.json({
        documentId: doc.id,
        status: doc.processing_status,
        alreadyProcessed: true,
        wordCount: doc.word_count,
      });
    }

    if (!doc.extracted_text || doc.extracted_text.length < 10) {
      return Response.json(
        { error: 'Brak wyekstrahowanego tekstu. Plik mógł nie zostać poprawnie przetworzony.' },
        { status: 400 }
      );
    }

    // Chunk the extracted text (fast — pure string processing)
    console.log(`[ExtractChunks] Chunking text for ${documentId} (${doc.word_count ?? '?'} words)`);
    const textChunks = chunkText(doc.extracted_text);
    console.log(`[ExtractChunks] Created ${textChunks.length} chunks`);

    if (textChunks.length === 0) {
      await updateDocumentStatus(documentId, 'extracted', undefined, supabase);
      return Response.json({
        documentId: doc.id,
        chunkCount: 0,
        wordCount: doc.word_count,
        status: 'extracted',
      });
    }

    // Insert chunks WITHOUT embeddings
    await insertChunksWithoutEmbeddings(
      textChunks.map((chunk) => ({
        document_id: documentId,
        course_id: courseId ?? undefined,
        content: chunk.content,
        chunk_index: chunk.chunkIndex,
        start_char: chunk.startChar,
        end_char: chunk.endChar,
      })),
      supabase
    );

    // Mark as extracted (chunks saved, embeddings pending)
    await updateDocumentStatus(documentId, 'extracted', undefined, supabase);

    console.log(`[ExtractChunks] Done: ${textChunks.length} chunks for ${documentId}`);

    return Response.json({
      documentId: doc.id,
      chunkCount: textChunks.length,
      wordCount: doc.word_count,
      status: 'extracted',
    });
  } catch (error) {
    console.error('[ExtractChunks] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Chunking failed' },
      { status: 500 }
    );
  }
}
