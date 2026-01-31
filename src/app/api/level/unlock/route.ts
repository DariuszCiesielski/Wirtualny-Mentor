/**
 * API Route: Unlock Next Level
 *
 * POST /api/level/unlock
 *
 * Called after user passes a level test.
 * Unlocks the next level in the course progression.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/dal/auth";
import { unlockLevel } from "@/lib/dal/level-unlocks";
import { getCourse } from "@/lib/dal/courses";

const requestSchema = z.object({
  levelId: z.string().uuid(),
  attemptId: z.string().uuid(),
  courseId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { levelId, attemptId, courseId } = parsed.data;

  try {
    // Verify course ownership
    const course = await getCourse(courseId);
    if (!course || course.user_id !== user.id) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Verify level exists in course
    const level = course.course_levels?.find((l) => l.id === levelId);
    if (!level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    // Find next level
    const currentOrder = level.order_index;
    const nextLevel = course.course_levels?.find(
      (l) => l.order_index === currentOrder + 1
    );

    // Unlock next level if exists
    if (nextLevel) {
      await unlockLevel(user.id, nextLevel.id, attemptId);
      return NextResponse.json({
        unlocked: true,
        nextLevelId: nextLevel.id,
        nextLevelName: nextLevel.name,
      });
    }

    // Course complete - no more levels
    return NextResponse.json({
      unlocked: true,
      nextLevelId: null,
      courseComplete: true,
    });
  } catch (error) {
    console.error("Failed to unlock level:", error);
    return NextResponse.json(
      { error: "Failed to unlock level" },
      { status: 500 }
    );
  }
}
