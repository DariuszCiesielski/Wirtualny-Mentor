'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { QuizFeedback } from './quiz-feedback';
import type { QuizQuestion as QuizQuestionType, Difficulty, BloomLevel } from '@/types/quiz';

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Łatwe',
  medium: 'Średnie',
  hard: 'Trudne',
};

const bloomLabels: Record<BloomLevel, string> = {
  remembering: 'Zapamiętywanie',
  understanding: 'Rozumienie',
  applying: 'Stosowanie',
  analyzing: 'Analiza',
};

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: string | null;
  onSelect: (optionId: string) => void;
  showFeedback: boolean;
  disabled: boolean;
}

export function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelect,
  showFeedback,
  disabled,
}: QuizQuestionProps) {
  const isCorrect = selectedOption === question.correctOptionId;

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">
            Pytanie {questionNumber} z {totalQuestions}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">{difficultyLabels[question.difficulty]}</Badge>
            <Badge variant="secondary" className="text-xs">{bloomLabels[question.bloomLevel]}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-base sm:text-lg font-medium">{question.question}</p>

        <RadioGroup
          value={selectedOption ?? undefined}
          onValueChange={onSelect}
          disabled={disabled}
          className="space-y-2 sm:space-y-3"
        >
          {question.options.map((option) => {
            const isSelected = selectedOption === option.id;
            const isCorrectOption = option.id === question.correctOptionId;

            let optionClass = 'border rounded-lg p-3 transition-colors';
            if (showFeedback && isSelected) {
              optionClass += isCorrectOption
                ? ' border-green-500 bg-green-50 dark:bg-green-950'
                : ' border-red-500 bg-red-50 dark:bg-red-950';
            } else if (showFeedback && isCorrectOption) {
              optionClass += ' border-green-500';
            } else if (isSelected) {
              optionClass += ' border-primary';
            }

            return (
              <div key={option.id} className={optionClass}>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} />
                  <Label htmlFor={`${question.id}-${option.id}`} className="flex-1 cursor-pointer text-sm sm:text-base">
                    <span className="font-medium mr-2">{option.id.toUpperCase()}.</span>
                    {option.text}
                  </Label>
                  {showFeedback && isSelected && (
                    isCorrectOption
                      ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      : <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </RadioGroup>

        {/* Inline feedback po odpowiedzi */}
        {showFeedback && selectedOption && (
          <QuizFeedback
            isCorrect={isCorrect}
            explanation={question.explanation}
            wrongExplanation={
              !isCorrect ? question.wrongExplanations.find(e => e.optionId === selectedOption)?.explanation : undefined
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
