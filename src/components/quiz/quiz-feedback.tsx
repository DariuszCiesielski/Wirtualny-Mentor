'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';

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
    <Alert variant={isCorrect ? 'default' : 'destructive'} className="mt-4">
      <div className="flex items-start gap-3">
        {isCorrect ? (
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
        ) : (
          <XCircle className="h-5 w-5 mt-0.5" />
        )}
        <div className="flex-1">
          <AlertTitle className="mb-2">
            {isCorrect ? 'Poprawnie!' : 'Niepoprawnie'}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            {!isCorrect && wrongExplanation && (
              <p className="text-sm">{wrongExplanation}</p>
            )}
            <div className="flex items-start gap-2 mt-2 p-2 bg-muted rounded">
              <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{explanation}</p>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
