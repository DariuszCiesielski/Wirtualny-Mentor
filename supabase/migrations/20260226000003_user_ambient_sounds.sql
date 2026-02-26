-- User ambient sounds: custom MP3 uploads per sound slot
-- Replaces default /sounds/*.mp3 with user-uploaded versions stored in Supabase Storage

CREATE TABLE user_ambient_sounds (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sound_slot_id  TEXT NOT NULL CHECK (sound_slot_id IN ('rain', 'cafe', 'forest', 'ocean', 'whitenoise')),
  original_filename TEXT NOT NULL,
  storage_path   TEXT NOT NULL,
  file_size      INT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, sound_slot_id)
);

CREATE INDEX idx_user_ambient_sounds_user ON user_ambient_sounds(user_id);

-- RLS
ALTER TABLE user_ambient_sounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ambient sounds"
  ON user_ambient_sounds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ambient sounds"
  ON user_ambient_sounds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ambient sounds"
  ON user_ambient_sounds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ambient sounds"
  ON user_ambient_sounds FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket: ambient-sounds (private, 10MB file limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('ambient-sounds', 'ambient-sounds', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own ambient sounds"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ambient-sounds'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own ambient sounds"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ambient-sounds'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own ambient sounds"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ambient-sounds'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
