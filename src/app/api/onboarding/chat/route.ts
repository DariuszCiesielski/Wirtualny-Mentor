/**
 * Onboarding Chat API
 *
 * Streaming endpoint for AI clarifying questions during business onboarding.
 * Uses structured output to parse AI responses with isComplete flag
 * and experience_summary generation.
 */

import { streamText, Output, type ModelMessage } from "ai";
import { getModel } from "@/lib/ai/providers";
import { onboardingChatSchema } from "@/lib/onboarding/schemas";
import { ONBOARDING_CHAT_SYSTEM_PROMPT } from "@/lib/onboarding/prompts";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

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
    if (typeof msg.content === "string") {
      return { role: msg.role, content: msg.content };
    }
    const content =
      msg.parts
        ?.filter((p) => p.type === "text" && p.text)
        .map((p) => p.text)
        .join("") ?? "";
    return { role: msg.role, content };
  });
}

export async function POST(req: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages, profileData } = await req.json();

    // Build system prompt with user's profile data
    const systemPrompt = ONBOARDING_CHAT_SYSTEM_PROMPT.replace(
      "{industry}",
      profileData?.industry || "nie podano"
    )
      .replace("{role}", profileData?.role || "nie podano")
      .replace("{goal}", profileData?.business_goal || "nie podano");

    const coreMessages = convertToCoreMessages(messages);

    const result = streamText({
      model: getModel("onboarding"),
      system: systemPrompt,
      messages: coreMessages,
      experimental_output: Output.object({ schema: onboardingChatSchema }),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[onboarding/chat] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const runtime = "nodejs";
