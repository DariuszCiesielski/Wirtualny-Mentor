import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/dal/auth";
import { getCourse } from "@/lib/dal/courses";
import { getProgress } from "@/lib/dal/progress";

interface CourseLayoutProps {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}

export default async function CourseLayout({
  children,
  params,
}: CourseLayoutProps) {
  const user = await requireAuth();
  const { courseId } = await params;

  // Fetch course with all details
  const course = await getCourse(courseId);

  if (!course) {
    notFound();
  }

  // RLS already ensures user can only access their own courses,
  // but we verify course belongs to user as defense-in-depth
  if (course.user_id !== user.id) {
    notFound();
  }

  // Fetch user's progress for this course
  const progress = await getProgress(user.id, courseId);

  // Course should always have progress record (created on curriculum save)
  // but handle edge case gracefully
  if (!progress) {
    notFound();
  }

  return <>{children}</>;
}
