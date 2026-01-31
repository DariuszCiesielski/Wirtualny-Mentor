/**
 * Mentor Chat API Route
 *
 * Streaming chat endpoint for AI mentor with Socratic method.
 * Integrates RAG via searchNotes tool for user's notes.
 *
 * Features:
 * - Authentication required
 * - Course ownership verification
 * - Tool calling with searchNotes
 * - Streaming responses
 */

import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { getModel } from "@/lib/ai/providers";
import { MENTOR_SYSTEM_PROMPT } from "@/lib/ai/mentor/prompts";
import { createSearchNotesTool } from "@/lib/ai/mentor/tools";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const requestSchema = z.object({
  messages: z.array(z.any()),
  courseId: z.string().uuid(),
});

export async function POST(req: Request) {
  // Validate request
  const body = await req.json();
  const parseResult = requestSchema.safeParse(body);

  if (!parseResult.success) {
    return new Response("Invalid request body", { status: 400 });
  }

  const { messages, courseId } = parseResult.data;

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify course ownership
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();

  if (!course) {
    return new Response("Course not found", { status: 404 });
  }

  // Create tool with context
  const searchNotes = createSearchNotesTool({
    userId: user.id,
    courseId,
  });

  // Stream response
  const result = streamText({
    model: getModel("mentor"),
    system: MENTOR_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: { searchNotes },
    stopWhen: stepCountIs(3), // Max 3 tool calls per turn
  });

  return result.toUIMessageStreamResponse();
}

export const runtime = "edge";
export const maxDuration = 30;
