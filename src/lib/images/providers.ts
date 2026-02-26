/**
 * Image Provider Abstraction
 *
 * Unified interface for AI image generation (kie.ai, DALL-E 3)
 * and stock photo search (Unsplash).
 *
 * Provider priority:
 * - AI generation: kie.ai (primary) -> DALL-E 3 (fallback)
 * - Stock photos: Unsplash
 */

import type { ImageProvider, ImageResult, ImageType } from '@/types/images'
import { generateWithKieAi } from './kie-ai'
import { generateWithDalle } from './dalle'
import { searchUnsplash } from './unsplash'

export interface GenerateOptions {
  size?: '1:1' | '3:2' | '2:3'
}

export interface SearchOptions {
  orientation?: 'landscape' | 'portrait' | 'squarish'
}

/**
 * Generate an AI image with fallback chain: kie.ai -> DALL-E 3
 */
export async function generateAiImage(
  prompt: string,
  options?: GenerateOptions
): Promise<ImageResult> {
  // Try kie.ai first (cheaper)
  if (process.env.KIE_AI_API_KEY) {
    try {
      return await generateWithKieAi(prompt, options)
    } catch (error) {
      console.warn('[Images] kie.ai failed, falling back to DALL-E 3:', error)
    }
  }

  // Fallback to DALL-E 3
  return generateWithDalle(prompt, options)
}

/**
 * Search for a stock photo via Unsplash
 */
export async function searchStockPhoto(
  query: string,
  options?: SearchOptions
): Promise<ImageResult> {
  return searchUnsplash(query, options)
}

/**
 * Execute an image plan item - route to the right provider based on type
 */
export async function executeImagePlan(
  imageType: ImageType,
  query: string,
  altText: string
): Promise<ImageResult> {
  if (imageType === 'stock_photo') {
    const result = await searchStockPhoto(query, { orientation: 'landscape' })
    return { ...result, altText }
  }

  const result = await generateAiImage(query, { size: '3:2' })
  return { ...result, altText }
}

/**
 * Check which providers are configured
 */
export function getAvailableProviders(): {
  kieAi: boolean
  dalle: boolean
  unsplash: boolean
} {
  return {
    kieAi: !!process.env.KIE_AI_API_KEY,
    dalle: !!process.env.OPENAI_API_KEY,
    unsplash: !!process.env.UNSPLASH_ACCESS_KEY,
  }
}
