/**
 * Types for Business Onboarding module (Phase 8)
 */

export interface BusinessProfile {
  id: string;
  user_id: string;
  industry: string;
  role: string;
  business_goal: string;
  company_size: string | null;
  experience_summary: string | null;
  onboarding_completed: boolean;
  profile_version: number;
  created_at: string;
  updated_at: string;
}

export type BusinessProfileInput = {
  industry: string;
  role: string;
  business_goal: string;
  company_size?: string;
};
