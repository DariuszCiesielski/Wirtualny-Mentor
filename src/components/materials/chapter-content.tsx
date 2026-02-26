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

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ContentRenderer } from './content-renderer';
import { SourceList } from './source-list';
import { ToolCard } from './tool-card';
import { GeneratingState } from './generating-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Clock, BookOpen, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useChapterImages } from '@/hooks/use-chapter-images';
import { toast } from 'sonner';
import type { SectionContent } from '@/types/materials';
import type { Note } from '@/types/notes';
import type { LessonImage } from '@/types/images';

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
  /** Initial notes for this chapter (for section-level display) */
  initialNotes?: Note[];
  /** Course ID for note creation */
  courseId?: string;
  /** Callback when user wants to ask mentor about a section */
  onAskMentor?: (context: string) => void;
  /** Whether user can generate images (premium feature) */
  canGenerateImages?: boolean;
  /** Pre-loaded images keyed by section heading */
  initialImages?: Record<string, LessonImage>;
  /** Course topic for image generation context */
  courseTopic?: string;
}

type GenerationPhase = 'idle' | 'searching' | 'generating' | 'saving' | 'complete' | 'error';
type RegenerationMode = 'from_scratch' | 'from_stage';
type GenerationStartStage = 'searching' | 'generating' | 'saving';

interface GenerationProgress {
  phase: GenerationPhase;
  sourcesFound?: number;
  message?: string;
}

interface RegenerationPayload {
  forceRegenerate: boolean;
  regenerationMode: RegenerationMode;
  startStage: GenerationStartStage;
  regenerationInstructions: string;
}

