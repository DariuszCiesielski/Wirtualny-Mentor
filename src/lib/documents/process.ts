/**
 * Document Processing Pipeline (Two-Stage)
 *
 * Stage 1: extractAndChunk — extract text + chunk + save to DB (no embeddings)
 * Stage 2: embedChunks — generate embeddings + update chunks in DB
 *
 * Split into two stages to fit within Vercel Hobby time limits (60s per request).
 * Stage 2 supports chunked processing — frontend calls in a loop for large files.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { extractText, generateTextSummary } from './extract';
import { chunkText } from './chunk';
import { generateEmbeddings, EMBEDDING_MODEL_ID } from '@/lib/ai/embeddings';
import {
  updateDocumentStatus,
  updateDocumentText,
  insertChunksWithoutEmbeddings,
  getChunksWithoutEmbeddings,
  updateChunkEmbeddings,
} from '@/lib/dal/source-documents';
import type { SourceFileType } from '@/types/source-documents';

const EMBEDDING_BATCH_SIZE = 50;
const DEFAULT_MAX_BATCHES = 5; // 250 chunks per call → ~15-25s, safe within 60s

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = baseDelay * (attempt + 1);
      console.warn(`[Document] Retry ${attempt + 1}/${maxRetries} after ${delay}ms:`, err instanceof Error ? err.message : err);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}

/**
 * Stage 1: Extract text from file, chunk it, and save chunks WITHOUT embeddings.
 * Typically completes in 5-15 seconds.
 *
 * @returns chunkCount — number of chunks created
 */
