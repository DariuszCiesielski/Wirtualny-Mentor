"use client";

/**
 * Curriculum Generator Component
 *
 * Streams curriculum generation from AI and displays partial results.
 * Shows real-time progress as the curriculum structure is being created.
 */

import { useState, useEffect, useCallback } from "react";
import type { Curriculum } from "@/lib/ai/curriculum/schemas";
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
  const [curriculum, setCurriculum] = useState<Partial<Curriculum>>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [retryCount, setRetryCount] = useState(0);

  const generate = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await fetch("/api/curriculum/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInfo, courseId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Blad generowania (${response.status})`
        );
      }

      // Read streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let lastValidCurriculum: Partial<Curriculum> | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Try to parse partial JSON from streamObject response
        // The stream contains the object being built incrementally
        try {
          // Look for complete or partial JSON object in buffer
          // streamObject sends incremental JSON updates
          const trimmed = buffer.trim();

          // Try to parse as complete JSON first
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === "object") {
            lastValidCurriculum = parsed;
            setCurriculum(parsed);
          }
        } catch {
          // Try to extract partial valid JSON
          // This handles incomplete streaming data
          const match = buffer.match(/\{[\s\S]*$/);
          if (match) {
            try {
              // Add closing braces to make it valid JSON for preview
              let partial = match[0];
              const openBraces =
                (partial.match(/\{/g) || []).length -
                (partial.match(/\}/g) || []).length;
              const openBrackets =
                (partial.match(/\[/g) || []).length -
                (partial.match(/\]/g) || []).length;

              // Close any open strings
              if ((partial.match(/"/g) || []).length % 2 !== 0) {
                partial += '"';
              }

              // Close brackets and braces
              for (let i = 0; i < openBrackets; i++) partial += "]";
              for (let i = 0; i < openBraces; i++) partial += "}";

              const parsed = JSON.parse(partial);
              if (parsed && typeof parsed === "object") {
                setCurriculum(parsed);
              }
            } catch {
              // Ignore parse errors during streaming
            }
          }
        }
      }

      // Final parse after stream completes
      if (buffer.trim()) {
        try {
          const finalCurriculum = JSON.parse(buffer.trim());
          if (
            finalCurriculum &&
            finalCurriculum.title &&
            finalCurriculum.levels?.length === 5
          ) {
            setCurriculum(finalCurriculum);
            lastValidCurriculum = finalCurriculum;
          }
        } catch {
          // Use last valid curriculum if final parse fails
        }
      }

      // Complete if we have a valid curriculum
      if (
        lastValidCurriculum &&
        lastValidCurriculum.title &&
        lastValidCurriculum.levels?.length === 5
      ) {
        onComplete(lastValidCurriculum as Curriculum);
      } else {
        throw new Error(
          "Nie udalo sie wygenerowac pelnego curriculum. Sprobuj ponownie."
        );
      }
    } catch (e) {
      console.error("Generation error:", e);
      setError(e instanceof Error ? e.message : "Blad generowania curriculum");
    } finally {
      setIsLoading(false);
    }
  }, [userInfo, courseId, onComplete]);

  useEffect(() => {
    generate();
  }, [generate, retryCount]);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
  };

  // Progress indicators
  const levelNames = [
    "Poczatkujacy",
    "Srednio zaawansowany",
    "Zaawansowany",
    "Master",
    "Guru",
  ];

  const completedLevels = curriculum?.levels?.length || 0;

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Blad generowania
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRetry}>Sprobuj ponownie</Button>
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
        {curriculum?.title && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold">{curriculum.title}</h3>
            {curriculum.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {curriculum.description}
              </p>
            )}
            {curriculum.totalEstimatedHours && (
              <p className="text-sm text-muted-foreground mt-2">
                Szacowany czas: {curriculum.totalEstimatedHours} godzin
              </p>
            )}
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
              const level = curriculum?.levels?.[index];
              const isComplete = !!level;
              const isGenerating =
                isLoading && !isComplete && index === completedLevels;

              return (
                <div
                  key={name}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    isComplete && "bg-primary/5 border border-primary/20",
                    isGenerating && "bg-muted animate-pulse",
                    !isComplete && !isGenerating && "bg-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                      isComplete &&
                        "bg-primary text-primary-foreground",
                      isGenerating &&
                        "border-2 border-primary bg-primary/10 text-primary",
                      !isComplete &&
                        !isGenerating &&
                        "border border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium",
                        !isComplete && !isGenerating && "text-muted-foreground"
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
                  {level && (
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {level.chapters?.length || 0} rozdz.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
