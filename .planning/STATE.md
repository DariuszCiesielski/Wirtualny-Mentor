# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-01-30)

**Core value:** Kazdy moze nauczyc sie czegokolwiek dzieki spersonalizowanemu, aktualnemu programowi nauczania z praktycznymi instrukcjami krok po kroku.
**Current focus:** Phase 5 - Notes System & Embeddings (IN PROGRESS)

## Current Position

Phase: 5 of 7 (Notes System & Embeddings)
Plan: 3 of 5 in current phase - COMPLETE
Status: In progress - Phase 5
Last activity: 2026-01-31 - Completed 05-03-PLAN.md (Notes DAL & Server Actions)

Progress: [████████████░] 74% (23/31 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 23
- Average duration: 8 min
- Total execution time: 3.2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 00-foundation | 2/2 | 35 min | 17 min |
| 01-auth-basic-ui | 3/3 | 55 min | 18 min |
| 02-curriculum-generation | 7/7 | 57 min | 8 min |
| 03-learning-materials | 5/5 | 32 min | 6 min |
| 04-assessment-system | 4/4 | 18 min | 5 min |
| 05-notes-system-embeddings | 3/5 | 4 min | 1 min |

**Recent Trend:**
- Last 5 plans: 04-02 (3 min), 04-03 (5 min), 04-04 (7 min), 05-02 (1 min), 05-03 (3 min)
- Trend: Consistent fast execution

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Stack: Next.js (zamiast Vite) dla natywnego streaming AI i SSR
- AI: Multi-model strategy (Claude/GPT/Gemini) z Vercel AI SDK
- Search: Tavily API dla web search (RAG-optimized)
- Vector DB: pgvector w Supabase (brak osobnej vector DB)
- Zod v4: z.record(key, value) syntax dla walidacji
- AI types: Centralne w src/types/ai.ts
- Test model: Using GPT-4.1 (curriculum) for testing - OpenAI key available
- Auth pattern: Middleware ONLY refreshes session, auth verification in DAL (CVE-2025-29927)
- Supabase auth: Use getUser() not getSession() for server-side (token revalidation)
- UI: shadcn/ui New York style with Zinc palette, Tailwind v4 dark mode
- Auth forms: Server Component + Client Form pattern (unika hydration issues)
- Form errors: Zod flatten().fieldErrors dla per-field validation errors
- Mock auth: USE_MOCK_AUTH=true dla local development bez Supabase
- Avatar storage: Supabase Storage bucket 'avatars' z public access
- Course levels: 5 fixed Polish names (Poczatkujacy -> Guru)
- Completion tracking: UUID arrays instead of join tables
- RLS nested tables: Via course_id EXISTS join pattern
- Lazy initialization: Tavily client inicjalizowany przy pierwszym uzyciu (build-time safety)
- Curriculum schemas: curriculumSchema.levels.length(5) wymaga dokladnie 5 poziomow
- AI SDK v6 chat: DefaultChatTransport zamiast api prop, UIMessage.parts zamiast content, sendMessage({ text })
- Streaming object: streamObject dla structured AI output, manual buffer parsing dla partial UI
- Materials versioning: UNIQUE(chapter_id, version) dla regeneracji bez utraty starej wersji
- JSONB structured data: key_concepts, practical_steps, tools, external_resources, sources jako JSONB
- AI SDK v6 tools: inputSchema zamiast parameters dla tool definition
- AI SDK v6 tool calling: stopWhen: stepCountIs(N) dla multi-step, toolResult.output zamiast result
- Markdown rendering: react-markdown + remark-gfm + rehype-highlight z github-dark theme
- Lazy generation: Server passes initialContent, client fetches only when null
- Quiz JSONB: questions stored as JSONB array for flexibility
- Quiz parent CHECK: exactly one of chapter_id or level_id must be NOT NULL
- Bloom taxonomy: Question classification using remembering/understanding/applying/analyzing
- Quiz generation: Gemini 2.0 Flash for fast, cheap quiz generation
- Server-side scoring: Anti-cheat pattern - correct answers never sent to client
- Auto level unlock: Automatic progression when level test passed
- Quiz state machine: useReducer with discriminated union for complex UI flows
- Level unlock: First level always accessible, subsequent require test pass or skip
- Skip tracking: unlockType: 'manual_skip' for analytics
- Embedding pattern: generateEmbedding/generateEmbeddings from embeddings.ts with AI SDK
- Notes embedding: Sync generation at write time (createNote/updateNote)
- Notes DAL pattern: Dual search (fulltext for UI, semantic for RAG)
- RPC SECURITY DEFINER: For vector search bypass RLS in trusted context

### Pending Todos

None yet.

### Blockers/Concerns

- Research needed: Prompt engineering dla metody sokratycznej (Phase 6)
- Research needed: Fact-checking automation (addressed via grounded generation in Phase 3)
- Cost monitoring: Setup complete in Phase 0, track real usage patterns going forward
- User setup: Supabase URL Configuration required (Site URL, Redirect URLs)
- User setup: Supabase Storage bucket 'avatars' required for avatar uploads
- User setup: Run curriculum migration in Supabase SQL Editor
- User setup: Run section_content migration in Supabase SQL Editor
- User setup: TAVILY_API_KEY required for web search
- User setup: Run quizzes_schema migration in Supabase SQL Editor
- User setup: Run notes_schema migration in Supabase SQL Editor (includes RPC function)

## Session Continuity

Last session: 2026-01-31
Stopped at: Completed 05-03-PLAN.md (Notes DAL & Server Actions)
Resume file: None
