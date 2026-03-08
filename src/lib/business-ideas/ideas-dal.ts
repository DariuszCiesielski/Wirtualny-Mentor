/**
 * Data Access Layer - Business Suggestions
 *
 * Server actions for managing AI-generated business suggestions
 * per course chapter. Includes rate limiting and cache validation.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import type { BusinessSuggestion, DailyLimitResult } from "@/types/business-ideas";

const DAILY_LIMIT = 5;

/**
 * Get the latest non-dismissed suggestion for a chapter.
 */
export async function getSuggestion(
  chapterId: string
): Promise<BusinessSuggestion | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("business_suggestions")
    .select("*")
    .eq("user_id", user.id)
    .eq("chapter_id", chapterId)
    .eq("is_dismissed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as BusinessSuggestion | null;
}

/**
 * Get suggestion with cache validity check.
 * Returns null if cached suggestion has stale hash or profile version.
 */
export async function getSuggestionWithCacheCheck(
  chapterId: string,
  inputHash: string,
  profileVersion: number
): Promise<BusinessSuggestion | null> {
  const suggestion = await getSuggestion(chapterId);

  if (!suggestion) return null;

  // Cache is invalid if content or profile changed
  if (
    suggestion.input_hash !== inputHash ||
    suggestion.profile_version !== profileVersion
  ) {
    return null;
  }

  return suggestion;
}

/**
 * Save a new business suggestion (always INSERT, never upsert).
 */
export async function saveSuggestion(
  data: Omit<BusinessSuggestion, "id" | "is_bookmarked" | "is_dismissed" | "dismissed_at" | "created_at">
): Promise<BusinessSuggestion | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Verify user_id matches authenticated user
  if (data.user_id !== user.id) return null;

  const { data: inserted, error } = await supabase
    .from("business_suggestions")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("[ideas-dal] saveSuggestion error:", error);
    return null;
  }

  return inserted as BusinessSuggestion;
}

/**
 * Toggle bookmark status on a suggestion.
 */
export async function bookmarkSuggestion(
  suggestionId: string
): Promise<{ success: boolean; is_bookmarked?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  // Fetch current state
  const { data: current } = await supabase
    .from("business_suggestions")
    .select("is_bookmarked")
    .eq("id", suggestionId)
    .eq("user_id", user.id)
    .single();

  if (!current) return { success: false };

  const newValue = !current.is_bookmarked;

  const { error } = await supabase
    .from("business_suggestions")
    .update({ is_bookmarked: newValue })
    .eq("id", suggestionId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[ideas-dal] bookmarkSuggestion error:", error);
    return { success: false };
  }

  return { success: true, is_bookmarked: newValue };
}

/**
 * Dismiss a suggestion (soft delete).
 */
export async function dismissSuggestion(
  suggestionId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from("business_suggestions")
    .update({
      is_dismissed: true,
      dismissed_at: new Date().toISOString(),
    })
    .eq("id", suggestionId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[ideas-dal] dismissSuggestion error:", error);
    return { success: false };
  }

  return { success: true };
}

/**
 * Check daily generation limit for a user.
 * Uses Europe/Warsaw timezone for day boundary.
 */
export async function checkDailyLimit(
  userId: string
): Promise<DailyLimitResult> {
  const supabase = await createClient();

  // Calculate today's midnight in Europe/Warsaw
  const now = new Date();
  const warsawOffset = getWarsawOffset(now);
  const warsawNow = new Date(now.getTime() + warsawOffset * 60000);
  const todayMidnight = new Date(
    warsawNow.getFullYear(),
    warsawNow.getMonth(),
    warsawNow.getDate()
  );
  // Convert back to UTC
  const todayMidnightUTC = new Date(
    todayMidnight.getTime() - warsawOffset * 60000
  );

  const { count, error } = await supabase
    .from("business_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayMidnightUTC.toISOString());

  if (error) {
    console.error("[ideas-dal] checkDailyLimit error:", error);
    // Fail-open: allow generation if count fails
    return { remaining: 1, allowed: true };
  }

  const used = count ?? 0;
  const remaining = Math.max(0, DAILY_LIMIT - used);

  return { remaining, allowed: remaining > 0 };
}

/**
 * Get Warsaw timezone offset in minutes.
 * Handles CET (+60) and CEST (+120) automatically.
 */
function getWarsawOffset(date: Date): number {
  // Use Intl to get the actual offset for Europe/Warsaw
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Warsaw",
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(date);
  const tzPart = parts.find((p) => p.type === "timeZoneName");

  if (tzPart?.value) {
    // Parse "GMT+1" or "GMT+2" format
    const match = tzPart.value.match(/GMT([+-]\d+)/);
    if (match) {
      return parseInt(match[1], 10) * 60;
    }
  }

  // Fallback: CET (+1)
  return 60;
}
