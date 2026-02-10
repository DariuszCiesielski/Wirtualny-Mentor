/**
 * API Route: Generate Remediation Content
 *
 * POST /api/quiz/remediation
 *
 * Generates AI-powered remediation content for questions the user got wrong.
 * Helps the user understand their mistakes and prepare for a retry.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/ai/providers";
import { remediationSchema } from "@/lib/ai/quiz/schemas";
import { REMEDIATION_PROMPT } from "@/lib/ai/quiz/prompts";
import { getQuiz, saveRemediation } from "@/lib/dal/quizzes";
import { getSectionContent } from "@/lib/dal/materials";
import { getUser } from "@/lib/dal/auth";

// Request validation schema
const requestSchema = z.object({
  attemptId: z.string().uuid(),
  quizId: z.string().uuid(),
  wrongQuestionIds: z.array(z.string()),
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
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { attemptId, quizId, wrongQuestionIds } = parsed.data;

  try {
    // Get quiz and wrong questions
    const quiz = await getQuiz(quizId);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const wrongQuestions = quiz.questions.filter((q) =>
      wrongQuestionIds.includes(q.id)
    );

    if (wrongQuestions.length === 0) {
      return NextResponse.json(
        { error: "No wrong questions provided" },
        { status: 400 }
      );
    }

    // Get chapter content for context (if section quiz)
    let chapterContent = "";
    if (quiz.chapterId) {
      const content = await getSectionContent(quiz.chapterId);
      chapterContent = content?.content?.slice(0, 2000) ?? "";
    }

    // Generate remediation content
    const { object } = await generateObject({
      model: getModel("curriculum"),
      schema: remediationSchema,
      system: REMEDIATION_PROMPT,
      prompt: `Uzytkownik odpowiedzial blednie na te pytania:

${wrongQuestions
  .map(
    (q) => `
Pytanie: ${q.question}
Bledna odpowiedz: ${q.wrongExplanations[0]?.explanation || "brak wyjasnienia"}
Poprawna odpowiedz: ${q.explanation}
Koncept: ${q.relatedConcept || "nie podano"}
`
  )
  .join("\n")}

${chapterContent ? `Kontekst rozdzialu:\n${chapterContent}` : ""}

Przygotuj krotki material remediacyjny.`,
    });

    // Save remediation to attempt
    await saveRemediation(attemptId, object);

    console.log(
      "[Remediation] Generated for",
      wrongQuestions.length,
      "wrong questions"
    );

    return NextResponse.json({ remediation: object });
  } catch (error) {
    console.error("[Remediation] Generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate remediation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
