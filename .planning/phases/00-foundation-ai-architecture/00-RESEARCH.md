# Phase 0: Foundation & AI Architecture - Research

**Researched:** 2026-01-30
**Domain:** Next.js 15 + Vercel AI SDK 6 + Multi-Model AI Orchestration
**Confidence:** HIGH

## Summary

Faza 0 ustanawia fundament techniczny dla platformy Wirtualny Mentor: projekt Next.js 15 z App Router, Vercel AI SDK 6 z multi-model orchestration, oraz monitoring kosztow. Badanie potwierdza, ze Vercel AI SDK 6 jest standardem dla aplikacji AI w React/Next.js w 2026 roku, oferujac unified API dla 20+ providerow, natywne streaming responses, oraz nowy Agent abstraction.

Kluczowe odkrycie: AI SDK 6 domyslnie uzywa Vercel AI Gateway, ktory zapewnia dostep do setek modeli przez jeden klucz API bez markup na tokenach. Mozna rowniez uzyc BYOK (Bring Your Own Key) dla wlasnych kluczy API od Anthropic, OpenAI i Google bez dodatkowych kosztow.

Krytyczne dla tej fazy jest zbudowanie model tiering strategy od poczatku - koszty tokenow eksploduja 500-1000% bez odpowiedniej strategii. Trzeba zaprojektowac routing modeli (Claude dla mentoringu, GPT dla structured outputs, Gemini dla quizow) oraz monitoring kosztow per-feature.

**Primary recommendation:** Uzyj Vercel AI Gateway jako domyslnego providera z BYOK dla produkcji. Zbuduj warstwe AI orchestration z explicit model routing od pierwszego dnia.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Next.js** | 15.x | Full-stack React framework | App Router z streaming support, Server Components, natywna integracja z Vercel AI SDK |
| **ai** | 6.x | Vercel AI SDK Core | Unified API dla 25+ providerow, streaming, tool calling, agents. Standard 2026 dla React AI apps |
| **@ai-sdk/react** | 6.x | React hooks dla AI | useChat, useCompletion, useObject - streaming UI hooks |
| **React** | 19.x | UI library | Wymagane przez Next.js 15, Server Components, Suspense |
| **TypeScript** | 5.x | Type safety | Standard w 2026, type-safe AI SDK integration |

### AI Providers

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Vercel AI Gateway** | (wbudowany w ai) | Unified model access | Domyslny - 20+ providerow, jeden klucz API |
| **@ai-sdk/anthropic** | latest | Direct Anthropic access | BYOK mode - wlasny klucz Claude |
| **@ai-sdk/openai** | latest | Direct OpenAI access | BYOK mode - wlasny klucz GPT |
| **@ai-sdk/google** | latest | Direct Google AI access | BYOK mode - wlasny klucz Gemini |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **zod** | 3.x | Schema validation | Structured outputs, input validation |
| **dotenv** | 16.x | Environment variables | Lokalne klucze API |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel AI SDK | LangChain.js | LangChain wiekszy bundle (101kB), blokuje edge runtime. Uzywaj tylko jesli potrzebujesz zaawansowanego RAG |
| Vercel AI Gateway | Direct API calls | Gateway daje automatic failover, load balancing, spend monitoring. Direct calls wiecej kontroli |
| BYOK na Vercel | OpenRouter | OpenRouter 5% markup, Vercel 0% markup |

