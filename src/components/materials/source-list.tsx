'use client';

/**
 * Source List Component
 *
 * Displays citations/sources at the end of content section.
 * Shows source type badge and external link.
 */

import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Source } from '@/types/materials';

interface SourceListProps {
  sources: Source[];
}

const typeLabels: Record<Source['type'], string> = {
  documentation: 'Dokumentacja',
  article: 'Artykul',
  video: 'Wideo',
  course: 'Kurs',
  official: 'Oficjalne',
};

export function SourceList({ sources }: SourceListProps) {
  if (!sources.length) return null;

  return (
    <div className="bg-muted/50 rounded-lg p-4 mt-8">
      <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
        Zrodla
      </h3>
      <ol className="space-y-2 text-sm">
        {sources.map((source, index) => (
          <li key={source.id} className="flex items-start gap-2">
            <span className="text-muted-foreground font-mono text-xs mt-0.5">
              [{index + 1}]
            </span>
            <div className="flex-1">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                {source.title}
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
              <Badge variant="outline" className="ml-2 text-xs">
                {typeLabels[source.type]}
              </Badge>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
