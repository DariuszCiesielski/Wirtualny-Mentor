"use client";

/**
 * Course Card Component
 *
 * Displays a single course in the courses grid.
 * Shows status badge, progress bar, estimated time, and last activity.
 */

import { useState } from "react";
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
import { Clock, BookOpen, ArrowRight, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import { deleteCourseAction } from "@/app/(dashboard)/courses/actions";
import type { CourseWithProgress } from "@/types/database";

interface CourseCardProps {
  course: CourseWithProgress;
}

export function CourseCard({ course }: CourseCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Czy na pewno chcesz usunąć kurs "${course.title}"? Ta operacja jest nieodwracalna.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteCourseAction(course.id);

    if (!result.success) {
      alert(result.error || "Nie udało się usunąć kursu");
      setIsDeleting(false);
    }
    // On success, revalidatePath will refresh the page
  };

  const completedChapters = course.user_progress?.completed_chapters.length || 0;
  const totalChapters = course.total_chapters || 0;
  const percentage =
    totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  const statusBadge = {
    draft: { label: "Szkic", variant: "secondary" as const },
    generating: { label: "Generowanie...", variant: "outline" as const },
    active: { label: "W trakcie", variant: "default" as const },
    completed: { label: "Ukończony", variant: "secondary" as const },
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
                {completedChapters} z {totalChapters} rozdziałów
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
            Ostatnia aktywność: {lastActivity}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        <Button asChild className="flex-1">
          <Link href={`/courses/${course.id}`}>
            {course.status === "active" ? "Kontynuuj naukę" : "Zobacz kurs"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Usuń kurs"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 text-destructive" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
