/**
 * Chat Types - TypeScript types for mentor chat sessions and messages
 *
 * Keep in sync with supabase/migrations/20260207000001_chat_schema.sql
 */

// ============================================================================
// BASE ENTITIES
// ============================================================================

/**
 * Chat session - a conversation thread within a course
 */
export interface ChatSession {
  id: string;
  user_id: string;
  course_id: string;
  chapter_id: string | null;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Chat message - single message in a session
 */
export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  files: ChatMessageFile[];
  created_at: string;
}

/**
 * File reference stored in chat_messages.files JSONB
 */
export interface ChatMessageFile {
  path: string; // Storage path: {userId}/{sessionId}/{uuid}_{filename}
  filename: string; // Original filename
  mediaType: string; // MIME type (image/png, application/pdf, etc.)
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input for creating a chat session
 */
export interface CreateSessionInput {
  course_id: string;
  chapter_id?: string | null;
  title?: string;
}

/**
 * Input for saving a chat message
 */
export interface SaveMessageInput {
  session_id: string;
  role: "user" | "assistant";
  content: string;
  files?: ChatMessageFile[];
}

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

/**
 * Chat message with resolved file URLs (for client display)
 */
export interface ChatMessageWithUrls extends Omit<ChatMessage, "files"> {
  files: ChatMessageFileWithUrl[];
}

/**
 * File reference with a signed URL for display
 */
export interface ChatMessageFileWithUrl extends ChatMessageFile {
  url: string; // Signed URL for display/download
}
