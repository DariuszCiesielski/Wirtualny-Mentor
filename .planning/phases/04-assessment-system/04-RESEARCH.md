# Phase 4: Assessment System - Research

**Researched:** 2026-01-31
**Domain:** Educational Assessment, Quiz Generation, Adaptive Learning
**Confidence:** HIGH

## Summary

System oceny (quizow i testow) dla platformy edukacyjnej wymaga kilku kluczowych komponentow: generowania pytan przez AI, bazy danych do przechowywania pytan/odpowiedzi/prob, logiki adaptacyjnej dla remediacji oraz UI do rozwiazywania quizow z natychmiastowym feedbackiem.

Projekt juz posiada infrastrukture AI (Vercel AI SDK z `generateObject` + Zod schemas), wzorzec lazy generation oraz strukture bazy danych z poziomami i rozdzialami. Phase 4 rozszerza te wzorce o tabele quizow/testow, schematy Zod dla pytan generowanych przez AI i logike odblokowywania poziomow.

Kluczowe rekomendacje:
1. Uzyc `generateObject` z Zod schema dla generowania pytan (wzorzec z Phase 3)
2. Typy pytan: MCQ (multiple choice) jako podstawa, z opcja short answer
3. Lazy generation: generowac quizy przy pierwszym dostepie do rozdzialu/poziomu
4. JSONB dla elastycznej struktury pytan i odpowiedzi
5. Feedback natychmiastowy z wyjasnieniami "dlaczego poprawna/bledna"

**Primary recommendation:** Wykorzystac istniejacy wzorzec lazy generation z Phase 3 - quizy generowane on-demand z uzyciem `generateObject` i zapisywane w JSONB kolumnach z wersjonowaniem.

## Standard Stack

Projekt juz uzywa tych bibliotek - nie trzeba dodawac nowych:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vercel AI SDK | v6+ | `generateObject` z Zod schema | Verified pattern z Phase 3 materials |
| Zod | v4 | Schema validation dla AI output | Type-safe quiz structure |
| Supabase | - | Database + RLS | Istniejaca infrastruktura |
| shadcn/ui | - | Quiz UI components | Consistent design system |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | - | Quiz form handling | User input validation |
| @tanstack/react-query | - | Data fetching | Quiz state management |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom quiz engine | External quiz platforms | Control vs maintenance - keep custom |
| Separate quiz service | Integrated in app | Simplicity - keep integrated |
| Complex adaptive algorithms | Rule-based remediation | Complexity vs clarity - start simple |

**Installation:**
Nie wymaga nowych pakietow - wszystko dostepne w projekcie.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── ai/
│       └── quiz/
│           ├── schemas.ts       # Zod schemas dla pytań
│           └── prompts.ts       # System prompts dla generowania
├── lib/
│   └── dal/
│       ├── quizzes.ts          # Quiz CRUD operations
│       └── attempts.ts         # Quiz attempt tracking
├── app/
│   └── api/
│       └── quiz/
│           ├── generate/route.ts    # Generate quiz on-demand
│           └── submit/route.ts      # Submit and evaluate answers
├── components/
│   └── quiz/
│       ├── quiz-question.tsx   # Single question component
│       ├── quiz-container.tsx  # Quiz flow management
│       ├── quiz-feedback.tsx   # Answer feedback display
│       └── quiz-results.tsx    # Summary after completion
└── types/
    └── quiz.ts                 # Quiz type definitions
```

### Pattern 1: AI Quiz Generation with Zod Schema

**What:** Generowanie quizow przez AI z uzyciem `generateObject` i Zod schema (taki sam wzorzec jak materials w Phase 3).

**When to use:** Przy pierwszym dostepie do quizu lub regeneracji.

**Example:**
```typescript
// Source: Verified pattern from Phase 3 + Vercel AI SDK docs
import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';

