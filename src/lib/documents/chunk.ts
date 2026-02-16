/**
 * Document Text Chunking
 *
 * Splits extracted text into chunks for embedding and RAG retrieval.
 * Uses simple fixed-size strategy with sentence-boundary awareness.
 *
 * Designed for documents up to 200k words (~1.2MB text).
 * Safeguard: max 5000 chunks per document.
 */

export interface TextChunk {
  content: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
}

export interface ChunkOptions {
  maxChunkSize?: number;   // Max characters per chunk (default: 2000)
  overlapSize?: number;    // Overlap between chunks (default: 300)
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxChunkSize: 2000,
  overlapSize: 300,
};

const MAX_CHUNKS = 5000;

/**
 * Split text into chunks using fixed-size strategy with sentence-boundary awareness.
 *
 * Strategy:
 * 1. Walk through text in steps of (maxChunkSize - overlapSize)
 * 2. Try to break at sentence boundary (". ") or newline
 * 3. If chunk count exceeds MAX_CHUNKS, auto-increase chunk size
 */
export function chunkText(text: string, options?: ChunkOptions): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const cleaned = text.trim();
  if (!cleaned) return [];

  // Estimate chunk count — if too many, increase chunk size
  const effectiveAdvance = opts.maxChunkSize - opts.overlapSize;
  const estimatedChunks = Math.ceil(cleaned.length / effectiveAdvance);

  let chunkSize = opts.maxChunkSize;
  let overlap = opts.overlapSize;

  if (estimatedChunks > MAX_CHUNKS) {
    // Auto-scale chunk size to fit within MAX_CHUNKS
    const targetAdvance = Math.ceil(cleaned.length / MAX_CHUNKS);
    overlap = Math.min(500, Math.floor(targetAdvance * 0.15));
    chunkSize = targetAdvance + overlap;
    console.log(`[Chunk] Auto-scaled: ${chunkSize} chars/chunk, ${overlap} overlap (estimated ${estimatedChunks} → ~${MAX_CHUNKS} chunks)`);
  }

  return fixedSizeChunk(cleaned, chunkSize, overlap);
}

/**
 * Simple fixed-size chunking with sentence-boundary awareness.
 * Predictable chunk count: ceil(textLength / (chunkSize - overlap))
 */
function fixedSizeChunk(
  text: string,
  chunkSize: number,
  overlap: number
): TextChunk[] {
  const chunks: TextChunk[] = [];
  const advance = chunkSize - overlap;
  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    // Try to break at sentence boundary if not at end of text
    if (end < text.length) {
      const slice = text.slice(start, end);

      // Look for last sentence boundary in the last 30% of the slice
      const searchStart = Math.floor(slice.length * 0.7);
      const tail = slice.slice(searchStart);

      const lastPeriod = tail.lastIndexOf('. ');
      const lastNewline = tail.lastIndexOf('\n');
      const bestBreak = Math.max(lastPeriod, lastNewline);

      if (bestBreak >= 0) {
        end = start + searchStart + bestBreak + 1;
      }
    }

    const content = text.slice(start, end).trim();
    if (content.length > 0) {
      chunks.push({
        content,
        chunkIndex: chunkIndex++,
        startChar: start,
        endChar: end,
      });
    }

    // Advance by fixed step (not based on end position)
    start += advance;
  }

  return chunks;
}
