'use client';

/**
 * Idea Card (Expand/Collapse)
 *
 * Shows a bookmarked business suggestion with expandable details,
 * source links, and contact CTA. Visually consistent with InlineSuggestion.
 */

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { ContactCTA } from './ContactCTA';
import type {
  BookmarkedSuggestionWithContext,
  ContactInfo,
} from '@/types/business-ideas';

const complexityConfig = {
  prosty: {
    label: 'Prosty',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  sredni: {
    label: 'Średni',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  zlozony: {
    label: 'Złożony',
    className:
      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
} as const;

interface IdeaCardProps {
  suggestion: BookmarkedSuggestionWithContext;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemoveBookmark: () => void;
  contactInfo: ContactInfo | null;
}

export function IdeaCard({
  suggestion,
  isExpanded,
  onToggleExpand,
  onRemoveBookmark,
  contactInfo,
}: IdeaCardProps) {
  const complexity = complexityConfig[suggestion.estimated_complexity];
  const lessonUrl = `/courses/${suggestion.course_id}/${suggestion.level_id}/${suggestion.chapter_id}`;

  return (
    <Card className="border-l-4 border-l-amber-500 bg-card/50">
      <CardContent className="px-4 py-4 space-y-3">
        {/* Title + complexity badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold leading-tight">
            <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
            {suggestion.title}
          </h3>
          <Badge variant="secondary" className={complexity.className}>
            {complexity.label}
          </Badge>
        </div>

        {/* Description */}
        <p
          className={`text-sm text-muted-foreground leading-relaxed ${
            isExpanded ? '' : 'line-clamp-2'
          }`}
        >
          {suggestion.description}
        </p>

        {/* Source */}
        <p className="text-xs text-muted-foreground">
          z kursu:{' '}
          <Link
            href={`/courses/${suggestion.course_id}`}
            className="font-medium text-foreground hover:underline"
          >
            {suggestion.course_title}
          </Link>{' '}
          · Rozdział:{' '}
          <Link
            href={lessonUrl}
            className="font-medium text-foreground hover:underline"
          >
            {suggestion.chapter_title}
          </Link>
        </p>

        {/* Expanded: business potential */}
        {isExpanded && suggestion.business_potential && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              Potencjał biznesowy
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {suggestion.business_potential}
            </p>
          </div>
        )}

        {/* Expanded: ContactCTA */}
        {isExpanded && contactInfo && <ContactCTA contactInfo={contactInfo} />}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Zwiń
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Zobacz szczegóły
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            asChild
          >
            <Link href={lessonUrl}>
              <ExternalLink className="h-3.5 w-3.5" />
              Przejdź do lekcji
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
            onClick={onRemoveBookmark}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Usuń z zapisanych
          </Button>
        </div>

        {/* Collapsed: contact teaser */}
        {!isExpanded && contactInfo && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
          >
            Chcesz to omówić?
          </button>
        )}
      </CardContent>
    </Card>
  );
}
