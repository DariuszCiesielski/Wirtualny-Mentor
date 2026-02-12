/**
 * Document Text Extraction
 *
 * Extracts text from PDF, DOCX and TXT files.
 * Uses pdf-parse for PDF and mammoth for DOCX.
 */

import type { SourceFileType } from '@/types/source-documents';

// pdfjs-dist v5 requires DOMMatrix (browser API) even for text extraction.
// In Node.js serverless (Vercel), DOMMatrix is not available — provide a stub.
if (typeof globalThis.DOMMatrix === 'undefined') {
  // @ts-expect-error — minimal stub, only identity matrix needed for text extraction
  globalThis.DOMMatrix = class DOMMatrix {
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    is2D = true;
    isIdentity = true;
    inverse() { return new DOMMatrix(); }
    multiply() { return new DOMMatrix(); }
    translate() { return new DOMMatrix(); }
    scale() { return new DOMMatrix(); }
    rotate() { return new DOMMatrix(); }
    transformPoint(p: Record<string, number> = {}) { return { x: p.x ?? 0, y: p.y ?? 0, z: p.z ?? 0, w: p.w ?? 1 }; }
    toFloat32Array() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
    toFloat64Array() { return new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
    toString() { return 'matrix(1, 0, 0, 1, 0, 0)'; }
  };
}

export interface ExtractedText {
  text: string;
  pageCount?: number;
  wordCount: number;
}

/**
 * Extract text from a PDF buffer
 */
async function extractTextFromPDF(buffer: Buffer): Promise<ExtractedText> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  const textResult = await parser.getText();
  const text = textResult.text.trim();
  const pageCount = textResult.total;

  // Clean up parser resources (ignore errors)
  try { await parser.destroy(); } catch { /* noop */ }

  return {
    text,
    pageCount,
    wordCount: countWords(text),
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