**Installation:**
```bash
# Create Next.js 15 project
npx create-next-app@latest wirtualny-mentor --typescript --tailwind --app --src-dir

cd wirtualny-mentor

# AI SDK 6 (includes AI Gateway by default)
npm install ai @ai-sdk/react zod

# Optional: Direct provider packages for BYOK
npm install @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/google
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Homepage
│   └── api/
│       ├── chat/
│       │   └── route.ts        # Streaming chat endpoint
│       └── generate/
│           └── route.ts        # Text generation endpoint
├── lib/
│   ├── ai/
│   │   ├── index.ts            # AI orchestrator exports
│   │   ├── providers.ts        # Provider registry configuration
│   │   ├── models.ts           # Model routing config
│   │   └── prompts/            # System prompts per use case
│   │       ├── mentor.ts
│   │       ├── curriculum.ts
│   │       └── quiz.ts
│   └── utils/
│       └── cost-tracker.ts     # Token usage logging
├── services/
│   └── ai/
│       ├── orchestrator.ts     # Main AI orchestration logic
│       ├── mentor.service.ts   # Mentor chat service
│       ├── curriculum.service.ts
│       └── quiz.service.ts
├── components/
│   └── chat/
│       └── ChatInterface.tsx   # useChat hook integration
├── hooks/
│   └── useAI.ts                # Custom AI hooks
└── types/
    └── ai.ts                   # AI-related TypeScript types
```

### Pattern 1: Provider Registry for Multi-Model

**What:** Centralizacja konfiguracji providerow i modeli w jednym miejscu
**When to use:** Zawsze przy multi-model strategy
**Example:**

```typescript
// lib/ai/providers.ts
// Source: https://ai-sdk.dev/docs/ai-sdk-core/provider-management

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { createProviderRegistry, gateway } from 'ai';

// Model routing configuration
export const MODEL_CONFIG = {
  // Claude Sonnet 4.5 - mentoring, long context, empathy
  mentor: 'anthropic/claude-sonnet-4.5',

  // GPT-4.1 - structured curriculum generation
  curriculum: 'openai/gpt-4.1',

  // Gemini 2.5 Flash - fast, cheap quizzes
  quiz: 'google/gemini-2.5-flash',

  // Embeddings
  embedding: 'openai/text-embedding-3-small',
} as const;

// Create provider registry with fallbacks
export const registry = createProviderRegistry({
  // Default: Vercel AI Gateway (simplest)
  gateway,

  // BYOK providers (for production cost control)
  anthropic,
  openai,
  google,
});

// Helper to get model with fallback
export function getModel(purpose: keyof typeof MODEL_CONFIG) {
  return MODEL_CONFIG[purpose];
}
```

### Pattern 2: Streaming Route Handler

**What:** API route z streamText dla real-time responses
**When to use:** Wszystkie endpointy AI z dlugimi odpowiedziami
**Example:**

```typescript
// app/api/chat/route.ts
// Source: https://ai-sdk.dev/docs/getting-started/nextjs-app-router

import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { getModel } from '@/lib/ai/providers';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: getModel('mentor'),
    system: `Jestes wirtualnym mentorem edukacyjnym. Uzywasz metody sokratycznej -
             naprowadzasz na odpowiedz zamiast dawac gotowe rozwiazania.`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

// Edge runtime for better streaming performance
export const runtime = 'edge';
```

### Pattern 3: Model Routing Orchestrator

**What:** Centralna klasa/funkcja do wyboru modelu na podstawie zadania
**When to use:** Kazde wywolanie AI przechodzi przez orchestrator
**Example:**

```typescript
// services/ai/orchestrator.ts

import { generateText, streamText, generateObject } from 'ai';
import { getModel, MODEL_CONFIG } from '@/lib/ai/providers';
import { z } from 'zod';

export type AITask = 'mentor' | 'curriculum' | 'quiz';

interface CostLog {
  task: AITask;
  model: string;
  inputTokens: number;
  outputTokens: number;
  timestamp: Date;
}

// In-memory cost tracking (replace with DB in production)
const costLogs: CostLog[] = [];

export async function executeAITask<T = string>(
  task: AITask,
  params: {
    prompt?: string;
    messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
    schema?: z.ZodSchema<T>;
    stream?: boolean;
  }
) {
  const model = getModel(task);

  // Structured output with schema
  if (params.schema) {
    const result = await generateObject({
      model,
      schema: params.schema,
      prompt: params.prompt,
    });

    logUsage(task, model, result.usage);
    return result.object;
  }

  // Streaming response
  if (params.stream && params.messages) {
    return streamText({
      model,
      messages: params.messages,
      onFinish: (result) => {
        logUsage(task, model, result.usage);
      },
    });
  }

  // Simple text generation
  const result = await generateText({
    model,
    prompt: params.prompt,
  });

  logUsage(task, model, result.usage);
  return result.text;
}

function logUsage(
  task: AITask,
  model: string,
  usage: { promptTokens: number; completionTokens: number }
) {
  costLogs.push({
    task,
    model,
    inputTokens: usage.promptTokens,
    outputTokens: usage.completionTokens,
    timestamp: new Date(),
  });

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AI COST] ${task}: ${usage.promptTokens} in, ${usage.completionTokens} out`);
  }
}

