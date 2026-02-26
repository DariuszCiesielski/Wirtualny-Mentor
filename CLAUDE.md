# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projekcie

Wirtualny Mentor - personalizowana platforma edukacyjna z AI generująca kompleksowe programy nauczania. Użytkownik podaje temat, AI zadaje pytania doprecyzowujące, następnie tworzy strukturyzowany kurs od poziomu Początkujący do Guru z materiałami, quizami i chatbotem-mentorem.

**Status:** Projekt zakończony (7 faz, 33 plany) + materiały źródłowe (PDF/DOCX/TXT) + Focus Panel + Gamification + Lesson Images

## Stack

Next.js 16 (App Router, Turbopack) | React 19 | TypeScript strict | Tailwind CSS v4 | shadcn/ui (New York, Zinc) | Supabase (PostgreSQL + pgvector + RLS + Storage) | Vercel AI SDK v6 | Zod 4 | unpdf | mammoth | sonner (toasts) | Web Audio API

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
- `src/lib/images/` - Providerzy obrazów (kie.ai, DALL-E, Unsplash) + AI Planner
- `src/lib/focus/` - Audio manager, presets, focus DAL (server actions)
- `src/lib/gamification/` - Points, achievements, DAL
- `src/components/focus/` - Focus Panel UI (Pomodoro, sounds, focus mode)
- `src/components/gamification/` - Points badge, achievements list, toast
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

### Focus Panel (Pomodoro + Sounds + Focus Mode)

```typescript
// FocusShell (provider) wraps DashboardLayout; FocusContentArea reaguje na focus mode
// FocusContext: centralny provider (pomodoro + sounds + focusMode + stats + customSounds)
// useFocusContextSafe(): zwraca null poza providerem (bezpieczny dla header/sidebar)
// Pomodoro: usePomodoro (reducer + timestamp-based timer, 250ms tick, stateRef inside interval)
// sessionIdRef pattern: zapobiega cyklicznej referencji pomodoro → focus-context
// Audio: Web Audio API singleton — getAudioManager() (lazy, SSR-safe)
// Binaural beats: synteza (Gamma 40Hz, Alpha 10Hz, Theta 6Hz), Ambient: MP3 z public/sounds/
// startAmbient(id, filenameOrUrl): http → URL, inaczej → /sounds/{filename}
// Focus mode: ukrywa sidebar (-translate-x-full), zmniejsza header (h-10), lg:pl-0
// useFocusMode: localStorage + useSyncExternalStore (SSR-compatible)
// Stats: RPC get_focus_stats_today (Supabase), useFocusStats hook
// Break reminder: sonner toast po zakończeniu work session
// DB: focus_sessions + trigger auto-duration + RLS
// DAL: src/lib/focus/focus-dal.ts (createFocusSession, completeFocusSession, cancelFocusSession)
```

### Custom Ambient Sounds Upload

```typescript
// Upload MP3 do Supabase Storage bucket `ambient-sounds` (per user, max 5MB)
// API: POST /api/focus/upload-sound (multipart), GET /api/focus/custom-sounds, DELETE ?slotId=
// useCustomSounds hook: upload/remove/getCustomUrl + auto-refresh signed URLs co 50min
// DB: user_ambient_sounds (user_id, slot_id, storage_path, original_name, UNIQUE)
// SoundMixer: upload button per slot + badge "Własny" + reset do domyślnego
// useFocusSounds: parametr getCustomUrl (custom URL nadpisuje domyślny plik)
```

### Gamification (Points + Achievements)

```typescript
// 6 reguł punktowych: chapter_complete(10), level_complete(50), course_complete(200),
//   quiz_passed(15), quiz_perfect(+10 bonus), pomodoro_complete(5)
// 13 odznak w 4 kategoriach: learning, quiz, focus, streak
// Integracja fire-and-forget: awardPoints().catch(() => {}), checkAchievements().catch(() => {})
// Idempotency: awardPoints sprawdza duplikat przed insertem (action_type + reference_id)
// checkAchievements: level_complete → COUNT completed_levels, streak → consecutive days
// PointsBadge: Zap icon w headerze, getUserTotalPoints RPC
// AchievementsList: 13 odznak, 4 kategorie, progress bars
// AchievementToast: sonner toast na odblokowanie
// DB: achievements (seed 13) + user_achievements + user_points_log + RLS
// DAL: src/lib/gamification/gamification-dal.ts (server actions)
// Hookpoints: progress.ts (chapter/level/course), quizzes.ts (pass/perfect), focus-dal.ts (pomodoro)
```