export async function extractAndChunk(
  documentId: string,
  fileBuffer: Buffer,
  fileType: SourceFileType,
  courseId?: string | null,
  supabase?: SupabaseClient
): Promise<{ chunkCount: number; wordCount: number }> {
  try {
    // 1. Set status to processing
    console.log(`[Document] Stage 1 Step 1: Setting status to 'processing' for ${documentId}`);
    await updateDocumentStatus(documentId, 'processing', undefined, supabase);

    // 2. Extract text
    console.log(`[Document] Stage 1 Step 2: Extracting text (${fileType}, ${fileBuffer.length} bytes)`);
    const extracted = await extractText(fileBuffer, fileType);
    console.log(`[Document] Stage 1 Step 2 OK: ${extracted.wordCount} words, ${extracted.pageCount ?? '?'} pages`);

    if (!extracted.text || extracted.text.length < 10) {
      throw new Error('Nie udało się wyekstrahować tekstu z pliku lub plik jest pusty');
    }

    // 3. Save extracted text and summary
    console.log(`[Document] Stage 1 Step 3: Saving extracted text to DB`);
    const summary = generateTextSummary(extracted.text);
    await updateDocumentText(documentId, {
      extracted_text: extracted.text,
      text_summary: summary,
      page_count: extracted.pageCount,
      word_count: extracted.wordCount,
    }, supabase);

    // 4. Chunk text
    console.log(`[Document] Stage 1 Step 4: Chunking text`);
    const textChunks = chunkText(extracted.text);
    console.log(`[Document] Stage 1 Step 4 OK: ${textChunks.length} chunks`);

    if (textChunks.length === 0) {
      await updateDocumentStatus(documentId, 'extracted', undefined, supabase);
      return { chunkCount: 0, wordCount: extracted.wordCount };
    }

    // 5. Insert chunks WITHOUT embeddings
    console.log(`[Document] Stage 1 Step 5: Inserting ${textChunks.length} chunks (no embeddings)`);
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

    // 6. Mark as extracted (chunks saved, embeddings pending)
    await updateDocumentStatus(documentId, 'extracted', undefined, supabase);

    console.log(
      `[Document] Stage 1 DONE: "${documentId}" — ${extracted.wordCount} words, ${textChunks.length} chunks (no embeddings yet)`
    );

    return { chunkCount: textChunks.length, wordCount: extracted.wordCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown processing error';
    console.error(`[Document] Stage 1 failed for "${documentId}":`, message);
    await updateDocumentStatus(documentId, 'failed', message, supabase);
    throw err;
  }
}

/**
 * Stage 2: Generate embeddings for chunks and update them in DB.
 * Idempotent — only processes chunks where embedding IS NULL.
 *
 * Supports chunked processing: processes up to maxBatches batches per call.
 * Frontend calls in a loop until remainingCount === 0 (for large files).
 * Each batch is saved immediately (partial save) for resilience.
 */
export async function embedChunks(
  documentId: string,
  supabase?: SupabaseClient,
  maxBatches = DEFAULT_MAX_BATCHES
): Promise<{ embeddedCount: number; remainingCount: number; totalChunks: number }> {
  let embeddedCount = 0;

  try {
    // 1. Get chunks without embeddings
    const chunks = await getChunksWithoutEmbeddings(documentId, supabase);
    const totalChunks = chunks.length;
    console.log(`[Document] Stage 2: ${totalChunks} chunks to embed for "${documentId}" (maxBatches: ${maxBatches})`);

    if (totalChunks === 0) {
      await updateDocumentStatus(documentId, 'completed', undefined, supabase);
      return { embeddedCount: 0, remainingCount: 0, totalChunks: 0 };
    }

    // 2. Process up to maxBatches batches (partial — frontend loops for large files)
    const chunksToProcess = chunks.slice(0, maxBatches * EMBEDDING_BATCH_SIZE);
    const remainingAfter = totalChunks - chunksToProcess.length;

    for (let i = 0; i < chunksToProcess.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = chunksToProcess.slice(i, i + EMBEDDING_BATCH_SIZE);
      const batchNum = Math.floor(i / EMBEDDING_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunksToProcess.length / EMBEDDING_BATCH_SIZE);
      console.log(`[Document] Stage 2: Embedding batch ${batchNum}/${totalBatches} (${batch.length} chunks)`);

      const embeddings = await withRetry(() => generateEmbeddings(batch.map((c) => c.content)));

      // Partial save — immediately persist this batch
      const batchUpdates = batch.map((chunk, j) => ({ id: chunk.id, embedding: embeddings[j] }));
      await updateChunkEmbeddings(batchUpdates, supabase);
      embeddedCount += batch.length;
    }

    // 3. Set status based on remaining chunks
    if (remainingAfter === 0) {
      await updateDocumentStatus(documentId, 'completed', undefined, supabase);
      console.log(`[Document] Stage 2 DONE: "${documentId}" — all ${embeddedCount} chunks embedded`);
    } else {
      // Keep as 'extracted' — frontend will call again for remaining chunks
      console.log(`[Document] Stage 2 PARTIAL: "${documentId}" — ${embeddedCount} embedded, ${remainingAfter} remaining`);
    }

    return { embeddedCount, remainingCount: remainingAfter, totalChunks };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown embedding error';
    console.error(`[Document] Stage 2 failed for "${documentId}":`, message);

    // If some chunks were embedded (partial save), keep as 'extracted' so frontend can retry
    if (embeddedCount > 0) {
      console.log(`[Document] Partial failure: ${embeddedCount} chunks saved, keeping status 'extracted' for retry`);
      await updateDocumentStatus(documentId, 'extracted', `Częściowy błąd: ${embeddedCount} chunków zapisanych, ${message}`, supabase);
    } else {
      await updateDocumentStatus(documentId, 'failed', message, supabase);
    }
    throw err;
  }
}

/**
 * Full pipeline (both stages) — for local dev or environments without time limits.
 * Processes all chunks at once (no batching limit).
 */
export async function processDocument(
  documentId: string,
  fileBuffer: Buffer,
  fileType: SourceFileType,
  courseId?: string | null,
  supabase?: SupabaseClient
): Promise<void> {
  await extractAndChunk(documentId, fileBuffer, fileType, courseId, supabase);
  // No batch limit — process all chunks in one call
  await embedChunks(documentId, supabase, Infinity);
}
