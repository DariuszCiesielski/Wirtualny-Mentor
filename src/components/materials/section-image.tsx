'use client'

/**
 * Section Image Component
 *
 * Displays a lesson illustration with:
 * - Alt text for accessibility
 * - Unsplash attribution badge when applicable
 * - Skeleton loader during generation
 * - Click to expand (lightbox)
 */

import { useState } from 'react'
import { X, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionImageProps {
  url: string
  altText: string
  attribution?: string | null
  className?: string
  onDelete?: () => void
  isDeleting?: boolean
}

export function SectionImage({ url, altText, attribution, className, onDelete, isDeleting }: SectionImageProps) {
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
            <div className="h-64 w-full animate-pulse bg-muted" />
          )}
          <img
            src={url}
            alt={altText}
            className={cn(
              'w-full object-cover transition-opacity',
              isLoaded ? 'opacity-100' : 'opacity-0 h-0'
            )}
            onLoad={() => setIsLoaded(true)}
            loading="lazy"
          />
        </div>

        {/* Alt text + attribution + delete */}
        <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground">
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

      {/* Lightbox */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsExpanded(false)}
        >
          <button
            className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            onClick={() => setIsExpanded(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={url}
            alt={altText}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </>
  )
}

/**
 * Skeleton placeholder for images being generated
 */
export function SectionImageSkeleton({ message }: { message?: string }) {
  return (
    <div className="not-prose my-6 overflow-hidden rounded-lg border border-border">
      <div className="flex h-48 items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-xs">{message || 'Generuję grafikę...'}</span>
        </div>
      </div>
    </div>
  )
}
