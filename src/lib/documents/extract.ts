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
  switch (fileType) {
    case 'pdf':
      return extractTextFromPDF(buffer);
    case 'docx':
      return extractTextFromDOCX(buffer);
    case 'txt':
      return extractTextFromTXT(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Generate a summary from extracted text (first ~500 words)
 */
export function generateTextSummary(text: string, maxWords = 500): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
