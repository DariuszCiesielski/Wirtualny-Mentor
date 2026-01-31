"use client";

/**
 * Course Card Component
 *
 * Displays a single course in the courses grid.
 * Shows status badge, progress bar, estimated time, and last activity.
 */

import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import type { CourseWithProgress } from "@/types/database";

interface CourseCardProps {
  course: CourseWithProgress;
}

export function CourseCard({ course }: CourseCardProps) {
  const completedChapters = course.user_progress?.completed_chapters.length || 0;
  const totalChapters = course.total_chapters || 0;
  const percentage =
    totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  const statusBadge = {
    draft: { label: "Szkic", variant: "secondary" as const },
    generating: { label: "Generowanie...", variant: "outline" as const },
    active: { label: "W trakcie", variant: "default" as const },
    completed: { label: "Ukonczony", variant: "secondary" as const },
    archived: { label: "Archiwum", variant: "secondary" as const },
  }[course.status];

  const lastActivity = course.user_progress?.last_activity_at
    ? formatDistanceToNow(new Date(course.user_progress.last_activity_at))
    : null;

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2">{course.title}</CardTitle>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </div>
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {course.description}
          </p>
        )}
      </CardHeader>

      <CardContent>
        {/* Progress Bar */}
        {course.status === "active" && totalChapters > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>
                {completedChapters} z {totalChapters} rozdzialow
              </span>
              <span>{percentage}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {course.total_estimated_hours && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{course.total_estimated_hours}h</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>Kurs</span>
          </div>
        </div>

        {lastActivity && (
          <p className="text-xs text-muted-foreground mt-2">
            Ostatnia aktywnosc: {lastActivity}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button asChild className="w-full">
          <Link href={`/courses/${course.id}`}>
            {course.status === "active" ? "Kontynuuj nauke" : "Zobacz kurs"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
