/**
 * Data Access Layer - Level Unlocks
 *
 * Manages level progression, unlock tracking, and skip operations.
 * Extracted from quizzes.ts for better separation of concerns.
 */

import { createClient } from "@/lib/supabase/server";
import type { LevelUnlock, LevelUnlockRow } from "@/types/quiz";

// ============================================================================
// ROW TO APPLICATION TYPE CONVERTER
// ============================================================================

/**
 * Transform level unlock row to frontend type (snake_case -> camelCase)
 */
function rowToUnlock(row: LevelUnlockRow): LevelUnlock {
  return {
    id: row.id,
    userId: row.user_id,
    levelId: row.level_id,
    unlockType: row.unlock_type,
    unlockedAt: row.unlocked_at,
    passingAttemptId: row.passing_attempt_id,
  };
}

// ============================================================================
// UNLOCK OPERATIONS
// ============================================================================

/**
 * Odblokuj poziom po zdaniu testu
 *
 * @param userId - User ID
 * @param levelId - Level ID to unlock
 * @param passingAttemptId - Quiz attempt ID that resulted in unlock
 * @returns Level unlock record
 */
export async function unlockLevel(
  userId: string,
  levelId: string,
  passingAttemptId: string
): Promise<LevelUnlock> {
  const supabase = await createClient();

  // Check if already unlocked
  const { data: existing } = await supabase
    .from("level_unlocks")
    .select("*")
    .eq("user_id", userId)
    .eq("level_id", levelId)
    .single();

  if (existing) {
    return rowToUnlock(existing as LevelUnlockRow);
  }

  // Insert new unlock
  const { data, error } = await supabase
    .from("level_unlocks")
    .insert({
      user_id: userId,
      level_id: levelId,
      unlock_type: "test_passed",
      passing_attempt_id: passingAttemptId,
      unlocked_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to unlock level: ${error.message}`);
  }

  return rowToUnlock(data as LevelUnlockRow);
}

/**
 * Przeskocz poziom (manual skip)
 *
 * User can skip a level without passing the test.
 * This is tracked separately for analytics and potential remediation.
 *
 * @param userId - User ID
 * @param levelId - Level ID to skip
 * @returns Level unlock record
 */
export async function skipLevel(
  userId: string,
  levelId: string
): Promise<LevelUnlock> {
  const supabase = await createClient();

  // Check if already unlocked
  const { data: existing } = await supabase
    .from("level_unlocks")
    .select("*")
    .eq("user_id", userId)
    .eq("level_id", levelId)
    .single();

  if (existing) {
    return rowToUnlock(existing as LevelUnlockRow);
  }

  // Insert skip
  const { data, error } = await supabase
    .from("level_unlocks")
    .insert({
      user_id: userId,
      level_id: levelId,
      unlock_type: "manual_skip",
      unlocked_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to skip level: ${error.message}`);
  }

  return rowToUnlock(data as LevelUnlockRow);
}

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Sprawdz czy poziom jest odblokowany
 *
 * @param userId - User ID
 * @param levelId - Level ID to check
 * @returns True if level is unlocked
 */
export async function isLevelUnlocked(
  userId: string,
  levelId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("level_unlocks")
    .select("id")
    .eq("user_id", userId)
    .eq("level_id", levelId)
    .single();

  return !!data;
}

/**
 * Pobierz status unlock dla poziomu
 *
 * @param userId - User ID
 * @param levelId - Level ID
 * @returns Level unlock record or null
 */
export async function getUnlockStatus(
  userId: string,
  levelId: string
): Promise<LevelUnlock | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("level_unlocks")
    .select("*")
    .eq("user_id", userId)
    .eq("level_id", levelId)
    .single();

  if (error?.code === "PGRST116") return null;
  if (error) throw new Error(`Failed to get unlock status: ${error.message}`);
  return rowToUnlock(data as LevelUnlockRow);
}

/**
 * Pobierz wszystkie unlocki uzytkownika dla kursu
 *
 * @param userId - User ID
 * @param courseId - Course ID
 * @returns Array of level unlocks for the course
 */
export async function getCourseUnlocks(
  userId: string,
  courseId: string
): Promise<LevelUnlock[]> {
  const supabase = await createClient();

  // Get all levels for course, then filter unlocks
  const { data, error } = await supabase
    .from("level_unlocks")
    .select(
      `
      *,
      course_levels!inner (
        course_id
      )
    `
    )
    .eq("user_id", userId)
    .eq("course_levels.course_id", courseId);

  if (error) {
    throw new Error(`Failed to get course unlocks: ${error.message}`);
  }

  return (data || []).map((row) => rowToUnlock(row as LevelUnlockRow));
}

/**
 * Sprawdz czy nastepny poziom moze byc odblokowany
 *
 * Checks if the current level's test has been passed and if there's
 * a next level available to unlock.
 *
 * @param userId - User ID
 * @param courseId - Course ID
 * @param currentLevelOrder - Current level's order_index
 * @returns Object with canUnlock status and next level ID
 */
export async function canUnlockNextLevel(
  userId: string,
  courseId: string,
  currentLevelOrder: number
): Promise<{ canUnlock: boolean; nextLevelId: string | null }> {
  const supabase = await createClient();

  // Get current level ID and check if unlocked
  const { data: levels } = await supabase
    .from("course_levels")
    .select("id, order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (!levels || levels.length === 0) {
    return { canUnlock: false, nextLevelId: null };
  }

  const currentLevel = levels.find((l) => l.order_index === currentLevelOrder);
  const nextLevel = levels.find((l) => l.order_index === currentLevelOrder + 1);

  if (!currentLevel || !nextLevel) {
    return { canUnlock: false, nextLevelId: null };
  }

  // Check if current level is unlocked (meaning test was passed or skipped)
  const isUnlocked = await isLevelUnlocked(userId, nextLevel.id);

  return {
    canUnlock: !isUnlocked,
    nextLevelId: nextLevel.id,
  };
}

/**
 * Get unlock map for all levels in a course
 *
 * Returns a map of levelId -> unlock status for efficient lookups.
 *
 * @param userId - User ID
 * @param courseId - Course ID
 * @returns Map of levelId to unlock info
 */
export async function getUnlockMap(
  userId: string,
  courseId: string
): Promise<Map<string, LevelUnlock>> {
  const unlocks = await getCourseUnlocks(userId, courseId);
  const map = new Map<string, LevelUnlock>();

  for (const unlock of unlocks) {
    map.set(unlock.levelId, unlock);
  }

  return map;
}
