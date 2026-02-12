/**
 * Suggest Topic API
 *
 * Analyzes uploaded document summaries and suggests a course topic.
 *
 * POST /api/curriculum/suggest-topic
 * Body: { documentIds: string[] }
 */

import { generateText } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { getUser } from '@/lib/dal/auth';
import { getDocumentsByIds } from '@/lib/dal/source-documents';
import { z } from 'zod';

export const runtime = 'nodejs';

const requestSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1).max(10),
});

const SUGGEST_TOPIC_PROMPT = `Na podstawie ponizszych streszczeń materiałów zaproponuj KRÓTKI temat kursu szkoleniowego (max 10 słów, po polsku).

Temat powinien:
- Być konkretny i opisowy
- Oddawać główny zakres tematyczny materiałów
- Nadawać się jako tytuł kursu

Odpowiedz WYŁĄCZNIE samym tematem, bez dodatkowego tekstu.`;

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { documentIds } = requestSchema.parse(body);

    const documents = await getDocumentsByIds(documentIds);
    const completedDocs = documents.filter(
      (d) => d.processing_status === 'completed' && d.text_summary
    );

    if (completedDocs.length === 0) {
      return Response.json(
        { error: 'Brak przetworzonych dokumentów' },
        { status: 400 }
      );
    }

    const summaries = completedDocs
      .map((d) => `--- ${d.filename} ---\n${d.text_summary}`)
      .join('\n\n');

    const { text } = await generateText({
      model: getModel('curriculum'),
      system: SUGGEST_TOPIC_PROMPT,
      prompt: summaries,
    });

    return Response.json({ topic: text.trim() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    console.error('[SuggestTopic] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to suggest topic' },
      { status: 500 }
    );
  }
}
