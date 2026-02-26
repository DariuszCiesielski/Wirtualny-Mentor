-- Lesson Images: AI-generated and stock photo illustrations for lessons
-- Premium feature: only admin role has access (extensible to subscription tiers)

-- Create storage bucket for lesson images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('lesson-images', 'lesson-images', false, 10485760) -- 10MB limit
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can manage their own files
CREATE POLICY "Users upload own lesson images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own lesson images" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'lesson-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own lesson images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'lesson-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lesson images table
CREATE TABLE lesson_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  section_heading TEXT,
  image_type TEXT NOT NULL CHECK (image_type IN ('ai_generated', 'stock_photo')),
  provider TEXT NOT NULL CHECK (provider IN ('kie_ai', 'dalle3', 'unsplash')),
  storage_path TEXT NOT NULL,
  prompt TEXT,
  alt_text TEXT NOT NULL,
  source_attribution TEXT,
  width INT,
  height INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lesson_images_chapter ON lesson_images(chapter_id);

-- RLS: access through chapters -> course_levels -> courses ownership chain
ALTER TABLE lesson_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own lesson images" ON lesson_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chapters c
      JOIN course_levels cl ON cl.id = c.level_id
      JOIN courses co ON co.id = cl.course_id
      WHERE c.id = lesson_images.chapter_id
      AND co.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own lesson images" ON lesson_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapters c
      JOIN course_levels cl ON cl.id = c.level_id
      JOIN courses co ON co.id = cl.course_id
      WHERE c.id = lesson_images.chapter_id
      AND co.user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own lesson images" ON lesson_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chapters c
      JOIN course_levels cl ON cl.id = c.level_id
      JOIN courses co ON co.id = cl.course_id
      WHERE c.id = lesson_images.chapter_id
      AND co.user_id = auth.uid()
    )
  );
