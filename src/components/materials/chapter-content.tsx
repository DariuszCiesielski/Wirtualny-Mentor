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

interface GenerationProgress {
  phase: GenerationPhase;
  sourcesFound?: number;
  message?: string;
}

export function ChapterContent({ chapter, courseContext, initialContent }: ChapterContentProps) {
  const [content, setContent] = useState<SectionContent | null>(initialContent || null);
  const [progress, setProgress] = useState<GenerationProgress>({
    phase: initialContent ? 'complete' : 'idle',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // CRITICAL: If we already have content (from server), skip generation
    // This is the key to lazy generation - only generate when initialContent is null
    if (content) {
      setProgress({ phase: 'complete' });
      return;
    }

    // No content exists - start generation with SSE
    const generateContent = async () => {
      try {
        setProgress({ phase: 'searching', message: 'Rozpoczynam wyszukiwanie...' });

        // Make POST request to get SSE stream
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

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate content');
        }

        // Read SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7);
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);
            } else if (line === '' && eventType && eventData) {
              // Process complete event
              try {
                const parsed = JSON.parse(eventData);

                switch (eventType) {
                  case 'phase':
                    setProgress({
                      phase: parsed.phase as GenerationPhase,
                      message: parsed.message,
                    });
                    break;
                  case 'progress':
                    setProgress({
                      phase: parsed.phase as GenerationPhase,
                      sourcesFound: parsed.sourcesFound,
                      message: parsed.message,
                    });
                    break;
                  case 'complete':
                    setContent(parsed.content as SectionContent);
                    setProgress({ phase: 'complete' });
                    break;
                  case 'error':
                    throw new Error(parsed.message);
                }
              } catch (e) {
                if (e instanceof SyntaxError) {
                  console.error('Failed to parse SSE data:', eventData);
                } else {
                  throw e;
                }
              }
              eventType = '';
              eventData = '';
            }
          }
        }
      } catch (err) {
        console.error('Content generation error:', err);
        setError(err instanceof Error ? err.message : 'Nieznany błąd');
        setProgress({ phase: 'error' });
      }
    };

    generateContent();
  }, [chapter, courseContext, content]);

  // Error state
  if (progress.phase === 'error') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Błąd generowania</AlertTitle>
        <AlertDescription>
          {error || 'Nie udało się wygenerować materiałów. Spróbuj ponownie później.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Loading state - shown only when initialContent was null and generation in progress
  if (progress.phase !== 'complete' || !content) {
    return (
      <GeneratingState
        chapterTitle={chapter.title}
        phase={progress.phase === 'idle' ? 'searching' : (progress.phase as 'searching' | 'generating' | 'saving')}
        sourcesFound={progress.sourcesFound}
        message={progress.message}
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
          {content.wordCount} słów
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
          <h2 className="text-2xl font-semibold">Narzędzia</h2>
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
