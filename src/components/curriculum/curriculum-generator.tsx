"use client";

/**
 * Curriculum Generator Component
 *
 * Streams curriculum generation from AI and displays partial results.
 * Uses experimental_useObject for real-time streaming with progress.
 */

import { useEffect, useRef } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import type { Curriculum } from "@/lib/ai/curriculum/schemas";
import { curriculumSchema } from "@/lib/ai/curriculum/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserInfo {
  topic: string;
  goals: string[];
  experience: "beginner" | "intermediate" | "advanced";
  weeklyHours: number;
  sourceUrl?: string;
}

interface CurriculumGeneratorProps {
  userInfo: UserInfo;
  courseId: string;
  onComplete: (curriculum: Curriculum) => void;
}

export function CurriculumGenerator({
  userInfo,
  courseId,
  onComplete,
}: CurriculumGeneratorProps) {
  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/curriculum/generate",
    schema: curriculumSchema,
  });

  // Track if we've already started generation
  const hasStarted = useRef(false);

  // Start generation on mount (only once)
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      submit({ userInfo, courseId });
    }
  }, [submit, userInfo, courseId]);

  // Track if we've already called onComplete
  const hasCompleted = useRef(false);

  // Call onComplete when curriculum is fully generated (only once)
  useEffect(() => {
    if (hasCompleted.current) return;

    if (!isLoading && object?.title && object?.levels?.length === 5) {
      // Verify all levels have required data
      const isComplete = object.levels.every(
        (level) =>
          level?.id &&
          level?.name &&
          (level?.chapters?.length ?? 0) >= 3 &&
          (level?.learningOutcomes?.length ?? 0) >= 3
      );
      if (isComplete) {
        hasCompleted.current = true;
        onComplete(object as Curriculum);
      }
    }
  }, [isLoading, object, onComplete]);

  const handleRetry = () => {
    hasCompleted.current = false;
    submit({ userInfo, courseId });
  };

  // Progress indicators
  const levelNames = [
    "Początkujący",
    "Średnio zaawansowany",
    "Zaawansowany",
    "Master",
    "Guru",
  ];

  // Count completed levels (with all required fields)
  const completedLevels =
    object?.levels?.filter(
      (level) =>
        level?.id &&
        level?.name &&
        level?.description &&
        (level?.chapters?.length ?? 0) >= 1 &&
        (level?.learningOutcomes?.length ?? 0) >= 1
    ).length || 0;

  // Calculate overall progress percentage
  const progressPercent = Math.round((completedLevels / 5) * 100);

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Błąd generowania
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {error.message || "Wystąpił błąd podczas generowania curriculum"}
          </p>
          <Button onClick={handleRetry}>Spróbuj ponownie</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Generowanie curriculum...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Curriculum gotowe!
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Course title */}
        {object?.title && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold">{object.title}</h3>
            {object.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {object.description}
              </p>
            )}
            {object.totalEstimatedHours && (
              <p className="text-sm text-muted-foreground mt-2">
                Szacowany czas: {object.totalEstimatedHours} godzin
              </p>
            )}
          </div>
        )}

        {/* Progress bar */}
        {isLoading && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Postęp generowania</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${Math.max(progressPercent, 5)}%` }}
              />
            </div>
          </div>
        )}

        {/* Progress indicators */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <BookOpen className="h-4 w-4" />
            <span>Poziomy: {completedLevels} / 5</span>
          </div>

          {/* Level progress */}
          <div className="space-y-3">
            {levelNames.map((name, index) => {
              const level = object?.levels?.[index];
              const hasBasicData = level?.id && level?.name;
              const isComplete =
                hasBasicData &&
                (level?.chapters?.length ?? 0) >= 1 &&
                (level?.learningOutcomes?.length ?? 0) >= 1;
              const isGenerating = isLoading && hasBasicData && !isComplete;
              const isWaiting = isLoading && !hasBasicData && index === completedLevels;

              return (
                <div
                  key={name}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    isComplete && "bg-primary/5 border border-primary/20",
                    (isGenerating || isWaiting) && "bg-muted animate-pulse",
                    !isComplete && !isGenerating && !isWaiting && "bg-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                      isComplete && "bg-primary text-primary-foreground",
                      (isGenerating || isWaiting) &&
                        "border-2 border-primary bg-primary/10 text-primary",
                      !isComplete &&
                        !isGenerating &&
                        !isWaiting &&
                        "border border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isGenerating || isWaiting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium",
                        !isComplete &&
                          !isGenerating &&
                          !isWaiting &&
                          "text-muted-foreground"
                      )}
                    >
                      {level?.name || name}
                    </p>
                    {level?.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {level.description}
                      </p>
                    )}
                  </div>
                  {level?.chapters && level.chapters.length > 0 && (
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {level.chapters.length} rozdz.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stop button during generation */}
        {isLoading && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" size="sm" onClick={() => stop()}>
              Anuluj generowanie
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
