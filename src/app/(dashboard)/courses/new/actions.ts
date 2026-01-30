"use server";

/**
 * Server Actions - Course Creation
 *
 * Server-side actions for course creation flow.
 */

import { createCourse } from "@/lib/dal/courses";
import { getUser } from "@/lib/dal/auth";
import { redirect } from "next/navigation";
import type { UserExperience } from "@/types/database";

interface InitiateCourseCreationInput {
  topic: string;
  sourceUrl?: string;
  userGoals?: string[];
  userExperience?: UserExperience;
  weeklyHours?: number;
}

interface InitiateCourseCreationResult {
  courseId: string;
}

/**
 * Initiate course creation - creates a draft course in the database
 *
 * @param input - Course creation input data
 * @returns The created course ID
 */
export async function initiateCourseCreation(
  input: InitiateCourseCreationInput
): Promise<InitiateCourseCreationResult> {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const course = await createCourse(user.id, {
    title: input.topic, // Use topic as initial title
    source_url: input.sourceUrl,
    user_goals: input.userGoals ?? [],
    user_experience: input.userExperience,
    weekly_hours: input.weeklyHours,
    status: "draft",
  });

  return { courseId: course.id };
}
