'use client';

import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizFeedbackProps {
  isCorrect: boolean;
  explanation: string;
  wrongExplanation?: string;
}

export function QuizFeedback({
  isCorrect,
  explanation,
  wrongExplanation,
}: QuizFeedbackProps) {
  return (
    <div
      className={cn(
        'mt-4 rounded-lg border p-4',
        isCorrect
          ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
          : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {isCorrect ? (
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
        )}
        <span className="font-semibold">
          {isCorrect ? 'Poprawnie!' : 'Niepoprawnie'}
        </span>
      </div>

      {!isCorrect && wrongExplanation && (
        <p className="text-sm mb-3 ml-7">{wrongExplanation}</p>
      )}

      <div className="ml-7 mt-2 rounded-md bg-muted/50 p-3">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
          <p className="text-sm leading-relaxed">{explanation}</p>
        </div>
      </div>
    </div>
  );
}
