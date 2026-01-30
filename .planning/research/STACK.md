# Technology Stack

**Project:** Wirtualny Mentor
**Researched:** 2026-01-30
**Overall Confidence:** HIGH

## Executive Summary

Stack zaprojektowany dla platformy edukacyjnej AI z funkcjami: personalizowane curriculum, chatbot-mentor, quizy, web search i tracking postepow. Bazuje na preferencji uzytkownika (React + TypeScript + Supabase) z uzupelnieniem o sprawdzone narzedzia AI.

**Kluczowa decyzja:** Next.js zamiast Vite — streaming AI, API routes, SSR dla SEO, natywna integracja z Vercel AI SDK.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Next.js** | 15.x | Full-stack React framework | Natywne wsparcie dla streaming AI (Vercel AI SDK), API routes, SSR/SSG dla SEO, edge runtime. Publiczny produkt wymaga SEO. | HIGH |
| **React** | 19.x | UI library | Wymagane przez Next.js 15, Server Components, Suspense dla AI streaming | HIGH |
| **TypeScript** | 5.x | Type safety | Standard w 2025/2026, lepsze DX, bledy wykrywane na etapie kompilacji | HIGH |

**Dlaczego Next.js zamiast Vite (z PROJECT.md):**
- Vite = SPA, brak SSR out-of-box. Publiczny produkt potrzebuje SEO (strony landing, dokumentacja kursow).
- Next.js ma natywna integracje z Vercel AI SDK — 20 linii kodu vs 100+ z Vite.
- Streaming responses (useChat hook) dziala najlepiej z Next.js API routes.
- Deployment na Vercel (z PROJECT.md) — optymalna integracja.

