-- ============================================================================
-- COMBINED MIGRATION: All tables for Wirtualny Mentor
-- Run this entire file in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Order matters - tables are created in dependency order
-- ============================================================================

-- ############################################################################
-- 1/5: COURSES SCHEMA (courses, levels, chapters, progress, resources)
-- ############################################################################

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

CREATE TABLE level_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE course_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('article', 'video', 'documentation', 'course', 'book')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own courses" ON courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own courses" ON courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own courses" ON courses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own courses" ON courses FOR DELETE USING (auth.uid() = user_id);

-- RLS: Course levels
ALTER TABLE course_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view levels of own courses" ON course_levels FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_levels.course_id AND courses.user_id = auth.uid())
);
CREATE POLICY "Users can insert levels to own courses" ON course_levels FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_levels.course_id AND courses.user_id = auth.uid())
);
CREATE POLICY "Users can update levels of own courses" ON course_levels FOR UPDATE USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_levels.course_id AND courses.user_id = auth.uid())
);
CREATE POLICY "Users can delete levels of own courses" ON course_levels FOR DELETE USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_levels.course_id AND courses.user_id = auth.uid())
);

-- RLS: Level outcomes
ALTER TABLE level_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view outcomes of own levels" ON level_outcomes FOR SELECT USING (
  EXISTS (SELECT 1 FROM course_levels cl JOIN courses c ON c.id = cl.course_id WHERE cl.id = level_outcomes.level_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can insert outcomes to own levels" ON level_outcomes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM course_levels cl JOIN courses c ON c.id = cl.course_id WHERE cl.id = level_outcomes.level_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can update outcomes of own levels" ON level_outcomes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM course_levels cl JOIN courses c ON c.id = cl.course_id WHERE cl.id = level_outcomes.level_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can delete outcomes of own levels" ON level_outcomes FOR DELETE USING (
  EXISTS (SELECT 1 FROM course_levels cl JOIN courses c ON c.id = cl.course_id WHERE cl.id = level_outcomes.level_id AND c.user_id = auth.uid())
);

-- RLS: Chapters
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view chapters of own levels" ON chapters FOR SELECT USING (
  EXISTS (SELECT 1 FROM course_levels cl JOIN courses c ON c.id = cl.course_id WHERE cl.id = chapters.level_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can insert chapters to own levels" ON chapters FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM course_levels cl JOIN courses c ON c.id = cl.course_id WHERE cl.id = chapters.level_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can update chapters of own levels" ON chapters FOR UPDATE USING (
  EXISTS (SELECT 1 FROM course_levels cl JOIN courses c ON c.id = cl.course_id WHERE cl.id = chapters.level_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can delete chapters of own levels" ON chapters FOR DELETE USING (
  EXISTS (SELECT 1 FROM course_levels cl JOIN courses c ON c.id = cl.course_id WHERE cl.id = chapters.level_id AND c.user_id = auth.uid())
);

-- RLS: User progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress" ON user_progress FOR DELETE USING (auth.uid() = user_id);

-- RLS: Course resources
ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view resources of own courses" ON course_resources FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_resources.course_id AND courses.user_id = auth.uid())
);
CREATE POLICY "Users can insert resources to own courses" ON course_resources FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_resources.course_id AND courses.user_id = auth.uid())
);
CREATE POLICY "Users can update resources of own courses" ON course_resources FOR UPDATE USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_resources.course_id AND courses.user_id = auth.uid())
);
CREATE POLICY "Users can delete resources of own courses" ON course_resources FOR DELETE USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_resources.course_id AND courses.user_id = auth.uid())
);

-- Indexes: Courses schema
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

-- Triggers: Courses schema
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_last_activity_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_progress_last_activity
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_last_activity_column();

-- ############################################################################
-- 2/5: SECTION CONTENT (learning materials)
-- ############################################################################

CREATE TABLE section_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  key_concepts JSONB DEFAULT '[]',
  practical_steps JSONB DEFAULT '[]',
  tools JSONB DEFAULT '[]',
  external_resources JSONB DEFAULT '[]',
  sources JSONB NOT NULL DEFAULT '[]',
  word_count INT,
  estimated_reading_minutes INT,
  language TEXT DEFAULT 'pl' CHECK (language IN ('pl', 'en')),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generation_model TEXT,
  generation_cost_tokens INT,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chapter_id, version)
);

