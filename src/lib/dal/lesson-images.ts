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
const URL_CACHE_BUFFER = 5 * 60 // 5 minutes before expiry

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
 * Get all images for a chapter with signed URLs (cached in DB)
 *
 * Uses cached signed URLs from DB when still valid (with 5-min buffer).
 * Only generates new signed URLs for expired ones, then fire-and-forget
 * updates the cache so subsequent requests are faster.
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

  const rows = data as LessonImageRow[]
  const now = Date.now()
  const bufferMs = URL_CACHE_BUFFER * 1000

  // Separate rows with valid cached URLs from expired ones
  const expired: { index: number; row: LessonImageRow }[] = []

  const images: LessonImage[] = rows.map((row, i) => {
    const image = transformRow(row)

    const cachedUrl = row.signed_url
    const expiresAt = row.signed_url_expires_at
      ? new Date(row.signed_url_expires_at).getTime()
      : 0

    if (cachedUrl && expiresAt > now + bufferMs) {
      // Cached URL still valid
      return { ...image, url: cachedUrl }
    }

    // Needs refresh
    expired.push({ index: i, row })
    return image
  })

  // If all URLs are cached, return immediately
  if (expired.length === 0) return images

  // Batch generate signed URLs only for expired ones
  const expiredPaths = expired.map(e => e.row.storage_path)
  const { data: signedUrls, error: urlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(expiredPaths, SIGNED_URL_EXPIRY)

  if (urlError) {
    console.warn('[LessonImages] Failed to generate signed URLs:', urlError.message)
    return images // graceful degradation — return images without URLs for expired ones
  }

  const expiresAtIso = new Date(Date.now() + SIGNED_URL_EXPIRY * 1000).toISOString()

  // Attach fresh URLs to images + prepare DB cache updates
  const updates: { id: string; signed_url: string; signed_url_expires_at: string }[] = []

  expired.forEach((entry, j) => {
    const url = signedUrls[j]?.signedUrl
    if (url) {
      images[entry.index] = { ...images[entry.index], url }
      updates.push({
        id: entry.row.id,
        signed_url: url,
        signed_url_expires_at: expiresAtIso,
      })
    }
  })

  // Fire-and-forget: cache new signed URLs in DB (don't block page load)
  if (updates.length > 0) {
    Promise.all(
      updates.map(u =>
        supabase
          .from('lesson_images')
          .update({
            signed_url: u.signed_url,
            signed_url_expires_at: u.signed_url_expires_at,
          })
          .eq('id', u.id)
      )
    ).catch(err => {
      console.warn('[LessonImages] Failed to cache signed URLs in DB:', err)
    })
  }

  return images
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
 * Save a lesson image (upload to Storage + upsert DB record)
 *
 * Uses UPSERT on (chapter_id, section_heading) unique index.
 * If an image already exists for this section, the old file is deleted
 * from Storage before uploading the new one.
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

  // If section heading is set, check for existing image to clean up old file
  let existingId: string | null = null
  let oldStoragePath: string | null = null
  if (params.sectionHeading !== null) {
    const { data: existing } = await supabase
      .from('lesson_images')
      .select('id, storage_path')
      .eq('chapter_id', params.chapterId)
      .eq('section_heading', params.sectionHeading)
      .single()

    if (existing) {
      existingId = existing.id
      oldStoragePath = existing.storage_path
    }
  }

  // Generate unique storage path
  const ext = params.contentType.includes('png') ? 'png'
    : params.contentType.includes('webp') ? 'webp'
    : 'jpg'
  const filename = `${crypto.randomUUID()}.${ext}`
  const storagePath = `${params.userId}/${params.chapterId}/${filename}`

  // Delete old file from Storage (before uploading new one)
  if (oldStoragePath) {
    await supabase.storage.from(BUCKET).remove([oldStoragePath])
  }

  // Upload new file to Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, params.buffer, {
      contentType: params.contentType,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`)
  }

  // Generate signed URL immediately for the new image
  const { data: urlData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

  const signedUrl = urlData?.signedUrl || null
  const signedUrlExpiresAt = signedUrl
    ? new Date(Date.now() + SIGNED_URL_EXPIRY * 1000).toISOString()
    : null

  // Insert or update DB record
  // Cannot use upsert() because Supabase PostgREST doesn't support partial unique indexes.
  // The idx_lesson_images_chapter_section index has WHERE section_heading IS NOT NULL.
  const imageRecord = {
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
    signed_url: signedUrl,
    signed_url_expires_at: signedUrlExpiresAt,
  }

  // Update existing or insert new record
  // Cannot use upsert() — Supabase PostgREST doesn't support partial unique indexes
  let data, error
  if (existingId) {
    // Update existing record by ID
    const result = await supabase
      .from('lesson_images')
      .update(imageRecord)
      .eq('id', existingId)
      .select()
      .single()
    data = result.data
    error = result.error
  } else {
    // Insert new record
    const result = await supabase
      .from('lesson_images')
      .insert(imageRecord)
      .select()
      .single()
    data = result.data
    error = result.error
  }

  if (error) {
    // Cleanup uploaded file on DB error
    await supabase.storage.from(BUCKET).remove([storagePath])
    throw new Error(`Failed to save image record: ${error.message}`)
  }

  const image = transformRow(data as LessonImageRow)
  return { ...image, url: signedUrl || undefined }
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
 * Delete a single lesson image by ID (Storage file + DB record)
 */
export async function deleteLessonImage(imageId: string): Promise<void> {
  const supabase = await createClient()

  const { data: image, error: fetchError } = await supabase
    .from('lesson_images')
    .select('storage_path')
    .eq('id', imageId)
    .single()

  if (fetchError || !image) {
    throw new Error('Image not found')
  }

  await supabase.storage.from(BUCKET).remove([image.storage_path])

  const { error } = await supabase
    .from('lesson_images')
    .delete()
    .eq('id', imageId)

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`)
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
