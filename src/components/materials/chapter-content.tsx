'use client';

/**
 * Chapter Content Component
 *
 * Implements lazy generation pattern:
 *
 * WIRING PATTERN (Server -> Client):
 * 1. Server component (page.tsx) calls getSectionContent(chapterId)
 * 2. Server passes initialContent prop (may be null if not generated yet)
 * 3. This client component checks if initialContent is null
 * 4. If null -> triggers fetch('/api/materials/generate') in useEffect
 * 5. If not null -> renders content immediately without API call
 *
 * This pattern ensures:
 * - No redundant API calls when content exists
 * - Automatic generation on first chapter visit
 * - Loading state only shown during generation
 */

import { useState, useEffect } from 'react';
import { ContentRenderer } from './content-renderer';
import { SourceList } from './source-list';
import { ToolCard } from './tool-card';
import { GeneratingState } from './generating-state';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { SectionContent } from '@/types/materials';

interface ChapterData {
  id: string;
  title: string;
  description: string;
  topics: string[];
  estimatedMinutes: number;
}

interface ChapterContentProps {
  chapter: ChapterData;
  courseContext?: string;
  /** Content from server - null means needs generation */
  initialContent?: SectionContent | null;
}

type GenerationPhase = 'idle' | 'searching' | 'generating' | 'saving' | 'complete' | 'error';

export function ChapterContent({ chapter, courseContext, initialContent }: ChapterContentProps) {
  const [content, setContent] = useState<SectionContent | null>(initialContent || null);
  const [phase, setPhase] = useState<GenerationPhase>(initialContent ? 'complete' : 'idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // CRITICAL: If we already have content (from server), skip generation
    // This is the key to lazy generation - only generate when initialContent is null
    if (content) {
      setPhase('complete');
      return;
    }

    // No content exists - start generation
    const generateContent = async () => {
      try {
        setPhase('searching');

        const response = await fetch('/api/materials/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            chapterDescription: chapter.description,
            topics: chapter.topics,
            courseContext: courseContext || '',
          }),
        });

        setPhase('generating');

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to generate content');
        }

        setPhase('saving');
        const data = await response.json();

        if (!data.success || !data.content) {
          throw new Error('Invalid response from server');
        }

        setContent(data.content);
        setPhase('complete');
      } catch (err) {
        console.error('Content generation error:', err);
        setError(err instanceof Error ? err.message : 'Nieznany blad');
        setPhase('error');
      }
    };

    generateContent();
  }, [chapter, courseContext, content]);

  // Error state
  if (phase === 'error') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Blad generowania</AlertTitle>
        <AlertDescription>
          {error || 'Nie udalo sie wygenerowac materialow. Sprobuj ponownie pozniej.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Loading state - shown only when initialContent was null and generation in progress
  if (phase !== 'complete' || !content) {
    return (
      <GeneratingState
        chapterTitle={chapter.title}
        phase={phase === 'idle' ? 'searching' : (phase as 'searching' | 'generating' | 'saving')}
      />
    );
  }

  // Content loaded - render
  return (
    <article className="space-y-8">
      {/* Metadata badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {content.estimatedReadingMinutes} min czytania
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          {content.wordCount} slow
        </Badge>
        {chapter.topics.map((topic) => (
          <Badge key={topic} variant="secondary">
            {topic}
          </Badge>
        ))}
      </div>

      {/* Main content */}
      <ContentRenderer content={content.content} sources={content.sources} />

      {/* Tools section */}
      {content.tools && content.tools.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Narzedzia</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {content.tools.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* External resources */}
      {content.externalResources && content.externalResources.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Dodatkowe zasoby</h2>
          <ul className="space-y-2">
            {content.externalResources.map((resource) => (
              <li key={resource.url} className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {resource.language.toUpperCase()}
                </Badge>
                <Badge variant="secondary" className="text-xs capitalize">
                  {resource.type}
                </Badge>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {resource.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sources */}
      <SourceList sources={content.sources} />

      {/* Footer metadata */}
      <footer className="text-xs text-muted-foreground border-t pt-4">
        Wygenerowano: {new Date(content.generatedAt).toLocaleDateString('pl-PL')}
        {content.generationModel && <span> | Model: {content.generationModel}</span>}
        {content.version > 1 && <span> | Wersja: {content.version}</span>}
      </footer>
    </article>
  );
}
