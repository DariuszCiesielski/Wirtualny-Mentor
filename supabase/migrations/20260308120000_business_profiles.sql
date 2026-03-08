-- Business Profiles for Onboarding (Phase 8)
-- Stores user business context for personalized course suggestions

CREATE TABLE user_business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  industry TEXT NOT NULL,
  role TEXT NOT NULL,
  business_goal TEXT NOT NULL,
  company_size TEXT,
  experience_summary TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_business_profiles IS 'User business profiles collected during onboarding for personalized suggestions';

-- Index on user_id for fast lookups (UNIQUE already creates one, but explicit for clarity)
CREATE INDEX idx_business_profiles_user_id ON user_business_profiles(user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_business_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_business_profile_timestamp
  BEFORE UPDATE ON user_business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_business_profile_timestamp();

-- Row Level Security
ALTER TABLE user_business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business profile"
  ON user_business_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business profile"
  ON user_business_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business profile"
  ON user_business_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
