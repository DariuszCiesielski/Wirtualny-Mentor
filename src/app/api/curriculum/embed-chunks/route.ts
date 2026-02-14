/**
 * Embed Chunks API (Stage 2)
 *
 * Generates embeddings for document chunks that were created without them.
 * Called by frontend after /api/curriculum/upload completes with status 'extracted'.
 *
 * POST /api/curriculum/embed-chunks
 * Body: { documentId: string }
 */

import { getUser } from '@/lib/dal/auth';
import { embedChunks } from '@/lib/documents/process';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { documentId } = body;

    if (!documentId || typeof documentId !== 'string') {
      return Response.json({ error: 'documentId is required' }, { status: 400 });
    }

    const { embeddedCount, remainingCount, totalChunks } = await embedChunks(documentId);

    return Response.json({
      documentId,
      status: remainingCount === 0 ? 'completed' : 'in_progress',
      embeddedCount,
      remainingCount,
      totalChunks,
    });
  } catch (error) {
    console.error('[EmbedChunks] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Embedding failed' },
      { status: 500 }
    );
  }
}
