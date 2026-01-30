"use client";

import { useState, useEffect } from "react";
import { LevelCard } from "./level-card";
import type { CourseLevelWithDetails, UserProgress } from "@/types/database";

interface CurriculumTOCProps {
  levels: CourseLevelWithDetails[];
  progress: UserProgress;
  courseId: string;
}

export function CurriculumTOC({
  levels,
  progress,
  courseId,
}: CurriculumTOCProps) {
  // Initialize expanded state - expand current level by default
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(() => {
    const initialExpanded = new Set<string>();

    // Find and expand current level
    if (progress.current_level_id) {
      initialExpanded.add(progress.current_level_id);
    } else if (levels.length > 0) {
      // If no current level, expand first level
      initialExpanded.add(levels[0].id);
    }

    return initialExpanded;
  });

  // Update expanded when progress changes
  useEffect(() => {
    if (progress.current_level_id && !expandedLevels.has(progress.current_level_id)) {
      setExpandedLevels((prev) => new Set([...prev, progress.current_level_id!]));
    }
  }, [progress.current_level_id, expandedLevels]);

  const toggleLevel = (levelId: string) => {
    setExpandedLevels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(levelId)) {
        newSet.delete(levelId);
      } else {
        newSet.add(levelId);
      }
      return newSet;
    });
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Spis tresci</h2>
      <div className="space-y-0">
        {levels.map((level, index) => (
          <LevelCard
            key={level.id}
            level={level}
            levelIndex={index}
            isExpanded={expandedLevels.has(level.id)}
            onToggle={() => toggleLevel(level.id)}
            progress={progress}
            courseId={courseId}
          />
        ))}
      </div>
    </section>
  );
}
