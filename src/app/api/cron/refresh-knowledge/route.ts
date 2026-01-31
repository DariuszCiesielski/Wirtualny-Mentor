/**
 * Knowledge Refresh Cron Job
 *
 * Triggered daily at 5:00 AM UTC by Vercel Cron.
 * Refreshes materials for courses in dynamic domains (AI, tech, law, etc.).
 *
 * Security: Requires CRON_SECRET header from Vercel.
 *
 * MVP approach: Mark courses as needing refresh (updated_at timestamp).
 * Full regeneration is expensive - we flag and lazy-regenerate on next visit.
 *
 * @requirement KNOW-03 - Knowledge base refreshed for AI, tech, law domains
 */

import { NextRequest, NextResponse } from "next/server";
import { getCoursesNeedingRefresh } from "@/lib/dal/courses";
import { createClient } from "@/lib/supabase/server";

// Node.js runtime for database operations
export const runtime = "nodejs";

// Allow up to 5 minutes for batch processing
export const maxDuration = 300;

/**
 * Verify the request is from Vercel Cron using CRON_SECRET.
 *
 * In production, Vercel automatically sends the secret in the Authorization header.
 * For local testing, set CRON_SECRET in .env.local and use:
 *   curl -H "Authorization: Bearer YOUR_SECRET" localhost:3000/api/cron/refresh-knowledge
 */
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");

  // In development without CRON_SECRET, allow access for testing
  if (
    process.env.NODE_ENV === "development" &&
    !process.env.CRON_SECRET
  ) {
    console.warn(
      "[Cron] CRON_SECRET not set - allowing request in development mode"
    );
    return true;
  }

  if (!process.env.CRON_SECRET) {
    console.error("[Cron] CRON_SECRET environment variable not configured");
    return false;
  }

  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  if (!isAuthorized(request)) {
    console.error("[Cron] Unauthorized request - invalid or missing CRON_SECRET");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  console.log("[Cron] Knowledge refresh started");

  try {
    // Get courses needing refresh
    const courses = await getCoursesNeedingRefresh();
    console.log(`[Cron] Found ${courses.length} courses to refresh`);

    if (courses.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No courses need refresh",
        refreshed: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    // MVP approach: Mark courses as needing refresh by updating timestamp
    // Full implementation would regenerate materials here, but that's expensive
    // Instead, we flag courses and lazy-regenerate when user visits
    const supabase = await createClient();

    const { error } = await supabase
      .from("courses")
      .update({
        updated_at: new Date().toISOString(),
        // Future: Add a 'needs_refresh' boolean column for explicit flagging
      })
      .in(
        "id",
        courses.map((c) => c.id)
      );

    if (error) {
      console.error("[Cron] Error updating courses:", error);
      throw error;
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Cron] Marked ${courses.length} courses for refresh in ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      message: `Marked ${courses.length} courses for refresh`,
      refreshed: courses.length,
      duration_ms: duration,
      courses: courses.map((c) => ({
        id: c.id,
        topic: c.topic,
      })),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Cron] Knowledge refresh failed:", errorMessage);

    return NextResponse.json(
      {
        error: "Refresh failed",
        details: errorMessage,
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
