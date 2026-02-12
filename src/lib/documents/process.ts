/**
 * Document Processing Pipeline
 *
 * Orchestrates: extract text → chunk → embed → store
 */

import { extractText, generateTextSummary } from './extract';
import { chunkText } from './chunk';
import { generateEmbeddings, EMBEDDING_MODEL_ID } from '@/lib/ai/embeddings';
import {
  updateDocumentStatus,
  updateDocumentText,
  insertChunks,
} from '@/lib/dal/source-documents';
import type { SourceFileType } from '@/types/source-documents';

/**
 * Process an uploaded document: extract text, chunk, embed, store
 *
 * @param documentId - ID of the document record in DB
 * @param fileBuffer - Raw file buffer
 * @param fileType - pdf | docx | txt
 * @param courseId - Optional course ID (may be null during upload before course creation)
 */
export async function processDocument(
  documentId: string,
  fileBuffer: Buffer,
  fileType: SourceFileType,
  courseId?: string | null
): Promise<void> {
  try {
    // 1. Set status to processing
    await updateDocumentStatus(documentId, 'processing');

    // 2. Extract text
    const extracted = await extractText(fileBuffer, fileType);

    if (!extracted.text || extracted.text.length < 10) {
      throw new Error('Nie udało się wyekstrahować tekstu z pliku lub plik jest pusty');
    }

    // 3. Save extracted text and summary
    const summary = generateTextSummary(extracted.text);
    await updateDocumentText(documentId, {
      extracted_text: extracted.text,
      text_summary: summary,
      page_count: extracted.pageCount,
      word_count: extracted.wordCount,
    });

    // 4. Chunk text
    const textChunks = chunkText(extracted.text);

    if (textChunks.length === 0) {
      await updateDocumentStatus(documentId, 'completed');
      return;
    }

    // 5. Generate embeddings (batch)
    const chunkTexts = textChunks.map((c) => c.content);

    // Process in batches of 50 to avoid API limits
    const EMBEDDING_BATCH_SIZE = 50;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < chunkTexts.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = chunkTexts.slice(i, i + EMBEDDING_BATCH_SIZE);
      const embeddings = await generateEmbeddings(batch);
      allEmbeddings.push(...embeddings);
    }

    // 6. Insert chunks with embeddings
    const chunksToInsert = textChunks.map((chunk, index) => ({
      document_id: documentId,
      course_id: courseId ?? undefined,
      content: chunk.content,
      chunk_index: chunk.chunkIndex,
      start_char: chunk.startChar,
      end_char: chunk.endChar,
      embedding: allEmbeddings[index],
      embedding_model: EMBEDDING_MODEL_ID,
      metadata: {} as Record<string, unknown>,
    }));

    await insertChunks(chunksToInsert);

    // 7. Mark as completed
    await updateDocumentStatus(documentId, 'completed');

    console.log(
      `[Document] Processed "${documentId}": ${extracted.wordCount} words, ${textChunks.length} chunks`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown processing error';
    console.error(`[Document] Processing failed for "${documentId}":`, message);
    await updateDocumentStatus(documentId, 'failed', message);
    throw err;
  }
}
