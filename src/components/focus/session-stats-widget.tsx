"use client";

/**
 * SessionStatsWidget
 *
 * Shows today's focus statistics: completed Pomodoros and total focus time.
 */

import { Timer, Flame } from "lucide-react";
import { useFocusContext } from "./focus-context";

export function SessionStatsWidget() {
  const { focusStats } = useFocusContext();
  const { stats, isLoading } = focusStats;

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 text-xs text-muted-foreground animate-pulse">
        <span>Ładowanie statystyk...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5" title="Ukończone sesje Pomodoro">
        <Flame className="h-3.5 w-3.5 text-orange-500" />
        <span className="text-xs font-medium tabular-nums">
          {stats.completedPomodoros}
        </span>
        <span className="text-xs text-muted-foreground">sesji</span>
      </div>
      <div className="flex items-center gap-1.5" title="Czas nauki dzisiaj">
        <Timer className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-xs font-medium tabular-nums">
          {stats.totalFocusMinutes}
        </span>
        <span className="text-xs text-muted-foreground">min</span>
      </div>
    </div>
  );
}
