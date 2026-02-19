# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projekcie

Wirtualny Mentor - personalizowana platforma edukacyjna z AI generująca kompleksowe programy nauczania. Użytkownik podaje temat, AI zadaje pytania doprecyzowujące, następnie tworzy strukturyzowany kurs od poziomu Początkujący do Guru z materiałami, quizami i chatbotem-mentorem.

**Status:** Projekt zakończony (7 faz, 33 plany) + materiały źródłowe (PDF/DOCX/TXT)

## Stack

Next.js 16 (App Router, Turbopack) | React 19 | TypeScript strict | Tailwind CSS v4 | shadcn/ui (New York, Zinc) | Supabase (PostgreSQL + pgvector + RLS) | Vercel AI SDK v6 | Zod 4 | unpdf | mammoth

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
| GPT-4o-mini | Quiz generation | Structured outputs, kompatybilny ze schematem Zod |
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
- `src/lib/documents/` - Ekstrakcja tekstu, chunking (PDF/DOCX/TXT)
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

### Quiz Schema (structured outputs)

```typescript
// Unikaj z.discriminatedUnion, z.record, z.union w generateObject
// wrongExplanations: WrongExplanation[] (NIE Record<string,string>)
// ContentContainer: globalny toggle szerokości (localStorage: wm-content-width)
```

### Mentor Chat - upload plików

```typescript
// sendMessage z plikami (AI SDK v6)
sendMessage({ text: 'Wyjaśnij ten diagram', files: dt.files });
// Obsługiwane: PNG, JPEG, GIF, WebP, PDF (max 5 plików, 10MB/plik)
```

### Inline Mentor Chat (przy lekcji)

```typescript
// Sesja inline: 1 per user/course/chapter (UNIQUE partial index)
// ChapterLayoutWithChat otwiera panel czatu obok treści
// Desktop: sticky side panel (w-96, h-[calc(100vh-4rem)]), Mobile: Sheet (useMediaQuery)
// ChatContext (React Context) łączy layout z ContentRenderer.onAskMentor
// Floating button + TextSelectionPopover + SectionAskButton (pod h2)
// useChat({ initialMessages }) - tryb niekontrolowany (NIE messages:)
// Scroll: min-h-0 + container.scrollTop (NIE scrollIntoView - scrolluje stronę)
```

### Notatki sekcyjne

```typescript
// Notatki przypisane do sekcji (h2 heading) w treści lekcji
// notes.section_heading (TEXT, nullable) - identyfikuje sekcję
// SectionNoteIndicator (badge przy h2) + SectionNotesInline (panel pod h2)
// NoteEditor: props sectionHeading + compact mode
```

### Materiały źródłowe (PDF/DOCX/TXT)

```typescript
// 4-etapowy pipeline (każdy endpoint < 60s — Vercel Hobby limit):
// Stage 1: Direct upload z przeglądarki do Supabase Storage (omija Vercel 4.5MB body limit)
//          + POST /api/curriculum/register-document — JSON z metadanymi → DB record
// Stage 2: POST /api/curriculum/extract-text — download ze Storage + unpdf/mammoth + save text do DB
// Stage 3: POST /api/curriculum/extract-chunks — read text z DB + chunk + insert chunks (BEZ embeddingów)
// Stage 4: POST /api/curriculum/embed-chunks — embeddingi w pętli (max 5 batchy/call, frontend loop)
// POST /api/curriculum/suggest-topic (auto-detekcja tematu z AI)
// Pipeline: src/lib/documents/ (extract.ts, chunk.ts, process.ts)
// Chunking: fixed-size 2000 chars, 300 overlap, safeguard max 5000 chunków (auto-scale)
// DAL: src/lib/dal/source-documents.ts (CRUD + semantic search)
// DB: course_source_documents + course_source_chunks (HNSW index)
// Statusy: pending → processing → extracted → completed | failed
// embedChunks(docId, supabase?, maxBatches?) — default 5 (250 chunków/call)
// withRetry() — exponential backoff (max 2 retry) na OpenAI embedding API
// Partial save — embedding per batch, nie zbiorczy (odporność na awarie)
// Frontend: useFileUpload.ts — 4-stage pipeline + safeResponseJson() (obsługa non-JSON 504)
// Retry UI: przycisk "Ponów" (RotateCw) + retryEmbedding callback
// RPC: search_source_chunks_semantic(course_id, embedding, threshold, count)
// Storage bucket: course-materials (private, 50MB limit)
// course_source_documents.course_id nullable (upload przed utworzeniem kursu)
// Mentor tool: searchCourseMaterials (RAG z chunków materiałów)
// Checkbox "Uzupełnij danymi z internetu" - warunkowy Tavily search
// unpdf: extractText() dla PDF (serverless-friendly, zastępuje pdfjs-dist)
// mammoth: extractRawText({ buffer }) dla DOCX
// WAŻNE: serverExternalPackages w next.config.ts (mammoth)
// Przetestowane: 4.1MB PDF (174k słów) → 750 chunków, pełny pipeline < 3 min
```

### Shared Chat Utilities

```typescript
// src/components/chat/chat-utils.tsx
// uploadFile, AttachmentPreview, MessageFile, getMessageText, getMessageFiles
// Reused by MentorChat (full page) and InlineMentorChat (chapter panel)
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
- `GOOGLE_GENERATIVE_AI_API_KEY` (opcjonalnie, nieużywane - quizy przeniesione na OpenAI)
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
- **Szerokość treści:** `ContentContainer` (Wąski/Standard/Szeroki/Pełny) — `useContentWidth` hook + `localStorage: wm-content-width`
