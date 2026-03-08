/**
 * Data Access Layer - Business Onboarding
 *
 * Server actions for managing user business profiles
 * collected during the onboarding flow.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BusinessProfile, BusinessProfileInput } from "@/types/onboarding";

/**
 * Get the current user's business profile
 */
export async function getBusinessProfile(): Promise<BusinessProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_business_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data as BusinessProfile | null;
}

/**
 * Save (create or update) the user's business profile.
 * Sets onboarding_completed to true.
 */
export async function saveBusinessProfile(
  input: BusinessProfileInput & { experience_summary?: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Fetch current profile to increment profile_version
  const { data: current } = await supabase
    .from("user_business_profiles")
    .select("profile_version")
    .eq("user_id", user.id)
    .maybeSingle();

  const nextVersion = ((current?.profile_version as number) ?? 0) + 1;

  const { error } = await supabase
    .from("user_business_profiles")
    .upsert(
      {
        user_id: user.id,
        industry: input.industry,
        role: input.role,
        business_goal: input.business_goal,
        company_size: input.company_size || null,
        experience_summary: input.experience_summary || null,
        onboarding_completed: true,
        profile_version: nextVersion,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[onboarding-dal] saveBusinessProfile error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/profile");

  return { success: true };
}

/**
 * Check if the current user has completed onboarding
 */
export async function isOnboardingCompleted(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("user_business_profiles")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.onboarding_completed ?? false;
}
