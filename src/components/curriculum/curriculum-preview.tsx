"use client";

/**
 * Curriculum Preview Component
 *
 * Displays the full curriculum structure before saving.
 * Shows all 5 levels with their learning outcomes and chapters.
 */

import type { Curriculum } from "@/lib/ai/curriculum/schemas";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  Save,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CurriculumPreviewProps {
  curriculum: Curriculum;
  onConfirm: () => Promise<void>;
  isSubmitting?: boolean;
}

export function CurriculumPreview({
  curriculum,
  onConfirm,
  isSubmitting = false,
}: CurriculumPreviewProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  // Calculate totals
  const totalChapters = curriculum.levels.reduce(
    (sum, level) => sum + level.chapters.length,
    0
  );
  const totalOutcomes = curriculum.levels.reduce(
    (sum, level) => sum + level.learningOutcomes.length,
    0
  );

  // Level badge colors
  const levelColors: Record<string, string> = {
    Poczatkujacy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    "Srednio zaawansowany": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    Zaawansowany: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
    Master: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
    Guru: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  };

  return (
    <div className="space-y-6">
      {/* Course overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {curriculum.title}
          </CardTitle>
          <CardDescription>{curriculum.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{curriculum.totalEstimatedHours}</strong> godzin
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{totalChapters}</strong> rozdzialow
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{totalOutcomes}</strong> celow
              </span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>5</strong> poziomow
              </span>
            </div>
          </div>

          {/* Target audience */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-1">Dla kogo:</h4>
            <p className="text-sm text-muted-foreground">
              {curriculum.targetAudience}
            </p>
          </div>

          {/* Prerequisites */}
          {curriculum.prerequisites && curriculum.prerequisites.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Wymagania wstepne:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {curriculum.prerequisites.map((prereq, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    {prereq}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Levels accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Program nauczania
          </CardTitle>
          <CardDescription>
            Kliknij na poziom, aby zobaczyc szczegoly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={["level-0"]} className="w-full">
            {curriculum.levels.map((level, levelIndex) => (
              <AccordionItem key={level.id} value={`level-${levelIndex}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium bg-primary text-primary-foreground"
                      )}
                    >
                      {levelIndex + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{level.name}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            levelColors[level.name]
                          )}
                        >
                          {level.estimatedHours}h
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-normal line-clamp-1">
                        {level.description}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-11 space-y-4 pt-2">
                    {/* Learning outcomes */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Cele nauki ({level.learningOutcomes.length})
                      </h4>
                      <ul className="space-y-2">
                        {level.learningOutcomes.map((outcome) => (
                          <li
                            key={outcome.id}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">
                              {outcome.description}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Chapters */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Rozdzialy ({level.chapters.length})
                      </h4>
                      <div className="space-y-2">
                        {level.chapters.map((chapter, chapterIndex) => (
                          <div
                            key={chapter.id}
                            className="border rounded-lg p-3 bg-muted/30"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2">
                                <span className="text-xs text-muted-foreground mt-1">
                                  {levelIndex + 1}.{chapterIndex + 1}
                                </span>
                                <div>
                                  <h5 className="text-sm font-medium">
                                    {chapter.title}
                                  </h5>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {chapter.description}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                {chapter.estimatedMinutes} min
                              </Badge>
                            </div>
                            {chapter.topics && chapter.topics.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {chapter.topics.map((topic, topicIndex) => (
                                  <Badge
                                    key={topicIndex}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t pt-6">
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            size="lg"
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Zapisz i rozpocznij nauke
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
