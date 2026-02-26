/**
 * kie.ai Image Provider
 *
 * Two-tier model with internal fallback:
 * 1. Nano Banana Pro (Gemini 3.0 Pro) — $0.09-0.12/image, 4K, best quality
 * 2. 4o Image (GPT-Image-1) — $0.03/image, good quality fallback
 *
 * Both use async task API: submit → poll → download
 *
 * @see https://docs.kie.ai/market/google/pro-image-to-image
 * @see https://docs.kie.ai/4o-image-api/quickstart
 */

import type { ImageResult } from '@/types/images'
import type { GenerateOptions } from './providers'

const KIE_BASE_URL = 'https://api.kie.ai'
const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 40 // 3s * 40 = 2 minutes max

// --- Unified Jobs API types (Nano Banana Pro) ---

interface JobsCreateResponse {
  code: number
  msg: string
  data: {
    taskId: string
  }
}

interface JobsRecordInfoResponse {
  code: number
  message: string
  data: {
    taskId: string
    model: string
    state: 'waiting' | 'queuing' | 'generating' | 'success' | 'fail'
    resultJson: string | null // JSON string with { resultUrls: string[] }
    failCode: string
    failMsg: string
    costTime: number
    progress: number
  }
}

// --- 4o Image API types (legacy) ---

interface Gpt4oGenerateResponse {
  code: number
  msg: string
  data: {
    taskId: string
  }
}

interface Gpt4oRecordInfoResponse {
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
 * Map our size format to Nano Banana Pro aspect_ratio
 */
function toAspectRatio(size?: string): string {
  switch (size) {
    case '1:1': return '1:1'
    case '2:3': return '2:3'
    case '3:2':
    default: return '3:2'
  }
}

// =============================================================================
// Nano Banana Pro (Gemini 3.0 Pro) — Primary
// =============================================================================

async function submitNanoBananaPro(prompt: string, size: string): Promise<string> {
  const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: 'nano-banana-pro',
      input: {
        prompt,
        aspect_ratio: toAspectRatio(size),
        resolution: '2K', // Good balance of quality vs cost ($0.09 vs $0.12 for 4K)
        output_format: 'png',
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`[kie.ai/nano-banana-pro] Submit failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as JobsCreateResponse

  if (data.code !== 200) {
    throw new Error(`[kie.ai/nano-banana-pro] Submit error: ${data.msg}`)
  }

  return data.data.taskId
}

async function pollJobsUntilComplete(taskId: string, model: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    const response = await fetch(
      `${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`,
      { headers: { Authorization: `Bearer ${getApiKey()}` } }
    )

    if (!response.ok) {
      throw new Error(`[kie.ai/${model}] Poll failed: ${response.status}`)
    }

    const data = (await response.json()) as JobsRecordInfoResponse

    if (data.data.state === 'success') {
      if (!data.data.resultJson) {
        throw new Error(`[kie.ai/${model}] Task succeeded but no resultJson`)
      }
      const result = JSON.parse(data.data.resultJson) as { resultUrls?: string[] }
      const urls = result.resultUrls
      if (!urls || urls.length === 0) {
        throw new Error(`[kie.ai/${model}] Task succeeded but no result URLs`)
      }
      return urls[0]
    }

    if (data.data.state === 'fail') {
      throw new Error(`[kie.ai/${model}] Task failed: ${data.data.failMsg || 'Unknown error'}`)
    }

    // waiting | queuing | generating — continue polling
    console.log(`[kie.ai/${model}] Polling ${taskId}: ${data.data.state} (${data.data.progress}%)`)
  }

  throw new Error(`[kie.ai/${model}] Task ${taskId} timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`)
}

async function generateWithNanaBananaPro(
  prompt: string,
  options?: GenerateOptions
): Promise<ImageResult> {
  const size = options?.size || '3:2'

  console.log(`[kie.ai/nano-banana-pro] Submitting: "${prompt.slice(0, 80)}..."`)
  const taskId = await submitNanoBananaPro(prompt, size)

  console.log(`[kie.ai/nano-banana-pro] Task ${taskId}, polling...`)
  const imageUrl = await pollJobsUntilComplete(taskId, 'nano-banana-pro')

  console.log(`[kie.ai/nano-banana-pro] Downloading image...`)
  const { buffer, contentType } = await downloadImage(imageUrl)

  return {
    buffer,
    contentType,
    altText: '', // Will be set by caller
    provider: 'kie_ai',
  }
}

// =============================================================================
// 4o Image (GPT-Image-1) — Fallback
// =============================================================================

async function submitGpt4oTask(prompt: string, size: string): Promise<string> {
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
    throw new Error(`[kie.ai/4o-image] Submit failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as Gpt4oGenerateResponse

  if (data.code !== 200) {
    throw new Error(`[kie.ai/4o-image] Submit error: ${data.msg}`)
  }

  return data.data.taskId
}

async function pollGpt4oUntilComplete(taskId: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    const response = await fetch(
      `${KIE_BASE_URL}/api/v1/gpt4o-image/record-info?taskId=${taskId}`,
      { headers: { Authorization: `Bearer ${getApiKey()}` } }
    )

    if (!response.ok) {
      throw new Error(`[kie.ai/4o-image] Poll failed: ${response.status}`)
    }

    const data = (await response.json()) as Gpt4oRecordInfoResponse

    if (data.data.successFlag === 1) {
      const urls = data.data.response?.result_urls
      if (!urls || urls.length === 0) {
        throw new Error('[kie.ai/4o-image] Task succeeded but no result URLs')
      }
      return urls[0]
    }

    if (data.data.successFlag === 2) {
      throw new Error(`[kie.ai/4o-image] Task failed: ${data.data.errorMessage || 'Unknown error'}`)
    }

    console.log(`[kie.ai/4o-image] Polling ${taskId}: ${data.data.progress}`)
  }

  throw new Error(`[kie.ai/4o-image] Task ${taskId} timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`)
}

async function generateWithGpt4oImage(
  prompt: string,
  options?: GenerateOptions
): Promise<ImageResult> {
  const size = options?.size || '3:2'

  console.log(`[kie.ai/4o-image] Submitting: "${prompt.slice(0, 80)}..."`)
  const taskId = await submitGpt4oTask(prompt, size)

  console.log(`[kie.ai/4o-image] Task ${taskId}, polling...`)
  const imageUrl = await pollGpt4oUntilComplete(taskId)

  console.log(`[kie.ai/4o-image] Downloading image...`)
  const { buffer, contentType } = await downloadImage(imageUrl)

  return {
    buffer,
    contentType,
    altText: '',
    provider: 'kie_ai',
  }
}

// =============================================================================
// Shared utilities
// =============================================================================

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`[kie.ai] Download failed: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') || 'image/png'

  return { buffer: Buffer.from(arrayBuffer), contentType }
}

// =============================================================================
// Public API — Nano Banana Pro (primary) → 4o Image (fallback)
// =============================================================================

/**
 * Generate an image using kie.ai with internal fallback:
 * 1. Nano Banana Pro (Gemini 3.0 Pro, ~$0.09/image, best quality)
 * 2. 4o Image (GPT-Image-1, ~$0.03/image, good quality)
 */
export async function generateWithKieAi(
  prompt: string,
  options?: GenerateOptions
): Promise<ImageResult> {
  // Try Nano Banana Pro first (highest quality)
  try {
    return await generateWithNanaBananaPro(prompt, options)
  } catch (error) {
    console.warn('[kie.ai] Nano Banana Pro failed, falling back to 4o Image:', error)
  }

  // Fallback to 4o Image
  return generateWithGpt4oImage(prompt, options)
}
