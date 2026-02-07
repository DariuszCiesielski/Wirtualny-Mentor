/**
 * Mentor Chat API Route
 *
 * Streaming chat endpoint for AI mentor with Socratic method.
 * Integrates RAG via searchNotes tool for user's notes.
 * Persists messages to database for chat history.
 *
 * Features:
 * - Authentication required
 * - Course ownership verification
 * - Session-based message persistence
 * - Tool calling with searchNotes
 * - Streaming responses
 */

import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { getModel } from "@/lib/ai/providers";
import { MENTOR_SYSTEM_PROMPT } from "@/lib/ai/mentor/prompts";
import { createSearchNotesTool } from "@/lib/ai/mentor/tools";
import { createClient } from "@/lib/supabase/server";
import { saveMessage, updateSessionTitle } from "@/lib/dal/chat";
import { z } from "zod";

const fileSchema = z.object({
  path: z.string(),
  filename: z.string(),
  mediaType: z.string(),
});

const requestSchema = z.object({
  messages: z.array(z.any()),
  courseId: z.string().uuid(),
  sessionId: z.string().uuid(),
  userFiles: z.array(fileSchema).optional().default([]),
  chapterContext: z.string().optional(),
});

export async function POST(req: Request) {
  // Validate request
  const body = await req.json();
  const parseResult = requestSchema.safeParse(body);

  if (!parseResult.success) {
    return new Response("Invalid request body", { status: 400 });
  }

  const { messages, courseId, sessionId, userFiles, chapterContext } =
    parseResult.data;

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

  // Verify session ownership and get current title
  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id, title, message_count")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  // Extract user message text from the last message
  const lastMessage = messages[messages.length - 1];
  let userText = "";
  if (lastMessage && lastMessage.role === "user") {
    if (typeof lastMessage.content === "string") {
      userText = lastMessage.content;
    } else if (Array.isArray(lastMessage.parts)) {
      userText = lastMessage.parts
        .filter(
          (p: { type: string; text?: string }) =>
            p.type === "text" && p.text
        )
        .map((p: { text: string }) => p.text)
        .join("");
    }
  }

  // Save user message to DB
  try {
    await saveMessage({
      session_id: sessionId,
      role: "user",
      content: userText,
      files: userFiles,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save message";
    return new Response(message, { status: 400 });
  }

  // Auto-title: update session title from first user message
  if (session.title === "Nowa rozmowa" && userText) {
    const firstLine = userText.split(/[\n.!?]/)[0].trim();
    const title =
      firstLine.length > 60 ? firstLine.slice(0, 57) + "..." : firstLine;
    if (title) {
      updateSessionTitle(sessionId, user.id, title).catch(() => {});
    }
  }

  // Create tool with context
  const searchNotes = createSearchNotesTool({
    userId: user.id,
    courseId,
  });

  // Build system prompt with optional chapter context
  const systemPrompt = chapterContext
    ? `${MENTOR_SYSTEM_PROMPT}\n\n## Kontekst bieżącej lekcji\nUczeń czyta właśnie: ${chapterContext}\nJeśli uczeń pyta o zaznaczony fragment, odniesie się do niego w wiadomości.`
    : MENTOR_SYSTEM_PROMPT;

  // Stream response with persistence
  const result = streamText({
    model: getModel("mentor"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: { searchNotes },
    stopWhen: stepCountIs(3),
    onFinish: async ({ text }) => {
      // Save assistant response to DB
      try {
        await saveMessage({
          session_id: sessionId,
          role: "assistant",
          content: text,
        });
      } catch {
        // Log but don't fail the response - message was already streamed
        console.error("Failed to save assistant message to DB");
      }
    },
  });

  return result.toUIMessageStreamResponse();
}

export const runtime = "nodejs";
export const maxDuration = 60;