// Zod schema for quiz questions
const quizQuestionSchema = z.object({
  id: z.string().describe("Unique question ID, e.g. 'q-1'"),
  question: z.string().describe("The question text in Polish"),
  type: z.enum(['multiple_choice', 'true_false']).describe("Question type"),
  options: z.array(z.object({
    id: z.string().describe("Option ID, e.g. 'a', 'b', 'c', 'd'"),
    text: z.string().describe("Option text"),
  })).describe("Answer options (4 for MCQ, 2 for T/F)"),
  correctOptionId: z.string().describe("ID of correct option"),
  explanation: z.string().describe("Explanation why the answer is correct"),
  wrongExplanations: z.record(z.string(), z.string())
    .describe("Map of optionId -> explanation why wrong"),
  bloomLevel: z.enum(['remembering', 'understanding', 'applying', 'analyzing'])
    .describe("Bloom's taxonomy level"),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe("Question difficulty"),
});

const quizSchema = z.object({
  questions: z.array(quizQuestionSchema).min(3).max(10),
  estimatedMinutes: z.number().int().positive(),
});

export async function generateQuiz(
  chapterTitle: string,
  chapterContent: string,
  keyConcepts: string[],
  questionCount: number = 5
) {
  const { object } = await generateObject({
    model: getModel('curriculum'), // GPT-4 for quiz generation
    schema: quizSchema,
    system: QUIZ_GENERATION_PROMPT,
    prompt: `Generate ${questionCount} quiz questions for chapter: "${chapterTitle}"

Key concepts to test: ${keyConcepts.join(', ')}

Content summary: ${chapterContent.slice(0, 2000)}

Requirements:
- Mix of Bloom's taxonomy levels (mostly remembering/understanding)
- Clear, unambiguous questions in Polish
- 4 options for MCQ (one clearly correct)
- Detailed explanations for correct AND incorrect answers`,
  });

  return object;
}
```

### Pattern 2: Quiz State Machine

**What:** Zarzadzanie stanem quizu z uzyciem prostego state machine pattern.

**When to use:** W komponencie quiz-container dla flow rozwiazywania quizu.

**Example:**
```typescript
// Quiz states: idle -> in_progress -> reviewing -> completed
type QuizState =
  | { status: 'idle' }
  | { status: 'in_progress'; currentIndex: number; answers: Record<string, string> }
  | { status: 'reviewing'; results: QuizResults }
  | { status: 'completed'; passed: boolean };

