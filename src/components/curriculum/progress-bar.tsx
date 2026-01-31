"use client";

/**
 * Progress Bar Component
 *
 * Visual progress indicator for course completion.
 * Shows percentage, chapter count, and current level.
 */

interface ProgressBarProps {
  percentage: number;
  completedChapters: number;
  totalChapters: number;
  currentLevel: string;
}

export function ProgressBar({
  percentage,
  completedChapters,
  totalChapters,
  currentLevel,
}: ProgressBarProps) {
  return (
    <div className="mb-8 p-4 bg-muted/50 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Postep kursu</span>
        <span className="text-sm text-muted-foreground">
          {completedChapters} z {totalChapters} rozdzialow
        </span>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Aktualny poziom: {currentLevel}</span>
        <span className="font-medium text-foreground">{percentage}%</span>
      </div>
    </div>
  );
}
