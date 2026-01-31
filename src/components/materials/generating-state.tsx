'use client';

/**
 * Generating State Component
 *
 * Shows progress while AI generates chapter content.
 * Displays animated skeleton and status messages.
 */

import { Loader2, BookOpen, Search, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface GeneratingStateProps {
  chapterTitle: string;
  phase?: 'searching' | 'generating' | 'saving';
}

const phaseMessages = {
  searching: {
    icon: Search,
    title: 'Szukam zrodel...',
    description: 'Przeszukuje dokumentacje i tutoriale dla najnowszych informacji.',
  },
  generating: {
    icon: Sparkles,
    title: 'Generuje materialy...',
    description: 'Tworze tresc edukacyjna na podstawie znalezionych zrodel.',
  },
  saving: {
    icon: BookOpen,
    title: 'Zapisuje...',
    description: 'Zapisuje wygenerowane materialy.',
  },
};

export function GeneratingState({ chapterTitle, phase = 'searching' }: GeneratingStateProps) {
  const { icon: Icon, title, description } = phaseMessages[phase];

  return (
    <div className="space-y-8">
      {/* Status card */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content skeleton */}
      <div className="space-y-6">
        {/* Introduction skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Key concepts skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>

        {/* Code block skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-32 rounded-lg" />
        </div>

        {/* More content */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>

      {/* Info message */}
      <p className="text-center text-sm text-muted-foreground">
        Generowanie materialow dla &quot;{chapterTitle}&quot; moze zajac do 2 minut.
        <br />
        Nie odswiezaj strony.
      </p>
    </div>
  );
}
