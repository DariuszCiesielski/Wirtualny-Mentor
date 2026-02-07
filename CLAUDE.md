# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projekcie

Wirtualny Mentor - personalizowana platforma edukacyjna z AI generująca kompleksowe programy nauczania. Użytkownik podaje temat, AI zadaje pytania doprecyzowujące, następnie tworzy strukturyzowany kurs od poziomu Początkujący do Guru z materiałami, quizami i chatbotem-mentorem.

**Status:** Projekt zakończony (7 faz, 33 plany)

## Stack

Next.js 16 (App Router, Turbopack) | React 19 | TypeScript strict | Tailwind CSS v4 | shadcn/ui (New York, Zinc) | Supabase (PostgreSQL + pgvector + RLS) | Vercel AI SDK v6 | Zod 4

## Komendy

```bash
npm run dev              # Serwer deweloperski (localhost:3000)
npm run build            # Build produkcyjny
npm run lint             # ESLint
ANALYZE=true npm run build  # Bundle analyzer
```

## Konwencje

- **Kod:** angielski (zmienne, funkcje, komentarze)
- **UI/UX:** polski (wszystkie teksty użytkownika)
- **Git:** Conventional commits (feat, fix, docs, chore, perf)

## Architektura

### Multi-Model AI Routing

| Model | Zastosowanie | Powód |
|-------|--------------|-------|
| GPT-5.2 | Curriculum + Mentor chatbot | Strukturalny JSON, vision (obrazy/PDF) |
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

### Mentor Chat - upload plików

```typescript
// sendMessage z plikami (AI SDK v6)
sendMessage({ text: 'Wyjaśnij ten diagram', files: dt.files });
// Obsługiwane: PNG, JPEG, GIF, WebP, PDF (max 5 plików, 10MB/plik)
```

### Lazy Loading

```typescript
const MentorChat = dynamic(() => import('./MentorChat'), { ssr: false })
```

### Server Actions

```typescript
'use server'
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { error: 'Unauthorized' }
```

### RLS z nested tables

```sql
-- Używaj EXISTS z course_id join
CREATE POLICY "..." ON chapters USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = chapters.course_id AND courses.user_id = auth.uid())
);
```

### Zod v4

```typescript
z.record(z.string(), z.number())           // Record syntax
result.error.flatten().fieldErrors          // Form errors
```

## Zmienne środowiskowe

Wymagane:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (curriculum + mentor)
- `GOOGLE_GENERATIVE_AI_API_KEY` (quizy, opcjonalnie)
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

## Styling

- Tailwind CSS v4 z dark mode
- shadcn/ui: New York style, Zinc palette
- Breakpoint `lg` (1024px) dla sidebar visibility
- **Fonty:** Geist Sans/Mono z `latin-ext` (polskie znaki ą, ę, ć, ł, ń, ó, ś, ź, ż)
