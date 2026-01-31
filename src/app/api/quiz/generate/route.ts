/**
 * API Route: Generate Quiz
 *
 * POST /api/quiz/generate
 *
 * Lazy generation pattern - returns cached quiz if exists,
 * otherwise generates new quiz using AI.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getModel, getModelName } from "@/lib/ai/providers";
import { quizSchema, levelTestSchema } from "@/lib/ai/quiz/schemas";
import {
  QUIZ_GENERATION_PROMPT,
  LEVEL_TEST_PROMPT,
  QUIZ_GENERATION_USER_PROMPT,
  LEVEL_TEST_USER_PROMPT,
} from "@/lib/ai/quiz/prompts";
import {
  saveQuiz,
  getQuizByChapter,
  getLevelTest,
} from "@/lib/dal/quizzes";
import { getSectionContent } from "@/lib/dal/materials";
import { getUser } from "@/lib/dal/auth";
import { createClient } from "@/lib/supabase/server";

// Request validation schema
const requestSchema = z
  .object({
    chapterId: z.string().uuid().optional(),
    levelId: z.string().uuid().optional(),
    courseId: z.string().uuid(),
    forceRegenerate: z.boolean().optional().default(false),
  })
  .refine((data) => data.chapterId || data.levelId, {
    message: "Either chapterId or levelId required",
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

    const { chapterId, levelId, courseId, forceRegenerate } = parsed.data;
    const isLevelTest = !!levelId;

    // 3. Verify user owns the course
    const supabase = await createClient();
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, user_id")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    if (course.user_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // 4. Check for existing quiz (lazy generation)
    if (!forceRegenerate) {
      const existing = isLevelTest
        ? await getLevelTest(levelId!)
        : await getQuizByChapter(chapterId!);
      if (existing) {
        return NextResponse.json({ quiz: existing, cached: true });
      }
    }

    // 5. Get context for generation
    let generationPrompt: string;
    let schema: typeof quizSchema | typeof levelTestSchema;
    let systemPrompt: string;

    if (isLevelTest) {
      // Get level info and all chapters
      const { data: level } = await supabase
        .from("course_levels")
        .select(`
          id,
          name,
          description,
          chapters (
            id,
            title,
            topics
          )
        `)
        .eq("id", levelId!)
        .single();

      if (!level) {
        return NextResponse.json(
          { error: "Level not found" },
          { status: 404 }
        );
      }

      schema = levelTestSchema;
      systemPrompt = LEVEL_TEST_PROMPT;
      generationPrompt = LEVEL_TEST_USER_PROMPT(
        level.name,
        level.description || "",
        course.title,
        (level.chapters || []).map((ch: { title: string; topics: string[] }) => ({
          title: ch.title,
          topics: ch.topics || [],
        }))
      );
    } else {
      // Get chapter info and content if available
      const { data: chapter } = await supabase
        .from("chapters")
        .select(`
          id,
          title,
          description,
          topics,
          level:course_levels!inner (
            id,
            name
          )
        `)
        .eq("id", chapterId!)
        .single();

      if (!chapter) {
        return NextResponse.json(
          { error: "Chapter not found" },
          { status: 404 }
        );
      }

      // Try to get section content for better quiz context
      const sectionContent = await getSectionContent(chapterId!);

      schema = quizSchema;
      systemPrompt = QUIZ_GENERATION_PROMPT;
      generationPrompt = QUIZ_GENERATION_USER_PROMPT(
        chapter.title,
        chapter.description || "",
        chapter.topics || [],
        sectionContent?.content
      );
    }

    // 6. Generate quiz with AI
    console.log("[Quiz] Generating", isLevelTest ? "level test" : "section quiz");

    const { object } = await generateObject({
      model: getModel("quiz"),
      schema,
      system: systemPrompt,
      prompt: generationPrompt,
    });

    // 7. Save to database
    const modelName = getModelName("quiz");

    const savedQuiz = await saveQuiz({
      chapterId: isLevelTest ? undefined : chapterId,
      levelId: isLevelTest ? levelId : undefined,
      quizType: isLevelTest ? "level_test" : "section",
      questions: object.questions,
      questionCount: object.questions.length,
      estimatedMinutes: object.estimatedMinutes,
      generationModel: modelName,
    });

    console.log("[Quiz] Saved quiz, version:", savedQuiz.version);

    return NextResponse.json({ quiz: savedQuiz, cached: false });
  } catch (error) {
    console.error("[Quiz] Generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate quiz",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
