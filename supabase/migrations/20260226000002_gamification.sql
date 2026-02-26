-- Gamification: achievements, points, and user achievements

-- Achievement definitions (static seed data)
CREATE TABLE achievements (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('learning', 'focus', 'quiz', 'streak')),
  condition   JSONB NOT NULL,
  points      INT NOT NULL DEFAULT 0,
  sort_order  INT NOT NULL DEFAULT 0
);

COMMENT ON TABLE achievements IS 'Static achievement definitions - seeded via migration';

-- User achievements (earned badges)
CREATE TABLE user_achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  context        JSONB,
  UNIQUE(user_id, achievement_id)
);

-- Points log (append-only)
CREATE TABLE user_points_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points       INT NOT NULL,
  reason       TEXT NOT NULL,
  reference_id UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_points_log_user_date ON user_points_log(user_id, created_at DESC);

-- RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points_log ENABLE ROW LEVEL SECURITY;

-- Achievements: readable by all authenticated users
CREATE POLICY "Achievements are publicly readable"
  ON achievements FOR SELECT
  USING (true);

-- User achievements: users see only their own
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Points log: users see only their own
CREATE POLICY "Users can view own points"
  ON user_points_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points"
  ON user_points_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RPC: get total points for user
CREATE OR REPLACE FUNCTION get_user_total_points(p_user_id UUID)
RETURNS INT AS $$
  SELECT COALESCE(SUM(points), 0)::INT
  FROM user_points_log
  WHERE user_id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Seed achievement definitions
INSERT INTO achievements (id, name, description, icon, category, condition, points, sort_order) VALUES
  ('first_chapter', 'Pierwszy krok', 'Ukończ swój pierwszy rozdział', 'Star', 'learning',
   '{"type": "count", "metric": "chapters_completed", "threshold": 1}', 10, 1),
  ('ten_chapters', 'Pilny uczeń', 'Ukończ 10 rozdziałów', 'BookOpen', 'learning',
   '{"type": "count", "metric": "chapters_completed", "threshold": 10}', 50, 2),
  ('level_beginner', 'Początkujący opanowany', 'Ukończ poziom Początkujący', 'Medal', 'learning',
   '{"type": "level_complete", "level": "Początkujący"}', 25, 3),
  ('level_intermediate', 'Średnio zaawansowany', 'Ukończ poziom Średnio zaawansowany', 'Medal', 'learning',
   '{"type": "level_complete", "level": "Średnio zaawansowany"}', 50, 4),
  ('level_advanced', 'Zaawansowany', 'Ukończ poziom Zaawansowany', 'Medal', 'learning',
   '{"type": "level_complete", "level": "Zaawansowany"}', 75, 5),
  ('level_master', 'Master', 'Ukończ poziom Master', 'Medal', 'learning',
   '{"type": "level_complete", "level": "Master"}', 100, 6),
  ('level_guru', 'Guru', 'Ukończ poziom Guru', 'Crown', 'learning',
   '{"type": "level_complete", "level": "Guru"}', 150, 7),
  ('course_complete', 'Absolwent', 'Ukończ cały kurs', 'GraduationCap', 'learning',
   '{"type": "course_complete"}', 200, 8),
  ('quiz_master', 'Quiz Master', 'Zdaj 10 quizów na 100%', 'Trophy', 'quiz',
   '{"type": "count", "metric": "perfect_quizzes", "threshold": 10}', 100, 9),
  ('first_quiz', 'Pierwszy quiz', 'Zdaj swój pierwszy quiz', 'CheckCircle', 'quiz',
   '{"type": "count", "metric": "quizzes_passed", "threshold": 1}', 10, 10),
  ('pomodoro_marathon', 'Maratończyk', '5 sesji Pomodoro w jednym dniu', 'Flame', 'focus',
   '{"type": "daily_count", "metric": "pomodoros_completed", "threshold": 5}', 30, 11),
  ('streak_7', 'Konsekwentny', '7 dni nauki z rzędu', 'Calendar', 'streak',
   '{"type": "streak", "metric": "study_days", "threshold": 7}', 50, 12),
  ('streak_30', 'Wytrwały', '30 dni nauki z rzędu', 'Shield', 'streak',
   '{"type": "streak", "metric": "study_days", "threshold": 30}', 200, 13);
