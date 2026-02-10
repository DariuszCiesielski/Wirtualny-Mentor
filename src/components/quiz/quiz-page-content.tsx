'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { QuizContainer } from './quiz-container';

const STORAGE_KEY = 'quiz-width';

const widthOptions = [
  { key: 'standard', label: 'Standard', className: 'max-w-3xl' },
  { key: 'wide', label: 'Szeroki', className: 'max-w-5xl' },
  { key: 'full', label: 'Pełny', className: '' },
] as const;

type WidthKey = (typeof widthOptions)[number]['key'];

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
  const [width, setWidth] = useState<WidthKey>('standard');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as WidthKey | null;
    if (saved && widthOptions.some((o) => o.key === saved)) {
      setWidth(saved);
    }
  }, []);

  function handleWidthChange(key: WidthKey) {
    setWidth(key);
    localStorage.setItem(STORAGE_KEY, key);
  }

  const currentOption = widthOptions.find((o) => o.key === width)!;

  return (
    <div
      className={cn(
        'mx-auto px-2 sm:px-4 py-4 sm:py-8 transition-[max-width] duration-300',
        currentOption.className
      )}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Button variant="ghost" asChild>
          <Link href={`/courses/${courseId}/${levelId}/${chapterId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wróć do rozdziału
          </Link>
        </Button>

        {/* Width toggle */}
        <div className="inline-flex items-center rounded-lg border bg-muted p-0.5 gap-0.5">
          {widthOptions.map((opt) => (
            <button
              key={opt.key}
              className={cn(
                'px-2.5 py-1 text-xs rounded-md transition-colors',
                width === opt.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => handleWidthChange(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

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
    </div>
  );
}