### Lesson Images (Premium — AI + Stock Photos)

```typescript
// Hybryda: AI Image Planner (GPT-4o-mini) analizuje lekcję i wybiera 1-2 sekcje do zilustrowania
// Decyzja per sekcja: stock_photo (Unsplash) vs ai_generated (kie.ai → DALL-E 3 fallback)
// Auto-trigger po załadowaniu lekcji (premium only) + on-demand per sekcja (przycisk ImagePlus)
// Feature gating: canAccessPremiumFeature() → admin role (docelowo subscription tiers)
// Providers: src/lib/images/ (kie-ai.ts, dalle.ts, unsplash.ts, providers.ts, planner.ts)
// kie.ai model chain: Nano Banana Pro (Gemini 3.0 Pro, $0.09, 2K) → 4o Image (GPT-Image-1, $0.03)
// kie.ai APIs: Jobs API (/api/v1/jobs/createTask + /recordInfo) + legacy 4o API (/gpt4o-image/)
// DALL-E 3: sync OpenAI API, ~$0.04/image, reuse OPENAI_API_KEY (external fallback)
// Unsplash: search + download, attribution "Photo by X on Unsplash" (wymagane)
// Planner: generateObject() z GPT-4o-mini, Zod schema, max 2 obrazy, truncate 4000 chars
// DAL: src/lib/dal/lesson-images.ts (getLessonImages, saveLessonImage, signed URLs 1h)
// Storage: bucket lesson-images (private, 10MB, path: {userId}/{chapterId}/{uuid}.ext)
// API SSE: POST /api/materials/generate-images (maxDuration: 120, events: planning→generating→image_ready→complete)
// API on-demand: POST /api/materials/generate-image (sync JSON response)
// Frontend: useChapterImages hook (SSE listener + on-demand generateImage)
// Server: page.tsx → getLessonImagesBySection() → initialImages (persystencja po refresh)
// ContentRenderer: h2 → SectionImage | SectionImageSkeleton | GenerateImageButton
// DB: lesson_images (chapter_id, section_heading, image_type, provider, storage_path, alt_text)
// RLS: chapters → course_levels → courses ownership chain
// Env: KIE_AI_API_KEY, UNSPLASH_ACCESS_KEY (opcjonalne, graceful degradation)
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
// Sanityzacja tekstu: sanitizeForPostgres() w extract.ts — usuwa \u0000, C0 control chars
// Persist: useFileUpload ładuje niezlinkowane dokumenty z DB przy mount (przetrwają F5)
// Retry UI: przycisk "Ponów" (RotateCw) + retryProcessing (od dowolnego etapu)
// Remove: removeFile kasuje z DB + Storage (deleteDocumentFromDB, fire-and-forget)
// extract-chunks idempotentny: usuwa stare chunki przed ponownym insertem
// RPC: search_source_chunks_semantic(course_id, embedding, threshold, count)
// Storage bucket: course-materials (private, 50MB limit)
// course_source_documents.course_id nullable (upload przed utworzeniem kursu)
// Mentor tool: searchCourseMaterials (RAG z chunków materiałów)
// Checkbox "Uzupełnij danymi z internetu" - warunkowy Tavily search
// unpdf: extractText() dla PDF (serverless-friendly, zastępuje pdfjs-dist)
// mammoth: extractRawText({ buffer }) dla DOCX
// WAŻNE: serverExternalPackages w next.config.ts (mammoth)
// Przetestowane: 4.1MB PDF (174k słów) → 750 chunków, pełny pipeline < 3 min
// Przetestowane: 36-49MB PDF — sanityzacja Unicode, retry, persist, usuwanie z DB
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
- `KIE_AI_API_KEY` (kie.ai — generowanie grafik AI)
- `UNSPLASH_ACCESS_KEY` (Unsplash — stock photos)

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
