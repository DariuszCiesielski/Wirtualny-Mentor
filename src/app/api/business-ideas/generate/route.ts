/**
 * API Route: Generate Business Suggestion
 *
 * POST /api/business-ideas/generate
 *
 * Sync JSON endpoint that generates a personalized business idea
 * based on chapter content and user's business profile.
 * Includes rate limiting (5/day), caching, and force-refresh support.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel, getModelName } from "@/lib/ai/providers";
import {
  generateRequestSchema,
  suggestionOutputSchema,
  computeInputHash,
} from "@/lib/business-ideas/ideas-schema";
import {
  checkDailyLimit,
  getSuggestionWithCacheCheck,
  saveSuggestion,
} from "@/lib/business-ideas/ideas-dal";
import {
  buildSuggestionPrompt,
  PROMPT_VERSION,
} from "@/lib/business-ideas/ideas-prompt";
import { getBusinessProfile } from "@/lib/onboarding/onboarding-dal";

export async function POST(request: NextRequest) {
  // 1. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { chapterId, courseId, content, chapterTitle, courseTopic, force } =
    parsed.data;

  // 2. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Rate limit check
  const limit = await checkDailyLimit(user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Dzisiejszy limit został wykorzystany", remaining: 0 },
      { status: 429 }
    );
  }

  // 4. Cache check (skip if force refresh)
  const profile = await getBusinessProfile();
  const inputHash = await computeInputHash(
    chapterId,
    content,
    profile,
    PROMPT_VERSION
  );
  const profileVersion = profile?.profile_version ?? 0;

  if (!force) {
    const cached = await getSuggestionWithCacheCheck(
      chapterId,
      inputHash,
      profileVersion
    );

    if (cached) {
      return NextResponse.json({
        suggestion: cached,
        remaining: limit.remaining,
      });
    }
  }

  // 5. AI generation
  try {
    const { system, prompt } = buildSuggestionPrompt({
      chapterTitle,
      content,
      courseTopic,
      profile,
    });

    const { object } = await generateObject({
      model: getModel("suggestions"),
      schema: suggestionOutputSchema,
      system,
      prompt,
    });

    // If AI returns empty suggestions (no business potential) — return null without saving
    if (object.suggestions.length === 0) {
      return NextResponse.json({
        suggestion: null,
        remaining: limit.remaining - 1,
      });
    }

    const aiSuggestion = object.suggestions[0];

    // 6. Save to DB (reasoning is AI-internal, not persisted)
    const saved = await saveSuggestion({
      user_id: user.id,
      course_id: courseId,
      chapter_id: chapterId,
      title: aiSuggestion.title,
      description: aiSuggestion.description,
      business_potential: aiSuggestion.business_potential,
      estimated_complexity: aiSuggestion.estimated_complexity,
      relevant_section: aiSuggestion.relevant_section,
      model_name: getModelName("suggestions"),
      input_hash: inputHash,
      profile_version: profileVersion,
    });

    // 7. Return result
    return NextResponse.json({
      suggestion: saved,
      remaining: limit.remaining - 1,
    });
  } catch (error) {
    // AI error — DON'T count toward limit (nothing saved to DB)
    console.error("[Business Ideas] Generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Błąd generowania sugestii",
      },
      { status: 500 }
    );
  }
}
