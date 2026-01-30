# Phase 2: Curriculum Generation - Research

**Researched:** 2026-01-30
**Domain:** AI-powered curriculum generation, multi-step conversational workflows, structured data streaming
**Confidence:** HIGH

## Summary

Phase 2 implementuje generowanie spersonalizowanych programow nauczania przez AI. Obejmuje: (1) konwersacyjny interfejs do zbierania informacji o uzytkowniku (temat, cele, doswiadczenie, dostepny czas), (2) generowanie strukturyzowanego curriculum z 5 poziomami, (3) integracje z Tavily dla aktualnych informacji, (4) persystencje kursu i postepu w bazie danych, oraz (5) UI do nawigacji po curriculum.

Istniejaca infrastruktura AI z Phase 0 (Vercel AI SDK, multi-model routing) stanowi solidna baze. Kluczowe wyzwania to: zaprojektowanie schematu bazy danych dla kursow/postepu, implementacja multi-step konwersacji z AI, i streaming duzych strukturyzowanych odpowiedzi (curriculum moze miec 8k+ tokenow).

**Primary recommendation:** Uzyj Vercel AI SDK `streamText` z `Output.object()` dla generowania curriculum, `useChat` hook dla konwersacji doprecyzowujacej, i Tavily `@tavily/core` dla web search. Schemat DB w Supabase z tabelami: courses, levels, chapters, user_progress.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai (Vercel AI SDK) | ^6.0.62 | Streaming, structured output, tool calling | Juz zainstalowane, unified API dla wszystkich providerow |
| @ai-sdk/react | ^3.0.64 | useChat, useObject hooks | Juz zainstalowane, framework-agnostic React hooks |
| @tavily/core | latest | Web search API | Official Tavily SDK, RAG-optimized results |
| zod | ^4.3.6 | Schema validation dla AI output | Juz zainstalowane, natywna integracja z AI SDK |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| partial-json | latest | Parsing incomplete JSON podczas streaming | Gdy streaming structured data wymaga partial rendering |
| shadcn/ui Progress | - | Progress bar component | Juz w projekcie, rozszerz o stepper pattern |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tavily Search | Perplexity API | Tavily jest RAG-optimized, lepsze dla AI agents |
| useChat | Custom fetch | useChat ma built-in state management i streaming |
| Output.object() | generateObject() | generateObject deprecated w AI SDK 6, Output.object() jest nowym standardem |

**Installation:**
```bash
npm install @tavily/core
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── courses/                    # Courses listing
│   │   │   ├── page.tsx
│   │   │   ├── new/                    # New course creation flow
│   │   │   │   ├── page.tsx            # Topic input + clarifying chat
│   │   │   │   └── actions.ts          # Server actions for course creation
│   │   │   └── [courseId]/             # Single course view
│   │   │       ├── page.tsx            # Curriculum overview (TOC)
│   │   │       ├── [levelId]/          # Level view
│   │   │       │   └── page.tsx
│   │   │       └── [levelId]/[chapterId]/
│   │   │           └── page.tsx        # Chapter content
│   └── api/
│       ├── curriculum/
│       │   ├── generate/route.ts       # Streaming curriculum generation
│       │   └── clarify/route.ts        # Clarifying questions chat
│       └── search/route.ts             # Tavily web search wrapper
├── lib/
│   ├── ai/
│   │   ├── curriculum/
│   │   │   ├── prompts.ts              # System prompts dla curriculum
│   │   │   ├── schemas.ts              # Zod schemas dla AI output
│   │   │   └── tools.ts                # Tool definitions (web search)
│   │   └── providers.ts                # Existing
│   ├── dal/
│   │   ├── courses.ts                  # Course CRUD operations
│   │   └── progress.ts                 # Progress tracking
│   └── tavily/
│       └── client.ts                   # Tavily API wrapper
├── components/
│   ├── curriculum/
│   │   ├── topic-input.tsx             # Initial topic input form
│   │   ├── clarifying-chat.tsx         # Chat for clarifying questions
│   │   ├── curriculum-toc.tsx          # Table of contents view
│   │   ├── level-card.tsx              # Level with learning outcomes
│   │   ├── chapter-list.tsx            # Chapter navigation
│   │   └── progress-bar.tsx            # Course progress indicator
│   └── ui/
│       └── stepper.tsx                 # Multi-step progress component
└── types/
    └── ai.ts                           # Existing, rozszerz o Course types
```

### Pattern 1: Multi-Step Clarifying Conversation

