// Test endpoint for AI SDK verification
// GET /api/test-ai - returns streaming response from curriculum model (GPT)
// NOTE: Using 'curriculum' (OpenAI) for testing. Switch to 'mentor' (Claude) when Anthropic key is available.

import { streamText } from 'ai';
import { getModel } from '@/lib/ai';

export async function GET() {
  const result = streamText({
    model: getModel('curriculum'),
    prompt: 'Przedstaw sie krotko jako Wirtualny Mentor. Powiedz czym sie zajmujesz i jak mozesz pomoc w nauce. Odpowiedz po polsku, max 3 zdania.',
  });

  return result.toTextStreamResponse();
}

// Edge runtime for better streaming performance
export const runtime = 'edge';
