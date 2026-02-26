/**
 * Point Rules
 *
 * Defines how many points are awarded for each activity.
 */

export const POINT_RULES = {
  chapter_complete: 10,
  level_complete: 50,
  course_complete: 200,
  quiz_passed: 15,
  quiz_perfect: 10, // bonus on top of quiz_passed
  pomodoro_complete: 5,
} as const;

export type PointReason = keyof typeof POINT_RULES;
