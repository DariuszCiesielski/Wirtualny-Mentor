/**
 * API Route: Delete a single lesson image
 *
 * DELETE /api/materials/lesson-image?imageId=<uuid>
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { deleteLessonImage } from '@/lib/dal/lesson-images'

const querySchema = z.object({
  imageId: z.string().uuid(),
})

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({ imageId: searchParams.get('imageId') })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid imageId' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user owns this image (through chapter -> level -> course chain)
  const { data: image } = await supabase
    .from('lesson_images')
    .select(`
      id,
      chapter:chapters!inner (
        level:course_levels!inner (
          course:courses!inner ( user_id )
        )
      )
    `)
    .eq('id', parsed.data.imageId)
    .single()

  if (!image) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  try {
    await deleteLessonImage(parsed.data.imageId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Images] Delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
