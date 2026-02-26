/**
 * API Route: Generate Learning Materials (SSE Streaming)
 *
 * POST /api/materials/generate
 *
 * Uses Server-Sent Events to stream real-time progress:
 * - phase: current generation phase (searching/generating/saving)
 * - progress: detailed progress with sourcesFound, message
 * - complete: final content
 * - error: error message
 *
 * Two-phase generation:
 * 1. Research phase - AI gathers information with web search tools
 * 2. Generation phase - AI creates structured content from gathered sources
 *
 * Typical execution time: 30-90 seconds (depends on web search latency)
 */

import { NextRequest } from 'next/server';
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
import { getSectionContent, saveSectionContent } from '@/lib/dal/materials';
import { createClient } from '@/lib/supabase/server';

// Request validation schema
const requestSchema = z.object({
  chapterId: z.string().uuid(),
  chapterTitle: z.string(),
  chapterDescription: z.string(),
  topics: z.array(z.string()),
  courseContext: z.string().optional(),
  forceRegenerate: z.boolean().optional().default(false),
  regenerationMode: z.enum(['from_scratch', 'from_stage']).optional().default('from_scratch'),
  startStage: z.enum(['searching', 'generating', 'saving']).optional().default('searching'),
  regenerationInstructions: z.string().max(3000).optional().default(''),
});

type GenerationStartStage = 'searching' | 'generating' | 'saving';

// SSE event types
type SSEEvent =
  | { event: 'phase'; data: { phase: 'searching' | 'generating' | 'saving'; message: string } }
  | { event: 'progress'; data: { phase: string; sourcesFound?: number; message: string } }
  | { event: 'complete'; data: { content: unknown } }
  | { event: 'error'; data: { message: string } };

