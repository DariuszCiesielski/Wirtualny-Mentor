-- Migration: Inline Chat + Section Notes
-- Adds chapter_id to chat_sessions (for inline chapter chat)
-- Adds section_heading to notes (for section-level notes)

-- ============================================================================
-- 1. chat_sessions.chapter_id - ties session to a specific chapter
-- ============================================================================

ALTER TABLE chat_sessions
  ADD COLUMN chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL;

COMMENT ON COLUMN chat_sessions.chapter_id
  IS 'Optional: ties session to a specific chapter for inline chat';

-- Index for looking up chapter sessions
CREATE INDEX idx_chat_sessions_chapter
  ON chat_sessions(user_id, course_id, chapter_id)
  WHERE chapter_id IS NOT NULL;

-- Unique constraint: max 1 inline session per user+course+chapter
CREATE UNIQUE INDEX idx_chat_sessions_unique_chapter
  ON chat_sessions(user_id, course_id, chapter_id)
  WHERE chapter_id IS NOT NULL;

-- ============================================================================
-- 2. notes.section_heading - associates note with a specific h2 section
-- ============================================================================

ALTER TABLE notes
  ADD COLUMN section_heading TEXT;

COMMENT ON COLUMN notes.section_heading
  IS 'Optional: h2 heading text to associate note with a specific section in chapter content';

-- Index for filtering notes by section within a chapter
CREATE INDEX idx_notes_section
  ON notes(chapter_id, section_heading)
  WHERE section_heading IS NOT NULL;
