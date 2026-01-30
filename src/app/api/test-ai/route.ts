// Test endpoint for AI SDK verification
// GET /api/test-ai - returns streaming response from mentor model

import { streamText } from 'ai';
import { getModel } from '@/lib/ai';

export async function GET() {
  const result = streamText({
    model: getModel('mentor'),
    prompt: 'Przedstaw sie krotko jako Wirtualny Mentor. Powiedz czym sie zajmujesz i jak mozesz pomoc w nauce. Odpowiedz po polsku, max 3 zdania.',
  });

  return result.toTextStreamResponse();
}

// Edge runtime for better streaming performance
export const runtime = 'edge';