// Reducer pattern for quiz state
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START':
      return { status: 'in_progress', currentIndex: 0, answers: {} };
    case 'ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.optionId },
      };
    case 'NEXT':
      return { ...state, currentIndex: state.currentIndex + 1 };
    case 'SUBMIT':
      return { status: 'reviewing', results: action.results };
    case 'COMPLETE':
      return { status: 'completed', passed: action.passed };
    default:
      return state;
  }
}
```

### Pattern 3: Level Unlocking Logic

**What:** Logika odblokowywania poziomow po zdaniu testu koncowego.

**When to use:** Po zakonczeniu testu koncowego poziomu.

**Example:**
```typescript
// Source: Project pattern from progress.ts
async function processTestCompletion(
  userId: string,
  courseId: string,
  levelId: string,
  testResults: QuizResults
): Promise<{ unlocked: boolean; nextLevelId: string | null }> {
  const PASS_THRESHOLD = 0.7; // 70% to pass
  const passed = testResults.score >= PASS_THRESHOLD;

  if (passed) {
    // Mark level as completed
    await markLevelComplete(userId, courseId, levelId);

    // Get next level
    const nextLevel = await getNextLevel(courseId, levelId);

    if (nextLevel) {
      // Auto-unlock next level
      await unlockLevel(userId, courseId, nextLevel.id);
      return { unlocked: true, nextLevelId: nextLevel.id };
    }

    // Course completed
    return { unlocked: true, nextLevelId: null };
  }

  // Failed - trigger remediation
  return { unlocked: false, nextLevelId: null };
}
```

### Pattern 4: Remediation Flow

**What:** Dodatkowe materialy przy blednych odpowiedziach.

**When to use:** Gdy uzytkownik odpowie blednie lub nie zda testu.

**Example:**
```typescript
// Generate remediation based on wrong answers
async function generateRemediation(
  wrongQuestions: QuizQuestion[],
  chapterContent: string
): Promise<RemediationContent> {
  const weakConcepts = wrongQuestions.map(q => ({
    concept: q.question,
    bloomLevel: q.bloomLevel,
  }));

  const { object } = await generateObject({
    model: getModel('curriculum'),
    schema: remediationSchema,
    prompt: `User struggled with these concepts: ${JSON.stringify(weakConcepts)}

Generate a focused review covering:
1. Key concepts they missed (re-explained simply)
2. Examples for each concept
3. Practice tips

Original content: ${chapterContent.slice(0, 1500)}`,
  });

  return object;
}
```

### Anti-Patterns to Avoid
- **Immediate answer reveal:** Don't show correct answer until user submits - keeps quiz challenging
- **Blocking generation:** Don't block navigation while generating quiz - use loading states
- **Single attempt only:** Allow retries after remediation - learning is iterative
- **Generic feedback:** Always explain WHY answer is correct/incorrect - educational value
- **Hardcoded questions:** Don't store questions in code - generate from content for freshness

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Question shuffling | Custom shuffle | Fisher-Yates (standard) | Edge cases with randomness |
| Score calculation | Manual counting | Reduce with type safety | Cleaner, testable |
| Timer functionality | setInterval | useEffect cleanup | Memory leaks |
| Form state | useState sprawl | react-hook-form | Validation, error handling |
| Quiz progress persistence | localStorage | Server-side in attempts table | Cross-device, auditable |

**Key insight:** Quiz systems seem simple but have many edge cases (partial submissions, retries, timing). Leverage existing patterns from Phase 3 (lazy generation) and Supabase (RLS for user isolation).

## Common Pitfalls

### Pitfall 1: Overly Complex Adaptive Logic
**What goes wrong:** Building sophisticated IRT/CAT algorithms that are hard to maintain
**Why it happens:** Excitement about adaptive learning without clear requirements
**How to avoid:** Start with simple rule-based logic (70% pass threshold, fixed remediation)
**Warning signs:** Spending more time on algorithm than core features

### Pitfall 2: Quiz Generation Performance
**What goes wrong:** Slow quiz load times (30-90s generation)
**Why it happens:** On-demand generation without caching
**How to avoid:** Generate and cache quizzes after chapter content is generated (piggyback on Phase 3)
**Warning signs:** Users waiting > 5s for quiz to load

### Pitfall 3: Cheating Prevention Gaps
**What goes wrong:** Users can refresh to get new questions, see answers in network tab
**Why it happens:** Client-side answer validation
**How to avoid:** Server-side answer checking, store attempts with timestamps
**Warning signs:** Unrealistic 100% pass rates, very fast completion times

### Pitfall 4: Poor Feedback Quality
**What goes wrong:** Generic "Wrong!" without educational value
**Why it happens:** Skipping explanation generation to save costs
**How to avoid:** Require explanations in Zod schema, budget for longer generations
**Warning signs:** Users not learning from mistakes, repeated failures

### Pitfall 5: Level Skip Without Validation
**What goes wrong:** Users skip levels and struggle with advanced content
**Why it happens:** No confirmation that user understands they're skipping
**How to avoid:** Clear warning modal, track skipped levels for analytics
**Warning signs:** High dropout after skipped levels

## Code Examples

### Database Schema for Quizzes

```sql
-- Source: Adapted from existing project patterns (section_content.sql)

