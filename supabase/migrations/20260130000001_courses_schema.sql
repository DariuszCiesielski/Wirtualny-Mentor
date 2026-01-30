-- Supabase Migration: Courses Schema for Curriculum Generation
-- Created: 2026-01-30
-- Purpose: Database schema for courses, levels, chapters, and user progress tracking

-- ============================================================================
-- TABLES
-- ============================================================================

-- Courses table - main curriculum container
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_audience TEXT,
  total_estimated_hours NUMERIC(5,1),
  prerequisites TEXT[] DEFAULT '{}',
  source_url TEXT,
  user_goals TEXT[] DEFAULT '{}',
  user_experience TEXT CHECK (user_experience IN ('beginner', 'intermediate', 'advanced')),
  weekly_hours NUMERIC(4,1),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course levels table (5 levels per course: Poczatkujacy -> Guru)
CREATE TABLE course_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('Poczatkujacy', 'Srednio zaawansowany', 'Zaawansowany', 'Master', 'Guru')),
  description TEXT,
  estimated_hours NUMERIC(5,1),
  order_index INT NOT NULL CHECK (order_index BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, order_index)
);

-- Level outcomes table - learning outcomes per level
CREATE TABLE level_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters table - individual chapters within a level
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  estimated_minutes INT,
  topics TEXT[] DEFAULT '{}',
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress table - tracks user's position and completion status
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  current_level_id UUID REFERENCES course_levels(id) ON DELETE SET NULL,
  current_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  completed_chapters UUID[] DEFAULT '{}',
  completed_levels UUID[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- Course resources table - additional learning resources
CREATE TABLE course_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('article', 'video', 'documentation', 'course', 'book')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Users can view own courses" ON courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses" ON courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses" ON courses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses" ON courses
  FOR DELETE USING (auth.uid() = user_id);

-- Course levels policies (access through course ownership)
CREATE POLICY "Users can view levels of own courses" ON course_levels
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_levels.course_id AND courses.user_id = auth.uid())
  );

CREATE POLICY "Users can insert levels to own courses" ON course_levels
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_levels.course_id AND courses.user_id = auth.uid())
  );

CREATE POLICY "Users can update levels of own courses" ON course_levels
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_levels.course_id AND courses.user_id = auth.uid())
  );

CREATE POLICY "Users can delete levels of own courses" ON course_levels
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_levels.course_id AND courses.user_id = auth.uid())
  );

-- Level outcomes policies (access through level -> course ownership)
CREATE POLICY "Users can view outcomes of own levels" ON level_outcomes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_levels cl
      JOIN courses c ON c.id = cl.course_id
      WHERE cl.id = level_outcomes.level_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert outcomes to own levels" ON level_outcomes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_levels cl
      JOIN courses c ON c.id = cl.course_id
      WHERE cl.id = level_outcomes.level_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update outcomes of own levels" ON level_outcomes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM course_levels cl
      JOIN courses c ON c.id = cl.course_id
      WHERE cl.id = level_outcomes.level_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete outcomes of own levels" ON level_outcomes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM course_levels cl
      JOIN courses c ON c.id = cl.course_id
      WHERE cl.id = level_outcomes.level_id AND c.user_id = auth.uid()
    )
  );

-- Chapters policies (access through level -> course ownership)
CREATE POLICY "Users can view chapters of own levels" ON chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_levels cl
      JOIN courses c ON c.id = cl.course_id
      WHERE cl.id = chapters.level_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chapters to own levels" ON chapters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_levels cl
      JOIN courses c ON c.id = cl.course_id
      WHERE cl.id = chapters.level_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chapters of own levels" ON chapters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM course_levels cl
      JOIN courses c ON c.id = cl.course_id
      WHERE cl.id = chapters.level_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chapters of own levels" ON chapters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM course_levels cl
      JOIN courses c ON c.id = cl.course_id
      WHERE cl.id = chapters.level_id AND c.user_id = auth.uid()
    )
  );

-- User progress policies
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" ON user_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Course resources policies (access through course ownership)
CREATE POLICY "Users can view resources of own courses" ON course_resources
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_resources.course_id AND courses.user_id = auth.uid())
  );

CREATE POLICY "Users can insert resources to own courses" ON course_resources
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_resources.course_id AND courses.user_id = auth.uid())
  );

CREATE POLICY "Users can update resources of own courses" ON course_resources
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_resources.course_id AND courses.user_id = auth.uid())
  );

CREATE POLICY "Users can delete resources of own courses" ON course_resources
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_resources.course_id AND courses.user_id = auth.uid())
  );

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Performance indexes
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_updated_at ON courses(updated_at DESC);

CREATE INDEX idx_course_levels_course_id ON course_levels(course_id);
CREATE INDEX idx_course_levels_order ON course_levels(course_id, order_index);

CREATE INDEX idx_level_outcomes_level_id ON level_outcomes(level_id);

CREATE INDEX idx_chapters_level_id ON chapters(level_id);
CREATE INDEX idx_chapters_order ON chapters(level_id, order_index);

CREATE INDEX idx_user_progress_user_course ON user_progress(user_id, course_id);
CREATE INDEX idx_user_progress_last_activity ON user_progress(last_activity_at DESC);

CREATE INDEX idx_course_resources_course_id ON course_resources(course_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for courses table
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_activity_at on progress changes
CREATE OR REPLACE FUNCTION update_last_activity_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_progress table
CREATE TRIGGER update_user_progress_last_activity
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_last_activity_column();