export function getCostLogs() {
  return costLogs;
}
```

### Pattern 4: Client-side useChat Hook

**What:** React hook dla streaming chat UI
**When to use:** Wszystkie komponenty chatowe
**Example:**

```typescript
// components/chat/ChatInterface.tsx
// Source: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat

'use client';

import { useChat } from '@ai-sdk/react';

export function MentorChat() {
  const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Czesc! Jestem twoim wirtualnym mentorem. O czym chcesz sie dzis nauczyc?',
      },
    ],
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3 rounded-lg ${
              m.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
            } max-w-[80%]`}
          >
            <p className="text-sm font-medium">
              {m.role === 'user' ? 'Ty' : 'Mentor'}
            </p>
            <p>{m.content}</p>
          </div>
        ))}

        {status === 'streaming' && (
          <div className="text-gray-500">Mentor pisze...</div>
        )}

        {error && (
          <div className="text-red-500">Blad: {error.message}</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Zadaj pytanie..."
          className="w-full p-2 border rounded"
          disabled={status === 'streaming'}
        />
      </form>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Hardcoded models:** Nie pisz `model: 'anthropic/claude-sonnet-4.5'` bezposrednio w route handlers. Uzywaj MODEL_CONFIG.
- **Brak cost trackingu:** Kazde wywolanie AI musi logowac zuzycie tokenow od pierwszego dnia.
- **Synchroniczne wywolania dla dlugich odpowiedzi:** Zawsze uzywaj streamText dla odpowiedzi >100 tokenow.
- **API keys w kodzie:** Zawsze .env.local, nigdy commity z kluczami.
- **Jeden model do wszystkiego:** Projektuj model routing od poczatku, nie "pozniej zoptymalizujemy".

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming SSE | Manual ReadableStream | AI SDK streamText | Zlozone edge cases, reconnection, chunk encoding |
| Provider abstraction | Custom wrappers | AI SDK provider registry | 25+ providerow, testowane, unified API |
| Chat state management | Custom useState hooks | useChat from @ai-sdk/react | Handles streaming, errors, optimistic updates |
| Token counting | Manual estimation | AI SDK usage object | Accurate per-model, returned by all functions |
| Retry logic | Custom retry wrapper | AI Gateway failover | Automatic, cross-provider, no code needed |

**Key insight:** AI SDK 6 rozwiazuje 90% problemow integracji AI. Pisanie custom wrapperow to strata czasu i zrodlo bugow.

## Common Pitfalls

### Pitfall 1: Eksplozja Kosztow Tokenow

**What goes wrong:** Koszty API rosna 500-1000% przy skalowaniu. Startup zaczal od $15k/mies, a w 3 miesiacu placil $60k.
**Why it happens:** Tokeny output kosztuja 3-10x wiecej niz input. Uzywanie premium models do prostych zadan. Brak cachowania.
**How to avoid:**
1. Zdefiniuj MODEL_CONFIG z poczatku - tanie modele dla prostych zadan
2. Loguj kazde wywolanie z tokenami (orchestrator pattern powyzej)
3. Ustaw budget alerts w providerach AI (OpenAI: Limits page, Anthropic: Cost & Usage reports)
4. Weekly review kosztow per-feature
**Warning signs:** Brak cost trackingu, jeden model wszedzie, rosna koszty bez wzrostu userow.

### Pitfall 2: Vercel Serverless Duration Costs

**What goes wrong:** Streaming AI responses trwaja 30-60 sekund, a Vercel liczy za ms aktywnej funkcji.
**Why it happens:** Vercel nie jest zoptymalizowany dla long-running AI workloads. Na Pro 1000 GB-hours included, ale streaming AI szybko to przekracza.
**How to avoid:**
1. Edge runtime (`export const runtime = 'edge'`) dla streaming routes - inny model billingowy
2. Monitoruj function duration w Vercel dashboard
3. Dla heavy workloads rozważ serverless-only na AWS/GCP
**Warning signs:** Niespodziewane charges za compute, 504 timeouts.

### Pitfall 3: AI Gateway vs BYOK Confusion

**What goes wrong:** Nie wiadomo kiedy uzywac Vercel AI Gateway vs wlasnych kluczy API.
**Why it happens:** AI SDK 6 domyslnie uzywa Gateway (wymaga AI_GATEWAY_API_KEY), ale mozna tez uzyc BYOK.
**How to avoid:**
1. Development: AI Gateway z free $5/mies credits
2. Production: BYOK z wlasnymi kluczami (zero markup, pelna kontrola budzetow)
3. Ustaw zmienne srodowiskowe dla obu:
   - `AI_GATEWAY_API_KEY` dla Gateway
   - `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY` dla BYOK
**Warning signs:** "API key not configured" errors, nieoczekiwane charges.

### Pitfall 4: Brak Structured Response Validation

**What goes wrong:** AI zwraca tekst zamiast oczekiwanego JSON, aplikacja crashuje.
**Why it happens:** generateText zwraca string. Parsowanie JSON bez walidacji.
**How to avoid:**
1. Zawsze uzywaj generateObject z Zod schema dla structured data
2. Zdefiniuj schemas w typach (types/ai.ts)
3. Uzyj "strict mode" dla tool inputs
**Warning signs:** JSON.parse errors w logach, inconsistent AI responses.

## Code Examples

### Environment Variables Setup

```bash
# .env.local

