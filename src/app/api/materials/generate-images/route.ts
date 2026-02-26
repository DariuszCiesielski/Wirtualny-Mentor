/**
 * API Route: Auto-generate Lesson Images (SSE Streaming)
 *
 * POST /api/materials/generate-images
 *
 * Premium feature - generates 1-2 images for a chapter's lesson content.
 * Uses AI Image Planner to decide what to illustrate, then routes to
 * appropriate provider (Unsplash for stock, kie.ai/DALL-E for AI).
 *
 * SSE events:
 * - planning: AI is analyzing the lesson content
 * - generating: image is being generated/searched
 * - image_ready: individual image is ready with URL
 * - complete: all images done
 * - error: something went wrong (non-fatal - lesson still works without images)
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUserAccess } from '@/lib/dal/auth'
import { getSectionContent } from '@/lib/dal/materials'
import { saveLessonImage, hasLessonImages, deleteLessonImages } from '@/lib/dal/lesson-images'
import { planLessonImages } from '@/lib/images/planner'
import { executeImagePlan } from '@/lib/images/providers'

export const maxDuration = 120 // Vercel Pro: up to 300s

const requestSchema = z.object({
  chapterId: z.string().uuid(),
  courseTopic: z.string().optional(),
  force: z.boolean().optional().default(false),
})

type SSEEvent =
  | { event: 'planning'; data: { message: string } }
  | { event: 'generating'; data: { sectionHeading: string; imageType: string; message: string } }
  | { event: 'image_ready'; data: { sectionHeading: string; imageUrl: string; altText: string; imageType: string; attribution: string | null } }
  | { event: 'complete'; data: { imageCount: number } }
  | { event: 'error'; data: { message: string } }

function formatSSE(event: SSEEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { chapterId, courseTopic, force } = parsed.data

  // Auth + premium check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const access = await getUserAccess()
  if (access.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Premium feature' }), { status: 403 })
  }

  // Verify user owns this chapter
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select(`
      id, title,
      level:course_levels!inner (
        course:courses!inner ( user_id, title )
      )
    `)
    .eq('id', chapterId)
    .single()

  if (chapterError || !chapter) {
    return new Response(JSON.stringify({ error: 'Chapter not found' }), { status: 404 })
  }

  // Check if images already exist
  const imagesExist = await hasLessonImages(chapterId)
  if (imagesExist) {
    if (!force) {
      return new Response(
        JSON.stringify({ error: 'Images already exist', code: 'ALREADY_EXISTS' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    }
    // Force mode: delete existing images first
    await deleteLessonImages(chapterId)
  }

  // Get lesson content
  const content = await getSectionContent(chapterId)
  if (!content) {
    return new Response(JSON.stringify({ error: 'No lesson content' }), { status: 404 })
  }

  // Capture abort signal from client (stops polling when SSE connection closes)
  const signal = request.signal

  // Create SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        if (signal.aborted) return
        try {
          controller.enqueue(encoder.encode(formatSSE(event)))
        } catch {
          // Controller may be closed if client disconnected
        }
      }

      try {
        // Phase 1: AI Planner
        send({
          event: 'planning',
          data: { message: 'Analizuję treść lekcji...' },
        })

        if (signal.aborted) { controller.close(); return }

        const chapterTitle = chapter.title as string
        // Supabase returns nested !inner joins as arrays
        const levelData = chapter.level as unknown as Array<{ course: Array<{ title: string }> }>
        const topic = courseTopic || levelData?.[0]?.course?.[0]?.title

        const plans = await planLessonImages(content.content, chapterTitle, topic)

        if (plans.length === 0) {
          send({ event: 'complete', data: { imageCount: 0 } })
          return
        }

        // Phase 2: Execute each plan
        let imageCount = 0

        for (const plan of plans) {
          if (signal.aborted) break

          send({
            event: 'generating',
            data: {
              sectionHeading: plan.sectionHeading,
              imageType: plan.imageType,
              message: plan.imageType === 'stock_photo'
                ? `Szukam zdjęcia: "${plan.query}"...`
                : 'Generuję ilustrację AI...',
            },
          })

          try {
            const result = await executeImagePlan(plan.imageType, plan.query, plan.altText, signal)

            if (signal.aborted) break

            // Save to Storage + DB
            const savedImage = await saveLessonImage({
              chapterId,
              userId: user.id,
              sectionHeading: plan.sectionHeading,
              imageType: plan.imageType,
              provider: result.provider,
              buffer: result.buffer,
              contentType: result.contentType,
              prompt: plan.query,
              altText: plan.altText,
              sourceAttribution: result.attribution,
              width: result.width,
              height: result.height,
            })

            send({
              event: 'image_ready',
              data: {
                sectionHeading: plan.sectionHeading,
                imageUrl: savedImage.url || '',
                altText: plan.altText,
                imageType: plan.imageType,
                attribution: result.attribution || null,
              },
            })

            imageCount++
          } catch (imgError) {
            if (signal.aborted) break
            console.error(`[Images] Failed to generate image for "${plan.sectionHeading}":`, imgError)
            // Continue with other images - non-fatal
            send({
              event: 'error',
              data: {
                message: `Nie udało się wygenerować grafiki dla "${plan.sectionHeading}". Kontynuuję...`,
              },
            })
          }
        }

        if (!signal.aborted) {
          send({ event: 'complete', data: { imageCount } })
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error('[Images] Generation error:', error)
          send({
            event: 'error',
            data: { message: error instanceof Error ? error.message : 'Nieznany błąd' },
          })
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
