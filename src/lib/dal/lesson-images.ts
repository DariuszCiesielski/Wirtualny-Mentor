/**
 * Data Access Layer - Lesson Images
 *
 * CRUD operations for AI-generated and stock photo images in lessons.
 * Images stored in Supabase Storage (lesson-images bucket), metadata in DB.
 */

import { createClient } from '@/lib/supabase/server'
import type { LessonImage, LessonImageRow, ImageProvider, ImageType } from '@/types/images'

const BUCKET = 'lesson-images'
const SIGNED_URL_EXPIRY = 3600 // 1 hour

/**
 * Transform database row to frontend type (snake_case -> camelCase)
 */
function transformRow(row: LessonImageRow): LessonImage {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    sectionHeading: row.section_heading,
    imageType: row.image_type as ImageType,
    provider: row.provider as ImageProvider,
    storagePath: row.storage_path,
    prompt: row.prompt,
    altText: row.alt_text,
    sourceAttribution: row.source_attribution,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
  }
}

/**
 * Get all images for a chapter with signed URLs
 */
export async function getLessonImages(
  chapterId: string
): Promise<LessonImage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lesson_images')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to get lesson images: ${error.message}`)
  }

  if (!data || data.length === 0) return []

  // Generate signed URLs for all images
  const images = (data as LessonImageRow[]).map(transformRow)

  const paths = images.map(img => img.storagePath)
  const { data: signedUrls, error: urlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_EXPIRY)

  if (urlError) {
    console.warn('[LessonImages] Failed to generate signed URLs:', urlError.message)
    return images
  }

  // Attach signed URLs to images
  return images.map((img, i) => ({
    ...img,
    url: signedUrls[i]?.signedUrl || undefined,
  }))
}

/**
 * Get images as a map keyed by section heading
 */
export async function getLessonImagesBySection(
  chapterId: string
): Promise<Record<string, LessonImage>> {
  const images = await getLessonImages(chapterId)
  const map: Record<string, LessonImage> = {}

  for (const img of images) {
    if (img.sectionHeading) {
      map[img.sectionHeading] = img
    }
  }

  return map
}

/**
 * Save a lesson image (upload to Storage + insert DB record)
 */
export async function saveLessonImage(params: {
  chapterId: string
  userId: string
  sectionHeading: string | null
  imageType: ImageType
  provider: ImageProvider
  buffer: Buffer
  contentType: string
  prompt: string | null
  altText: string
  sourceAttribution?: string | null
  width?: number | null
  height?: number | null
}): Promise<LessonImage> {
  const supabase = await createClient()

  // Generate unique storage path
  const ext = params.contentType.includes('png') ? 'png'
    : params.contentType.includes('webp') ? 'webp'
    : 'jpg'
  const filename = `${crypto.randomUUID()}.${ext}`
  const storagePath = `${params.userId}/${params.chapterId}/${filename}`

  // Upload to Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, params.buffer, {
      contentType: params.contentType,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`)
  }

  // Insert DB record
  const { data, error } = await supabase
    .from('lesson_images')
    .insert({
      chapter_id: params.chapterId,
      section_heading: params.sectionHeading,
      image_type: params.imageType,
      provider: params.provider,
      storage_path: storagePath,
      prompt: params.prompt,
      alt_text: params.altText,
      source_attribution: params.sourceAttribution || null,
      width: params.width || null,
      height: params.height || null,
    })
    .select()
    .single()

  if (error) {
    // Cleanup uploaded file on DB error
    await supabase.storage.from(BUCKET).remove([storagePath])
    throw new Error(`Failed to save image record: ${error.message}`)
  }

  // Generate signed URL for the new image
  const { data: urlData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

  const image = transformRow(data as LessonImageRow)
  return { ...image, url: urlData?.signedUrl || undefined }
}

/**
 * Delete all images for a chapter (cleanup for regeneration)
 */
export async function deleteLessonImages(chapterId: string): Promise<void> {
  const supabase = await createClient()

  // Get storage paths before deleting records
  const { data: images } = await supabase
    .from('lesson_images')
    .select('storage_path')
    .eq('chapter_id', chapterId)

  if (images && images.length > 0) {
    // Delete from Storage
    const paths = images.map(img => img.storage_path)
    await supabase.storage.from(BUCKET).remove(paths)
  }

  // Delete DB records
  const { error } = await supabase
    .from('lesson_images')
    .delete()
    .eq('chapter_id', chapterId)

  if (error) {
    throw new Error(`Failed to delete lesson images: ${error.message}`)
  }
}

/**
 * Check if images exist for a chapter (without fetching full data)
 */
export async function hasLessonImages(chapterId: string): Promise<boolean> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('lesson_images')
    .select('id', { count: 'exact', head: true })
    .eq('chapter_id', chapterId)

  if (error) {
    throw new Error(`Failed to check images: ${error.message}`)
  }

  return (count ?? 0) > 0
}