# Option 1: Vercel AI Gateway (simplest, $5 free/month)
AI_GATEWAY_API_KEY=your_gateway_key

# Option 2: BYOK - Direct provider keys (production recommended)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...

# App config
NODE_ENV=development
```

### Basic Streaming Test Endpoint

```typescript
// app/api/test-ai/route.ts
// Simple endpoint to verify AI SDK is working

import { streamText } from 'ai';

export async function GET() {
  const result = streamText({
    model: 'anthropic/claude-sonnet-4.5',
    prompt: 'Powiedz "Czesc, AI dziala!" po polsku.',
  });

  return result.toTextStreamResponse();
}

export const runtime = 'edge';
```

### Structured Curriculum Schema

```typescript
// types/ai.ts

import { z } from 'zod';

export const ChapterSchema = z.object({
  title: z.string(),
  description: z.string(),
  estimatedTime: z.string(), // e.g., "2 hours"
  topics: z.array(z.string()),
});

export const CurriculumSchema = z.object({
  title: z.string(),
  topic: z.string(),
  levels: z.array(z.object({
    level: z.number().min(1).max(5),
    name: z.enum(['Poczatkujacy', 'Podstawowy', 'Sredniozaawansowany', 'Zaawansowany', 'Guru']),
    chapters: z.array(ChapterSchema),
    learningOutcomes: z.array(z.string()),
  })),
});

export type Curriculum = z.infer<typeof CurriculumSchema>;
```

### Generating Structured Curriculum

```typescript
// services/ai/curriculum.service.ts

import { generateObject } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { CurriculumSchema, type Curriculum } from '@/types/ai';

