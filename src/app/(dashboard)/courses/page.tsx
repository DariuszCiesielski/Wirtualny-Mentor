/**
 * Courses Listing Page
 *
 * Displays all user courses with progress information.
 * Allows navigation to individual courses and creation of new ones.
 */

import { requireAuth } from "@/lib/dal/auth";
import { getUserCourses } from "@/lib/dal/courses";
import { CourseCard } from "@/components/curriculum/course-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";

export default async function CoursesPage() {
  const user = await requireAuth();
  const courses = await getUserCourses(user.id);

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Moje kursy</h1>
          <p className="text-muted-foreground mt-1">
            Zarządzaj swoimi kursami i śledź postępy
          </p>
        </div>
        <Button asChild>
          <Link href="/courses/new">
            <Plus className="h-4 w-4 mr-2" />
            Nowy kurs
          </Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-medium mb-2">Brak kursów</h2>
          <p className="text-muted-foreground mb-4">
            Rozpocznij naukę tworząc swój pierwszy kurs
          </p>
          <Button asChild>
            <Link href="/courses/new">
              <Plus className="h-4 w-4 mr-2" />
              Utwórz pierwszy kurs
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
