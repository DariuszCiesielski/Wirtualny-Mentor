/**
 * API Route: Skip Level
 *
 * POST /api/level/skip
 *
 * Allows user to manually skip a level without passing the test.
 * The next level is unlocked but the skip is tracked for analytics.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/dal/auth";
import { skipLevel } from "@/lib/dal/level-unlocks";
import { getCourse } from "@/lib/dal/courses";

const requestSchema = z.object({
  levelId: z.string().uuid(),
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

  const { levelId, courseId } = parsed.data;

  try {
    // Verify course ownership
    const course = await getCourse(courseId);
    if (!course || course.user_id !== user.id) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Find current and next level
    const level = course.course_levels?.find((l) => l.id === levelId);
    if (!level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    const nextLevel = course.course_levels?.find(
      (l) => l.order_index === level.order_index + 1
    );

    // Skip current level (unlock next)
    if (nextLevel) {
      await skipLevel(user.id, nextLevel.id);
      return NextResponse.json({
        skipped: true,
        nextLevelId: nextLevel.id,
        nextLevelName: nextLevel.name,
      });
    }

    // No more levels to skip to
    return NextResponse.json({
      skipped: true,
      nextLevelId: null,
    });
  } catch (error) {
    console.error("Failed to skip level:", error);
    return NextResponse.json(
      { error: "Failed to skip level" },
      { status: 500 }
    );
  }
}
