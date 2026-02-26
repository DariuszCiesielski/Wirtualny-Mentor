"use client";

/**
 * AchievementsList
 *
 * Displays all achievements with earned/unearned state.
 * Used on the profile page.
 */

import { useEffect, useState } from "react";
import {
  Star,
  BookOpen,
  Medal,
  Crown,
  GraduationCap,
  Trophy,
  CheckCircle,
  Flame,
  Calendar,
  Shield,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ACHIEVEMENT_DEFINITIONS, type AchievementDef } from "@/lib/gamification/achievements";
import { getUserAchievements } from "@/lib/gamification/gamification-dal";

const ICON_MAP: Record<string, React.ElementType> = {
  Star,
  BookOpen,
  Medal,
  Crown,
  GraduationCap,
  Trophy,
  CheckCircle,
  Flame,
  Calendar,
  Shield,
};

function AchievementCard({
  achievement,
  earned,
}: {
  achievement: AchievementDef;
  earned: boolean;
}) {
  const Icon = ICON_MAP[achievement.icon] || Star;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
        earned
          ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
          : "border-muted bg-muted/30 opacity-60"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          earned
            ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400"
            : "bg-muted text-muted-foreground"
        )}
      >
        {earned ? (
          <Icon className="h-5 w-5" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium",
            !earned && "text-muted-foreground"
          )}
        >
          {achievement.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {achievement.description}
        </p>
      </div>
      {earned && (
        <span className="shrink-0 text-xs font-medium text-amber-600 dark:text-amber-400">
          +{achievement.points} pkt
        </span>
      )}
    </div>
  );
}

export function AchievementsList() {
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUserAchievements()
      .then((ids) => setEarnedIds(new Set(ids)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  const categories = [
    { key: "learning", label: "Nauka" },
    { key: "quiz", label: "Quizy" },
    { key: "focus", label: "Skupienie" },
    { key: "streak", label: "Konsekwencja" },
  ] as const;

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const achievements = ACHIEVEMENT_DEFINITIONS.filter(
          (a) => a.category === cat.key
        );
        if (!achievements.length) return null;

        return (
          <div key={cat.key}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {cat.label}
            </h3>
            <div className="space-y-2">
              {achievements.map((a) => (
                <AchievementCard
                  key={a.id}
                  achievement={a}
                  earned={earnedIds.has(a.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
