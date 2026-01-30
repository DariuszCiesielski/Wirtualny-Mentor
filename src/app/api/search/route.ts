import { NextResponse } from 'next/server';
import { searchWeb } from '@/lib/tavily/client';
import { z } from 'zod';

const searchRequestSchema = z.object({
  query: z.string().min(2),
  topic: z.enum(['general', 'news']).optional(),
  maxResults: z.number().int().min(1).max(10).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, topic, maxResults } = searchRequestSchema.parse(body);

    const results = await searchWeb(query, { topic, maxResults });
    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
