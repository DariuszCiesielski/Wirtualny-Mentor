# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-01-30)

**Core value:** Kazdy moze nauczyc sie czegokolwiek dzieki spersonalizowanemu, aktualnemu programowi nauczania z praktycznymi instrukcjami krok po kroku.
**Current focus:** Phase 2 - Curriculum Generation (NEXT)

## Current Position

Phase: 1 of 7 (Auth & Basic UI) - COMPLETE
Plan: 3 of 3 in current phase - COMPLETE
Status: Phase complete
Last activity: 2025-01-30 - Completed 01-03-PLAN.md

Progress: [█████░░░░░] 35% (5/14 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 18 min
- Total execution time: 1.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 00-foundation | 2/2 | 35 min | 17 min |
| 01-auth-basic-ui | 3/3 | 55 min | 18 min |

**Recent Trend:**
- Last 5 plans: 00-02 (20 min), 01-01 (12 min), 01-02 (18 min), 01-03 (25 min)
- Trend: Stable

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

### Pending Todos

None yet.

### Blockers/Concerns

- Research needed: Prompt engineering dla metody sokratycznej (Phase 6)
- Research needed: Fact-checking automation (Phase 3)
- Cost monitoring: Setup complete in Phase 0, track real usage patterns going forward
- User setup: Supabase URL Configuration required (Site URL, Redirect URLs)
- User setup: Supabase Storage bucket 'avatars' required for avatar uploads

## Session Continuity

Last session: 2025-01-30 17:00
Stopped at: Completed 01-03-PLAN.md (Dashboard Profile) - Phase 1 COMPLETE
Resume file: None
