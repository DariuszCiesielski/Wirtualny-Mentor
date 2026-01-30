/**
 * Data Access Layer - Courses
 *
 * CRUD operations for courses and curriculum management.
 * All functions use Supabase server client and require authentication.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  Course,
  CourseWithDetails,
  CourseWithProgress,
  CreateCourseInput,
  CurriculumData,
  CourseStatus,
  CourseLevelWithDetails,
} from "@/types/database";

/**
 * Create a new course
 *
 * @param userId - The user's ID
 * @param courseData - Course creation data
 * @returns The created course
 */
export async function createCourse(
  userId: string,
  courseData: CreateCourseInput
): Promise<Course> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .insert({
      user_id: userId,
      title: courseData.title,
      description: courseData.description ?? null,
      target_audience: courseData.target_audience ?? null,
      total_estimated_hours: courseData.total_estimated_hours ?? null,
      prerequisites: courseData.prerequisites ?? [],
      source_url: courseData.source_url ?? null,
      user_goals: courseData.user_goals ?? [],
      user_experience: courseData.user_experience ?? null,
      weekly_hours: courseData.weekly_hours ?? null,
      status: courseData.status ?? "draft",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create course: ${error.message}`);
  }

  return data as Course;
}

/**
 * Save full curriculum with levels, outcomes, and chapters
 *
 * This function saves the AI-generated curriculum structure to the database.
 * It creates levels, their outcomes, chapters, and initializes user progress.
 *
 * @param courseId - The course ID to save curriculum for
 * @param userId - The user's ID (for progress record)
 * @param curriculum - The curriculum data from AI generation
 */
export async function saveCurriculumWithLevels(
  courseId: string,
  userId: string,
  curriculum: CurriculumData
): Promise<void> {
  const supabase = await createClient();

  // Update course with curriculum data
  const { error: updateError } = await supabase
    .from("courses")
    .update({
      title: curriculum.title,
      description: curriculum.description,
      target_audience: curriculum.target_audience,
      total_estimated_hours: curriculum.total_estimated_hours,
      prerequisites: curriculum.prerequisites,
      status: "active" as CourseStatus,
    })
    .eq("id", courseId);

  if (updateError) {
    throw new Error(`Failed to update course: ${updateError.message}`);
  }

  // Track first level and chapter for progress initialization
  let firstLevelId: string | null = null;
  let firstChapterId: string | null = null;

  // Insert levels, outcomes, and chapters
  for (let levelIndex = 0; levelIndex < curriculum.levels.length; levelIndex++) {
    const level = curriculum.levels[levelIndex];

    // Insert level
    const { data: levelData, error: levelError } = await supabase
      .from("course_levels")
      .insert({
        course_id: courseId,
        name: level.name,
        description: level.description,
        estimated_hours: level.estimated_hours,
        order_index: levelIndex + 1,
      })
      .select("id")
      .single();

    if (levelError) {
      throw new Error(`Failed to create level: ${levelError.message}`);
    }

    const levelId = levelData.id;

    // Track first level
    if (levelIndex === 0) {
      firstLevelId = levelId;
    }

    // Insert level outcomes
    if (level.outcomes.length > 0) {
      const outcomesData = level.outcomes.map((description, index) => ({
        level_id: levelId,
        description,
        order_index: index + 1,
      }));

      const { error: outcomesError } = await supabase
        .from("level_outcomes")
        .insert(outcomesData);

      if (outcomesError) {
        throw new Error(`Failed to create outcomes: ${outcomesError.message}`);
      }
    }

    // Insert chapters
    if (level.chapters.length > 0) {
      const chaptersData = level.chapters.map((chapter, index) => ({
        level_id: levelId,
        title: chapter.title,
        description: chapter.description,
        estimated_minutes: chapter.estimated_minutes,
        topics: chapter.topics,
        order_index: index + 1,
      }));

      const { data: insertedChapters, error: chaptersError } = await supabase
        .from("chapters")
        .insert(chaptersData)
        .select("id, order_index");

      if (chaptersError) {
        throw new Error(`Failed to create chapters: ${chaptersError.message}`);
      }

      // Track first chapter of first level
      if (levelIndex === 0 && insertedChapters && insertedChapters.length > 0) {
        const firstChapter = insertedChapters.find((c) => c.order_index === 1);
        firstChapterId = firstChapter?.id ?? insertedChapters[0].id;
      }
    }
  }

  // Insert resources if provided
  if (curriculum.resources && curriculum.resources.length > 0) {
    const resourcesData = curriculum.resources.map((resource) => ({
      course_id: courseId,
      title: resource.title,
      url: resource.url,
      type: resource.type ?? null,
    }));

    const { error: resourcesError } = await supabase
      .from("course_resources")
      .insert(resourcesData);

    if (resourcesError) {
      throw new Error(`Failed to create resources: ${resourcesError.message}`);
    }
  }

  // Create initial user progress record
  const { error: progressError } = await supabase.from("user_progress").insert({
    user_id: userId,
    course_id: courseId,
    current_level_id: firstLevelId,
    current_chapter_id: firstChapterId,
    completed_chapters: [],
    completed_levels: [],
  });

  if (progressError) {
    throw new Error(`Failed to create progress: ${progressError.message}`);
  }
}

/**
 * Get a course with all nested details
 *
 * @param courseId - The course ID
 * @returns Course with levels, outcomes, chapters, and resources
 */
export async function getCourse(
  courseId: string
): Promise<CourseWithDetails | null> {
  const supabase = await createClient();

  // Get course with levels
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select(
      `
      *,
      course_levels (
        *,
        level_outcomes (*),
        chapters (*)
      ),
      course_resources (*)
    `
    )
    .eq("id", courseId)
    .single();

  if (courseError) {
    if (courseError.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get course: ${courseError.message}`);
  }

  // Sort levels and their children by order_index
  if (course.course_levels) {
    course.course_levels.sort(
      (a: CourseLevelWithDetails, b: CourseLevelWithDetails) =>
        a.order_index - b.order_index
    );

    course.course_levels.forEach((level: CourseLevelWithDetails) => {
      if (level.level_outcomes) {
        level.level_outcomes.sort((a, b) => a.order_index - b.order_index);
      }
      if (level.chapters) {
        level.chapters.sort((a, b) => a.order_index - b.order_index);
      }
    });
  }

  return course as CourseWithDetails;
}

