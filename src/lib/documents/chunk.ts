/**
 * Document Text Chunking
 *
 * Splits extracted text into chunks for embedding and RAG retrieval.
 * Uses paragraph-based chunking with overlap.
 */

export interface TextChunk {
  content: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
}

export interface ChunkOptions {
  maxChunkSize?: number;   // Max characters per chunk (default: 1000)
  overlapSize?: number;    // Overlap between chunks (default: 200)
  separator?: string;      // Primary separator (default: '\n\n')
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxChunkSize: 1000,
  overlapSize: 200,
  separator: '\n\n',
};

/**
 * Split text into chunks using paragraph-based strategy with overlap
 *
 * Strategy:
 * 1. Split by paragraphs (double newline)
 * 2. Merge small paragraphs until maxChunkSize
 * 3. Split large paragraphs with overlap
 */
export function chunkText(text: string, options?: ChunkOptions): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: TextChunk[] = [];

  if (!text.trim()) return chunks;

  // Split into paragraphs
  const paragraphs = text.split(opts.separator).filter((p) => p.trim());

  let currentChunk = '';
  let currentStart = 0;
  let chunkIndex = 0;
  let charPosition = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();

    // Find actual position of this paragraph in original text
    const paragraphPos = text.indexOf(paragraph, charPosition);
    if (paragraphPos >= 0) charPosition = paragraphPos;

    // If single paragraph exceeds max, split it
    if (paragraph.length > opts.maxChunkSize) {
      // Flush current chunk first
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          chunkIndex: chunkIndex++,
          startChar: currentStart,
          endChar: currentStart + currentChunk.trim().length,
        });
      }

      // Split large paragraph by sentences or fixed size
      const subChunks = splitLargeParagraph(paragraph, opts.maxChunkSize, opts.overlapSize);
      for (const sub of subChunks) {
        chunks.push({
          content: sub,
          chunkIndex: chunkIndex++,
          startChar: charPosition,
          endChar: charPosition + sub.length,
        });
      }

      currentChunk = '';
      currentStart = charPosition + paragraph.length;
      continue;
    }

    // Check if adding paragraph exceeds max
    const separator = currentChunk ? '\n\n' : '';
    if (currentChunk.length + separator.length + paragraph.length > opts.maxChunkSize) {
      // Save current chunk
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          chunkIndex: chunkIndex++,
          startChar: currentStart,
          endChar: currentStart + currentChunk.trim().length,
        });
      }

      // Start new chunk with overlap from end of previous
      if (opts.overlapSize > 0 && currentChunk.length > opts.overlapSize) {
        const overlapText = currentChunk.slice(-opts.overlapSize);
        const lastNewline = overlapText.lastIndexOf('\n');
        const cleanOverlap = lastNewline >= 0 ? overlapText.slice(lastNewline + 1) : overlapText;
        currentChunk = cleanOverlap.trim() + '\n\n' + paragraph;
      } else {
        currentChunk = paragraph;
      }
      currentStart = charPosition;
    } else {
      // Append to current chunk
      if (!currentChunk) currentStart = charPosition;
      currentChunk += separator + paragraph;
    }
  }

  // Flush remaining
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      chunkIndex: chunkIndex++,
      startChar: currentStart,
      endChar: currentStart + currentChunk.trim().length,
    });
  }

  return chunks;
}

/**
 * Split a large paragraph into smaller pieces with overlap
 */
function splitLargeParagraph(
  text: string,
  maxSize: number,
  overlapSize: number
): string[] {
  const pieces: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxSize;

    if (end < text.length) {
      // Try to break at sentence boundary
      const slice = text.slice(start, end);
      const lastPeriod = slice.lastIndexOf('. ');
      const lastNewline = slice.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > maxSize * 0.5) {
        end = start + breakPoint + 1;
      }
    } else {
      end = text.length;
    }

    pieces.push(text.slice(start, end).trim());
    start = Math.max(start + 1, end - overlapSize);
  }

  return pieces;
}
