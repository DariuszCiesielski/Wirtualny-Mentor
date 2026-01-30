/**
 * Clarifying Questions API
 *
 * Streaming endpoint for AI clarifying questions during course creation.
 * Uses structured output to parse AI responses with isComplete flag.
 */

import { streamText, Output } from "ai";
import { getModel } from "@/lib/ai/providers";
import { clarificationSchema } from "@/lib/ai/curriculum/schemas";
import { CLARIFYING_SYSTEM_PROMPT } from "@/lib/ai/curriculum/prompts";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: getModel("curriculum"), // GPT-4.1 for reliable structured output
    system: CLARIFYING_SYSTEM_PROMPT,
    messages,
    experimental_output: Output.object({ schema: clarificationSchema }),
  });

  return result.toUIMessageStreamResponse();
}

// Edge runtime for better streaming performance
export const runtime = "edge";
