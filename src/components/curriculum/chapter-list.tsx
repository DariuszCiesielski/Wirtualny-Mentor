"use client";

import Link from "next/link";
import { CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chapter, UserProgress } from "@/types/database";

interface ChapterListProps {
  chapters: Chapter[];
  progress: UserProgress;
  courseId: string;
  levelId: string;
}

export function ChapterList({
  chapters,
  progress,
  courseId,
  levelId,
}: ChapterListProps) {
  return (
    <div className="space-y-2">
      {chapters.map((chapter, index) => {
        const isCompleted = progress.completed_chapters.includes(chapter.id);
        const isCurrent = progress.current_chapter_id === chapter.id;

        return (
          <Link
            key={chapter.id}
            href={`/courses/${courseId}/${levelId}/${chapter.id}`}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border transition-colors",
              isCompleted &&
                "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
              isCurrent && "bg-primary/5 border-primary",
              !isCompleted && !isCurrent && "hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-6 text-sm">
                {index + 1}.
              </span>
              {isCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : isCurrent ? (
                <Circle className="h-5 w-5 text-primary flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <div>
                <p className="font-medium">{chapter.title}</p>
                {chapter.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {chapter.description}
                  </p>
                )}
              </div>
            </div>
            {chapter.estimated_minutes && (
              <span className="text-sm text-muted-foreground flex-shrink-0 ml-4">
                {chapter.estimated_minutes} min
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
