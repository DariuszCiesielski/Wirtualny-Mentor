'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ContentContainer } from '@/components/layout/content-container';
import { QuizContainer } from './quiz-container';

interface QuizPageContentProps {
  courseId: string;
  levelId: string;
  chapterId: string;
  levelName?: string;
  chapterTitle: string;
}

export function QuizPageContent({
  courseId,
  levelId,
  chapterId,
  levelName,
  chapterTitle,
}: QuizPageContentProps) {
  return (
    <ContentContainer className="py-4 sm:py-8">
      <Button variant="ghost" asChild className="mb-4 sm:mb-6">
        <Link href={`/courses/${courseId}/${levelId}/${chapterId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Wróć do rozdziału
        </Link>
      </Button>

      <div className="mb-4 sm:mb-6">
        {levelName && (
          <div className="text-sm text-muted-foreground mb-1">
            {levelName}
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-bold">
          Quiz: {chapterTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          Sprawdź swoje zrozumienie materiału
        </p>
      </div>

      <QuizContainer
        chapterId={chapterId}
        courseId={courseId}
        chapterTitle={chapterTitle}
      />
    </ContentContainer>
  );
}
