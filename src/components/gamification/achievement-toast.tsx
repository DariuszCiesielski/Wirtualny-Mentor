"use client";

/**
 * Achievement Toast
 *
 * Utility function to show a toast when an achievement is earned.
 * Called from gamification-dal after checkAchievements returns new achievements.
 */

import { toast } from "sonner";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/gamification/achievements";

export function showAchievementToast(achievementId: string) {
  const achievement = ACHIEVEMENT_DEFINITIONS.find(
    (a) => a.id === achievementId
  );
  if (!achievement) return;

  toast.success(`Odznaka zdobyta: ${achievement.name}!`, {
    description: achievement.description,
    duration: 5000,
  });
}
