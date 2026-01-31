/**
 * API Route: Submit Quiz Answers
 *
 * POST /api/quiz/submit
 *
 * Submits user answers and calculates score server-side.
 * This is the anti-cheat pattern - correct answers never sent to client.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getQuiz, createAttempt, submitAttempt, unlockLevel } from "@/lib/dal/quizzes";
import { getUser } from "@/lib/dal/auth";

// Request validation schema
const requestSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.record(z.string(), z.string()), // questionId -> optionId
});

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { quizId, answers } = parsed.data;

    // 3. Get quiz
    const quiz = await getQuiz(quizId);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // 4. Create attempt and calculate score
    const attempt = await createAttempt(user.id, quizId);
    const { attempt: finalAttempt, results } = await submitAttempt(
      attempt.id,
      answers,
      quiz
    );

    // 5. If level test passed, unlock next level
    if (quiz.quizType === "level_test" && results.passed && quiz.levelId) {
      await unlockLevel(user.id, quiz.levelId, "test_passed", finalAttempt.id);
      console.log("[Quiz] Level unlocked:", quiz.levelId);
    }

    console.log(
      "[Quiz] Attempt submitted, score:",
      results.score.toFixed(1),
      "%",
      results.passed ? "(PASSED)" : "(FAILED)"
    );

    // 6. Return results with explanations
    // Note: We return explanations for learning purposes,
    // but correct answers are only revealed AFTER submission
    return NextResponse.json({
      attempt: finalAttempt,
      results,
    });
  } catch (error) {
    console.error("[Quiz] Submit error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit quiz",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