**What:** Konwersacyjny flow gdzie AI zadaje pytania doprecyzowujace przed generowaniem curriculum.

**When to use:** Kiedy potrzebujemy zebrac informacje o uzytkowniku (cele, doswiadczenie, czas) przed generowaniem.

**Example:**
```typescript
// src/app/api/curriculum/clarify/route.ts
import { streamText, Output, tool } from 'ai';
import { getModel } from '@/lib/ai';
import { z } from 'zod';

const clarificationSchema = z.object({
  question: z.string().describe('Pytanie do uzytkownika'),
  options: z.array(z.string()).optional().describe('Sugerowane odpowiedzi'),
  isComplete: z.boolean().describe('Czy zebrano wystarczajaco informacji'),
  collectedInfo: z.object({
    topic: z.string().optional(),
    goals: z.array(z.string()).optional(),
    experience: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    weeklyHours: z.number().optional(),
    sourceUrl: z.string().url().optional(),
  }).optional(),
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: getModel('curriculum'),
    system: `Jestes asystentem pomagajacym stworzyc spersonalizowany kurs.
Zadawaj pytania doprecyzowujace aby poznac:
1. Dokladny temat nauki
2. Cele uzytkownika (co chce osiagnac)
3. Dotychczasowe doswiadczenie (poczatkujacy/srednio zaawansowany/zaawansowany)
4. Ile godzin tygodniowo moze poswiecic na nauke

Gdy masz wszystkie informacje, ustaw isComplete: true.
Odpowiadaj ZAWSZE po polsku.`,
    messages,
    output: Output.object({ schema: clarificationSchema }),
  });

  return result.toUIMessageStreamResponse();
}
```

### Pattern 2: Streaming Structured Curriculum Generation

**What:** Generowanie pelnego curriculum jako streaming structured object.

**When to use:** Po zebraniu informacji, generujemy duzy strukturyzowany obiekt (curriculum).

**Example:**
```typescript
// src/lib/ai/curriculum/schemas.ts
import { z } from 'zod';

export const learningOutcomeSchema = z.object({
  id: z.string(),
  description: z.string().describe('Co uzytkownik bedzie umial po ukonczeniu'),
});

export const chapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  estimatedMinutes: z.number(),
  topics: z.array(z.string()),
});

export const levelSchema = z.object({
  id: z.string(),
  name: z.enum(['Poczatkujacy', 'Srednio zaawansowany', 'Zaawansowany', 'Master', 'Guru']),
  description: z.string(),
  learningOutcomes: z.array(learningOutcomeSchema),
  chapters: z.array(chapterSchema),
  estimatedHours: z.number(),
});

export const curriculumSchema = z.object({
  title: z.string(),
  description: z.string(),
  targetAudience: z.string(),
  totalEstimatedHours: z.number(),
  levels: z.array(levelSchema).length(5),
  prerequisites: z.array(z.string()),
  resources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    type: z.enum(['article', 'video', 'documentation', 'course']),
  })).optional(),
});

// src/app/api/curriculum/generate/route.ts
import { streamText, Output } from 'ai';
import { getModel } from '@/lib/ai';
import { curriculumSchema } from '@/lib/ai/curriculum/schemas';

export async function POST(req: Request) {
  const { userInfo, searchResults } = await req.json();

  const result = streamText({
    model: getModel('curriculum'),
    system: `Jestes ekspertem w tworzeniu programow nauczania.
Generujesz kompleksowe curriculum z 5 poziomami:
1. Poczatkujacy - podstawy, pierwsze kroki
2. Srednio zaawansowany - rozszerzenie wiedzy
3. Zaawansowany - zaawansowane tematy
4. Master - ekspertyza
5. Guru - mistrzostwo, nauczanie innych

Kazdy poziom ma learning outcomes i rozdzialy.
Uwzglednij aktualne informacje z web search.
Dostosuj do poziomu i celow uzytkownika.`,
    prompt: `Stworz curriculum dla: ${userInfo.topic}
Cele: ${userInfo.goals.join(', ')}
Doswiadczenie: ${userInfo.experience}
Dostepny czas: ${userInfo.weeklyHours}h/tydzien

Aktualne informacje z sieci:
${searchResults}`,
    output: Output.object({
      schema: curriculumSchema,
      name: 'curriculum',
      description: 'Spersonalizowany program nauczania',
    }),
  });

  return result.toUIMessageStreamResponse();
}
```

### Pattern 3: Tavily Web Search Integration as AI Tool

