import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/dal/auth";
import { getCourse } from "@/lib/dal/courses";
import { getProgress, getProgressStats } from "@/lib/dal/progress";
import { Button } from "@/components/ui/button";
import { CurriculumTOC } from "@/components/curriculum/curriculum-toc";

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const user = await requireAuth();
  const { courseId } = await params;

  // Fetch course with all details
  const course = await getCourse(courseId);

  if (!course) {
    notFound();
  }

  // Verify ownership (RLS + defense-in-depth)
  if (course.user_id !== user.id) {
    notFound();
  }

  // Fetch user's progress
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
            <span>~{course.total_estimated_hours}h calkowicie</span>
          )}
          <span>
            {stats.completedChapters}/{stats.totalChapters} rozdzialow
          </span>
          <span className="font-medium text-foreground">
            {stats.percentage}% ukonczone
          </span>
        </div>

        {/* Prerequisites */}
        {course.prerequisites && course.prerequisites.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-1">Wymagania wstepne:</h3>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {course.prerequisites.map((prereq, index) => (
                <li key={index}>{prereq}</li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {/* Continue learning button */}
      {hasContinueLink && (
        <Button asChild className="mb-8">
          <Link
            href={`/courses/${courseId}/${currentLevelId}/${currentChapterId}`}
          >
            {stats.percentage === 0 ? "Rozpocznij nauke" : "Kontynuuj nauke"}
          </Link>
        </Button>
      )}

      {/* Course completion message */}
      {stats.isComplete && (
        <div className="mb-8 p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800">
          <p className="text-green-700 dark:text-green-300 font-medium">
            Gratulacje! Ukonczyles ten kurs.
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
