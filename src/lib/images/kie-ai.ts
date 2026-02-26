/**
 * kie.ai Image Provider
 *
 * Async API: submit task -> poll record-info -> download result
 * Model: 4o Image API (GPT-Image-1)
 * Cost: ~$0.03/image
 *
 * @see https://docs.kie.ai/4o-image-api/quickstart
 */

import type { ImageResult } from '@/types/images'
import type { GenerateOptions } from './providers'

const KIE_BASE_URL = 'https://api.kie.ai'
const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 40 // 3s * 40 = 2 minutes max

interface KieGenerateResponse {
  code: number
  msg: string
  data: {
    taskId: string
  }
}

interface KieRecordInfoResponse {
  code: number
  msg: string
  data: {
    taskId: string
    successFlag: 0 | 1 | 2 // 0=in progress, 1=success, 2=failed
    progress: string
    response: {
      result_urls?: string[]
    } | null
    errorMessage: string | null
  }
}

function getApiKey(): string {
  const key = process.env.KIE_AI_API_KEY
  if (!key) throw new Error('[kie.ai] KIE_AI_API_KEY not configured')
  return key
}

function getHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Submit an image generation task to kie.ai
 */
async function submitTask(prompt: string, size: string): Promise<string> {
  const response = await fetch(`${KIE_BASE_URL}/api/v1/gpt4o-image/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      prompt,
      size,
      nVariants: 1,
      isEnhance: false,
      enableFallback: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`[kie.ai] Submit failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as KieGenerateResponse

  if (data.code !== 200) {
    throw new Error(`[kie.ai] Submit error: ${data.msg}`)
  }

  return data.data.taskId
}

/**
 * Poll task status until completion or failure
 */
async function pollUntilComplete(taskId: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    const response = await fetch(
      `${KIE_BASE_URL}/api/v1/gpt4o-image/record-info?taskId=${taskId}`,
      { headers: { Authorization: `Bearer ${getApiKey()}` } }
    )

    if (!response.ok) {
      throw new Error(`[kie.ai] Poll failed: ${response.status}`)
    }

    const data = (await response.json()) as KieRecordInfoResponse

    if (data.data.successFlag === 1) {
      // Success
      const urls = data.data.response?.result_urls
      if (!urls || urls.length === 0) {
        throw new Error('[kie.ai] Task succeeded but no result URLs')
      }
      return urls[0]
    }

    if (data.data.successFlag === 2) {
      // Failed
      throw new Error(`[kie.ai] Task failed: ${data.data.errorMessage || 'Unknown error'}`)
    }

    // Still in progress (successFlag === 0), continue polling
    console.log(`[kie.ai] Polling task ${taskId}, progress: ${data.data.progress}`)
  }

  throw new Error(`[kie.ai] Task ${taskId} timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`)
}

/**
 * Download image from URL and return as buffer
 */
async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`[kie.ai] Download failed: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') || 'image/png'

  return { buffer: Buffer.from(arrayBuffer), contentType }
}

/**
 * Generate an image using kie.ai (4o Image API)
 */
export async function generateWithKieAi(
  prompt: string,
  options?: GenerateOptions
): Promise<ImageResult> {
  const size = options?.size || '3:2'

  console.log(`[kie.ai] Submitting task: "${prompt.slice(0, 80)}..."`)
  const taskId = await submitTask(prompt, size)

  console.log(`[kie.ai] Task submitted: ${taskId}, polling...`)
  const imageUrl = await pollUntilComplete(taskId)

  console.log(`[kie.ai] Downloading image...`)
  const { buffer, contentType } = await downloadImage(imageUrl)

  return {
    buffer,
    contentType,
    altText: '', // Will be set by caller
    provider: 'kie_ai',
  }
}