**What:** Tavily jako tool dla AI do wyszukiwania aktualnych informacji.

**When to use:** Podczas generowania curriculum dla dynamicznych dziedzin (technologia, prawo, medycyna).

**Example:**
```typescript
// src/lib/ai/curriculum/tools.ts
import { tool } from 'ai';
import { z } from 'zod';
import { tavily } from '@tavily/core';

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });

export const webSearchTool = tool({
  description: 'Wyszukaj aktualne informacje w internecie na dany temat',
  inputSchema: z.object({
    query: z.string().describe('Zapytanie do wyszukiwarki'),
    topic: z.enum(['general', 'news']).default('general'),
  }),
  execute: async ({ query, topic }) => {
    const response = await tvly.search(query, {
      search_depth: 'advanced',
      topic,
      max_results: 5,
      include_answer: true,
    });

    return {
      answer: response.answer,
      results: response.results.map(r => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })),
    };
  },
});

export const extractUrlTool = tool({
  description: 'Wyciagnij tresc z podanego URL',
  inputSchema: z.object({
    urls: z.array(z.string().url()).max(5),
  }),
  execute: async ({ urls }) => {
    const response = await tvly.extract(urls);
    return response.results.map(r => ({
      url: r.url,
      content: r.rawContent?.slice(0, 5000), // Limit content
    }));
  },
});
```

### Pattern 4: Database Schema for Courses & Progress

**What:** Schemat bazy danych dla kursow, poziomow, rozdzialow i postepu uzytkownika.

**When to use:** Persystencja curriculum i sledzenie postepu.

**Example:**
```sql
-- Supabase migration: courses schema

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_audience TEXT,
  total_estimated_hours NUMERIC(5,1),
  prerequisites TEXT[],
  source_url TEXT, -- jesli uzytkownik podal link
  user_goals TEXT[],
  user_experience TEXT CHECK (user_experience IN ('beginner', 'intermediate', 'advanced')),
  weekly_hours NUMERIC(4,1),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Levels table (5 per course)
CREATE TABLE course_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('Poczatkujacy', 'Srednio zaawansowany', 'Zaawansowany', 'Master', 'Guru')),
  description TEXT,
  estimated_hours NUMERIC(5,1),
  order_index INT NOT NULL, -- 1-5
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, order_index)
);

-- Learning outcomes per level
CREATE TABLE level_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters per level
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  estimated_minutes INT,
  topics TEXT[],
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  current_level_id UUID REFERENCES course_levels(id),
  current_chapter_id UUID REFERENCES chapters(id),
  completed_chapters UUID[] DEFAULT '{}',
  completed_levels UUID[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- Resources (optional, linked to course)
CREATE TABLE course_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('article', 'video', 'documentation', 'course', 'book')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;

-- User can only see their own courses
CREATE POLICY "Users can view own courses" ON courses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own courses" ON courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own courses" ON courses
  FOR UPDATE USING (auth.uid() = user_id);

-- Similar policies for related tables...
CREATE POLICY "Users can view levels of own courses" ON course_levels
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_levels.course_id AND courses.user_id = auth.uid())
  );
-- ... (continue for all tables)

-- Indexes for performance
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_course_levels_course_id ON course_levels(course_id);
CREATE INDEX idx_chapters_level_id ON chapters(level_id);
CREATE INDEX idx_user_progress_user_course ON user_progress(user_id, course_id);
```

### Pattern 5: Client-Side Streaming with useChat

**What:** React hook dla konwersacji z AI z automatycznym state management.

**When to use:** Interfejs chatu dla pytan doprecyzowujacych.