/**
 * Get all courses for a user with progress information
 *
 * @param userId - The user's ID
 * @returns List of courses with progress data
 */
export async function getUserCourses(
  userId: string
): Promise<CourseWithProgress[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .select(
      `
      *,
      user_progress (*)
    `
    )
    .eq("user_id", userId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get user courses: ${error.message}`);
  }

  // Transform the data to include progress as single object (not array)
  const coursesWithProgress: CourseWithProgress[] = (data ?? []).map(
    (course) => {
      const progress = Array.isArray(course.user_progress)
        ? course.user_progress[0] ?? null
        : course.user_progress;

      return {
        ...course,
        user_progress: progress,
      };
    }
  );

  return coursesWithProgress;
}

/**
 * Update course status
 *
 * @param courseId - The course ID
 * @param status - New status
 */
export async function updateCourseStatus(
  courseId: string,
  status: CourseStatus
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("courses")
    .update({ status })
    .eq("id", courseId);

  if (error) {
    throw new Error(`Failed to update course status: ${error.message}`);
  }
}

/**
 * Delete a course and all related data (cascades via foreign keys)
 *
 * @param courseId - The course ID to delete
 */
export async function deleteCourse(courseId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("courses").delete().eq("id", courseId);

  if (error) {
    throw new Error(`Failed to delete course: ${error.message}`);
  }
}