export function ChapterContent({
  chapter,
  courseContext,
  initialContent,
  initialNotes = [],
  courseId,
  onAskMentor,
  canGenerateImages = false,
  initialImages,
  courseTopic,
}: ChapterContentProps) {
  const [content, setContent] = useState<SectionContent | null>(initialContent || null);
  const [progress, setProgress] = useState<GenerationProgress>({
    phase: initialContent ? 'complete' : 'idle',
  });
  const [error, setError] = useState<string | null>(null);
  const [isRegenerationDialogOpen, setIsRegenerationDialogOpen] = useState(false);
  const [regenerationMode, setRegenerationMode] = useState<RegenerationMode>('from_scratch');
  const [startStage, setStartStage] = useState<GenerationStartStage>('searching');
  const [regenerationInstructions, setRegenerationInstructions] = useState('');

  const autoGenerationStarted = useRef(Boolean(initialContent));
  const generationInFlight = useRef(false);

  // Section notes state
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Lesson images (auto-generation + on-demand)
  const contentReady = progress.phase === 'complete' && !!content;
  const {
    images,
    isAutoGenerating,
    generatingSection,
    generateImage,
    deleteImage,
    generatingSections,
    deletingSections,
  } = useChapterImages(
    chapter.id,
    canGenerateImages && contentReady,
    initialImages,
    courseTopic,
  );

  const isGenerating =
    progress.phase === 'searching' ||
    progress.phase === 'generating' ||
    progress.phase === 'saving';

  const sectionNotesMap = useMemo(() => {
    const map: Record<string, Note[]> = {};
    for (const note of notes) {
      const key = note.section_heading || '__general__';
      if (!map[key]) map[key] = [];
      map[key].push(note);
    }
    return map;
  }, [notes]);

  const handleToggleSection = useCallback((heading: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(heading)) {
        next.delete(heading);
      } else {
        next.add(heading);
      }
      return next;
    });
  }, []);

  const handleAddNote = useCallback((note: Note) => {
    setNotes((prev) => [note, ...prev]);
  }, []);

  const handleUpdateNote = useCallback((updatedNote: Note) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
    );
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, []);

  const generateContent = useCallback(async (payload: RegenerationPayload) => {
    if (generationInFlight.current) return;
    generationInFlight.current = true;

    try {
      setError(null);
      setProgress({ phase: payload.startStage, message: 'Rozpoczynam generowanie...' });

      const response = await fetch('/api/materials/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterDescription: chapter.description,
          topics: chapter.topics,
          courseContext: courseContext || '',
          forceRegenerate: payload.forceRegenerate,
          regenerationMode: payload.regenerationMode,
          startStage: payload.startStage,
          regenerationInstructions: payload.regenerationInstructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

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
            } catch (parseError) {
              if (parseError instanceof SyntaxError) {
                console.error('Failed to parse SSE data:', eventData);
              } else {
                throw parseError;
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
    } finally {
      generationInFlight.current = false;
    }
  }, [chapter, courseContext]);

  useEffect(() => {
    if (content) {
      setProgress({ phase: 'complete' });
      return;
    }

    if (autoGenerationStarted.current) return;
    autoGenerationStarted.current = true;

    void generateContent({
      forceRegenerate: false,
      regenerationMode: 'from_scratch',
      startStage: 'searching',
      regenerationInstructions: '',
    });
  }, [content, generateContent]);

  // On-demand image generation handler
  const handleGenerateImage = useCallback(
    (sectionHeading: string) => {
      if (!content) return;

      // Extract section content (text between this h2 and the next h2)
      const sections = content.content.split(/^## /m);
      const sectionContent = sections.find((s) => s.startsWith(sectionHeading))
        ?.slice(sectionHeading.length) || '';

      void generateImage(
        sectionHeading,
        sectionContent.slice(0, 3000),
        chapter.title,
        courseTopic,
      ).catch((err) => {
        toast.error(`Nie udało się wygenerować grafiki: ${err instanceof Error ? err.message : 'Nieznany błąd'}`);
      });
    },
    [content, chapter.title, courseTopic, generateImage]
  );

  // On-demand image deletion handler
  const handleDeleteImage = useCallback(
    (sectionHeading: string, imageId: string) => {
      void deleteImage(sectionHeading, imageId).catch((err) => {
        toast.error(`Nie udało się usunąć grafiki: ${err instanceof Error ? err.message : 'Nieznany błąd'}`)
      })
    },
    [deleteImage]
  );

  const handleRegenerate = useCallback(() => {
    const payload: RegenerationPayload = {
      forceRegenerate: true,
      regenerationMode,
      startStage: regenerationMode === 'from_stage' ? startStage : 'searching',
      regenerationInstructions: regenerationInstructions.trim(),
    };

    setIsRegenerationDialogOpen(false);
    setContent(null);
    void generateContent(payload);
  }, [generateContent, regenerationMode, startStage, regenerationInstructions]);

  const regenerationDialog = (
    <Dialog open={isRegenerationDialogOpen} onOpenChange={setIsRegenerationDialogOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Ponowne generowanie lekcji</DialogTitle>
          <DialogDescription>
            Wybierz tryb regeneracji i dodaj wskazówki co zmienić albo co zachować.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <Label>Tryb regeneracji</Label>
            <RadioGroup
              value={regenerationMode}
              onValueChange={(value) => setRegenerationMode(value as RegenerationMode)}
            >
              <label
                htmlFor="regen-mode-scratch"
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3"
              >
                <RadioGroupItem id="regen-mode-scratch" value="from_scratch" className="mt-1" />
                <div>
                  <p className="text-sm font-medium">Od zera</p>
                  <p className="text-xs text-muted-foreground">
                    Przechodzi przez wszystkie etapy: wyszukiwanie, generowanie i zapis.
                  </p>
                </div>
              </label>
              <label
                htmlFor="regen-mode-stage"
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3"
              >
                <RadioGroupItem id="regen-mode-stage" value="from_stage" className="mt-1" />
                <div>
                  <p className="text-sm font-medium">Od wybranego etapu</p>
                  <p className="text-xs text-muted-foreground">
                    Wznawia generowanie od wskazanego etapu konkretnej lekcji.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {regenerationMode === 'from_stage' && (
            <div className="space-y-3">
              <Label>Etap startowy</Label>
              <RadioGroup
                value={startStage}
                onValueChange={(value) => setStartStage(value as GenerationStartStage)}
              >
                <label
                  htmlFor="stage-searching"
                  className="flex cursor-pointer items-start gap-3 rounded-md border p-3"
                >
                  <RadioGroupItem id="stage-searching" value="searching" className="mt-1" />
                  <div>
                    <p className="text-sm font-medium">Wyszukiwanie</p>
                    <p className="text-xs text-muted-foreground">
                      Ponowne zebranie źródeł i pełna regeneracja.
                    </p>
                  </div>
                </label>
                <label
                  htmlFor="stage-generating"
                  className="flex cursor-pointer items-start gap-3 rounded-md border p-3"
                >
                  <RadioGroupItem id="stage-generating" value="generating" className="mt-1" />
                  <div>
                    <p className="text-sm font-medium">Generowanie</p>
                    <p className="text-xs text-muted-foreground">
                      Używa źródeł z poprzedniej wersji i tworzy nową treść.
                    </p>
                  </div>
                </label>
                <label
                  htmlFor="stage-saving"
                  className="flex cursor-pointer items-start gap-3 rounded-md border p-3"
                >
                  <RadioGroupItem id="stage-saving" value="saving" className="mt-1" />
                  <div>
                    <p className="text-sm font-medium">Zapis</p>
                    <p className="text-xs text-muted-foreground">
                      Ponawia sam etap zapisu na podstawie poprzedniej wersji.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="regeneration-instructions">Dodatkowe informacje dla AI</Label>
            <Textarea
              id="regeneration-instructions"
              value={regenerationInstructions}
              onChange={(event) => setRegenerationInstructions(event.target.value)}
              placeholder="Np. chcę więcej przykładów praktycznych, mniej teorii, zachowaj sekcję o X..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Możesz napisać: co chcesz zmienić, co uzyskać, co się nie podobało i co chcesz zachować.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsRegenerationDialogOpen(false)}
            disabled={isGenerating}
          >
            Anuluj
          </Button>
          <Button type="button" onClick={handleRegenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generuję...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Regeneruj
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (progress.phase === 'error' && !content) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd generowania</AlertTitle>
          <AlertDescription>
            {error || 'Nie udało się wygenerować materiałów. Spróbuj ponownie.'}
          </AlertDescription>
        </Alert>

        <Button type="button" variant="outline" onClick={() => setIsRegenerationDialogOpen(true)}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Otwórz opcje regeneracji
        </Button>

        {regenerationDialog}
      </div>
    );
  }

  // Loading state - shown only when content is not ready yet
  if (progress.phase !== 'complete' || !content) {
    return (
      <>
        <GeneratingState
          chapterTitle={chapter.title}
          phase={progress.phase === 'idle' ? 'searching' : (progress.phase as 'searching' | 'generating' | 'saving')}
          sourcesFound={progress.sourcesFound}
          message={progress.message}
        />
        {regenerationDialog}
      </>
    );
  }

  // Content loaded - render
  return (
    <>
      <article className="space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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

          <Button type="button" variant="outline" size="sm" onClick={() => setIsRegenerationDialogOpen(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Regeneruj lekcję
          </Button>
        </div>

        {/* Main content */}
        <ContentRenderer
          content={content.content}
          sources={content.sources}
          sectionNotes={courseId ? sectionNotesMap : undefined}
          expandedSections={courseId ? expandedSections : undefined}
          onToggleSection={courseId ? handleToggleSection : undefined}
          onAddNote={courseId ? handleAddNote : undefined}
          onUpdateNote={courseId ? handleUpdateNote : undefined}
          onDeleteNote={courseId ? handleDeleteNote : undefined}
          onAskMentor={onAskMentor}
          courseId={courseId}
          chapterId={chapter.id}
          images={images}
          onGenerateImage={handleGenerateImage}
          canGenerateImages={canGenerateImages}
          generatingSections={generatingSections}
          autoGeneratingSection={generatingSection?.sectionHeading}
          onDeleteImage={handleDeleteImage}
          deletingSections={deletingSections}
        />

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

      {regenerationDialog}
    </>
  );
}
