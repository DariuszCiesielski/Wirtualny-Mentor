"use server";

/**
 * Chat Server Actions
 *
 * Server-side actions for managing chat sessions.
 * Used by client components for CRUD operations.
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createSession,
  deleteSession,
  deleteSessionFiles,
  updateSessionTitle,
  saveMessage,
} from "@/lib/dal/chat";

/**
 * Create a new chat session and redirect to it
 */
export async function createSessionAction(courseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify course ownership
  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();

  if (!course) {
    return { error: "Course not found" };
  }

  const session = await createSession(user.id, { course_id: courseId });

  // Save welcome message as first assistant message
  await saveMessage({
    session_id: session.id,
    role: "assistant",
    content: `Cześć! Jestem Twoim mentorem dla kursu "${course.title}".\n\nJestem tutaj, żeby pomóc Ci się uczyć - ale nie przez dawanie gotowych odpowiedzi! Zamiast tego będę zadawał pytania, które naprowadzą Cię na rozwiązanie.\n\nMożesz też wysłać mi zrzuty ekranu lub dokumenty PDF - przeanalizuję je i pomogę Ci zrozumieć materiał.\n\nO czym chcesz porozmawiać?`,
  });

  revalidatePath(`/courses/${courseId}/chat`);
  redirect(`/courses/${courseId}/chat?session=${session.id}`);
}

/**
 * Delete a chat session and its files
 */
export async function deleteSessionAction(
  courseId: string,
  sessionId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Delete storage files first
  await deleteSessionFiles(user.id, sessionId);

  // Delete session (CASCADE deletes messages)
  await deleteSession(sessionId, user.id);

  revalidatePath(`/courses/${courseId}/chat`);
}

/**
 * Rename a chat session
 */
export async function renameSessionAction(
  courseId: string,
  sessionId: string,
  title: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const trimmed = title.trim();
  if (!trimmed || trimmed.length > 100) {
    return { error: "Title must be 1-100 characters" };
  }

  await updateSessionTitle(sessionId, user.id, trimmed);

  revalidatePath(`/courses/${courseId}/chat`);
}
