/**
 * Embedding Generation - AI SDK wrapper for text embeddings
 *
 * Uses OpenAI text-embedding-3-small (1536 dimensions)
 * Configured in providers.ts as MODEL_CONFIG.embedding
 *
 * Source: https://ai-sdk.dev/docs/ai-sdk-core/embeddings
 */

import { embed, embedMany, cosineSimilarity } from 'ai';
import { openai } from '@ai-sdk/openai';

// Model configuration - matches providers.ts
const EMBEDDING_MODEL = openai.embedding('text-embedding-3-small');
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embedding for a single text
 *
 * @param text - Text to embed
 * @returns Float array of 1536 dimensions
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding, usage } = await embed({
    model: EMBEDDING_MODEL,
    value: text,
  });

  // Log usage for cost tracking (optional)
  console.log(`[Embedding] Tokens: ${usage.tokens}`);

  return embedding;
}

/**
 * Generate embeddings for multiple texts (batch)
 *
 * More efficient than calling generateEmbedding in a loop.
 * Use for re-indexing or bulk operations.
 *
 * @param texts - Array of texts to embed
 * @returns Array of float arrays (1536 dimensions each)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const { embeddings, usage } = await embedMany({
    model: EMBEDDING_MODEL,
    values: texts,
  });

  console.log(`[Embedding Batch] Texts: ${texts.length}, Tokens: ${usage.tokens}`);

  return embeddings;
}

/**
 * Calculate cosine similarity between two embeddings
 *
 * @param a - First embedding
 * @param b - Second embedding
 * @returns Similarity score (0 to 1, higher = more similar)
 */
export function calculateSimilarity(a: number[], b: number[]): number {
  return cosineSimilarity(a, b);
}

/**
 * Embedding model identifier for tracking version drift
 */
export const EMBEDDING_MODEL_ID = 'text-embedding-3-small';

/**
 * Embedding dimensions for type checking
 */
export { EMBEDDING_DIMENSIONS };
