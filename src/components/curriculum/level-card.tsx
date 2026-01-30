"use client";

import { ChevronDown, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChapterList } from "./chapter-list";
import type { CourseLevelWithDetails, UserProgress } from "@/types/database";

interface LevelCardProps {
  level: CourseLevelWithDetails;
  levelIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  progress: UserProgress;
  courseId: string;
}

export function LevelCard({
  level,
  levelIndex,
  isExpanded,
  onToggle,
  progress,
  courseId,
}: LevelCardProps) {
  const isCompleted = progress.completed_levels.includes(level.id);
  const isCurrent = progress.current_level_id === level.id;

  // Get learning outcomes from level_outcomes
  const learningOutcomes = level.level_outcomes || [];

  return (
    <Card
      className={cn(
        "mb-4",
        isCompleted && "border-green-500/50",
        isCurrent && !isCompleted && "border-primary"
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={isCurrent && !isCompleted ? "default" : "secondary"}
                  >
                    Poziom {levelIndex + 1}
                  </Badge>
                  {isCompleted && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Ukonczony
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{level.name}</CardTitle>
                {level.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {level.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-right flex-shrink-0">
                {level.estimated_hours && (
                  <span className="text-sm text-muted-foreground">
                    {level.estimated_hours}h
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Learning Outcomes */}
            {learningOutcomes.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-sm">
                  Po ukonczeniu tego poziomu bedziesz umial:
                </h4>
                <ul className="space-y-2">
                  {learningOutcomes.map((outcome) => (
                    <li
                      key={outcome.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        {outcome.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chapters */}
            {level.chapters && level.chapters.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 text-sm">
                  Rozdzialy ({level.chapters.length}):
                </h4>
                <ChapterList
                  chapters={level.chapters}
                  progress={progress}
                  courseId={courseId}
                  levelId={level.id}
                />
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
