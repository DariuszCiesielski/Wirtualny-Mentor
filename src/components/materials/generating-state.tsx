'use client';

/**
 * Generating State Component
 *
 * Shows real-time progress while AI generates chapter content.
 * Displays animated skeleton, status messages, and sources count.
 */

import { useState, useEffect } from 'react';
import { Loader2, BookOpen, Search, Sparkles, CheckCircle2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface GeneratingStateProps {
  chapterTitle: string;
  phase?: 'searching' | 'generating' | 'saving';
  sourcesFound?: number;
  message?: string;
}

const phaseConfig = {
  searching: {
    icon: Search,
    title: 'Szukam źródeł...',
    description: 'Przeszukuję dokumentację i tutoriale dla najnowszych informacji.',
    progress: 15,
  },
  generating: {
    icon: Sparkles,
    title: 'Generuję materiały...',
    description: 'Tworzę treść edukacyjną na podstawie znalezionych źródeł.',
    progress: 60,
  },
  saving: {
    icon: BookOpen,
    title: 'Zapisuję...',
    description: 'Zapisuję wygenerowane materiały.',
    progress: 95,
  },
};

export function GeneratingState({
  chapterTitle,
  phase = 'searching',
  sourcesFound,
  message,
}: GeneratingStateProps) {
  const config = phaseConfig[phase];
  const Icon = config.icon;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate dynamic progress based on phase and sources
  const calculateProgress = () => {
    if (phase === 'searching') {
      // Progress increases with each source found (max ~40%)
      const sourceProgress = Math.min((sourcesFound || 0) * 5, 35);
      return 5 + sourceProgress;
    }
    return config.progress;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Postęp generowania</span>
          <span className="font-mono text-muted-foreground">{formatTime(elapsedSeconds)}</span>
        </div>
        <Progress value={calculateProgress()} className="h-2" />
      </div>

      {/* Status card */}
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 text-primary animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">{message || config.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{config.description}</p>

              {/* Sources found indicator */}
              {phase === 'searching' && sourcesFound !== undefined && sourcesFound > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {sourcesFound} {sourcesFound === 1 ? 'źródło' : sourcesFound < 5 ? 'źródła' : 'źródeł'}
                  </Badge>
                </div>
              )}

              {/* Phase completion indicators */}
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  {phase === 'searching' ? (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}
                  <span className={phase !== 'searching' ? 'text-green-600' : ''}>Wyszukiwanie</span>
                </div>
                <div className="flex items-center gap-1">
                  {phase === 'generating' ? (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  ) : phase === 'saving' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                  )}
                  <span className={phase === 'saving' ? 'text-green-600' : ''}>Generowanie</span>
                </div>
                <div className="flex items-center gap-1">
                  {phase === 'saving' ? (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  ) : (
                    <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                  )}
                  <span>Zapis</span>
                </div>
              </div>
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
        Generowanie materiałów dla &quot;{chapterTitle}&quot; może zająć do 2 minut.
        <br />
        Nie odświeżaj strony.
      </p>
    </div>
  );
}
