"use client";

/**
 * PointsBadge
 *
 * Displays user's total points in a compact badge.
 * Used in the header next to the focus timer.
 */

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { getUserTotalPoints } from "@/lib/gamification/gamification-dal";

export function PointsBadge() {
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    getUserTotalPoints()
      .then(setPoints)
      .catch(() => setPoints(0));
  }, []);

  if (points === null) return null;

  return (
    <div
      className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      title={`${points} punktów`}
    >
      <Zap className="h-3 w-3" />
      <span className="tabular-nums">{points}</span>
    </div>
  );
}
