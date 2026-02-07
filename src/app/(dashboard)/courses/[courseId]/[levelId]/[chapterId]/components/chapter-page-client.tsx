'use client';

/**
 * Chapter Page Client Wrapper
 *
 * Client component that connects ChapterLayoutWithChat with ChapterContent.
 * Uses ChatContext to wire the askMentor callback from layout to content.
 */

import { Suspense } from 'react';
import { ChapterLayoutWithChat } from './chapter-layout-with-chat';
import { ChapterContentWithChat } from './chapter-content-with-chat';
import { GeneratingState } from '@/components/materials/generating-state';
import { ChapterPageWrapper } from '@/components/materials/chapter-page-wrapper';
import { ProgressBar } from '@/components/curriculum/progress-bar';
import { ChapterNavigation } from '@/components/curriculum/chapter-navigation';
import { NotesList } from '@/components/notes/notes-list';
import { Button } from '@/components/ui/button';
import { markComplete } from '../actions';
import { CheckCircle2, ArrowLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { getLevelDisplayName } from '@/lib/utils';
import type { SectionContent } from '@/types/materials';
import type { Note } from '@/types/notes';

interface ChapterPageClientProps {
  courseId: string;
  courseTitle: string;
  levelId: string;
  levelName: string;
  levelDescription: string;
  chapter: {
    id: string;
    title: string;
    description: string;
    topics: string[];
    estimated_minutes: number;
    order_index: number;
  };
  courseContext: string;
  existingContent: SectionContent | null;
  notes: Note[];
  percentage: number;
  completedChaptersCount: number;
  totalChapters: number;
  isCompleted: boolean;
  prevChapter: { levelId: string; chapterId: string } | null;
  nextChapter: { levelId: string; chapterId: string } | null;
}

export function ChapterPageClient({
  courseId,
  courseTitle,
  levelId,
  levelName,
  levelDescription,
  chapter,
  courseContext,
  existingContent,
  notes,
  percentage,
  completedChaptersCount,
  totalChapters,
  isCompleted,
  prevChapter,
  nextChapter,
}: ChapterPageClientProps) {
  // Filter notes: section notes handled by ChapterContent, general notes at bottom
  const generalNotes = notes.filter((n) => !n.section_heading);

  const chapterContext = `Kurs: ${courseTitle} | Poziom: ${levelName} - ${levelDescription} | Rozdział: ${chapter.title}`;

  return (
    <ChapterLayoutWithChat
      courseId={courseId}
      courseTitle={courseTitle}
      chapterId={chapter.id}
      chapterTitle={chapter.title}
      chapterContext={chapterContext}
    >
      <ChapterPageWrapper>
        {/* Progress Bar */}
        <ProgressBar
          percentage={percentage}
          completedChapters={completedChaptersCount}
          totalChapters={totalChapters}
          currentLevel={getLevelDisplayName(levelName)}
        />

        {/* Back navigation */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href={`/courses/${courseId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wróć do kursu
          </Link>
        </Button>

        {/* Chapter header */}
        <header className="mb-8">
          <div className="text-sm text-muted-foreground mb-2">
            {getLevelDisplayName(levelName)} &bull; Rozdział{' '}
            {chapter.order_index}
            {isCompleted && (
              <CheckCircle2 className="inline ml-2 h-4 w-4 text-green-500" />
            )}
          </div>
          <h1 className="text-3xl font-bold">{chapter.title}</h1>
          <p className="text-muted-foreground mt-2">{chapter.description}</p>
        </header>

        {/* Chapter content with section notes - uses ChatContext for mentor */}
        <Suspense
          fallback={
            <GeneratingState
              chapterTitle={chapter.title}
              phase="searching"
            />
          }
        >
          <ChapterContentWithChat
            chapter={{
              id: chapter.id,
              title: chapter.title,
              description: chapter.description || '',
              topics: chapter.topics || [],
              estimatedMinutes: chapter.estimated_minutes || 15,
            }}
            courseContext={courseContext}
            initialContent={existingContent}
            initialNotes={notes}
            courseId={courseId}
          />
        </Suspense>

        {/* Complete Button */}
        {!isCompleted && (
          <form
            action={markComplete.bind(null, courseId, levelId, chapter.id)}
            className="mt-8"
          >
            <Button type="submit" size="lg" className="w-full">
              Ukończ rozdział i przejdź dalej
            </Button>
          </form>
        )}

        {/* Quiz Link */}
        {isCompleted && (
          <div className="mt-8">
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href={`/courses/${courseId}/${levelId}/${chapter.id}/quiz`}>
                <ClipboardList className="mr-2 h-5 w-5" />
                Sprawdź wiedzę - Quiz
              </Link>
            </Button>
          </div>
        )}

        {/* General Notes Section (bottom) */}
        <div className="mt-12">
          <NotesList
            courseId={courseId}
            chapterId={chapter.id}
            initialNotes={generalNotes}
          />
        </div>

        {/* Navigation */}
        <div className="mt-12">
          <ChapterNavigation
            courseId={courseId}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
            isCompleted={isCompleted}
          />
        </div>
      </ChapterPageWrapper>
    </ChapterLayoutWithChat>
  );
}
