/**
 * Data Access Layer - Chat
 *
 * CRUD operations for mentor chat sessions and messages.
 * All functions use Supabase server client and require authentication.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  ChatSession,
  ChatMessage,
  CreateSessionInput,
  SaveMessageInput,
} from "@/types/chat";

const MAX_MESSAGES_PER_SESSION = 500;

// ============================================================================
// SESSIONS
// ============================================================================

/**
 * Create a new chat session for a course
 */
export async function createSession(
  userId: string,
  input: CreateSessionInput
): Promise<ChatSession> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      course_id: input.course_id,
      title: input.title ?? "Nowa rozmowa",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create chat session: ${error.message}`);
  }

  return data as ChatSession;
}

/**
 * Get all sessions for a course, ordered by most recent first
 */
export async function getSessions(
  userId: string,
  courseId: string
): Promise<ChatSession[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get chat sessions: ${error.message}`);
  }

  return data as ChatSession[];
}

/**
 * Get a single session by ID with ownership verification
 */
export async function getSession(
  sessionId: string,
  userId: string
): Promise<ChatSession | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get chat session: ${error.message}`);
  }

  return data as ChatSession;
}

/**
 * Delete a session (CASCADE deletes messages too)
 */
export async function deleteSession(
  sessionId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete chat session: ${error.message}`);
  }
}

/**
 * Update session title
 */
export async function updateSessionTitle(
  sessionId: string,
  userId: string,
  title: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("chat_sessions")
    .update({ title })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update session title: ${error.message}`);
  }
}

// ============================================================================
// MESSAGES
// ============================================================================

/**
 * Save a message to a session.
 * Checks message limit and increments message_count.
 */
export async function saveMessage(input: SaveMessageInput): Promise<ChatMessage> {
  const supabase = await createClient();

  // Check message limit via denormalized count
  const { data: session, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("message_count")
    .eq("id", input.session_id)
    .single();

  if (sessionError) {
    throw new Error(`Failed to check session: ${sessionError.message}`);
  }

  if (session.message_count >= MAX_MESSAGES_PER_SESSION) {
    throw new Error(
      `Message limit reached (${MAX_MESSAGES_PER_SESSION}). Start a new session.`
    );
  }

  // Insert message
  const { data: message, error: messageError } = await supabase
    .from("chat_messages")
    .insert({
      session_id: input.session_id,
      role: input.role,
      content: input.content,
      files: input.files ?? [],
    })
    .select()
    .single();

  if (messageError) {
    throw new Error(`Failed to save message: ${messageError.message}`);
  }

  // Increment message_count on session
  const { error: updateError } = await supabase
    .from("chat_sessions")
    .update({ message_count: session.message_count + 1 })
    .eq("id", input.session_id);

  if (updateError) {
    throw new Error(`Failed to update message count: ${updateError.message}`);
  }

  return message as ChatMessage;
}

/**
 * Get messages for a session, ordered chronologically
 */
export async function getMessages(
  sessionId: string,
  limit = MAX_MESSAGES_PER_SESSION
): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  return data as ChatMessage[];
}

/**
 * Delete all files from Supabase Storage for a session.
 * Call before deleting the session.
 */
export async function deleteSessionFiles(
  userId: string,
  sessionId: string
): Promise<void> {
  const supabase = await createClient();

  const folderPath = `${userId}/${sessionId}`;
  const { data: files } = await supabase.storage
    .from("chat-files")
    .list(folderPath);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${folderPath}/${f.name}`);
    await supabase.storage.from("chat-files").remove(paths);
  }
}

/**
 * Generate signed URLs for message files
 */
export async function getSignedUrls(
  paths: string[]
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};

  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("chat-files")
    .createSignedUrls(paths, 3600); // 1 hour expiry

  if (error) {
    throw new Error(`Failed to generate signed URLs: ${error.message}`);
  }

  const urlMap: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.signedUrl) {
      urlMap[item.path!] = item.signedUrl;
    }
  }

  return urlMap;
}
