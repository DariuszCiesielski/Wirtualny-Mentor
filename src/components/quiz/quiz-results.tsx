'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, XCircle, RotateCcw, ArrowRight, Loader2 } from 'lucide-react';
import { RemediationContent } from './remediation-content';
import type { Quiz, QuizResults as QuizResultsType, RemediationContent as RemediationType } from '@/types/quiz';

interface QuizResultsProps {
  results: QuizResultsType;
  quiz: Quiz;
  attemptId?: string;
  onRetry: () => void;
  onContinue?: () => void;
}

export function QuizResults({
  results,
  quiz,
  attemptId,
  onRetry,
  onContinue,
}: QuizResultsProps) {
  const passThreshold = quiz.passThreshold ?? 0.7;
  const scorePercent = Math.round(results.score);

  const [remediation, setRemediation] = useState<RemediationType | null>(null);
  const [loadingRemediation, setLoadingRemediation] = useState(false);
  const [showRemediation, setShowRemediation] = useState(false);

  // Fetch remediation when quiz failed
  useEffect(() => {
    if (results.passed || !attemptId) return;

    async function fetchRemediation() {
      setLoadingRemediation(true);
      try {
        const res = await fetch('/api/quiz/remediation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId,
            quizId: quiz.id,
            wrongQuestionIds: results.questionResults
              .filter(qr => !qr.isCorrect)
              .map(qr => qr.questionId),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setRemediation(data.remediation);
        }
      } catch {
        // Remediation is optional - don't block on errors
      } finally {
        setLoadingRemediation(false);
      }
    }
    fetchRemediation();
  }, [results.passed, attemptId, quiz.id, results.questionResults]);

  // Show remediation view
  if (showRemediation && remediation) {
    return (
      <RemediationContent
        remediation={remediation}
        onRetry={() => {
          setShowRemediation(false);
          onRetry();
        }}
        onComplete={() => setShowRemediation(false)}
      />
    );
  }

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
            Próg zaliczenia: {Math.round(passThreshold * 100)}%
          </Badge>
          <Badge variant={results.passed ? 'default' : 'destructive'}>
            {results.passed ? 'ZALICZONE' : 'NIEZALICZONE'}
          </Badge>
        </div>

        {/* Szczegóły odpowiedzi */}
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
                  Błędne
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        {/* Remediation button when failed */}
        {!results.passed && remediation && (
          <Button
            variant="default"
            className="w-full"
            onClick={() => setShowRemediation(true)}
          >
            Przejrzyj materiał uzupełniający
          </Button>
        )}
        {!results.passed && loadingRemediation && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Przygotowywanie materiału uzupełniającego...
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Spróbuj ponownie
          </Button>
          {results.passed && onContinue && (
            <Button onClick={onContinue}>
              Kontynuuj <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
