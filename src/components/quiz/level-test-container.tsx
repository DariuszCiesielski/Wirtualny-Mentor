"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuizContainer } from "./quiz-container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Target } from "lucide-react";
import { SkipLevelModal } from "./skip-level-modal";

interface LevelTestContainerProps {
  levelId: string;
  courseId: string;
  levelName: string;
  levelOrder: number;
  levelOutcomes: string[];
  estimatedMinutes?: number;
  isLastLevel: boolean;
}

export function LevelTestContainer({
  levelId,
  courseId,
  levelName,
  levelOrder,
  levelOutcomes,
  estimatedMinutes = 15,
  isLastLevel,
}: LevelTestContainerProps) {
  const router = useRouter();
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  async function handleTestComplete(passed: boolean, currentAttemptId?: string) {
    if (passed && currentAttemptId) {
      // Unlock next level
      const res = await fetch("/api/level/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId,
          courseId,
          attemptId: currentAttemptId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.courseComplete) {
          // Show course complete celebration
          router.push(`/courses/${courseId}?completed=true`);
        } else {
          // Navigate to course page with unlock notification
          router.push(`/courses/${courseId}?unlocked=${data.nextLevelId}`);
        }
        router.refresh();
      }
    }
    // If failed, stay on page for retry (handled by QuizContainer)
  }

  if (!testStarted) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Test końcowy: {levelName}
            </CardTitle>
            <CardDescription>
              Sprawdź czy opanowałeś materiał z tego poziomu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Test info */}
            <div className="flex gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />~{estimatedMinutes} min
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Prog: 70%
              </Badge>
            </div>

            {/* What you should know */}
            {levelOutcomes.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">
                  Po tym poziomie powinieneś umieć:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {levelOutcomes.map((outcome, i) => (
                    <li key={i}>{outcome}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button onClick={() => setTestStarted(true)} size="lg">
                Rozpocznij test
              </Button>
              {levelOrder > 0 && !isLastLevel && (
                <Button
                  variant="outline"
                  onClick={() => setShowSkipModal(true)}
                >
                  Przeskocz poziom
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <SkipLevelModal
          open={showSkipModal}
          onOpenChange={setShowSkipModal}
          levelId={levelId}
          courseId={courseId}
          levelName={levelName}
        />
      </>
    );
  }

  return (
    <QuizContainer
      levelId={levelId}
      courseId={courseId}
      onComplete={(passed, _attemptId) => {
        handleTestComplete(passed, _attemptId);
      }}
    />
  );
}
