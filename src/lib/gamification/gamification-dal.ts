/**
 * Data Access Layer - Gamification
 *
 * Server functions for awarding points, checking achievements,
 * and retrieving user gamification stats.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { POINT_RULES, type PointReason } from "./point-rules";

export interface UserGamificationStats {
  totalPoints: number;
  earnedAchievements: string[];
}

/**
 * Award points to the current user
 */
export async function awardPoints(
  reason: PointReason,
  referenceId?: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const points = POINT_RULES[reason];
  if (!points) return;

  // Idempotency: skip if points already awarded for this reason+reference
  if (referenceId) {
    const { count } = await supabase
      .from("user_points_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("reason", reason)
      .eq("reference_id", referenceId);
    if (count && count > 0) return;
  }

  await supabase.from("user_points_log").insert({
    user_id: user.id,
    points,
    reason,
    reference_id: referenceId || null,
  });
}

/**
 * Check and award achievements for a given category
 */
export async function checkAchievements(
  category: "learning" | "focus" | "quiz" | "streak"
): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Get unearned achievements for this category
  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("id, condition")
    .eq("category", category);

  if (!allAchievements?.length) return [];

  const { data: earned } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", user.id);

  const earnedIds = new Set((earned || []).map((e) => e.achievement_id));
  const unearned = allAchievements.filter((a) => !earnedIds.has(a.id));

  if (!unearned.length) return [];

  // Check conditions and award new achievements
  const newlyEarned: string[] = [];

  for (const achievement of unearned) {
    const condition = achievement.condition as {
      type: string;
      metric?: string;
      threshold?: number;
    };

    const met = await checkCondition(user.id, condition, supabase);
    if (met) {
      const { error } = await supabase.from("user_achievements").insert({
        user_id: user.id,
        achievement_id: achievement.id,
      });
      if (!error) {
        newlyEarned.push(achievement.id);
        // Award bonus points for the achievement itself
        const { data: achData } = await supabase
          .from("achievements")
          .select("points")
          .eq("id", achievement.id)
          .single();
        if (achData?.points) {
          await supabase.from("user_points_log").insert({
            user_id: user.id,
            points: achData.points,
            reason: `achievement_${achievement.id}`,
          });
        }
      }
    }
  }

  return newlyEarned;
}

async function checkCondition(
  userId: string,
  condition: { type: string; metric?: string; threshold?: number; level?: string },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<boolean> {
  const { type, metric, threshold } = condition;

  if (type === "count" && metric && threshold) {
    let count = 0;

    if (metric === "chapters_completed") {
      const { data } = await supabase
        .from("user_progress")
        .select("completed_chapters")
        .eq("user_id", userId);
      count = (data || []).reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sum: number, p: any) => sum + (p.completed_chapters?.length || 0),
        0
      );
    } else if (metric === "quizzes_passed") {
      const { count: c } = await supabase
        .from("quiz_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("passed", true);
      count = c || 0;
    } else if (metric === "perfect_quizzes") {
      const { count: c } = await supabase
        .from("quiz_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("score", 100);
      count = c || 0;
    }

    return count >= threshold;
  }

  if (type === "daily_count" && metric && threshold) {
    if (metric === "pomodoros_completed") {
      const { data } = await supabase.rpc("get_focus_stats_today", {
        p_user_id: userId,
      });
      const row = Array.isArray(data) ? data[0] : data;
      return (row?.completed_pomodoros || 0) >= threshold;
    }
  }

  if (type === "course_complete") {
    const { count } = await supabase
      .from("user_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("completed_at", "is", null);
    return (count || 0) >= 1;
  }

  if (type === "level_complete" && condition.level) {
    // Check if user completed all chapters in a level with matching name
    const { data: levels } = await supabase
      .from("course_levels")
      .select("id, course_id")
      .eq("name", condition.level);

    if (!levels?.length) return false;

    for (const level of levels) {
      // Get total chapters in this level
      const { count: totalChapters } = await supabase
        .from("chapters")
        .select("*", { count: "exact", head: true })
        .eq("level_id", level.id);

      if (!totalChapters || totalChapters === 0) continue;

      // Get user progress for this course
      const { data: progress } = await supabase
        .from("user_progress")
        .select("completed_levels")
        .eq("user_id", userId)
        .eq("course_id", level.course_id)
        .single();

      const completedLevels: string[] = progress?.completed_levels || [];
      if (completedLevels.includes(level.id)) return true;
    }
    return false;
  }

  if (type === "streak" && metric === "study_days" && threshold) {
    // Count consecutive days with activity (progress or focus sessions)
    const { data: sessions } = await supabase
      .from("focus_sessions")
      .select("started_at")
      .eq("user_id", userId)
      .eq("completed", true)
      .order("started_at", { ascending: false })
      .limit(threshold * 2); // Fetch enough to check streak

    // Also check chapter completions via user_progress.last_activity_at
    const { data: progress } = await supabase
      .from("user_progress")
      .select("last_activity_at")
      .eq("user_id", userId);

    // Collect unique activity dates
    const dates = new Set<string>();
    for (const s of sessions || []) {
      dates.add(new Date(s.started_at).toISOString().split("T")[0]);
    }
    for (const p of progress || []) {
      if (p.last_activity_at) {
        dates.add(new Date(p.last_activity_at).toISOString().split("T")[0]);
      }
    }

    // Count consecutive days backwards from today
    const sortedDates = Array.from(dates).sort().reverse();
    if (sortedDates.length === 0) return false;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < threshold; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      if (dates.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return streak >= threshold;
  }

  return false;
}

/**
 * Get user's total points
 */
export async function getUserTotalPoints(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase.rpc("get_user_total_points", {
    p_user_id: user.id,
  });

  return Number(data) || 0;
}

/**
 * Get user's earned achievement IDs
 */
export async function getUserAchievements(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", user.id);

  return (data || []).map((d) => d.achievement_id);
}
