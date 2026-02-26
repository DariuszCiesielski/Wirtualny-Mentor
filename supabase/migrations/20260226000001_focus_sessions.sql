-- Focus Sessions: tracks Pomodoro and free-study sessions for learning analytics

CREATE TABLE focus_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id         UUID REFERENCES courses(id) ON DELETE SET NULL,
  chapter_id        UUID REFERENCES chapters(id) ON DELETE SET NULL,
  session_type      TEXT NOT NULL CHECK (session_type IN ('pomodoro_work', 'pomodoro_break', 'free_study')),
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at          TIMESTAMPTZ,
  duration_seconds  INT,
  completed         BOOLEAN NOT NULL DEFAULT false,
  config_work_min   SMALLINT NOT NULL DEFAULT 25,
  config_break_min  SMALLINT NOT NULL DEFAULT 5,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE focus_sessions IS 'Tracks Pomodoro and free-study sessions for learning analytics';
COMMENT ON COLUMN focus_sessions.duration_seconds IS 'Auto-calculated by trigger when ended_at is set';

-- Trigger: auto-calculate duration_seconds on UPDATE
CREATE OR REPLACE FUNCTION calculate_focus_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER focus_session_duration
  BEFORE UPDATE ON focus_sessions
  FOR EACH ROW EXECUTE FUNCTION calculate_focus_duration();

-- Indexes
CREATE INDEX idx_focus_sessions_user_date
  ON focus_sessions(user_id, started_at DESC);
CREATE INDEX idx_focus_sessions_user_course
  ON focus_sessions(user_id, course_id)
  WHERE course_id IS NOT NULL;

-- RLS
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own focus sessions"
  ON focus_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus sessions"
  ON focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus sessions"
  ON focus_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- RPC: get daily focus stats
CREATE OR REPLACE FUNCTION get_focus_stats_today(p_user_id UUID)
RETURNS TABLE(
  completed_pomodoros BIGINT,
  total_focus_minutes INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE session_type = 'pomodoro_work' AND completed = true),
    COALESCE(SUM(duration_seconds) FILTER (WHERE session_type IN ('pomodoro_work', 'free_study')) / 60, 0)::INT
  FROM focus_sessions
  WHERE user_id = p_user_id
    AND started_at >= CURRENT_DATE
    AND started_at < CURRENT_DATE + INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
