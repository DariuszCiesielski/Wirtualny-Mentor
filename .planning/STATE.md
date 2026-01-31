# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-01-30)

**Core value:** Kazdy moze nauczyc sie czegokolwiek dzieki spersonalizowanemu, aktualnemu programowi nauczania z praktycznymi instrukcjami krok po kroku.
**Current focus:** Phase 3 - Learning Materials (IN PROGRESS)

## Current Position

Phase: 3 of 7 (Learning Materials) - IN PROGRESS
Plan: 3 of 4 in current phase - COMPLETED
Status: Plan 03-03 complete, ready for 03-04
Last activity: 2026-01-31 - Completed 03-03-PLAN.md (DAL & API Endpoint)

Progress: [████████░░] 48% (15/31 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 15
- Average duration: 10 min
- Total execution time: 2.6 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 00-foundation | 2/2 | 35 min | 17 min |
| 01-auth-basic-ui | 3/3 | 55 min | 18 min |
| 02-curriculum-generation | 7/7 | 57 min | 8 min |
| 03-learning-materials | 3/4 | 20 min | 7 min |

**Recent Trend:**
- Last 5 plans: 02-06 (8 min), 02-07 (8 min), 03-01 (6 min), 03-02 (6 min), 03-03 (8 min)
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

### Pending Todos

None yet.

### Blockers/Concerns

- Research needed: Prompt engineering dla metody sokratycznej (Phase 6)
- Research needed: Fact-checking automation (Phase 3)
- Cost monitoring: Setup complete in Phase 0, track real usage patterns going forward
- User setup: Supabase URL Configuration required (Site URL, Redirect URLs)
- User setup: Supabase Storage bucket 'avatars' required for avatar uploads
- User setup: Run curriculum migration in Supabase SQL Editor
- User setup: Run section_content migration in Supabase SQL Editor
- User setup: TAVILY_API_KEY required for web search

## Session Continuity

Last session: 2026-01-31
Stopped at: Completed 03-03-PLAN.md (DAL & API Endpoint)
Resume file: None