ALTER TABLE section_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view content of own courses" ON section_content FOR SELECT USING (
  EXISTS (SELECT 1 FROM chapters ch JOIN course_levels cl ON cl.id = ch.level_id JOIN courses c ON c.id = cl.course_id WHERE ch.id = section_content.chapter_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can insert content to own courses" ON section_content FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM chapters ch JOIN course_levels cl ON cl.id = ch.level_id JOIN courses c ON c.id = cl.course_id WHERE ch.id = section_content.chapter_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can update content of own courses" ON section_content FOR UPDATE USING (
  EXISTS (SELECT 1 FROM chapters ch JOIN course_levels cl ON cl.id = ch.level_id JOIN courses c ON c.id = cl.course_id WHERE ch.id = section_content.chapter_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can delete content of own courses" ON section_content FOR DELETE USING (
  EXISTS (SELECT 1 FROM chapters ch JOIN course_levels cl ON cl.id = ch.level_id JOIN courses c ON c.id = cl.course_id WHERE ch.id = section_content.chapter_id AND c.user_id = auth.uid())
);

CREATE INDEX idx_section_content_chapter ON section_content(chapter_id);
CREATE INDEX idx_section_content_sources ON section_content USING GIN (sources);
CREATE INDEX idx_section_content_version ON section_content(chapter_id, version);

CREATE TRIGGER update_section_content_updated_at
  BEFORE UPDATE ON section_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ############################################################################
-- 3/5: QUIZZES SCHEMA (quizzes, attempts, level unlocks)
-- ############################################################################

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
  CONSTRAINT quiz_parent_check CHECK (
    (chapter_id IS NOT NULL AND level_id IS NULL) OR
    (chapter_id IS NULL AND level_id IS NOT NULL)
  ),
  CONSTRAINT unique_chapter_quiz UNIQUE (chapter_id, version),
  CONSTRAINT unique_level_quiz UNIQUE (level_id, quiz_type, version)
);

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

CREATE TABLE level_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
  unlock_type TEXT NOT NULL CHECK (unlock_type IN ('test_passed', 'manual_skip')),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  passing_attempt_id UUID REFERENCES quiz_attempts(id),
  UNIQUE(user_id, level_id)
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quizzes of own courses" ON quizzes FOR SELECT USING (
  (chapter_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM chapters ch JOIN course_levels cl ON cl.id = ch.level_id JOIN courses c ON c.id = cl.course_id
    WHERE ch.id = quizzes.chapter_id AND c.user_id = auth.uid()
  ))
  OR
  (level_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM course_levels cl JOIN courses c ON c.id = cl.course_id
    WHERE cl.id = quizzes.level_id AND c.user_id = auth.uid()
  ))
);
CREATE POLICY "Users can insert quizzes to own courses" ON quizzes FOR INSERT WITH CHECK (
  (chapter_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM chapters ch JOIN course_levels cl ON cl.id = ch.level_id JOIN courses c ON c.id = cl.course_id
    WHERE ch.id = quizzes.chapter_id AND c.user_id = auth.uid()
  ))
  OR
  (level_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM course_levels cl JOIN courses c ON c.id = cl.course_id
    WHERE cl.id = quizzes.level_id AND c.user_id = auth.uid()
  ))
);
CREATE POLICY "Users can update quizzes of own courses" ON quizzes FOR UPDATE USING (
  (chapter_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM chapters ch JOIN course_levels cl ON cl.id = ch.level_id JOIN courses c ON c.id = cl.course_id
    WHERE ch.id = quizzes.chapter_id AND c.user_id = auth.uid()
  ))
  OR
  (level_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM course_levels cl JOIN courses c ON c.id = cl.course_id
    WHERE cl.id = quizzes.level_id AND c.user_id = auth.uid()
  ))
);
CREATE POLICY "Users can delete quizzes of own courses" ON quizzes FOR DELETE USING (
  (chapter_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM chapters ch JOIN course_levels cl ON cl.id = ch.level_id JOIN courses c ON c.id = cl.course_id
    WHERE ch.id = quizzes.chapter_id AND c.user_id = auth.uid()
  ))
  OR
  (level_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM course_levels cl JOIN courses c ON c.id = cl.course_id
    WHERE cl.id = quizzes.level_id AND c.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quiz attempts" ON quiz_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quiz attempts" ON quiz_attempts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own level unlocks" ON level_unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own level unlocks" ON level_unlocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own level unlocks" ON level_unlocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own level unlocks" ON level_unlocks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_quizzes_chapter ON quizzes(chapter_id) WHERE chapter_id IS NOT NULL;
CREATE INDEX idx_quizzes_level ON quizzes(level_id) WHERE level_id IS NOT NULL;
CREATE INDEX idx_quizzes_type ON quizzes(quiz_type);
CREATE INDEX idx_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX idx_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_attempts_submitted ON quiz_attempts(submitted_at DESC) WHERE submitted_at IS NOT NULL;
CREATE INDEX idx_unlocks_user_level ON level_unlocks(user_id, level_id);
CREATE INDEX idx_unlocks_user ON level_unlocks(user_id);

-- ############################################################################
-- 4/5: NOTES SCHEMA (notes with pgvector embeddings)
-- ############################################################################

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  embedding halfvec(1536),
  fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,
  embedding_model TEXT DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view notes of own courses" ON notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = notes.course_id AND courses.user_id = auth.uid())
);
CREATE POLICY "Users can insert notes to own courses" ON notes FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM courses WHERE courses.id = notes.course_id AND courses.user_id = auth.uid())
);
CREATE POLICY "Users can update notes of own courses" ON notes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = notes.course_id AND courses.user_id = auth.uid())
);
CREATE POLICY "Users can delete notes of own courses" ON notes FOR DELETE USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = notes.course_id AND courses.user_id = auth.uid())
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_course_id ON notes(course_id);
CREATE INDEX idx_notes_chapter_id ON notes(chapter_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_embedding_hnsw ON notes USING hnsw (embedding halfvec_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_notes_fts ON notes USING gin(fts);

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RPC function for vector similarity search (RAG chatbot)
CREATE OR REPLACE FUNCTION search_notes_semantic(
  p_user_id UUID,
  p_course_id UUID,
  p_embedding TEXT,
  p_match_threshold FLOAT DEFAULT 0.7,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  similarity FLOAT,
  chapter_id UUID
) AS $$
DECLARE
  v_embedding halfvec(1536);
BEGIN
  v_embedding := p_embedding::halfvec(1536);
  RETURN QUERY
  SELECT
    notes.id,
    notes.content,
    (1 - (notes.embedding <=> v_embedding))::FLOAT as similarity,
    notes.chapter_id
  FROM notes
  WHERE notes.user_id = p_user_id
    AND notes.course_id = p_course_id
    AND notes.embedding IS NOT NULL
    AND 1 - (notes.embedding <=> v_embedding) > p_match_threshold
  ORDER BY notes.embedding <=> v_embedding
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ############################################################################
-- 5/5: CHAT SCHEMA (sessions, messages, file storage)
-- ############################################################################

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nowa rozmowa',
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL DEFAULT '',
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Chat sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chat sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat sessions" ON chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- RLS: Chat messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in own sessions" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_sessions cs WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid())
);
CREATE POLICY "Users can insert messages in own sessions" ON chat_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM chat_sessions cs WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid())
);
CREATE POLICY "Users can delete messages in own sessions" ON chat_messages FOR DELETE USING (
  EXISTS (SELECT 1 FROM chat_sessions cs WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid())
);

-- Indexes: Chat
CREATE INDEX idx_chat_sessions_user_course ON chat_sessions(user_id, course_id);
CREATE INDEX idx_chat_sessions_updated ON chat_sessions(updated_at DESC);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at ASC);

-- Trigger: Chat sessions updated_at
CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for chat files
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users upload own chat files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own chat files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own chat files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ############################################################################
-- 6/6: AVATARS STORAGE (profile pictures)
-- ############################################################################

-- Storage bucket for avatars (public - URLs are shared via getPublicUrl)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: avatars
-- Upload pattern: {userId}-{timestamp}.{ext} (flat, no folders)
CREATE POLICY "Users upload own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND name LIKE auth.uid()::text || '-%');

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users delete own avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND name LIKE auth.uid()::text || '-%');

CREATE POLICY "Users update own avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND name LIKE auth.uid()::text || '-%');

-- ============================================================================
-- DONE! All 6 migrations applied successfully.
-- ============================================================================
