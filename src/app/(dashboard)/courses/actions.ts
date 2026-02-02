"use server";

/**
 * Server Actions - Courses List
 *
 * Server-side actions for course management on the courses list page.
 */

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/dal/auth";
import { deleteCourse, getCourse } from "@/lib/dal/courses";

/**
 * Delete a course
 *
 * Verifies ownership before deletion.
 *
 * @param courseId - The course ID to delete
 */
export async function deleteCourseAction(courseId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();

  if (!user) {
    return { success: false, error: "Nie jesteś zalogowany" };
  }

  // Verify ownership
  const course = await getCourse(courseId);

  if (!course) {
    return { success: false, error: "Kurs nie istnieje" };
  }

  if (course.user_id !== user.id) {
    return { success: false, error: "Nie masz uprawnień do usunięcia tego kursu" };
  }

  try {
    await deleteCourse(courseId);
    revalidatePath("/courses");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete course:", error);
    return { success: false, error: "Nie udało się usunąć kursu" };
  }
}
