/**
 * Document Upload API (Stage 1 of 4)
 *
 * ONLY uploads file to Supabase Storage and creates a DB record.
 * Text extraction is handled by /api/curriculum/extract-text.
 *
 * POST /api/curriculum/upload
 * FormData: file, courseId? (optional)
 */

import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/dal/auth';
import { createSourceDocument } from '@/lib/dal/source-documents';
import type { SourceFileType } from '@/types/source-documents';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

    const fileType = ALLOWED_TYPES[file.type];
    if (!fileType) {
      return Response.json(
        { error: `Nieobsługiwany typ pliku: ${file.type}. Dozwolone: PDF, DOCX, TXT` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `Plik za duży (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = await createClient();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${user.id}/${crypto.randomUUID()}_${sanitizedName}`;

    console.log(`[Upload] Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB) to storage`);

    const { error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const doc = await createSourceDocument(user.id, {
      course_id: courseId || null,
      filename: file.name,
      file_type: fileType,
      file_size: file.size,
      storage_path: storagePath,
    });

    console.log(`[Upload] Done: ${doc.id} (${file.name})`);

    return Response.json({
      documentId: doc.id,
      filename: file.name,
      fileType,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
