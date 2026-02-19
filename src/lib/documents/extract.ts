/**
 * Document Text Extraction
 *
 * Extracts text from PDF, DOCX and TXT files.
 * Uses unpdf for PDF (serverless-friendly, no Web Worker needed).
 */

import type { SourceFileType } from '@/types/source-documents';

export interface ExtractedText {
  text: string;
  pageCount?: number;
  wordCount: number;
}

/**
 * Extract text from a PDF buffer using unpdf (serverless-friendly).
 */
async function extractTextFromPDF(buffer: Buffer): Promise<ExtractedText> {
  const { extractText: unpdfExtract } = await import('unpdf');

  const { text, totalPages } = await unpdfExtract(new Uint8Array(buffer));
  const trimmed = text.join('\n\n').trim();

  return {
    text: trimmed,
    pageCount: totalPages,
    wordCount: countWords(trimmed),
  };
}

/**
 * Extract text from a DOCX buffer
 */
async function extractTextFromDOCX(buffer: Buffer): Promise<ExtractedText> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });

  const text = result.value.trim();
  return {
    text,
    wordCount: countWords(text),
  };
}

/**
 * Extract text from a TXT buffer
 */
function extractTextFromTXT(buffer: Buffer): ExtractedText {
  const text = buffer.toString('utf-8').trim();
  return {
    text,
    wordCount: countWords(text),
  };
}

/**
 * Extract text from any supported file type
 */
export async function extractText(
  buffer: Buffer,
  fileType: SourceFileType
): Promise<ExtractedText> {
  let result: ExtractedText;

  switch (fileType) {
    case 'pdf':
      result = await extractTextFromPDF(buffer);
      break;
    case 'docx':
      result = await extractTextFromDOCX(buffer);
      break;
    case 'txt':
      result = extractTextFromTXT(buffer);
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  // Sanitize text to prevent PostgreSQL "unsupported Unicode escape sequence" errors
  result.text = sanitizeForPostgres(result.text);

  return result;
}

/**
 * Generate a summary from extracted text (first ~500 words)
 */
export function generateTextSummary(text: string, maxWords = 500): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Sanitize text for PostgreSQL storage.
 * Removes null bytes (\u0000) and other unsupported Unicode escape sequences
 * that PostgreSQL text/jsonb columns reject.
 */
function sanitizeForPostgres(text: string): string {
  return text
    // Remove null bytes (most common cause of "unsupported Unicode escape sequence")
    .replace(/\u0000/g, '')
    // Remove other C0 control characters (except \t, \n, \r which are valid)
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    // Remove Unicode replacement character clusters (corrupted data)
    .replace(/\uFFFD{3,}/g, ' ');
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