**Zrodla:**
- [Vite vs Next.js 2025](https://strapi.io/blog/vite-vs-nextjs-2025-developer-framework-comparison)
- [Vercel AI SDK docs](https://ai-sdk.dev/docs/introduction)

---

### AI Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Vercel AI SDK** | 6.x | AI orchestration | 25+ providerow, useChat/useCompletion hooks, streaming, tool calling. Standard dla React AI apps 2025/2026. | HIGH |
| **@ai-sdk/anthropic** | latest | Claude integration | Oficjalny provider dla AI SDK | HIGH |
| **@ai-sdk/openai** | latest | GPT integration | Oficjalny provider dla AI SDK | HIGH |
| **@ai-sdk/google** | latest | Gemini integration | Oficjalny provider dla AI SDK | HIGH |

**Multi-Model Strategy (z PROJECT.md):**
```
Claude Sonnet 4.5 → Mentoring chatbot (dlugi kontekst, empatia, wsparcie)
GPT-4.1 → Generowanie struktury curriculum (structured outputs)
Gemini 2.5 Flash → Quizy (szybki, tani, dobry w generowaniu pytan)
```

**Dlaczego Vercel AI SDK zamiast LangChain.js:**
- LangChain: 101.2 kB gzipped, blokuje edge runtime, bardziej zlozony
- Vercel AI SDK: mniejszy bundle, edge-native, purpose-built React hooks
- Mozna polaczyc oba jesli potrzeba RAG, ale na start AI SDK wystarczy

**Zrodla:**
- [Vercel AI SDK 6](https://vercel.com/blog/ai-sdk-6)
- [LangChain vs Vercel AI SDK](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide)

---

### Web Search API

| Technology | Price | Purpose | Why | Confidence |
|------------|-------|---------|-----|------------|
| **Tavily** | $0.008/search | RAG-optimized search | Najlepszy dla RAG, 800k+ developerow, integracja z LangChain/LlamaIndex, SOC 2 certified. Generous free tier (1000 credits/mies). | HIGH |

**Alternatywy rozwazone:**

| API | Best For | Why Not Primary |
|-----|----------|-----------------|
| Perplexity Sonar | Szybkosc (358ms) | Drogi dla wolumenu, zwraca przetworzone odpowiedzi |
| Exa AI | Semantic research | Drozszy, bardziej zlozony, overkill dla edukacji |
| Serper | Wysoki wolumen | Mniej zoptymalizowany dla RAG |

**Rekomendacja:** Zacznij z Tavily. Jesli potrzeba szybszych odpowiedzi UX — dodaj Perplexity jako drugi tier.

**Zrodla:**
- [Tavily vs Exa vs Perplexity 2025](https://www.humai.blog/tavily-vs-exa-vs-perplexity-vs-you-com-the-complete-ai-search-api-comparison-2025/)

---

### Database & Backend

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Supabase** | latest | BaaS (DB, Auth, Storage) | Znany z poprzednich projektow, PostgreSQL z pgvector, Row Level Security, realtime subscriptions | HIGH |
| **pgvector** | 0.8.x | Vector embeddings | Wbudowany w Supabase, eliminuje potrzebe osobnej vector DB (Pinecone, Weaviate) | HIGH |
| **Supabase Auth** | latest | Authentication | Email/password, OAuth, magic links, gotowe UI komponenty | HIGH |

**Vector Search dla RAG:**
- pgvector z HNSW index dla accuracy
- OpenAI text-embedding-3-small dla embeddings (tani, dobry)
- Alternatywa: voyage-3.5-lite (lepsza jakosc, podobna cena)

**Zrodla:**
- [Supabase AI docs](https://supabase.com/docs/guides/ai)
- [pgvector docs](https://supabase.com/docs/guides/database/extensions/pgvector)

---

### Embeddings

| Technology | Price/1M tokens | Dimensions | Purpose | Confidence |
|------------|-----------------|------------|---------|------------|
| **OpenAI text-embedding-3-small** | $0.02 | 1536 | Embeddings dla notatek, materialow | HIGH |

**Alternatywa do rozważenia:**
- **voyage-3.5-lite** ($0.02/1M) — 7.58% lepsza jakosc niz OpenAI small przy tej samej cenie
- Decyzja: zacznij z OpenAI (prostsze), migruj do Voyage jesli potrzeba lepszej jakosci

**Zrodla:**
- [Embedding Models Comparison 2025](https://elephas.app/blog/best-embedding-models)

---

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Zustand** | 5.x | Client state | Prosty, bez boilerplate, DevTools support, ~2KB. Idealny dla mid-size apps. | HIGH |
| **TanStack Query** | 5.x | Server state | Caching, background refetch, optimistic updates. Standard 2025. | HIGH |

**Dlaczego Zustand zamiast Redux/Jotai:**
- Redux: za duzo boilerplate dla tego projektu
- Jotai: atomiczny model niepotrzebny, Zustand prostszy
- Zustand: znany pattern (jak Redux), ale minimalny kod

**Zrodla:**
- [State Management 2025](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- [TanStack Query v5](https://tanstack.com/query/v5/docs/framework/react/overview)

---

### UI Components

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **shadcn/ui** | latest | Base components | Copy-paste, customizable, Tailwind-based. Standard 2025. | HIGH |
| **Tailwind CSS** | 4.x | Styling | Utility-first, szybki development, dobrze z shadcn | HIGH |
| **shadcn-chatbot-kit** | latest | Chat UI | Gotowe komponenty chatbota na shadcn, markdown, syntax highlighting | MEDIUM |

**Alternatywy dla Chat UI:**
- assistant-ui — bardziej zaawansowane, Radix-based
- Prompt Kit — components dla AI apps

**Zrodla:**
- [shadcn AI Components](https://www.shadcn.io/ai)
- [shadcn-chatbot-kit](https://github.com/Blazity/shadcn-chatbot-kit)

---

### Quiz System

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| **Custom implementation** | Quiz engine | Brak dominujacej biblioteki, proste do zbudowania z shadcn | MEDIUM |
| **react-quiz-component** | Alternatywa | Gotowy komponent, JSON-based, ale mniej elastyczny | LOW |

**Rekomendacja:** Zbuduj wlasny quiz engine. Wymagania (adaptacyjne remediation, rozne typy pytan) przekraczaja mozliwosci gotowych bibliotek.

**Struktura quizu:**
```typescript
interface Quiz {
  questions: Question[]
  passingScore: number
  adaptiveRemediation: boolean
}

interface Question {
  type: 'single' | 'multiple' | 'text' | 'code'
  content: string
  options?: string[]
  correctAnswer: string | string[]
  explanation: string
  remediationContent?: string // AI-generated on wrong answer
}
```

---

### Deployment & Infrastructure

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| **Vercel** | Hosting | Natywna integracja z Next.js, edge functions, preview deployments | HIGH |
| **Supabase Cloud** | Database hosting | Managed PostgreSQL, automatic backups, scaling | HIGH |

---

## Complete Installation

```bash
# Create Next.js project
npx create-next-app@latest wirtualny-mentor --typescript --tailwind --app --src-dir

cd wirtualny-mentor

# AI SDK & Providers
npm install ai @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/google

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# State Management
npm install zustand @tanstack/react-query

# UI Components (shadcn init)
npx shadcn@latest init

# Additional UI
npm install lucide-react

# Web Search
npm install @tavily/core

# Utilities
npm install zod date-fns

# Dev dependencies
npm install -D @types/node prettier eslint-config-prettier
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js | Vite + React | Brak SSR, gorsze streaming AI, brak API routes |
| AI SDK | Vercel AI SDK | LangChain.js | Wiekszy bundle, blokuje edge, bardziej zlozony |
| Database | Supabase | Firebase | PostgreSQL > Firestore dla relacji, pgvector wbudowany |
| Vector DB | pgvector (Supabase) | Pinecone | Dodatkowa infrastruktura, pgvector wystarczy na start |
| Web Search | Tavily | Perplexity | Tavily tanszy, lepszy dla RAG |
| State | Zustand | Redux Toolkit | Za duzo boilerplate |
| State | Zustand | Jotai | Atomiczny model niepotrzebny |
| Hosting | Vercel | Railway/Render | Vercel najlepsza integracja z Next.js |

---

## What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| Create React App | Deprecated, wolny, brak SSR |
| Redux (bez Toolkit) | Za duzo boilerplate |
| Separate vector DB (Pinecone) | Niepotrzebna zlozonosc, pgvector wystarczy |
| Firebase | Firestore gorszy dla relacyjnych danych, brak pgvector |
| LangChain.js (jako glowny) | Overkill, duzy bundle — uzywaj tylko jesli potrzeba zaawansowanego RAG |

---

## Cost Estimation (Monthly)

| Service | Free Tier | Estimated Cost (10K users) |
|---------|-----------|---------------------------|
| Vercel | Hobby free | Pro ~$20/mo |
| Supabase | 500MB DB, 2GB storage | Pro ~$25/mo |
| OpenAI API | — | ~$50-200/mo (zalezne od uzycia) |
| Anthropic API | — | ~$50-200/mo |
| Google AI | — | ~$20-50/mo |
| Tavily | 1000 free/mo | ~$50/mo |
| **Total** | **~$0** (MVP) | **~$200-500/mo** (10K users) |

---

## Migration Path from Existing Stack

Z PROJECT.md: "React + TypeScript + Vite + Tailwind CSS + shadcn/ui"

**Wymagane zmiany:**
1. Vite → Next.js (nowy projekt, migracja komponentow)
2. Dodaj Vercel AI SDK
3. Dodaj Supabase pgvector dla embeddings
4. Dodaj Tavily dla web search

**Zachowane:**
- React + TypeScript — bez zmian
- Tailwind CSS + shadcn/ui — bez zmian
- Supabase — rozszerzony o pgvector

---

## Sources

### HIGH Confidence (Official Docs / Context7)
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction)
- [Supabase AI & Vectors](https://supabase.com/docs/guides/ai)
- [TanStack Query v5](https://tanstack.com/query/v5/docs/framework/react/overview)
- [Next.js Documentation](https://nextjs.org/docs)

### MEDIUM Confidence (Multiple Sources Agree)
- [Vite vs Next.js 2025](https://strapi.io/blog/vite-vs-nextjs-2025-developer-framework-comparison)
- [LangChain vs Vercel AI SDK](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide)
- [State Management 2025](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- [Embedding Models Comparison](https://elephas.app/blog/best-embedding-models)

### LOW Confidence (Single Source / WebSearch Only)
- shadcn-chatbot-kit — popularne, ale mniej znane niz shadcn core
- react-quiz-component — stary, moze byc nieaktualny

---

## Roadmap Implications

### Phase 1: Foundation
- Next.js setup, Supabase auth, basic UI (shadcn)
- **Stack:** Next.js, Supabase, shadcn/ui, Zustand

### Phase 2: AI Core
- Vercel AI SDK setup, multi-model orchestration
- **Stack:** AI SDK, Claude/GPT/Gemini providers

### Phase 3: Content Generation
- Curriculum generation, material creation
- **Stack:** Structured outputs (GPT), streaming

### Phase 4: Quiz System
- Custom quiz engine, adaptive remediation
- **Stack:** Custom components, AI grading

### Phase 5: Mentor Chatbot
- Chat UI, context management, notatki integration
- **Stack:** useChat hook, shadcn-chatbot-kit, pgvector

### Phase 6: Web Search
- Tavily integration, knowledge refresh
- **Stack:** Tavily API, caching strategy

### Phase 7: Polish & Scale
- Performance optimization, monitoring
- **Stack:** Vercel Analytics, Supabase monitoring
