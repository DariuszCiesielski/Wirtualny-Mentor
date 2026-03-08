'use client';

/**
 * Inline Business Suggestion Card
 *
 * Compact card rendered below h2 headings in lesson content.
 * Shows AI-generated business idea with bookmark, dismiss, and refresh actions.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Lightbulb,
  Bookmark,
  BookmarkCheck,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { BusinessSuggestion } from '@/types/business-ideas';

const complexityConfig = {
  prosty: { label: 'Prosty', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  sredni: { label: 'Średni', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  zlozony: { label: 'Złożony', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
} as const;

interface InlineSuggestionProps {
  suggestion: BusinessSuggestion;
  showRefresh?: boolean;
  hasProfile?: boolean;
  onBookmark?: () => void;
  onDismiss?: () => void;
  onRefresh?: () => void;
}

export function InlineSuggestion({
  suggestion,
  showRefresh = false,
  hasProfile = false,
  onBookmark,
  onDismiss,
  onRefresh,
}: InlineSuggestionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const complexity = complexityConfig[suggestion.estimated_complexity];

  return (
    <div className="not-prose animate-in fade-in duration-500 my-4">
      <Card className="border-l-4 border-l-amber-500 bg-card/50">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold leading-tight">
              <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
              {suggestion.title}
            </CardTitle>
            <Badge
              variant="secondary"
              className={complexity.className}
            >
              {complexity.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-3 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {suggestion.description}
          </p>

          {/* Expandable business potential */}
          <div>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Potencjał biznesowy
            </button>
            {isExpanded && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed pl-5">
                {suggestion.business_potential}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 pt-1">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={onBookmark}
                  >
                    {suggestion.is_bookmarked ? (
                      <BookmarkCheck className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5" />
                    )}
                    {suggestion.is_bookmarked ? 'Zapisano' : 'Zapisz'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {suggestion.is_bookmarked
                    ? 'Usuń z zapisanych'
                    : 'Zapisz pomysł do swojej listy'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={onDismiss}
                  >
                    <X className="h-3.5 w-3.5" />
                    Ukryj
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ukryj tę sugestię</TooltipContent>
              </Tooltip>

              {showRefresh && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={onRefresh}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Odśwież
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Twój profil się zmienił — wygeneruj nową sugestię
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Profile callout */}
      {!hasProfile && (
        <div className="mt-2 flex items-start gap-2 rounded-md border-l-2 border-amber-500 bg-muted px-3 py-2">
          <p className="text-sm text-muted-foreground">
            Uzupełnij{' '}
            <Link
              href="/onboarding"
              className="font-medium text-amber-600 dark:text-amber-400 hover:underline"
            >
              profil biznesowy
            </Link>
            , żeby sugestie były dopasowane do Twojej branży.
          </p>
        </div>
      )}
    </div>
  );
}
