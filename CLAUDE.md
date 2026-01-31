# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projekcie

Wirtualny Mentor - personalizowana platforma edukacyjna z AI generująca kompleksowe programy nauczania. Użytkownik podaje temat, AI zadaje pytania doprecyzowujące, następnie tworzy strukturyzowany kurs od poziomu Początkujący do Guru z materiałami, quizami i chatbotem-mentorem.

**Status:** Projekt zakończony (7 faz, 33 plany)

## Komendy

```bash
npm run dev              # Serwer deweloperski (localhost:3000)
npm run build            # Build produkcyjny
npm run lint             # ESLint
ANALYZE=true npm run build  # Bundle analyzer
```

## Architektura

### Multi-Model AI Routing

| Model | Zastosowanie | Powód |
|-------|--------------|-------|
| GPT-4.1 | Curriculum + Materials | Strukturalny JSON, grounding |
| Claude Sonnet 4 | Mentor chatbot | Długi kontekst, empatia |
| Gemini 2.0 Flash | Quiz generation | Szybki, tani |
| text-embedding-3-small | RAG embeddings | pgvector similarity |

Konfiguracja: `src/lib/ai/providers.ts` (factory + Helicone proxy)

### Data Flow

```
User Input → API Route → DAL (auth check) → Supabase
                ↓
            AI Provider → Streaming Response
                ↓
            Client (useChat / streamObject)
```

### Kluczowe katalogi

- `src/lib/ai/` - Prompty, schematy Zod, orchestracja AI
- `src/lib/dal/` - Data Access Layer z auth verification
- `src/lib/supabase/` - Client/Server/Middleware
- `src/app/api/` - Route handlers (streaming)

## Krytyczne wzorce

### Auth (CVE-2025-29927)

```typescript
// Server-side - ZAWSZE getUser(), NIGDY getSession()
const { data: { user } } = await supabase.auth.getUser()
```

### AI SDK v6 Tools

```typescript
// inputSchema, NIE parameters
{
  name: 'searchNotes',
  inputSchema: z.object({ query: z.string() }),  // ✓
}
```

### Quiz Security

Server-side scoring - `correct_option` nigdy nie trafia do klienta. Weryfikacja w `/api/quiz/submit`.

### Lazy Loading

```typescript
const MentorChat = dynamic(() => import('./MentorChat'), { ssr: false })
```

## Zmienne środowiskowe

Wymagane (min. jeden AI provider):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY`
- `TAVILY_API_KEY` (web search)

Opcjonalne:
- `HELICONE_API_KEY` (monitoring)
- `CRON_SECRET` (Vercel Cron)
- `USE_MOCK_AUTH=true` (dev bez Supabase)

Patrz: `.env.example`

## 5 poziomów kursu (stałe nazwy)

1. Początkujący
2. Średnio zaawansowany
3. Zaawansowany
4. Master
5. Guru

Typ: `LevelName` w `src/types/database.ts`

## Cursor Rules

Szczegółowe wzorce i konwencje są w `.cursor/rules/`:
- `project.mdc` - Stack, struktura
- `architecture.mdc` - Auth, AI SDK, RLS patterns
- `conventions.mdc` - Język, styling, TypeScript
