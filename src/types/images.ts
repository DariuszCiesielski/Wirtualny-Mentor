/**
 * Lesson Images Types
 *
 * Types for AI-generated and stock photo images in lessons.
 * Part of the premium image generation feature.
 */

export type ImageType = 'ai_generated' | 'stock_photo'
export type ImageProvider = 'kie_ai' | 'dalle3' | 'unsplash'

/**
 * Database row shape (snake_case) from lesson_images table
 */
export interface LessonImageRow {
  id: string
  chapter_id: string
  section_heading: string | null
  image_type: ImageType
  provider: ImageProvider
  storage_path: string
  prompt: string | null
  alt_text: string
  source_attribution: string | null
  width: number | null
  height: number | null
  created_at: string
}

/**
 * Frontend shape (camelCase) for lesson images
 */
export interface LessonImage {
  id: string
  chapterId: string
  sectionHeading: string | null
  imageType: ImageType
  provider: ImageProvider
  storagePath: string
  prompt: string | null
  altText: string
  sourceAttribution: string | null
  width: number | null
  height: number | null
  createdAt: string
  url?: string // Signed URL (populated on read)
}

/**
 * Output from AI Image Planner - decides what to illustrate and how
 */
export interface ImagePlan {
  sectionHeading: string
  imageType: ImageType
  query: string // search query (stock) or generation prompt (AI)
  altText: string
  reasoning: string
}

/**
 * Result from image provider (generation or search)
 */
export interface ImageResult {
  buffer: Buffer
  contentType: string
  altText: string
  provider: ImageProvider
  width?: number
  height?: number
  attribution?: string // "Photo by X on Unsplash"
}
