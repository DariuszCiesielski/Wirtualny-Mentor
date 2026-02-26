/**
 * Unsplash Stock Photo Provider
 *
 * Free API for searching high-quality stock photos.
 * Requires attribution: "Photo by {name} on Unsplash"
 *
 * Rate limits: 50 req/h (demo), 5000 req/h (production)
 * @see https://unsplash.com/documentation
 */

import type { ImageResult } from '@/types/images'
import type { SearchOptions } from './providers'

const UNSPLASH_API_URL = 'https://api.unsplash.com'

interface UnsplashSearchResponse {
  total: number
  total_pages: number
  results: Array<{
    id: string
    width: number
    height: number
    description: string | null
    alt_description: string | null
    urls: {
      raw: string
      full: string
      regular: string // 1080px width
      small: string   // 400px width
      thumb: string   // 200px width
    }
    user: {
      name: string
      username: string
      links: {
        html: string
      }
    }
    links: {
      download_location: string
    }
  }>
}

function getAccessKey(): string {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) throw new Error('[Unsplash] UNSPLASH_ACCESS_KEY not configured')
  return key
}

/**
 * Track download as required by Unsplash API guidelines
 * @see https://unsplash.com/documentation#track-a-photo-download
 */
async function trackDownload(downloadLocation: string): Promise<void> {
  try {
    await fetch(`${downloadLocation}?client_id=${getAccessKey()}`)
  } catch {
    // Non-critical, just log
    console.warn('[Unsplash] Failed to track download')
  }
}

/**
 * Search for a stock photo on Unsplash and download it
 */
export async function searchUnsplash(
  query: string,
  options?: SearchOptions
): Promise<ImageResult> {
  const params = new URLSearchParams({
    query,
    per_page: '1',
    orientation: options?.orientation || 'landscape',
    content_filter: 'high',
    client_id: getAccessKey(),
  })

  console.log(`[Unsplash] Searching: "${query}"`)

  const response = await fetch(`${UNSPLASH_API_URL}/search/photos?${params}`)

  if (!response.ok) {
    throw new Error(`[Unsplash] Search failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as UnsplashSearchResponse

  if (data.results.length === 0) {
    throw new Error(`[Unsplash] No results for query: "${query}"`)
  }

  const photo = data.results[0]

  // Track download (Unsplash API requirement)
  await trackDownload(photo.links.download_location)

  // Download the regular size (1080px width - good balance of quality and size)
  console.log(`[Unsplash] Downloading photo by ${photo.user.name}...`)
  const imageResponse = await fetch(photo.urls.regular)

  if (!imageResponse.ok) {
    throw new Error(`[Unsplash] Download failed: ${imageResponse.status}`)
  }

  const arrayBuffer = await imageResponse.arrayBuffer()
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

  // Attribution required by Unsplash API terms
  const attribution = `Photo by ${photo.user.name} on Unsplash`

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
    altText: photo.alt_description || photo.description || query,
    provider: 'unsplash',
    width: photo.width,
    height: photo.height,
    attribution,
  }
}