function formatSSE(event: SSEEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

/**
 * Phase 1: Research - gather sources using AI tool calling
 * Uses generateText with stopWhen: stepCountIs(5) for multi-step tool execution
 */
async function runResearchPhase(
  chapterTitle: string,
  chapterDescription: string,
  topics: string[],
  courseContext?: string,
  regenerationInstructions?: string,
  onProgress?: (sourcesFound: number, message: string) => void
): Promise<CollectedSource[]> {
  console.log('[Materials] Starting research phase for:', chapterTitle);

  const researchResult = await generateText({
    model: getModel('curriculum'),
    system: RESEARCH_SYSTEM_PROMPT,
    prompt: `Zbierz informacje do rozdzialu: "${chapterTitle}"
Opis: ${chapterDescription}
Tematy do pokrycia: ${topics.join(', ')}
${courseContext ? `Kontekst kursu: ${courseContext}` : ''}
${regenerationInstructions ? `Dodatkowe wskazowki od uzytkownika (uwzglednij je przy doborze zrodel): ${regenerationInstructions}` : ''}

Wyszukaj:
1. Wiarygodne zrodla na temat
2. Praktyczne poradniki i materialy
3. Przydatne narzedzia i zasoby
4. Przyklady i cwiczenia

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
        const prevCount = collectedSources.length;
        collectedSources.push(...result.sources);
        // Report progress after each tool call
        if (onProgress && collectedSources.length > prevCount) {
          onProgress(
            collectedSources.length,
            `Znaleziono ${collectedSources.length} źródeł...`
          );
        }
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

function buildSourcesFromExistingContent(
  existingContent: NonNullable<Awaited<ReturnType<typeof getSectionContent>>>
): CollectedSource[] {
  return (existingContent.sources || []).map((source, index) => ({
    id: source.id || `prev-src-${index + 1}`,
    title: source.title,
    url: source.url,
    content: source.snippet?.trim() || `${source.title}\nURL: ${source.url}`,
    type: source.type,
  }));
}

export async function POST(request: NextRequest) {
  // Validate request first (before streaming)
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const {
    chapterId,
    chapterTitle,
    chapterDescription,
    topics,
    courseContext,
    forceRegenerate,
    regenerationMode,
    startStage,
    regenerationInstructions,
  } = parsed.data;

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
    return new Response(
      JSON.stringify({ error: 'Chapter not found or access denied' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get user from auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const existingContent = await getSectionContent(chapterId);
  const trimmedInstructions = regenerationInstructions.trim();
  const requestedStartStage: GenerationStartStage =
    regenerationMode === 'from_stage' ? startStage : 'searching';

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        controller.enqueue(encoder.encode(formatSSE(event)));
      };

      try {
        if (!forceRegenerate && existingContent) {
          send({
            event: 'complete',
            data: { content: existingContent },
          });
          return;
        }

        // Clean up old lesson images when content is being regenerated
        if (forceRegenerate) {
          import('@/lib/dal/lesson-images').then(({ deleteLessonImages }) =>
            deleteLessonImages(chapterId).catch((err: unknown) =>
              console.warn('[Materials] Failed to cleanup old images:', err)
            )
          )
        }

        let effectiveStartStage: GenerationStartStage = requestedStartStage;
        const hasExistingContent = !!existingContent;

        if (effectiveStartStage !== 'searching' && !hasExistingContent) {
          effectiveStartStage = 'searching';
          send({
            event: 'progress',
            data: {
              phase: 'searching',
              message: 'Brak poprzedniej wersji - uruchamiam pełne generowanie od etapu wyszukiwania.',
            },
          });
        }

        if (effectiveStartStage === 'saving' && trimmedInstructions) {
          effectiveStartStage = 'generating';
          send({
            event: 'progress',
            data: {
              phase: 'generating',
              message:
                'Wskazowki wymagaja wygenerowania nowej tresci - przechodze do etapu generowania.',
            },
          });
        }

        if (effectiveStartStage === 'saving' && existingContent) {
          send({
            event: 'phase',
            data: { phase: 'saving', message: 'Ponawiam etap zapisu na podstawie poprzedniej wersji...' },
          });

          const duplicatedContent = await saveSectionContent(
            chapterId,
            {
              content: existingContent.content,
              keyConcepts: existingContent.keyConcepts,
              practicalSteps: existingContent.practicalSteps,
              tools: existingContent.tools,
              externalResources: existingContent.externalResources,
              sources: existingContent.sources,
              wordCount: existingContent.wordCount,
              estimatedReadingMinutes: existingContent.estimatedReadingMinutes,
              language: existingContent.language,
            },
            existingContent.generationModel || 'manual-saving-stage-retry'
          );

          send({
            event: 'complete',
            data: { content: duplicatedContent },
          });
          return;
        }

        let limitedSources: CollectedSource[] = [];

        if (effectiveStartStage === 'searching') {
          send({
            event: 'phase',
            data: { phase: 'searching', message: 'Szukam źródeł i dokumentacji...' },
          });

          const collectedSources = await runResearchPhase(
            chapterTitle,
            chapterDescription,
            topics,
            courseContext,
            trimmedInstructions || undefined,
            // Progress callback - send updates as sources are found
            (sourcesFound, message) => {
              send({
                event: 'progress',
                data: { phase: 'searching', sourcesFound, message },
              });
            }
          );

          limitedSources = processCollectedSources(collectedSources);
        } else if (effectiveStartStage === 'generating' && existingContent) {
          limitedSources = processCollectedSources(buildSourcesFromExistingContent(existingContent));
          send({
            event: 'progress',
            data: {
              phase: 'searching',
              sourcesFound: limitedSources.length,
              message: `Uzywam ${limitedSources.length} zrodel z poprzedniej wersji.`,
            },
          });
        }

        if (limitedSources.length === 0) {
          send({
            event: 'phase',
            data: { phase: 'searching', message: 'Nie znaleziono źródeł - próbuję ponownie z web search.' },
          });

          const fallbackSources = await runResearchPhase(
            chapterTitle,
            chapterDescription,
            topics,
            courseContext,
            trimmedInstructions || undefined,
            (sourcesFound, message) => {
              send({
                event: 'progress',
                data: { phase: 'searching', sourcesFound, message },
              });
            }
          );

          limitedSources = processCollectedSources(fallbackSources);
        }

        send({
          event: 'phase',
          data: {
            phase: 'generating',
            message: `Generuję materiały na podstawie ${limitedSources.length} źródeł...`,
          },
        });

        console.log('[Materials] Starting generation phase with', limitedSources.length, 'sources');

        let generationPrompt = CONTENT_GENERATION_USER_PROMPT(
          chapterTitle,
          chapterDescription,
          topics,
          limitedSources.map((s) => ({
            title: s.title,
            url: s.url,
            content: s.content,
          }))
        );

        if (existingContent) {
          generationPrompt += `\n\nFRAGMENT POPRZEDNIEJ WERSJI (uzyj jako kontekst - zachowaj to, co wartosciowe):\n${existingContent.content.slice(0, 5000)}`;
        }

        if (trimmedInstructions) {
          generationPrompt += `\n\nDODATKOWE WSKAZOWKI OD UZYTKOWNIKA (najwyzszy priorytet):\n${trimmedInstructions}`;
        }

        const contentResult = await generateObject({
          model: getModel('curriculum'),
          schema: sectionContentSchema,
          system: MATERIAL_GENERATION_PROMPT,
          prompt: generationPrompt,
        });

        // Prepare sources for storage
        const sourcesForStorage = limitedSources.map((s, i) => ({
          id: s.id || `src-${i + 1}`,
          title: s.title,
          url: s.url,
          type: (s.type as 'documentation' | 'article' | 'video' | 'course' | 'official') || 'article',
          accessedAt: new Date().toISOString(),
          snippet: s.content.slice(0, 500),
        }));

        // Phase 3: Save to database
        send({
          event: 'phase',
          data: { phase: 'saving', message: 'Zapisuję wygenerowane materiały...' },
        });

        const modelName = getModelName('curriculum');
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

        // Send complete event with content
        send({
          event: 'complete',
          data: { content: savedContent },
        });

      } catch (error) {
        console.error('[Materials] Generation error:', error);
        send({
          event: 'error',
          data: { message: error instanceof Error ? error.message : 'Nieznany błąd' },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
