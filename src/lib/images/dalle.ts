/**
 * DALL-E 3 Image Provider (OpenAI)
 *
 * Synchronous API via OpenAI images endpoint.
 * Cost: ~$0.04 (standard) / ~$0.08 (hd) per image.
 * Used as fallback when kie.ai is unavailable.
 */

import type { ImageResult } from '@/types/images'
import type { GenerateOptions } from './providers'

const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations'

interface DalleResponse {
  data: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
}

// Map aspect ratios to DALL-E supported sizes
function mapSize(size?: string): '1024x1024' | '1792x1024' | '1024x1792' {
  switch (size) {
    case '3:2':
      return '1792x1024' // landscape
    case '2:3':
      return '1024x1792' // portrait
    default:
      return '1024x1024' // square
  }
}

/**
 * Generate an image using OpenAI DALL-E 3
 */
export async function generateWithDalle(
  prompt: string,
  options?: GenerateOptions
): Promise<ImageResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('[DALL-E] OPENAI_API_KEY not configured')

  const size = mapSize(options?.size)

  console.log(`[DALL-E] Generating: "${prompt.slice(0, 80)}..."`)

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      size,
      quality: 'standard',
      n: 1,
      response_format: 'url',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`[DALL-E] Generation failed: ${response.status} - ${error}`)
  }

  const data = (await response.json()) as DalleResponse
  const imageUrl = data.data[0]?.url

  if (!imageUrl) {
    throw new Error('[DALL-E] No image URL in response')
  }

  // Download the image (OpenAI URLs expire after ~1 hour)
  console.log('[DALL-E] Downloading generated image...')
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error(`[DALL-E] Download failed: ${imageResponse.status}`)
  }

  const arrayBuffer = await imageResponse.arrayBuffer()
  const contentType = imageResponse.headers.get('content-type') || 'image/png'

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
    altText: '',
    provider: 'dalle3',
  }
}
