/**
 * Clarifying Questions API
 *
 * Streaming endpoint for AI clarifying questions during course creation.
 * Uses structured output to parse AI responses with isComplete flag.
 * Supports material-based context when documents are uploaded.
 */

import { streamText, Output, type ModelMessage } from "ai";
import { getModel } from "@/lib/ai/providers";
import { clarificationSchema } from "@/lib/ai/curriculum/schemas";
import {
  CLARIFYING_SYSTEM_PROMPT,
  CLARIFYING_WITH_MATERIALS_SYSTEM_PROMPT,
} from "@/lib/ai/curriculum/prompts";
import { getDocumentsByIds } from "@/lib/dal/source-documents";

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
    const { messages, documentIds, useWebSearch } = await req.json();

    // Convert UIMessage[] to CoreMessage[]
    const coreMessages = convertToCoreMessages(messages);

    // Build system prompt - with or without materials context
    let systemPrompt = CLARIFYING_SYSTEM_PROMPT;

    if (documentIds && documentIds.length > 0) {
      try {
        const documents = await getDocumentsByIds(documentIds);
        const completedDocs = documents.filter(
          (d) => d.processing_status === "completed" && d.text_summary
        );

        if (completedDocs.length > 0) {
          const summaries = completedDocs
            .map((d) => `--- ${d.filename} ---\n${d.text_summary}`)
            .join("\n\n");

          systemPrompt = CLARIFYING_WITH_MATERIALS_SYSTEM_PROMPT.replace(
            "{materials_summary}",
            summaries
          );
        }
      } catch (err) {
        console.warn("[clarify] Failed to load document summaries:", err);
      }
    }

    const result = streamText({
      model: getModel("curriculum"),
      system: systemPrompt,
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

// nodejs runtime needed for DAL access (document summaries)
export const runtime = "nodejs";
