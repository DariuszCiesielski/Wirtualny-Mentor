/**
 * API Route: Generate Learning Materials
 *
 * POST /api/materials/generate
 *
 * Two-phase generation:
 * 1. Research phase - AI gathers information with web search tools
 * 2. Generation phase - AI creates structured content from gathered sources
 *
 * Typical execution time: 30-90 seconds (depends on web search latency)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText, generateObject, stepCountIs } from 'ai';
import { z } from 'zod';
import { getModel, getModelName } from '@/lib/ai/providers';
import { sectionContentSchema } from '@/lib/ai/materials/schemas';
import { materialGenerationTools, type CollectedSource } from '@/lib/ai/materials/tools';
import {
  RESEARCH_SYSTEM_PROMPT,
  MATERIAL_GENERATION_PROMPT,
  CONTENT_GENERATION_USER_PROMPT,
} from '@/lib/ai/materials/prompts';
import { saveSectionContent } from '@/lib/dal/materials';
import { createClient } from '@/lib/supabase/server';

// Request validation schema
const requestSchema = z.object({
  chapterId: z.string().uuid(),
  chapterTitle: z.string(),
  chapterDescription: z.string(),
  topics: z.array(z.string()),
  courseContext: z.string().optional(),
});

/**
 * Phase 1: Research - gather sources using AI tool calling
 * Uses generateText with stopWhen: stepCountIs(5) for multi-step tool execution
 */
async function runResearchPhase(
  chapterTitle: string,
  chapterDescription: string,
  topics: string[],
  courseContext?: string
): Promise<CollectedSource[]> {
  console.log('[Materials] Starting research phase for:', chapterTitle);

  const researchResult = await generateText({
    model: getModel('curriculum'),
    system: RESEARCH_SYSTEM_PROMPT,
    prompt: `Zbierz informacje do rozdzialu: "${chapterTitle}"
Opis: ${chapterDescription}
Tematy do pokrycia: ${topics.join(', ')}
${courseContext ? `Kontekst kursu: ${courseContext}` : ''}

Wyszukaj:
1. Oficjalna dokumentacje
2. Praktyczne tutoriale
3. Narzedzia i ich linki instalacyjne
4. Przyklady kodu/komend

Uzyj narzedzia searchResources dla kazdego tematu.`,
    tools: materialGenerationTools,
    stopWhen: stepCountIs(5),
  });

  // Collect sources from all tool results across all roundtrips
  const collectedSources: CollectedSource[] = [];

  for (const step of researchResult.steps) {
    for (const toolResult of step.toolResults) {
      // Access the output property for tool results
      const result = toolResult.output as { success?: boolean; sources?: CollectedSource[] };
      if (result && result.success && result.sources) {
        collectedSources.push(...result.sources);
      }
    }
  }

  console.log('[Materials] Research complete, found', collectedSources.length, 'sources');
  return collectedSources;
}

/**
 * Deduplicate and limit sources
 */
function processCollectedSources(sources: CollectedSource[], limit: number = 10): CollectedSource[] {
  // Deduplicate by URL
  const uniqueSources = sources.reduce<CollectedSource[]>((acc, source) => {
    const normalizedUrl = source.url.replace(/\/$/, '').toLowerCase();
    if (!acc.some(s => s.url.replace(/\/$/, '').toLowerCase() === normalizedUrl)) {
      acc.push(source);
    }
    return acc;
  }, []);

  // Limit to prevent context overflow
  return uniqueSources.slice(0, limit);
}

export async function POST(request: NextRequest) {
  try {
    // Validate request
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { chapterId, chapterTitle, chapterDescription, topics, courseContext } = parsed.data;

    // Verify user has access to this chapter
    const supabase = await createClient();
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select(`
        id,
        level:course_levels!inner (
          course:courses!inner (
            user_id
          )
        )
      `)
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: 'Chapter not found or access denied' },
        { status: 404 }
      );
    }

    // Get user from auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Phase 1: Research
    const collectedSources = await runResearchPhase(
      chapterTitle,
      chapterDescription,
      topics,
      courseContext
    );

    const limitedSources = processCollectedSources(collectedSources);

    // Phase 2: Generate structured content
    console.log('[Materials] Starting generation phase with', limitedSources.length, 'sources');

    const contentResult = await generateObject({
      model: getModel('curriculum'),
      schema: sectionContentSchema,
      system: MATERIAL_GENERATION_PROMPT,
      prompt: CONTENT_GENERATION_USER_PROMPT(
        chapterTitle,
        chapterDescription,
        topics,
        limitedSources.map(s => ({
          title: s.title,
          url: s.url,
          content: s.content,
        }))
      ),
    });

    // Prepare sources for storage (transform to Source format)
    const sourcesForStorage = limitedSources.map((s, i) => ({
      id: s.id || `src-${i + 1}`,
      title: s.title,
      url: s.url,
      type: (s.type as 'documentation' | 'article' | 'video' | 'course' | 'official') || 'article',
      accessedAt: new Date().toISOString(),
      snippet: s.content.slice(0, 500),
    }));

    // Get model name for tracking
    const modelName = getModelName('curriculum');

    // Phase 3: Save to database
    const savedContent = await saveSectionContent(
      chapterId,
      {
        content: contentResult.object.content,
        keyConcepts: contentResult.object.keyConcepts,
        practicalSteps: contentResult.object.practicalSteps,
        tools: contentResult.object.tools,
        externalResources: contentResult.object.externalResources,
        sources: sourcesForStorage,
        wordCount: contentResult.object.wordCount,
        estimatedReadingMinutes: contentResult.object.estimatedReadingMinutes,
        language: 'pl',
      },
      modelName,
      contentResult.usage?.totalTokens
    );

    console.log('[Materials] Content saved, version:', savedContent.version);

    return NextResponse.json({
      success: true,
      content: savedContent,
    });

  } catch (error) {
    console.error('[Materials] Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
