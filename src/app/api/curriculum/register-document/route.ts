/**
 * Register Document API (Stage 1b of 4)
 *
 * Creates a DB record for a file already uploaded directly to Supabase Storage
 * from the browser (bypassing Vercel's 4.5MB body size limit).
 *
 * POST /api/curriculum/register-document
 * Body (JSON): { filename, fileType, fileSize, storagePath }
 */

import { getUser } from '@/lib/dal/auth';
import { createSourceDocument } from '@/lib/dal/source-documents';
import type { SourceFileType } from '@/types/source-documents';

export const runtime = 'nodejs';
export const maxDuration = 10;

const ALLOWED_FILE_TYPES: SourceFileType[] = ['pdf', 'docx', 'txt'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { filename, fileType, fileSize, storagePath } = body;

    if (!filename || typeof filename !== 'string') {
      return Response.json({ error: 'filename is required' }, { status: 400 });
    }
    if (!fileType || !ALLOWED_FILE_TYPES.includes(fileType)) {
      return Response.json(
        { error: `Nieobsługiwany typ pliku: ${fileType}` },
        { status: 400 }
      );
    }
    if (!fileSize || typeof fileSize !== 'number' || fileSize > MAX_FILE_SIZE) {
      return Response.json(
        { error: `Nieprawidłowy rozmiar pliku (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }
    if (!storagePath || typeof storagePath !== 'string') {
      return Response.json({ error: 'storagePath is required' }, { status: 400 });
    }

    // Security: storage path MUST start with the authenticated user's ID
    if (!storagePath.startsWith(`${user.id}/`)) {
      return Response.json({ error: 'Nieprawidłowa ścieżka pliku' }, { status: 403 });
    }

    const doc = await createSourceDocument(user.id, {
      course_id: null,
      filename,
      file_type: fileType as SourceFileType,
      file_size: fileSize,
      storage_path: storagePath,
    });

    console.log(`[RegisterDocument] Created: ${doc.id} (${filename}, ${(fileSize / 1024 / 1024).toFixed(1)}MB)`);

    return Response.json({
      documentId: doc.id,
      filename,
      fileType,
      fileSize,
    });
  } catch (error) {
    console.error('[RegisterDocument] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}
