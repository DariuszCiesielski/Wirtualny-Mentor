/**
 * Document Upload API
 *
 * Handles file upload for course materials (PDF, DOCX, TXT).
 * Uploads to Supabase Storage, extracts text, chunks, and embeds.
 *
 * POST /api/curriculum/upload
 * FormData: file, courseId? (optional)
 */

import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/dal/auth';
import { createSourceDocument } from '@/lib/dal/source-documents';
import { processDocument } from '@/lib/documents/process';
import type { SourceFileType, UploadedSourceFile } from '@/types/source-documents';

// Must be nodejs runtime for pdf-parse/mammoth (Buffer, fs)
export const runtime = 'nodejs';

const ALLOWED_TYPES: Record<string, SourceFileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const courseId = formData.get('courseId') as string | null;

    if (!file) {
      return Response.json({ error: 'Brak pliku' }, { status: 400 });
    }

    // Validate file type
    const fileType = ALLOWED_TYPES[file.type];
    if (!fileType) {
      return Response.json(
        { error: `Nieobsługiwany typ pliku: ${file.type}. Dozwolone: PDF, DOCX, TXT` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `Plik za duży (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    // Read file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const supabase = await createClient();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${user.id}/${crypto.randomUUID()}_${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Create document record
    const doc = await createSourceDocument(user.id, {
      course_id: courseId || null,
      filename: file.name,
      file_type: fileType,
      file_size: file.size,
      storage_path: storagePath,
    });

    // Process document (extract, chunk, embed)
    // This runs synchronously - for very large files may take time
    try {
      await processDocument(doc.id, buffer, fileType, courseId);
    } catch (processError) {
      // Processing failed but document record exists - return with failed status
      const errorMessage = processError instanceof Error ? processError.message : 'Unknown processing error';
      console.error('[Upload] Processing failed:', errorMessage, processError);
      const result: UploadedSourceFile = {
        documentId: doc.id,
        filename: file.name,
        fileType,
        fileSize: file.size,
        processingStatus: 'failed',
        processingError: errorMessage,
      };
      return Response.json(result);
    }

    // Fetch updated document for response
    const { data: updatedDoc } = await supabase
      .from('course_source_documents')
      .select('processing_status, text_summary, word_count')
      .eq('id', doc.id)
      .single();

    const result: UploadedSourceFile = {
      documentId: doc.id,
      filename: file.name,
      fileType,
      fileSize: file.size,
      processingStatus: updatedDoc?.processing_status ?? 'completed',
      extractedTextPreview: updatedDoc?.text_summary?.slice(0, 200),
      wordCount: updatedDoc?.word_count,
    };

    return Response.json(result);
  } catch (error) {
    console.error('[Upload] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
