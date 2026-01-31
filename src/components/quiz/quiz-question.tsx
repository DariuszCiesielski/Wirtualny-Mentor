'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { QuizFeedback } from './quiz-feedback';
import type { QuizQuestion as QuizQuestionType } from '@/types/quiz';

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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          Pytanie {questionNumber} z {totalQuestions}
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="outline">{question.difficulty}</Badge>
          <Badge variant="secondary">{question.bloomLevel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-medium">{question.question}</p>

        <RadioGroup
          value={selectedOption ?? undefined}
          onValueChange={onSelect}
          disabled={disabled}
          className="space-y-3"
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
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    <span className="font-medium mr-2">{option.id.toUpperCase()}.</span>
                    {option.text}
                  </Label>
                  {showFeedback && isSelected && (
                    isCorrectOption
                      ? <CheckCircle className="h-5 w-5 text-green-600" />
                      : <XCircle className="h-5 w-5 text-red-600" />
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
              !isCorrect ? question.wrongExplanations[selectedOption] : undefined
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