**Example:**
```typescript
// src/components/curriculum/clarifying-chat.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ClarifyingChatProps {
  topic: string;
  sourceUrl?: string;
  onComplete: (userInfo: UserInfo) => void;
}

export function ClarifyingChat({ topic, sourceUrl, onComplete }: ClarifyingChatProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/curriculum/clarify',
    initialMessages: [
      {
        id: 'initial',
        role: 'user',
        content: sourceUrl
          ? `Chce sie nauczyc na podstawie tego zrodla: ${sourceUrl}`
          : `Chce sie nauczyc: ${topic}`,
      },
    ],
    onFinish: (message) => {
      // Check if AI collected all info
      const lastPart = message.parts?.find(p => p.type === 'object');
      if (lastPart?.object?.isComplete) {
        onComplete(lastPart.object.collectedInfo);
      }
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`p-4 rounded-lg ${
            m.role === 'user' ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'
          }`}>
            {m.parts?.map((part, i) => {
              if (part.type === 'text') return <p key={i}>{part.text}</p>;
              if (part.type === 'object' && part.object?.options) {
                return (
                  <div key={i} className="flex gap-2 mt-2">
                    {part.object.options.map((opt: string) => (
                      <Button
                        key={opt}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Set input and submit
                        }}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Napisz odpowiedz..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          Wyslij
        </Button>
      </form>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Monolityczny prompt:** Nie generuj calego curriculum w jednym prompcie bez kontekstu. Najpierw zbierz info, potem generuj.
- **Brak streaming:** Dla duzych odpowiedzi (8k+ tokens) zawsze uzyj streaming, inaczej UX jest fatalny.
- **generateObject zamiast Output.object:** `generateObject` jest deprecated w AI SDK 6.
- **Hardcoded levels:** Nie hardcoduj nazw poziomow w wielu miejscach, uzyj enum/const.
- **Brak RLS:** Kazda tabela z danymi uzytkownika musi miec Row Level Security.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured AI output | Custom JSON parsing | `Output.object()` z Zod schema | Automatic validation, type safety, streaming |
| Chat state management | useState + fetch | `useChat` hook | Built-in message history, streaming, error handling |
| Web search | Custom scraping | Tavily API | RAG-optimized, respects robots.txt, structured results |
| Progress calculation | Manual math | SQL aggregates + triggers | Database handles consistency |
| Partial JSON streaming | Regex parsing | `partial-json` library | Handles edge cases, malformed JSON |

**Key insight:** AI SDK 6 ma wbudowane wszystko do structured output i streaming. Tavily jest zoptymalizowany dla AI agents. Nie trzeba budowac wlasnych rozwiazan.

## Common Pitfalls

### Pitfall 1: Token Limits dla Curriculum

**What goes wrong:** Curriculum z 5 poziomami, kazdym z rozdzialami i learning outcomes moze przekroczyc output token limit.

**Why it happens:** GPT-4.1 ma 16k output limit, ale w praktyce jakoscowe odpowiedzi to ~8k.

**How to avoid:**
1. Generuj curriculum w 2 krokach: najpierw overview (poziomy + opisy), potem detale per level
2. Ustaw `maxOutputTokens: 8192` w MODEL_CONSTRAINTS
3. Uzyj streaming aby uzytkownik widzial postep

**Warning signs:** Odpowiedz AI sie urywa, brakuje ostatnich poziomow.

### Pitfall 2: Race Conditions w Progress Tracking

**What goes wrong:** Uzytkownik szybko klika "nastepny rozdzial" i progress sie nie zapisuje poprawnie.

**Why it happens:** Optymistyczne UI + wolne zapisy do DB.

**How to avoid:**
1. Uzyj optimistic updates z revalidation
2. Debounce progress updates (500ms)
3. Uzyj Supabase real-time dla synchronizacji

**Warning signs:** Progress "skacze" wstecz, duplikaty w completed_chapters.

### Pitfall 3: Clarifying Questions Loop

**What goes wrong:** AI zadaje w nieskonczonosc pytania, nigdy nie konczy zbierania info.

**Why it happens:** Prompt nie ma jasnych kryteriow "wystarczajacej" informacji.

**How to avoid:**
1. Zdefiniuj required fields w schema (topic, goals, experience, weeklyHours)
2. Ustaw max 5 tur konwersacji
3. Po 5 turach, AI musi ustawic isComplete: true z zebranymi danymi

**Warning signs:** Uzytkownik frustruje sie, opuszcza flow.

### Pitfall 4: Tavily Rate Limits i Koszty

**What goes wrong:** Przekroczenie limitu API, nieoczekiwane koszty.

**Why it happens:** Kazde generowanie curriculum wywoluje wiele search queries.

**How to avoid:**
1. Cache wynikow Tavily (15 min TTL)
2. Limit do 3-5 queries per curriculum generation
3. Uzyj `search_depth: 'basic'` dla szybszych, tanszych wynikow
4. Monitoruj usage w Tavily dashboard

**Warning signs:** 429 errors, rosnace koszty.

### Pitfall 5: UI Messages vs Model Messages

**What goes wrong:** Persistence nie dziala, wiadomosci sie gubią.

**Why it happens:** AI SDK 5+ rozroznia UIMessage i ModelMessage.

**How to avoid:**
1. Uzyj `onFinish` callback dla persistence (dostaje UIMessage[])
2. Waliduj messages przed zaladowaniem z DB (`validateUIMessages`)
3. Generuj message ID server-side dla persistence

**Warning signs:** Zaladowany chat nie ma historii, type errors.

## Code Examples

### Curriculum Generation Flow (End-to-End)

```typescript
// src/app/(dashboard)/courses/new/page.tsx
import { TopicInput } from '@/components/curriculum/topic-input';
import { ClarifyingChat } from '@/components/curriculum/clarifying-chat';
import { CurriculumPreview } from '@/components/curriculum/curriculum-preview';

