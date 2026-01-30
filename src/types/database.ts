/**
 * Database Types - TypeScript types matching Supabase schema
 *
 * These types represent the database entities for curriculum management.
 * Keep in sync with supabase/migrations/20260130000001_courses_schema.sql
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Course status - lifecycle states of a course
 */
export type CourseStatus =
  | "draft"
  | "generating"
  | "active"
  | "completed"
  | "archived";

/**
 * User experience level - self-reported proficiency
 */
export type UserExperience = "beginner" | "intermediate" | "advanced";

/**
 * Level names - 5 progression levels (Polish)
 */
export type LevelName =
  | "Poczatkujacy"
  | "Srednio zaawansowany"
  | "Zaawansowany"
  | "Master"
  | "Guru";

/**
 * Resource types - types of learning resources
 */
export type ResourceType =
  | "article"
  | "video"
  | "documentation"
  | "course"
  | "book";

/**
 * All 5 level names in order
 */
export const LEVEL_NAMES: readonly LevelName[] = [
  "Poczatkujacy",
  "Srednio zaawansowany",
  "Zaawansowany",
  "Master",
  "Guru",
] as const;

// ============================================================================
// BASE ENTITIES
// ============================================================================

/**
 * Course - main curriculum container
 */
export interface Course {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_audience: string | null;
  total_estimated_hours: number | null;
  prerequisites: string[];
  source_url: string | null;
  user_goals: string[];
  user_experience: UserExperience | null;
  weekly_hours: number | null;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Course Level - one of 5 progression levels within a course
 */
export interface CourseLevel {
  id: string;
  course_id: string;
  name: LevelName;
  description: string | null;
  estimated_hours: number | null;
  order_index: number;
  created_at: string;
}

/**
 * Level Outcome - learning outcome for a level
 */
export interface LevelOutcome {
  id: string;
  level_id: string;
  description: string;
  order_index: number;
  created_at: string;
}

/**
 * Chapter - individual chapter within a level
 */
export interface Chapter {
  id: string;
  level_id: string;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  topics: string[];
  order_index: number;
  created_at: string;
}

/**
 * User Progress - tracks user's position and completion status
 */
export interface UserProgress {
  id: string;
  user_id: string;
  course_id: string;
  current_level_id: string | null;
  current_chapter_id: string | null;
  completed_chapters: string[];
  completed_levels: string[];
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
}

/**
 * Course Resource - additional learning resource
 */
export interface CourseResource {
  id: string;
  course_id: string;
  title: string;
  url: string;
  type: ResourceType | null;
  created_at: string;
}

// ============================================================================
// COMPOSITE TYPES (with relations)
// ============================================================================

/**
 * Level with nested outcomes and chapters
 */
export interface CourseLevelWithDetails extends CourseLevel {
  level_outcomes: LevelOutcome[];
  chapters: Chapter[];
}

/**
 * Course with all nested relations
 */
export interface CourseWithDetails extends Course {
  course_levels: CourseLevelWithDetails[];
  course_resources?: CourseResource[];
}

/**
 * Course with progress information for listing
 */
export interface CourseWithProgress extends Course {
  user_progress: UserProgress | null;
  total_chapters?: number;
  completed_chapters_count?: number;
}

// ============================================================================
// INPUT TYPES (for creating/updating)
// ============================================================================

/**
 * Input for creating a new course
 */
export interface CreateCourseInput {
  title: string;
  description?: string;
  target_audience?: string;
  total_estimated_hours?: number;
  prerequisites?: string[];
  source_url?: string;
  user_goals?: string[];
  user_experience?: UserExperience;
  weekly_hours?: number;
  status?: CourseStatus;
}

/**
 * Input for creating a course level
 */
export interface CreateCourseLevelInput {
  name: LevelName;
  description?: string;
  estimated_hours?: number;
  order_index: number;
}

/**
 * Input for creating a level outcome
 */
export interface CreateLevelOutcomeInput {
  description: string;
  order_index: number;
}

/**
 * Input for creating a chapter
 */
export interface CreateChapterInput {
  title: string;
  description?: string;
  estimated_minutes?: number;
  topics?: string[];
  order_index: number;
}

/**
 * Input for creating a course resource
 */
export interface CreateCourseResourceInput {
  title: string;
  url: string;
  type?: ResourceType;
}

/**
 * Full curriculum data for saving (from AI generation)
 */
export interface CurriculumData {
  title: string;
  description: string;
  target_audience: string;
  total_estimated_hours: number;
  prerequisites: string[];
  levels: CurriculumLevelData[];
  resources?: CreateCourseResourceInput[];
}

/**
 * Level data within curriculum
 */
export interface CurriculumLevelData {
  name: LevelName;
  description: string;
  estimated_hours: number;
  outcomes: string[];
  chapters: CurriculumChapterData[];
}

/**
 * Chapter data within level
 */
export interface CurriculumChapterData {
  title: string;
  description: string;
  estimated_minutes: number;
  topics: string[];
}

// ============================================================================
// UPDATE TYPES
// ============================================================================

/**
 * Updates for user progress
 */
export interface ProgressUpdate {
  current_level_id?: string;
  current_chapter_id?: string;
  completed_chapters?: string[];
  completed_levels?: string[];
  completed_at?: string | null;
}
