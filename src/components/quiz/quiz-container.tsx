'use client';

import { useEffect, useReducer } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowRight, CheckSquare } from 'lucide-react';
import { QuizQuestion } from './quiz-question';
import { QuizResults } from './quiz-results';
import type { Quiz, QuizResults as QuizResultsType } from '@/types/quiz';

interface QuizContainerProps {
  chapterId?: string;
  levelId?: string;
  courseId: string;
  chapterTitle?: string;
  levelName?: string;
  onComplete?: (passed: boolean) => void;
}

type QuizState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; quiz: Quiz }
  | { status: 'in_progress'; quiz: Quiz; currentIndex: number; answers: Record<string, string>; showFeedback: boolean }
  | { status: 'submitting'; quiz: Quiz; answers: Record<string, string> }
  | { status: 'completed'; quiz: Quiz; results: QuizResultsType };

type QuizAction =
  | { type: 'LOADED'; quiz: Quiz }
  | { type: 'ERROR'; message: string }
  | { type: 'START' }
  | { type: 'ANSWER'; questionId: string; optionId: string }
  | { type: 'SHOW_FEEDBACK' }
  | { type: 'NEXT' }
  | { type: 'SUBMIT' }
  | { type: 'RESULTS'; results: QuizResultsType }
  | { type: 'RETRY' };

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'LOADED':
      return { status: 'ready', quiz: action.quiz };

    case 'ERROR':
      return { status: 'error', message: action.message };

    case 'START':
      if (state.status !== 'ready') return state;
      return {
        status: 'in_progress',
        quiz: state.quiz,
        currentIndex: 0,
        answers: {},
        showFeedback: false,
      };

    case 'ANSWER':
      if (state.status !== 'in_progress') return state;
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.optionId },
      };

    case 'SHOW_FEEDBACK':
      if (state.status !== 'in_progress') return state;
      return { ...state, showFeedback: true };

    case 'NEXT':
      if (state.status !== 'in_progress') return state;
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        showFeedback: false,
      };

    case 'SUBMIT':
      if (state.status !== 'in_progress') return state;
      return {
        status: 'submitting',
        quiz: state.quiz,
        answers: state.answers,
      };

    case 'RESULTS':
      if (state.status !== 'submitting') return state;
      return {
        status: 'completed',
        quiz: state.quiz,
        results: action.results,
      };

    case 'RETRY':
      if (state.status !== 'completed') return state;
      return { status: 'loading' };

    default:
      return state;
  }
}

export function QuizContainer({
  chapterId,
  levelId,
  courseId,
  onComplete,
}: QuizContainerProps) {
  const [state, dispatch] = useReducer(quizReducer, { status: 'loading' });

  // Load quiz on mount and on retry
  useEffect(() => {
    if (state.status !== 'loading') return;

    async function loadQuiz() {
      try {
        const res = await fetch('/api/quiz/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapterId, levelId, courseId }),
        });
        if (!res.ok) throw new Error('Failed to load quiz');
        const data = await res.json();
        dispatch({ type: 'LOADED', quiz: data.quiz });
      } catch {
        dispatch({ type: 'ERROR', message: 'Nie udalo sie zaladowac quizu' });
      }
    }
    loadQuiz();
  }, [chapterId, levelId, courseId, state.status]);

  // Submit answers
  async function handleSubmit() {
    if (state.status !== 'in_progress') return;
    dispatch({ type: 'SUBMIT' });

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: state.quiz.id,
          answers: state.answers,
        }),
      });
      if (!res.ok) throw new Error('Submit failed');
      const data = await res.json();
      dispatch({ type: 'RESULTS', results: data.results });
      onComplete?.(data.results.passed);
    } catch {
      dispatch({ type: 'ERROR', message: 'Nie udalo sie wyslac odpowiedzi' });
    }
  }

  // Render based on state
  if (state.status === 'loading') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Ladowanie quizu...</p>
        </CardContent>
      </Card>
    );
  }

  if (state.status === 'error') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">{state.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Sprobuj ponownie
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (state.status === 'ready') {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <h3 className="text-lg font-medium">Quiz gotowy</h3>
          <p className="text-muted-foreground">
            {state.quiz.questionCount} pytan, prog zaliczenia: {Math.round(state.quiz.passThreshold * 100)}%
          </p>
          <Button onClick={() => dispatch({ type: 'START' })}>
            Rozpocznij quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (state.status === 'submitting') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Wysylanie odpowiedzi...</p>
        </CardContent>
      </Card>
    );
  }

  if (state.status === 'completed') {
    return (
      <QuizResults
        results={state.results}
        quiz={state.quiz}
        onRetry={() => dispatch({ type: 'RETRY' })}
      />
    );
  }

  // Quiz in progress
  const quiz = state.quiz;
  const currentQuestion = quiz.questions[state.currentIndex];
  const progress = ((state.currentIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="space-y-4">
      <Progress value={progress} className="h-2" />

      <QuizQuestion
        question={currentQuestion}
        questionNumber={state.currentIndex + 1}
        totalQuestions={quiz.questions.length}
        selectedOption={state.answers[currentQuestion.id] ?? null}
        onSelect={(optionId) =>
          dispatch({
            type: 'ANSWER',
            questionId: currentQuestion.id,
            optionId,
          })
        }
        showFeedback={state.showFeedback}
        disabled={state.showFeedback}
      />

      <div className="flex justify-end">
        {!state.showFeedback ? (
          <Button
            onClick={() => dispatch({ type: 'SHOW_FEEDBACK' })}
            disabled={!state.answers[currentQuestion.id]}
          >
            Sprawdz odpowiedz
          </Button>
        ) : state.currentIndex < quiz.questions.length - 1 ? (
          <Button onClick={() => dispatch({ type: 'NEXT' })}>
            Nastepne pytanie <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit}>
            <CheckSquare className="mr-2 h-4 w-4" />
            Zakoncz quiz
          </Button>
        )}
      </div>
    </div>
  );
}