-- Quiz definitions (generated once, cached)
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  level_id UUID REFERENCES course_levels(id) ON DELETE CASCADE,

  -- Quiz type: 'section' (after chapter) or 'level_test' (end of level)
  quiz_type TEXT NOT NULL CHECK (quiz_type IN ('section', 'level_test')),

  -- Questions stored as JSONB array
  questions JSONB NOT NULL DEFAULT '[]',

  -- Metadata
  question_count INT NOT NULL,
  estimated_minutes INT,
  pass_threshold NUMERIC(3,2) DEFAULT 0.70,

  -- Generation tracking
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generation_model TEXT,
  version INT DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Only one quiz per chapter/level + version
  UNIQUE(chapter_id, version),
  UNIQUE(level_id, quiz_type, version),

  -- Either chapter_id or level_id, not both
  CHECK (
    (chapter_id IS NOT NULL AND level_id IS NULL) OR
    (chapter_id IS NULL AND level_id IS NOT NULL)
  )
);

-- User quiz attempts
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,

  -- Answers stored as JSONB: { questionId: selectedOptionId }
  answers JSONB NOT NULL DEFAULT '{}',

  -- Results
  score NUMERIC(5,2), -- Percentage 0-100
  correct_count INT,
  total_count INT,
  passed BOOLEAN,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INT,

  -- Remediation tracking
  remediation_viewed BOOLEAN DEFAULT FALSE,
  remediation_content JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Level unlock status (extends user_progress)
CREATE TABLE level_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,

  unlock_type TEXT NOT NULL CHECK (unlock_type IN ('test_passed', 'manual_skip')),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),

  -- For test_passed: link to passing attempt
  passing_attempt_id UUID REFERENCES quiz_attempts(id),

  UNIQUE(user_id, level_id)
);

-- RLS Policies (following project pattern)
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_unlocks ENABLE ROW LEVEL SECURITY;

-- Quizzes visible to course owners (via chapter/level -> course)
CREATE POLICY "Users can view quizzes of own courses" ON quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chapters ch
      JOIN course_levels cl ON cl.id = ch.level_id
      JOIN courses c ON c.id = cl.course_id
      WHERE ch.id = quizzes.chapter_id
      AND c.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM course_levels cl
      JOIN courses c ON c.id = cl.course_id
      WHERE cl.id = quizzes.level_id
      AND c.user_id = auth.uid()
    )
  );

-- Attempts owned by user
CREATE POLICY "Users can manage own attempts" ON quiz_attempts
  FOR ALL USING (auth.uid() = user_id);

-- Unlocks owned by user
CREATE POLICY "Users can manage own unlocks" ON level_unlocks
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_quizzes_chapter ON quizzes(chapter_id);
CREATE INDEX idx_quizzes_level ON quizzes(level_id);
CREATE INDEX idx_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX idx_unlocks_user_level ON level_unlocks(user_id, level_id);
```

### Zod Schema for Quiz Question Types

```typescript
// Source: Vercel AI SDK docs + educational best practices
import { z } from 'zod';

// Individual question option
const optionSchema = z.object({
  id: z.string().describe("Option identifier: a, b, c, d"),
  text: z.string().describe("Option text in Polish"),
});

