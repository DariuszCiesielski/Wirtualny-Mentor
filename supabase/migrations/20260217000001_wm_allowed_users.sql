-- =============================================================================
-- Migration: Whitelist Users (Admin System)
-- Created: 2026-02-17
-- =============================================================================

-- Whitelist table — only users on this list can access the platform
CREATE TABLE wm_allowed_users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL UNIQUE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role         TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wm_allowed_users_email ON wm_allowed_users(email);
CREATE INDEX idx_wm_allowed_users_user_id ON wm_allowed_users(user_id);

-- Reuse update_updated_at_column() from courses_schema migration
CREATE TRIGGER update_wm_allowed_users_updated_at
  BEFORE UPDATE ON wm_allowed_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE wm_allowed_users ENABLE ROW LEVEL SECURITY;

-- Users can check their own whitelist entry (needed for access check on login)
-- NOTE: Use auth.jwt() instead of subquery on auth.users — the authenticated
-- role does not have SELECT on auth.users, which would cause the policy to fail.
CREATE POLICY "Users can check own access"
  ON wm_allowed_users FOR SELECT
  USING (
    user_id = auth.uid()
    OR email = (auth.jwt() ->> 'email')
  );

-- Admin mutations go through service role key (bypasses RLS)
-- No INSERT/UPDATE/DELETE policies needed for anon key

-- =============================================================================
-- Seed: Initial admin + existing user
-- =============================================================================

INSERT INTO wm_allowed_users (email, user_id, role, display_name)
VALUES (
  'dariusz.ciesielski.71@gmail.com',
  (SELECT id FROM auth.users WHERE email = 'dariusz.ciesielski.71@gmail.com'),
  'admin',
  'Dariusz Ciesielski'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO wm_allowed_users (email, user_id, role, display_name)
VALUES (
  'iwona.bolt@gmail.com',
  (SELECT id FROM auth.users WHERE email = 'iwona.bolt@gmail.com'),
  'user',
  'Iwona Bolt'
)
ON CONFLICT (email) DO NOTHING;
