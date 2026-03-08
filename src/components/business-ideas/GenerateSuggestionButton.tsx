'use client';

/**
 * Generate Business Suggestion Button
 *
 * Button placed in chapter header metadata area.
 * Shows generation state, daily limit, and disabled states.
 */

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Lightbulb, Loader2 } from 'lucide-react';

interface GenerateSuggestionButtonProps {
  isGenerating: boolean;
  remaining: number | null;
  hasContent: boolean;
  hasSuggestion: boolean;
  onClick: () => void;
}

export function GenerateSuggestionButton({
  isGenerating,
  remaining,
  hasContent,
  hasSuggestion,
  onClick,
}: GenerateSuggestionButtonProps) {
  // Don't render if suggestion already exists
  if (hasSuggestion) return null;

  const isDisabled = !hasContent || isGenerating || remaining === 0;

  const tooltipMessage = !hasContent
    ? 'Najpierw wygeneruj materiały'
    : remaining === 0
      ? 'Dzisiejszy limit został wykorzystany'
      : null;

  const button = (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isDisabled}
      className="gap-1.5"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="hidden sm:inline">Analizuję lekcję...</span>
          <span className="sm:hidden">Analizuję...</span>
        </>
      ) : (
        <>
          <Lightbulb className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Pokaż pomysł biznesowy</span>
          <span className="sm:hidden">Pomysł</span>
        </>
      )}
    </Button>
  );

  return (
    <div className="flex items-center gap-2">
      {tooltipMessage ? (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>{button}</span>
            </TooltipTrigger>
            <TooltipContent>{tooltipMessage}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        button
      )}
      {remaining !== null && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Pozostało {remaining}/5 na dziś
        </span>
      )}
    </div>
  );
}
