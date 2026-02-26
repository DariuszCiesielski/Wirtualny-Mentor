"use client";

/**
 * useFocusStats
 *
 * Fetches today's focus session statistics from Supabase.
 * Supports optimistic updates when a Pomodoro completes.
 */

import { useState, useEffect, useCallback } from "react";
import {
  getFocusStatsToday,
  type FocusStats,
} from "@/lib/focus/focus-dal";

export function useFocusStats() {
  const [stats, setStats] = useState<FocusStats>({
    completedPomodoros: 0,
    totalFocusMinutes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getFocusStatsToday();
      setStats(data);
    } catch {
      // Silently fail — stats are non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Optimistic increment after completing a Pomodoro (before server confirms) */
  const incrementPomodoro = useCallback((workMinutes: number) => {
    setStats((prev) => ({
      completedPomodoros: prev.completedPomodoros + 1,
      totalFocusMinutes: prev.totalFocusMinutes + workMinutes,
    }));
  }, []);

  return { stats, isLoading, refresh, incrementPomodoro };
}
