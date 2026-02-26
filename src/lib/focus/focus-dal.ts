/**
 * Data Access Layer - Focus Sessions
 *
 * Server functions for tracking Pomodoro and study sessions.
 * Used by focus hooks to persist session data to Supabase.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { awardPoints, checkAchievements } from "@/lib/gamification/gamification-dal";

export interface CreateFocusSessionInput {
  courseId?: string;
  chapterId?: string;
  sessionType: "pomodoro_work" | "pomodoro_break" | "free_study";
  configWorkMin?: number;
  configBreakMin?: number;
}

export interface FocusStats {
  completedPomodoros: number;
  totalFocusMinutes: number;
}

/**
 * Start a new focus session
 */
export async function createFocusSession(
  input: CreateFocusSessionInput
): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("focus_sessions")
    .insert({
      user_id: user.id,
      course_id: input.courseId || null,
      chapter_id: input.chapterId || null,
      session_type: input.sessionType,
      config_work_min: input.configWorkMin ?? 25,
      config_break_min: input.configBreakMin ?? 5,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create focus session: ${error.message}`);
  return data.id;
}

/**
 * Complete a focus session (sets ended_at, trigger calculates duration)
 */
export async function completeFocusSession(sessionId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("focus_sessions")
    .update({ ended_at: new Date().toISOString(), completed: true })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error)
    throw new Error(`Failed to complete focus session: ${error.message}`);

  // Gamification: award points for completed Pomodoro work sessions
  const { data: session } = await supabase
    .from("focus_sessions")
    .select("session_type")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (session?.session_type === "pomodoro_work") {
    awardPoints("pomodoro_complete", sessionId).catch(() => {});
    checkAchievements("focus").catch(() => {});
  }
}

/**
 * Cancel a focus session (mark ended but not completed)
 */
export async function cancelFocusSession(sessionId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("focus_sessions")
    .update({ ended_at: new Date().toISOString(), completed: false })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error)
    throw new Error(`Failed to cancel focus session: ${error.message}`);
}

/**
 * Get today's focus stats for current user
 */
export async function getFocusStatsToday(): Promise<FocusStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase.rpc("get_focus_stats_today", {
    p_user_id: user.id,
  });

  if (error) throw new Error(`Failed to get focus stats: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  return {
    completedPomodoros: Number(row?.completed_pomodoros ?? 0),
    totalFocusMinutes: Number(row?.total_focus_minutes ?? 0),
  };
}
