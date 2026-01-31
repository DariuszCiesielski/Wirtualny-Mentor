'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import type { Quiz, QuizResults as QuizResultsType } from '@/types/quiz';

interface QuizResultsProps {
  results: QuizResultsType;
  quiz: Quiz;
  onRetry: () => void;
  onContinue?: () => void;
}

export function QuizResults({
  results,
  quiz,
  onRetry,
  onContinue,
}: QuizResultsProps) {
  const passThreshold = quiz.passThreshold ?? 0.7;
  const scorePercent = Math.round(results.score);

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {results.passed ? (
            <Trophy className="h-16 w-16 text-yellow-500" />
          ) : (
            <XCircle className="h-16 w-16 text-destructive" />
          )}
        </div>
        <CardTitle className="text-2xl">
          {results.passed ? 'Gratulacje!' : 'Nie tym razem'}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-4xl font-bold mb-2">{scorePercent}%</p>
          <p className="text-muted-foreground">
            {results.correctCount} z {results.totalCount} poprawnych
          </p>
        </div>

        <Progress value={scorePercent} className="h-3" />

        <div className="flex justify-center gap-4">
          <Badge variant={results.passed ? 'default' : 'secondary'}>
            Prog zaliczenia: {Math.round(passThreshold * 100)}%
          </Badge>
          <Badge variant={results.passed ? 'default' : 'destructive'}>
            {results.passed ? 'ZALICZONE' : 'NIEZALICZONE'}
          </Badge>
        </div>

        {/* Szczegoly odpowiedzi */}
        <div className="space-y-2">
          <h4 className="font-medium">Podsumowanie odpowiedzi:</h4>
          {results.questionResults.map((qr, index) => (
            <div
              key={qr.questionId}
              className={`flex items-center justify-between p-2 rounded ${
                qr.isCorrect ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
              }`}
            >
              <span>Pytanie {index + 1}</span>
              {qr.isCorrect ? (
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
                  Poprawne
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 dark:bg-red-900">
                  Bledne
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex gap-4 justify-center">
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Sprobuj ponownie
        </Button>
        {results.passed && onContinue && (
          <Button onClick={onContinue}>
            Kontynuuj <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
