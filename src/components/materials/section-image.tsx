'use client'

/**
 * Section Image Component
 *
 * Displays a lesson illustration with:
 * - Alt text for accessibility
 * - Unsplash attribution badge when applicable
 * - Skeleton loader during generation
 * - Click to expand (lightbox with Radix Dialog)
 */

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { X, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_WIDTH = 1024
const DEFAULT_HEIGHT = 576
const SWIPE_THRESHOLD = 100

interface SectionImageProps {
  url: string
  altText: string
  attribution?: string | null
  className?: string
  onDelete?: () => void
  isDeleting?: boolean
  width?: number | null
  height?: number | null
}

export function SectionImage({ url, altText, attribution, className, onDelete, isDeleting, width, height }: SectionImageProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <>
      <figure
        className={cn(
          'not-prose my-6 overflow-hidden rounded-lg border border-border bg-muted/30',
          className
        )}
      >
        <div className="relative cursor-zoom-in" onClick={() => setIsExpanded(true)}>
          {!isLoaded && (
            <div className="h-48 sm:h-64 w-full animate-pulse bg-muted" />
          )}
          <Image
            src={url}
            alt={altText}
            width={width || DEFAULT_WIDTH}
            height={height || DEFAULT_HEIGHT}
            className={cn(
              'w-full object-cover transition-opacity',
              isLoaded ? 'opacity-100' : 'opacity-0 h-0'
            )}
            onLoad={() => setIsLoaded(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 700px"
          />
        </div>

        {/* Alt text + attribution + delete */}
        <figcaption className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground">
          <span>{altText}</span>
          <div className="flex items-center gap-2 shrink-0">
            {attribution && (
              <span className="text-[10px] opacity-70">{attribution}</span>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="shrink-0 rounded p-1 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                title="Usuń grafikę"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </figcaption>
      </figure>

      {/* Lightbox — Radix Dialog for accessibility (Escape, focus trap, body scroll lock) */}
      <ImageLightbox
        open={isExpanded}
        onOpenChange={setIsExpanded}
        url={url}
        altText={altText}
        width={width}
        height={height}
        attribution={attribution}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// ImageLightbox — Radix Dialog primitives + swipe-to-close
// ---------------------------------------------------------------------------

function ImageLightbox({
  open,
  onOpenChange,
  url,
  altText,
  width,
  height,
  attribution,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string
  altText: string
  width?: number | null
  height?: number | null
  attribution?: string | null
}) {
  const [translateY, setTranslateY] = useState(0)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return
    const diff = e.touches[0].clientY - touchStartY.current
    if (diff > 0) setTranslateY(diff)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (translateY > SWIPE_THRESHOLD) {
      onOpenChange(false)
    }
    setTranslateY(0)
    touchStartY.current = null
  }, [translateY, onOpenChange])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <VisuallyHidden.Root>
            <DialogPrimitive.Title>{altText}</DialogPrimitive.Title>
            <DialogPrimitive.Description>Podgląd pełnej grafiki</DialogPrimitive.Description>
          </VisuallyHidden.Root>

          <DialogPrimitive.Close
            className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Zamknij</span>
          </DialogPrimitive.Close>

          <div
            style={{
              transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
              opacity: translateY > 0 ? Math.max(0.3, 1 - translateY / 300) : undefined,
              transition: translateY === 0 ? 'transform 0.2s, opacity 0.2s' : 'none',
            }}
          >
            <Image
              src={url}
              alt={altText}
              width={width || DEFAULT_WIDTH}
              height={height || DEFAULT_HEIGHT}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain w-auto h-auto"
              unoptimized
              priority
            />
          </div>

          {attribution && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/70 bg-black/40 px-3 py-1 rounded-full">
              {attribution}
            </p>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/**
 * Skeleton placeholder for images being generated
 */
export function SectionImageSkeleton({ message }: { message?: string }) {
  return (
    <div className="not-prose my-6 overflow-hidden rounded-lg border border-border">
      <div className="flex h-40 sm:h-48 items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-xs">{message || 'Generuję grafikę...'}</span>
        </div>
      </div>
    </div>
  )
}
