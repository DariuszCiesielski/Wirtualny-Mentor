-- Supabase Migration: Quizzes Schema for Assessment System
-- Created: 2026-01-31
-- Purpose: Database schema for quizzes, quiz attempts, and level unlock tracking

-- ============================================================================
-- TABLES
-- ============================================================================

-- Quizzes table - stores generated quizzes and level tests
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  level_id UUID REFERENCES course_levels(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL CHECK (quiz_type IN ('section', 'level_test')),
  questions JSONB NOT NULL DEFAULT '[]',
  question_count INT NOT NULL,
  estimated_minutes INT,
  pass_threshold NUMERIC(3,2) DEFAULT 0.70,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generation_model TEXT,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Exactly one of chapter_id or level_id must be NOT NULL
  CONSTRAINT quiz_parent_check CHECK (
    (chapter_id IS NOT NULL AND level_id IS NULL) OR
    (chapter_id IS NULL AND level_id IS NOT NULL)
  ),
  -- Unique constraint for section quizzes (per chapter + version)
  CONSTRAINT unique_chapter_quiz UNIQUE (chapter_id, version),
  -- Unique constraint for level tests (per level + type + version)
  CONSTRAINT unique_level_quiz UNIQUE (level_id, quiz_type, version)
);

-- Quiz attempts table - tracks user quiz submissions and results
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score NUMERIC(5,2),
  correct_count INT,
  total_count INT,
  passed BOOLEAN,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INT,
  remediation_viewed BOOLEAN DEFAULT FALSE,
  remediation_content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Level unlocks table - tracks which levels users have unlocked
CREATE TABLE level_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
  unlock_type TEXT NOT NULL CHECK (unlock_type IN ('test_passed', 'manual_skip')),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  passing_attempt_id UUID REFERENCES quiz_attempts(id),
  UNIQUE(user_id, level_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_unlocks ENABLE ROW LEVEL SECURITY;

-- Quizzes policies (access through course ownership via chapters or course_levels)
CREATE POLICY "Users can view quizzes of own courses" ON quizzes
  FOR SELECT USING (
    -- Section quiz: check chapter -> level -> course ownership
    (chapter_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM chapters ch
      JOIN course_levels cl ON cl.id = ch.level_id
      JOIN courses c ON c.id = cl.course_id
      WHERE ch.id = quizzes.chapter_id AND c.user_id = auth.uid()
    ))
    OR
    -- Level test: check level -> course ownership
    (level_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM course_levels cl
      JOIN courses c ON c.id = cl.course_id
      WHERE cl.id = quizzes.level_id AND c.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert quizzes to own courses" ON quizzes
  FOR INSERT WITH CHECK (
    (chapter_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM chapters ch
      JOIN course_levels cl ON cl.id = ch.level_id
      JOIN courses c ON c.id = cl.course_id
      WHERE ch.id = quizzes.chapter_id AND c.user_id = auth.uid()
    ))
    OR
    (level_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM course_levels cl
      JOIN courses c ON c.id = cl.course_id
      WHERE cl.id = quizzes.level_id AND c.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update quizzes of own courses" ON quizzes
  FOR UPDATE USING (
    (chapter_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM chapters ch
      JOIN course_levels cl ON cl.id = ch.level_id
      JOIN courses c ON c.id = cl.course_id
      WHERE ch.id = quizzes.chapter_id AND c.user_id = auth.uid()
    ))
    OR
    (level_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM course_levels cl
      JOIN courses c ON c.id = cl.course_id
      WHERE cl.id = quizzes.level_id AND c.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete quizzes of own courses" ON quizzes
  FOR DELETE USING (
    (chapter_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM chapters ch
      JOIN course_levels cl ON cl.id = ch.level_id
      JOIN courses c ON c.id = cl.course_id
      WHERE ch.id = quizzes.chapter_id AND c.user_id = auth.uid()
    ))
    OR
    (level_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM course_levels cl
      JOIN courses c ON c.id = cl.course_id
      WHERE cl.id = quizzes.level_id AND c.user_id = auth.uid()
    ))
  );

-- Quiz attempts policies (users manage their own attempts)
CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz attempts" ON quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz attempts" ON quiz_attempts
  FOR DELETE USING (auth.uid() = user_id);

-- Level unlocks policies (users manage their own unlocks)
CREATE POLICY "Users can view own level unlocks" ON level_unlocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own level unlocks" ON level_unlocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own level unlocks" ON level_unlocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own level unlocks" ON level_unlocks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Quizzes indexes
CREATE INDEX idx_quizzes_chapter ON quizzes(chapter_id) WHERE chapter_id IS NOT NULL;
CREATE INDEX idx_quizzes_level ON quizzes(level_id) WHERE level_id IS NOT NULL;
CREATE INDEX idx_quizzes_type ON quizzes(quiz_type);

-- Quiz attempts indexes
CREATE INDEX idx_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX idx_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_attempts_submitted ON quiz_attempts(submitted_at DESC) WHERE submitted_at IS NOT NULL;

-- Level unlocks indexes
CREATE INDEX idx_unlocks_user_level ON level_unlocks(user_id, level_id);
CREATE INDEX idx_unlocks_user ON level_unlocks(user_id);
