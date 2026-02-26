/**
 * API Route: On-demand Single Image Generation
 *
 * POST /api/materials/generate-image
 *
 * Premium feature - generates a single image for a specific section.
 * Used when user clicks "Generate illustration" button next to a section heading.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUserAccess } from '@/lib/dal/auth'
import { saveLessonImage } from '@/lib/dal/lesson-images'
import { planSectionImage } from '@/lib/images/planner'
import { executeImagePlan } from '@/lib/images/providers'

export const maxDuration = 120

const requestSchema = z.object({
  chapterId: z.string().uuid(),
  sectionHeading: z.string(),
  sectionContent: z.string().max(5000),
  chapterTitle: z.string(),
  courseTopic: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { chapterId, sectionHeading, sectionContent, chapterTitle, courseTopic } = parsed.data

  // Auth + premium check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const access = await getUserAccess()
  if (access.role !== 'admin') {
    return NextResponse.json({ error: 'Premium feature' }, { status: 403 })
  }

  // Verify user owns this chapter
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select(`
      id,
      level:course_levels!inner (
        course:courses!inner ( user_id )
      )
    `)
    .eq('id', chapterId)
    .single()

  if (chapterError || !chapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  try {
    // AI Planner decides type and prompt
    const plan = await planSectionImage(
      sectionHeading,
      sectionContent,
      chapterTitle,
      courseTopic
    )

    // Execute: generate or search
    const result = await executeImagePlan(plan.imageType, plan.query, plan.altText)

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

    return NextResponse.json({
      id: savedImage.id,
      sectionHeading: savedImage.sectionHeading,
      imageUrl: savedImage.url,
      altText: savedImage.altText,
      imageType: savedImage.imageType,
      provider: savedImage.provider,
      attribution: savedImage.sourceAttribution,
    })
  } catch (error) {
    console.error('[Images] On-demand generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nieznany błąd' },
      { status: 500 }
    )
  }
}