export default function NewCoursePage() {
  const [step, setStep] = useState<'topic' | 'clarify' | 'generate' | 'preview'>('topic');
  const [topic, setTopic] = useState('');
  const [sourceUrl, setSourceUrl] = useState<string>();
  const [userInfo, setUserInfo] = useState<UserInfo>();
  const [curriculum, setCurriculum] = useState<Curriculum>();

  return (
    <div className="container max-w-2xl py-8">
      <Stepper currentStep={step} steps={['Temat', 'Pytania', 'Generowanie', 'Podglad']} />

      {step === 'topic' && (
        <TopicInput
          onSubmit={(t, url) => {
            setTopic(t);
            setSourceUrl(url);
            setStep('clarify');
          }}
        />
      )}

      {step === 'clarify' && (
        <ClarifyingChat
          topic={topic}
          sourceUrl={sourceUrl}
          onComplete={(info) => {
            setUserInfo(info);
            setStep('generate');
          }}
        />
      )}

      {step === 'generate' && userInfo && (
        <CurriculumGenerator
          userInfo={userInfo}
          onComplete={(c) => {
            setCurriculum(c);
            setStep('preview');
          }}
        />
      )}

      {step === 'preview' && curriculum && (
        <CurriculumPreview
          curriculum={curriculum}
          onConfirm={async () => {
            await saveCourse(curriculum);
            redirect(`/courses/${curriculum.id}`);
          }}
        />
      )}
    </div>
  );
}
```

### Progress Bar Component

```typescript
// src/components/curriculum/progress-bar.tsx
'use client';

interface CourseProgressBarProps {
  completedChapters: number;
  totalChapters: number;
  currentLevel: string;
}

export function CourseProgressBar({
  completedChapters,
  totalChapters,
  currentLevel
}: CourseProgressBarProps) {
  const percentage = Math.round((completedChapters / totalChapters) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {completedChapters} z {totalChapters} rozdzialow
        </span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Aktualny poziom: {currentLevel}
      </p>
    </div>
  );
}
```

### DAL for Course Operations

```typescript
// src/lib/dal/courses.ts
import { createClient } from '@/lib/supabase/server';
import { Curriculum } from '@/types/ai';

export async function createCourse(
  userId: string,
  curriculum: Curriculum,
  userInfo: UserInfo
) {
  const supabase = await createClient();

  // Start transaction
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      user_id: userId,
      title: curriculum.title,
      description: curriculum.description,
      target_audience: curriculum.targetAudience,
      total_estimated_hours: curriculum.totalEstimatedHours,
      prerequisites: curriculum.prerequisites,
      source_url: userInfo.sourceUrl,
      user_goals: userInfo.goals,
      user_experience: userInfo.experience,
      weekly_hours: userInfo.weeklyHours,
      status: 'active',
    })
    .select()
    .single();

  if (courseError) throw courseError;

  // Insert levels
  for (let i = 0; i < curriculum.levels.length; i++) {
    const level = curriculum.levels[i];

    const { data: dbLevel, error: levelError } = await supabase
      .from('course_levels')
      .insert({
        course_id: course.id,
        name: level.name,
        description: level.description,
        estimated_hours: level.estimatedHours,
        order_index: i + 1,
      })
      .select()
      .single();

    if (levelError) throw levelError;

    // Insert learning outcomes
    await supabase.from('level_outcomes').insert(
      level.learningOutcomes.map((lo, j) => ({
        level_id: dbLevel.id,
        description: lo.description,
        order_index: j + 1,
      }))
    );

    // Insert chapters
    await supabase.from('chapters').insert(
      level.chapters.map((ch, j) => ({
        level_id: dbLevel.id,
        title: ch.title,
        description: ch.description,
        estimated_minutes: ch.estimatedMinutes,
        topics: ch.topics,
        order_index: j + 1,
      }))
    );
  }

  // Create initial progress record
  const { data: firstLevel } = await supabase
    .from('course_levels')
    .select('id')
    .eq('course_id', course.id)
    .eq('order_index', 1)
    .single();

  const { data: firstChapter } = await supabase
    .from('chapters')
    .select('id')
    .eq('level_id', firstLevel!.id)
    .eq('order_index', 1)
    .single();

  await supabase.from('user_progress').insert({
    user_id: userId,
    course_id: course.id,
    current_level_id: firstLevel!.id,
    current_chapter_id: firstChapter!.id,
  });

  return course;
}

