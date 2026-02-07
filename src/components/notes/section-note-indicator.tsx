'use client';

/**
 * Section Note Indicator
 *
 * Small badge/button displayed next to h2 headings.
 * Shows note count and toggles section notes visibility.
 */

import { StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SectionNoteIndicatorProps {
  count: number;
  isExpanded: boolean;
  onClick: () => void;
}

export function SectionNoteIndicator({
  count,
  isExpanded,
  onClick,
}: SectionNoteIndicatorProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'h-7 gap-1 text-xs shrink-0',
        isExpanded && 'bg-primary/10 text-primary',
        count > 0 && !isExpanded && 'text-muted-foreground'
      )}
      title={count > 0 ? `${count} notatek` : 'Dodaj notatkę'}
    >
      <StickyNote className="h-3.5 w-3.5" />
      {count > 0 && <span>{count}</span>}
    </Button>
  );
}