// Multiple choice question
const multipleChoiceSchema = z.object({
  id: z.string(),
  type: z.literal('multiple_choice'),
  question: z.string().describe("Question text in Polish"),
  options: z.array(optionSchema).length(4).describe("Exactly 4 options"),
  correctOptionId: z.string().describe("ID of the correct option"),
  explanation: z.string().describe("Why the correct answer is correct"),
  wrongExplanations: z.record(z.string(), z.string())
    .describe("optionId -> explanation why that option is wrong"),
  bloomLevel: z.enum(['remembering', 'understanding', 'applying', 'analyzing']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  relatedConcept: z.string().optional().describe("Key concept this tests"),
});

// True/False question
const trueFalseSchema = z.object({
  id: z.string(),
  type: z.literal('true_false'),
  statement: z.string().describe("Statement to evaluate"),
  correctAnswer: z.boolean(),
  explanation: z.string().describe("Why true/false"),
  bloomLevel: z.enum(['remembering', 'understanding']),
  difficulty: z.enum(['easy', 'medium']),
  relatedConcept: z.string().optional(),
});

// Union of question types
const questionSchema = z.discriminatedUnion('type', [
  multipleChoiceSchema,
  trueFalseSchema,
]);

// Complete quiz schema
export const quizSchema = z.object({
  questions: z.array(questionSchema).min(3).max(10),
  estimatedMinutes: z.number().int().positive(),
  focusAreas: z.array(z.string()).describe("Key topics covered"),
});

// Level test (longer, more comprehensive)
export const levelTestSchema = z.object({
  questions: z.array(questionSchema).min(10).max(20),
  estimatedMinutes: z.number().int().positive(),
  levelSummary: z.string().describe("Brief summary of what this level covered"),
  masteryIndicators: z.array(z.string()).describe("Skills user should demonstrate"),
});

export type QuizQuestion = z.infer<typeof questionSchema>;
export type Quiz = z.infer<typeof quizSchema>;
export type LevelTest = z.infer<typeof levelTestSchema>;
```

### Quiz Generation API Route

```typescript
// Source: Adapted from /api/materials/generate pattern
import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';
import { quizSchema } from '@/lib/ai/quiz/schemas';
import { QUIZ_GENERATION_PROMPT } from '@/lib/ai/quiz/prompts';
import { saveQuiz, getLatestQuiz } from '@/lib/dal/quizzes';
import { getSectionContent } from '@/lib/dal/materials';

const requestSchema = z.object({
  chapterId: z.string().uuid(),
  forceRegenerate: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterId, forceRegenerate } = requestSchema.parse(body);

    // Check for existing quiz (lazy generation pattern)
    if (!forceRegenerate) {
      const existingQuiz = await getLatestQuiz(chapterId);
      if (existingQuiz) {
        return NextResponse.json({ quiz: existingQuiz, cached: true });
      }
    }

    // Get chapter content for context
    const content = await getSectionContent(chapterId);
    if (!content) {
      return NextResponse.json(
        { error: 'Chapter content not found. Generate content first.' },
        { status: 404 }
      );
    }

    // Generate quiz
    const { object } = await generateObject({
      model: getModel('curriculum'),
      schema: quizSchema,
      system: QUIZ_GENERATION_PROMPT,
      prompt: `Generate a quiz for this chapter content:

Title: ${content.chapter?.title}
Key Concepts: ${JSON.stringify(content.keyConcepts.map(c => c.term))}
Content: ${content.content.slice(0, 3000)}

Requirements:
- 5 questions testing key concepts
- Mix of difficulty (2 easy, 2 medium, 1 hard)
- Focus on remembering and understanding levels
- Questions in Polish
- Clear, educational explanations`,
    });

    // Save to database
    const savedQuiz = await saveQuiz({
      chapterId,
      quizType: 'section',
      questions: object.questions,
      questionCount: object.questions.length,
      estimatedMinutes: object.estimatedMinutes,
      generationModel: 'gpt-4',
    });

    return NextResponse.json({ quiz: savedQuiz, cached: false });

  } catch (error) {
    console.error('[Quiz] Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
```

### Quiz UI Component

```tsx
// Source: shadcn/ui patterns + project conventions
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import type { QuizQuestion } from '@/types/quiz';

interface QuizQuestionProps {
  question: QuizQuestion;
  selectedOption: string | null;
  onSelect: (optionId: string) => void;
  showFeedback: boolean;
  disabled: boolean;
}

export function QuizQuestionCard({
  question,
  selectedOption,
  onSelect,
  showFeedback,
  disabled,
}: QuizQuestionProps) {
  const isCorrect = selectedOption === question.correctOptionId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={selectedOption ?? undefined}
          onValueChange={onSelect}
          disabled={disabled}
        >
          {question.options.map((option) => {
            const isSelected = selectedOption === option.id;
            const isCorrectOption = option.id === question.correctOptionId;

            let optionClass = '';
            if (showFeedback && isSelected) {
              optionClass = isCorrectOption
                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                : 'border-red-500 bg-red-50 dark:bg-red-950';
            } else if (showFeedback && isCorrectOption) {
              optionClass = 'border-green-500';
            }

            return (
              <div
                key={option.id}
                className={`flex items-center space-x-2 p-3 rounded-lg border ${optionClass}`}
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
                {showFeedback && isSelected && (
                  isCorrectOption
                    ? <CheckCircle className="h-5 w-5 text-green-600" />
                    : <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            );
          })}
        </RadioGroup>

        {showFeedback && (
          <Alert variant={isCorrect ? 'default' : 'destructive'}>
            <AlertDescription>
              {isCorrect ? (
                <>
                  <strong>Poprawnie!</strong> {question.explanation}
                </>
              ) : (
                <>
                  <strong>Niepoprawnie.</strong>{' '}
                  {question.wrongExplanations[selectedOption!] || question.explanation}
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static question banks | AI-generated questions | 2023-2024 | Personalized, fresh content |
| Immediate pass/fail | Detailed feedback per question | Always best practice | Better learning outcomes |
| Single attempt | Retry after remediation | Modern LMS pattern | Mastery-based learning |
| Manual quiz creation | On-demand generation | LLM capability maturity | Scalable content |

**Deprecated/outdated:**
- Paper-based question design: AI generation is faster and equally valid for formative assessment
- Complex adaptive testing (CAT): Overkill for educational platform - simple thresholds work

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal question count per quiz**
   - What we know: 3-10 questions typical, 5 is common
   - What's unclear: Best count for section quiz vs level test
   - Recommendation: Start with 5 for sections, 15 for level tests, adjust based on user feedback

2. **Remediation content depth**
   - What we know: Should target specific misconceptions
   - What's unclear: How much remediation before retry
   - Recommendation: Generate focused 500-word review + link back to relevant chapter section

3. **Level skip confirmation UX**
   - What we know: Users should understand consequences
   - What's unclear: Best UI pattern (modal vs inline warning)
   - Recommendation: Modal with explicit "I understand" checkbox

## Sources

### Primary (HIGH confidence)
- Vercel AI SDK docs - generateObject, structured output with Zod
- Project codebase Phase 3 - lazy generation pattern, materials generation
- Supabase docs - RLS patterns, JSONB handling

### Secondary (MEDIUM confidence)
- [Vercel Academy - Structured Data Extraction](https://vercel.com/academy/ai-sdk/structured-data-extraction)
- [Vercel AI SDK - Generating Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- [University of Waterloo - Exam Question Types](https://uwaterloo.ca/centre-for-teaching-excellence/catalogs/tip-sheets/exam-questions-types-characteristics-and-suggestions)
- [Bloom's Taxonomy Question Stems](https://tophat.com/blog/blooms-taxonomy-question-stems/)

### Tertiary (LOW confidence)
- [Best AI Quiz Generators 2026](https://www.disco.co/blog/best-ai-quiz-assessment-generators-2026) - market overview
- [Adaptive Learning Systems](https://er.educause.edu/articles/2016/10/adaptive-learning-systems-surviving-the-storm) - academic context
- [LLM Quiz Generation Research](https://ieeexplore.ieee.org/document/11086273/) - academic validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, extends proven patterns
- Architecture: HIGH - follows established project conventions
- Pitfalls: MEDIUM - based on general quiz system knowledge + project experience
- Code examples: HIGH - adapted from working Phase 3 code

**Research date:** 2026-01-31
**Valid until:** 2026-03-01 (30 days - stable domain)
