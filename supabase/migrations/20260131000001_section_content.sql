-- Supabase Migration: Section Content Schema for Learning Materials
-- Created: 2026-01-31
-- Purpose: Stores AI-generated textbook-like educational materials with citations

-- ============================================================================
-- TABLES
-- ============================================================================

-- Section content table - stores generated textbook-like materials
CREATE TABLE section_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,

  -- Main content (markdown with inline citations)
  content TEXT NOT NULL,

  -- Structured data (JSONB for flexibility)
  key_concepts JSONB DEFAULT '[]',
  practical_steps JSONB DEFAULT '[]',
  tools JSONB DEFAULT '[]',
  external_resources JSONB DEFAULT '[]',

  -- Source tracking for anti-hallucination
  sources JSONB NOT NULL DEFAULT '[]',

  -- Metadata
  word_count INT,
  estimated_reading_minutes INT,
  language TEXT DEFAULT 'pl' CHECK (language IN ('pl', 'en')),

  -- Generation tracking
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generation_model TEXT,
  generation_cost_tokens INT,

  -- Versioning (for regeneration)
  version INT DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(chapter_id, version)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE section_content ENABLE ROW LEVEL SECURITY;

-- RLS policies using same pattern as chapters (via course_id join)
CREATE POLICY "Users can view content of own courses" ON section_content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chapters ch
      JOIN course_levels cl ON cl.id = ch.level_id
      JOIN courses c ON c.id = cl.course_id
      WHERE ch.id = section_content.chapter_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert content to own courses" ON section_content
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapters ch
      JOIN course_levels cl ON cl.id = ch.level_id
      JOIN courses c ON c.id = cl.course_id
      WHERE ch.id = section_content.chapter_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update content of own courses" ON section_content
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chapters ch
      JOIN course_levels cl ON cl.id = ch.level_id
      JOIN courses c ON c.id = cl.course_id
      WHERE ch.id = section_content.chapter_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete content of own courses" ON section_content
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chapters ch
      JOIN course_levels cl ON cl.id = ch.level_id
      JOIN courses c ON c.id = cl.course_id
      WHERE ch.id = section_content.chapter_id
      AND c.user_id = auth.uid()
    )
  );

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_section_content_chapter ON section_content(chapter_id);
CREATE INDEX idx_section_content_sources ON section_content USING GIN (sources);
CREATE INDEX idx_section_content_version ON section_content(chapter_id, version);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for updated_at (uses existing function from courses migration)
CREATE TRIGGER update_section_content_updated_at
  BEFORE UPDATE ON section_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