export async function generateCurriculum(topic: string): Promise<Curriculum> {
  const result = await generateObject({
    model: getModel('curriculum'), // GPT-4.1 for structured output
    schema: CurriculumSchema,
    prompt: `Wygeneruj program nauczania dla tematu: "${topic}".

    Program musi zawierac 5 poziomow zaawansowania:
    1. Poczatkujacy - podstawy dla zupelnie nowych
    2. Podstawowy - fundamenty i kluczowe koncepcje
    3. Sredniozaawansowany - praktyczne zastosowania
    4. Zaawansowany - glebsze zrozumienie i edge cases
    5. Guru - ekspertyzsa i zaawansowane techniki

    Kazdy poziom powinien miec 3-5 rozdzialow.
    Odpowiedz MUSI byc po polsku.`,
  });

  return result.object;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LangChain.js for everything | Vercel AI SDK 6 | 2025-2026 | Mniejszy bundle, edge-native, purpose-built hooks |
| Manual SSE streaming | streamText/toUIMessageStreamResponse | AI SDK 5+ | 10x mniej boilerplate kodu |
| Separate provider SDKs | Provider Registry | AI SDK 6 | Jeden import, unified API |
| Custom retry logic | AI Gateway failover | 2025 | Automatic cross-provider fallback |
| useReducer for chat state | useChat hook | AI SDK 4+ | Built-in streaming, errors, status |

**Deprecated/outdated:**
- **LangChain.js jako glowny SDK**: Nadal ma sens dla zaawansowanego RAG, ale dla standardowych aplikacji AI SDK jest lzejszy i prostszy
- **Manual fetch dla AI APIs**: AI SDK abstracts all provider differences
- **AI SDK 4.x patterns**: v5/v6 zmieniły API (convertToModelMessages, toUIMessageStreamResponse)

## Open Questions

1. **AI Gateway vs BYOK dla produkcji**
   - What we know: AI Gateway ma zero markup, BYOK tez zero markup. Oba dzialaja.
   - What's unclear: Czy AI Gateway ma ukryte ograniczenia przy duzej skali? TrueFoundry sugeruje ze Vercel serverless jest drogi dla heavy AI.
   - Recommendation: Zacznij z AI Gateway, monitoruj koszty, migruj do BYOK jesli potrzeba wiecej kontroli.

2. **Edge Runtime vs Node.js Runtime**
   - What we know: Edge ma inny billing model na Vercel, lepszy dla streaming.
   - What's unclear: Czy wszystkie AI SDK funkcje dzialaja na edge? Czy sa limity?
   - Recommendation: Uzyj edge dla streaming routes, node dla ciezszych operacji.

3. **AI SDK 6 Agent abstraction**
   - What we know: Nowa abstrakcja dla reusable agents z tool loops.
   - What's unclear: Czy warto uzywac dla mentora chatbota czy standardowy streamText wystarczy?
   - Recommendation: Zacznij z streamText, rozważ Agent gdy potrzeba multi-step tool calling.

## Sources

### Primary (HIGH confidence)
- [Vercel AI SDK 6 Blog](https://vercel.com/blog/ai-sdk-6) - nowe funkcje, agents, devtools
- [AI SDK Getting Started: Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) - oficjalny tutorial
- [AI SDK Provider Management](https://ai-sdk.dev/docs/ai-sdk-core/provider-management) - registry, multi-model config
- [Vercel AI Gateway Docs](https://vercel.com/docs/ai-gateway) - supported models, pricing, BYOK

### Secondary (MEDIUM confidence)
- [Understanding Vercel AI Gateway Pricing](https://www.truefoundry.com/blog/understanding-vercel-ai-gateway-pricing) - hidden costs analysis
- [Next.js 15 Project Structure Best Practices](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji) - folder organization
- [Budget Limits in LLM Apps - Portkey](https://portkey.ai/blog/budget-limits-and-alerts-in-llm-apps/) - cost control implementation

### Tertiary (LOW confidence)
- Vercel serverless pricing concerns wymaga walidacji z wlasnymi metrykammi
- Feature-Sliced Design for Next.js - popularny pattern, ale nie oficjalny

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - oficjalna dokumentacja AI SDK 6, verified
- Architecture: HIGH - oparte na oficjalnych przykladach i best practices
- Cost monitoring: MEDIUM - providerzy maja dashboards, ale szczegoly implementacji wymagaja eksperymentow
- Pitfalls: HIGH - potwierdzone przez wiele zrodel, PITFALLS.md projektu

**Research date:** 2026-01-30
**Valid until:** 30 dni (AI SDK aktywnie rozwijany, sprawdz changelog przed wiekszymi zmianami)