export async function getUserCourses(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      user_progress!inner(
        completed_chapters,
        completed_levels,
        current_level_id,
        last_activity_at
      ),
      course_levels(count)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| generateObject() | Output.object() with streamText | AI SDK 6 (2026) | Unified API, tool calling support |
| Custom JSON streaming | AI SDK native streaming + partial-json | AI SDK 5+ | Built-in, type-safe |
| Perplexity/Google Search | Tavily API | 2025 | RAG-optimized, better for AI agents |
| Separate chat + completion hooks | Unified useChat with structured output | AI SDK 5 | Simpler API, better DX |
| Schema per endpoint | Centralized Zod schemas | Best practice | Single source of truth |

**Deprecated/outdated:**
- `generateObject()` - deprecated w AI SDK 6, uzyj `Output.object()` z `streamText`
- `useCompletion` for structured data - uzyj `useChat` z output schema lub `useObject`
- Manual message type conversion - AI SDK 5+ robi to automatycznie

## Open Questions

1. **Multi-step curriculum generation**
   - What we know: Duze curriculum moze przekroczyc token limit
   - What's unclear: Czy lepiej generowac all-at-once z wiekszym limitem, czy level-by-level?
   - Recommendation: Zacznij od all-at-once z 8k limit, jesli nie dziala, refactor na level-by-level

2. **Tavily vs built-in model search**
   - What we know: Claude i GPT maja web search capabilities
   - What's unclear: Czy Tavily jest lepszy niz native model search?
   - Recommendation: Uzyj Tavily dla kontroli (RAG-optimized, caching), ale przetestuj obie opcje

3. **Curriculum update/regeneration**
   - What we know: User moze chciec zmodyfikowac wygenerowane curriculum
   - What's unclear: Czy regenerowac cale, czy tylko czesci?
   - Recommendation: MVP bez edycji, pozniej dodaj regeneration per level

## Sources

### Primary (HIGH confidence)
- [AI SDK Core: Generating Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) - Output.object(), streaming
- [AI SDK UI: useChat](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) - Hook API reference
- [AI SDK Core: Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) - Tool definitions, multi-step
- [AI SDK UI: Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) - Persistence patterns
- [Tavily JavaScript SDK](https://github.com/tavily-ai/tavily-js) - Official SDK
- [Tavily Documentation](https://docs.tavily.com/) - API reference

### Secondary (MEDIUM confidence)
- [Vercel AI SDK Blog: AI SDK 6](https://vercel.com/blog/ai-sdk-6) - Deprecation notices, new patterns
- [GeeksforGeeks: Online Learning Platform Database](https://www.geeksforgeeks.org/sql/how-to-design-a-database-for-online-learning-platform/) - Schema patterns
- [Next.js Streaming Patterns](https://medium.com/@beenakumawat002/next-js-app-router-advanced-patterns-for-2026-server-actions-ppr-streaming-edge-first-b76b1b3dcac7) - Advanced patterns
- [ebulku/next-stepper](https://github.com/ebulku/next-stepper) - Multi-step form template
- [ScienceDirect: AI Curriculum Categorization](https://www.sciencedirect.com/science/article/pii/S2666920X2500044X) - Bloom's taxonomy alignment

### Tertiary (LOW confidence)
- [vercel-labs/ai-sdk-persistence-db](https://github.com/vercel-labs/ai-sdk-persistence-db) - Persistence template (needs validation)
- Community discussions on clarifying questions UX patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs, existing project setup
- Architecture: HIGH - Verified patterns from AI SDK docs
- Database schema: MEDIUM - Based on LMS patterns, needs project-specific tuning
- Pitfalls: MEDIUM - Based on community reports and AI SDK migration guides
- UX patterns: MEDIUM - Based on general best practices, needs user testing

**Research date:** 2026-01-30
**Valid until:** 2026-02-28 (AI SDK evolves quickly, re-verify before major changes)
