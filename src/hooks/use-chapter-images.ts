'use client'

/**
 * Hook: Chapter Images
 *
 * Manages lesson images for a chapter:
 * - Loads existing images from DB
 * - Auto-triggers generation for premium users (if no images exist)
 * - SSE listener for auto-generation progress
 * - On-demand generation per section
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { LessonImage } from '@/types/images'

interface ImagesBySection {
  [sectionHeading: string]: LessonImage
}

interface GeneratingSection {
  sectionHeading: string
  message: string
}

interface UseChapterImagesReturn {
  images: ImagesBySection
  isAutoGenerating: boolean
  generatingSection: GeneratingSection | null
  generateImage: (sectionHeading: string, sectionContent: string, chapterTitle: string, courseTopic?: string) => Promise<void>
  deleteImage: (sectionHeading: string, imageId: string) => Promise<void>
  generatingSections: Set<string>
  deletingSections: Set<string>
}

export function useChapterImages(
  chapterId: string,
  canGenerate: boolean,
  initialImages?: ImagesBySection,
  courseTopic?: string,
): UseChapterImagesReturn {
  const [images, setImages] = useState<ImagesBySection>(initialImages || {})
  const [isAutoGenerating, setIsAutoGenerating] = useState(false)
  const [generatingSection, setGeneratingSection] = useState<GeneratingSection | null>(null)
  const [generatingSections, setGeneratingSections] = useState<Set<string>>(new Set())
  const [deletingSections, setDeletingSections] = useState<Set<string>>(new Set())
  const autoGenerationAttempted = useRef(false)
  const hasInitialImages = useRef(Object.keys(initialImages || {}).length > 0)

  // Auto-generate images after lesson loads (premium only, once)
  useEffect(() => {
    if (!canGenerate || autoGenerationAttempted.current) return
    if (hasInitialImages.current) return // Already have images from server
    autoGenerationAttempted.current = true

    const controller = new AbortController()

    async function autoGenerate() {
      setIsAutoGenerating(true)

      try {
        const response = await fetch('/api/materials/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapterId, courseTopic }),
          signal: controller.signal,
        })

        if (!response.ok) {
          // 409 = already exists, 403 = not premium — both are fine
          if (response.status === 409 || response.status === 403) return
          console.error('[useChapterImages] Auto-generation failed:', response.status)
          return
        }

        const reader = response.body?.getReader()
        if (!reader) return

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          let eventType = ''
          let eventData = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7)
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6)
            } else if (line === '' && eventType && eventData) {
              try {
                const parsed = JSON.parse(eventData)

                switch (eventType) {
                  case 'planning':
                    setGeneratingSection({
                      sectionHeading: '',
                      message: parsed.message,
                    })
                    break
                  case 'generating':
                    setGeneratingSection({
                      sectionHeading: parsed.sectionHeading,
                      message: parsed.message,
                    })
                    break
                  case 'image_ready':
                    setImages((prev) => ({
                      ...prev,
                      [parsed.sectionHeading]: {
                        id: parsed.id || '',
                        chapterId,
                        sectionHeading: parsed.sectionHeading,
                        imageType: parsed.imageType,
                        provider: parsed.provider || 'unsplash',
                        storagePath: '',
                        prompt: null,
                        altText: parsed.altText,
                        sourceAttribution: parsed.attribution,
                        width: null,
                        height: null,
                        createdAt: new Date().toISOString(),
                        url: parsed.imageUrl,
                      },
                    }))
                    break
                  case 'complete':
                    setGeneratingSection(null)
                    break
                  case 'error':
                    console.warn('[useChapterImages] Non-fatal error:', parsed.message)
                    break
                }
              } catch {
                // Parse error, skip
              }
              eventType = ''
              eventData = ''
            }
          }
        }
      } catch (err) {
        // Ignore abort errors (Strict Mode double-mount, navigation, etc.)
        const isAbort = (err as Error).name === 'AbortError'
          || controller.signal.aborted
        if (!isAbort) {
          console.error('[useChapterImages] Auto-generation error:', err)
        }
      } finally {
        setIsAutoGenerating(false)
        setGeneratingSection(null)
      }
    }

    void autoGenerate()

    return () => {
      controller.abort()
      // Reset so Strict Mode re-mount can retry
      autoGenerationAttempted.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, canGenerate])

  // On-demand image generation for a specific section
  const generateImage = useCallback(
    async (
      sectionHeading: string,
      sectionContent: string,
      chapterTitle: string,
      topic?: string,
    ) => {
      setGeneratingSections((prev) => new Set(prev).add(sectionHeading))

      try {
        const response = await fetch('/api/materials/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapterId,
            sectionHeading,
            sectionContent,
            chapterTitle,
            courseTopic: topic || courseTopic,
          }),
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || 'Failed to generate image')
        }

        const result = await response.json()

        setImages((prev) => ({
          ...prev,
          [sectionHeading]: {
            id: result.id,
            chapterId,
            sectionHeading: result.sectionHeading,
            imageType: result.imageType,
            provider: result.provider,
            storagePath: '',
            prompt: null,
            altText: result.altText,
            sourceAttribution: result.attribution,
            width: null,
            height: null,
            createdAt: new Date().toISOString(),
            url: result.imageUrl,
          },
        }))
      } catch (err) {
        console.error(`[useChapterImages] On-demand error for "${sectionHeading}":`, err)
        throw err
      } finally {
        setGeneratingSections((prev) => {
          const next = new Set(prev)
          next.delete(sectionHeading)
          return next
        })
      }
    },
    [chapterId, courseTopic]
  )

  // Delete an image for a specific section
  const deleteImage = useCallback(
    async (sectionHeading: string, imageId: string) => {
      setDeletingSections((prev) => new Set(prev).add(sectionHeading))

      try {
        const response = await fetch(`/api/materials/lesson-image?imageId=${imageId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || 'Failed to delete image')
        }

        setImages((prev) => {
          const next = { ...prev }
          delete next[sectionHeading]
          return next
        })
      } catch (err) {
        console.error(`[useChapterImages] Delete error for "${sectionHeading}":`, err)
        throw err
      } finally {
        setDeletingSections((prev) => {
          const next = new Set(prev)
          next.delete(sectionHeading)
          return next
        })
      }
    },
    []
  )

  return {
    images,
    isAutoGenerating,
    generatingSection,
    generateImage,
    deleteImage,
    generatingSections,
    deletingSections,
  }
}
