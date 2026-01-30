"use server";

/**
 * Server Actions - Course Creation
 *
 * Server-side actions for course creation flow.
 */

import { createCourse, saveCurriculumWithLevels } from "@/lib/dal/courses";
import { getUser } from "@/lib/dal/auth";
import { redirect } from "next/navigation";
import type { UserExperience, CurriculumData, LevelName } from "@/types/database";
import type { Curriculum } from "@/lib/ai/curriculum/schemas";

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

/**
 * Transform AI-generated curriculum to database format
 */
function transformCurriculumForDB(curriculum: Curriculum): CurriculumData {
  return {
    title: curriculum.title,
    description: curriculum.description,
    target_audience: curriculum.targetAudience,
    total_estimated_hours: curriculum.totalEstimatedHours,
    prerequisites: curriculum.prerequisites,
    levels: curriculum.levels.map((level) => ({
      name: level.name as LevelName,
      description: level.description,
      estimated_hours: level.estimatedHours,
      outcomes: level.learningOutcomes.map((o) => o.description),
      chapters: level.chapters.map((chapter) => ({
        title: chapter.title,
        description: chapter.description,
        estimated_minutes: chapter.estimatedMinutes,
        topics: chapter.topics,
      })),
    })),
    resources: curriculum.resources?.map((r) => ({
      title: r.title,
      url: r.url,
      type: r.type,
    })),
  };
}

/**
 * Save curriculum to database and redirect to course page
 *
 * @param courseId - The course ID
 * @param curriculum - The AI-generated curriculum
 */
export async function saveCurriculum(
  courseId: string,
  curriculum: Curriculum
): Promise<void> {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Transform curriculum to database format
  const curriculumData = transformCurriculumForDB(curriculum);

  // Save curriculum with all levels, outcomes, and chapters
  await saveCurriculumWithLevels(courseId, user.id, curriculumData);

  // Redirect to course page
  redirect(`/courses/${courseId}`);
}
