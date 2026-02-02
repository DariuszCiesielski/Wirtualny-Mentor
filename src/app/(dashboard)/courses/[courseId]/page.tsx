// Force dynamic rendering to prevent caching issues with draft courses
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/dal/auth";
import { getCourse, deleteCourse } from "@/lib/dal/courses";
import { getProgress, getProgressStats } from "@/lib/dal/progress";
import { Button } from "@/components/ui/button";
import { CurriculumTOC } from "@/components/curriculum/curriculum-toc";
import { MessageCircle, FileEdit, Trash2 } from "lucide-react";

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const user = await requireAuth();
  const { courseId } = await params;

  // Fetch course with all details
  const course = await getCourse(courseId);
  console.log("[CoursePage] courseId:", courseId, "course:", course?.id, "status:", course?.status);

  if (!course) {
    console.log("[CoursePage] Course not found, returning 404");
    notFound();
  }

  // Verify ownership (RLS + defense-in-depth)
  if (course.user_id !== user.id) {
    notFound();
  }

  // Handle draft courses - show different UI
  if (course.status === "draft") {
    return (
      <div className="container max-w-2xl py-16">
        <div className="text-center space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto">
            <FileEdit className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground mt-2">
              Ten kurs jest w trakcie tworzenia. Curriculum nie zostało jeszcze wygenerowane.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/courses/new">Utwórz nowy kurs</Link>
            </Button>
            <form
              action={async () => {
                "use server";
                await deleteCourse(courseId);
                redirect("/courses");
              }}
            >
              <Button type="submit" variant="outline" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Usuń szkic
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Fetch user's progress (only for active courses)
  const progress = await getProgress(user.id, courseId);

  if (!progress) {
    notFound();
  }

  // Calculate progress stats
  const stats = getProgressStats(progress, course);

  // Determine current position for "Continue learning" link
  const currentLevelId = progress.current_level_id;
  const currentChapterId = progress.current_chapter_id;

  // Build continue link only if we have valid position
  const hasContinueLink = currentLevelId && currentChapterId;

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{course.title}</h1>
        {course.description && (
          <p className="text-muted-foreground mt-2">{course.description}</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          {course.total_estimated_hours && (
            <span>~{course.total_estimated_hours}h całkowicie</span>
          )}
          <span>
            {stats.completedChapters}/{stats.totalChapters} rozdziałów
          </span>
          <span className="font-medium text-foreground">
            {stats.percentage}% ukończone
          </span>
        </div>

        {/* Prerequisites */}
        {course.prerequisites && course.prerequisites.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-1">Wymagania wstępne:</h3>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {course.prerequisites.map((prereq, index) => (
                <li key={index}>{prereq}</li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-8">
        {hasContinueLink && (
          <Button asChild>
            <Link
              href={`/courses/${courseId}/${currentLevelId}/${currentChapterId}`}
            >
              {stats.percentage === 0 ? "Rozpocznij naukę" : "Kontynuuj naukę"}
            </Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href={`/courses/${courseId}/chat`}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat z mentorem
          </Link>
        </Button>
      </div>

      {/* Course completion message */}
      {stats.isComplete && (
        <div className="mb-8 p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800">
          <p className="text-green-700 dark:text-green-300 font-medium">
            Gratulacje! Ukończyłeś ten kurs.
          </p>
        </div>
      )}

      {/* Table of Contents */}
      <CurriculumTOC
        levels={course.course_levels}
        progress={progress}
        courseId={courseId}
      />
    </div>
  );
}
