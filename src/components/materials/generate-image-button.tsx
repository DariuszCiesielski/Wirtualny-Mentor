'use client'

/**
 * Generate Image Button
 *
 * On-demand image generation trigger per section heading.
 * Shows different states: idle, generating, premium gate.
 * Uses native title attribute for tooltip (no shadcn/ui tooltip dependency).
 */

import { ImagePlus, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GenerateImageButtonProps {
  sectionHeading: string
  canGenerate: boolean
  onGenerate: (sectionHeading: string) => void
  isGenerating?: boolean
}

export function GenerateImageButton({
  sectionHeading,
  canGenerate,
  onGenerate,
  isGenerating = false,
}: GenerateImageButtonProps) {
  if (!canGenerate) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 text-xs text-muted-foreground opacity-50 cursor-not-allowed"
        disabled
        title="Funkcja premium"
      >
        <Lock className="h-3.5 w-3.5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1 text-xs text-muted-foreground"
      onClick={() => onGenerate(sectionHeading)}
      disabled={isGenerating}
      title={isGenerating ? 'Generuję grafikę...' : 'Wygeneruj grafikę'}
    >
      {isGenerating ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ImagePlus className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}
