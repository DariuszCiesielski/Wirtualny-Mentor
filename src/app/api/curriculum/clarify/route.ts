/**
 * Clarifying Questions API
 *
 * Streaming endpoint for AI clarifying questions during course creation.
 * Uses structured output to parse AI responses with isComplete flag.
 */

import { streamText, Output, type ModelMessage } from "ai";
import { getModel } from "@/lib/ai/providers";
import { clarificationSchema } from "@/lib/ai/curriculum/schemas";
import { CLARIFYING_SYSTEM_PROMPT } from "@/lib/ai/curriculum/prompts";

// Convert UIMessage format (parts) to CoreMessage format (content)
interface UIMessagePart {
  type: string;
  text?: string;
}

interface UIMessage {
  role: "user" | "assistant" | "system";
  parts?: UIMessagePart[];
  content?: string;
}

function convertToCoreMessages(messages: UIMessage[]): ModelMessage[] {
  return messages.map((msg) => {
    // If already has content string, use it
    if (typeof msg.content === "string") {
      return { role: msg.role, content: msg.content };
    }
    // Convert parts to content string
    const content = msg.parts
      ?.filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("") ?? "";
    return { role: msg.role, content };
  });
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Convert UIMessage[] to CoreMessage[]
    const coreMessages = convertToCoreMessages(messages);

    const result = streamText({
      model: getModel("curriculum"),
      system: CLARIFYING_SYSTEM_PROMPT,
      messages: coreMessages,
      experimental_output: Output.object({ schema: clarificationSchema }),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[clarify] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Edge runtime for better streaming performance
export const runtime = "edge";
