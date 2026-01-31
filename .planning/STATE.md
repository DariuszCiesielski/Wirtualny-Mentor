# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-01-30)

**Core value:** Kazdy moze nauczyc sie czegokolwiek dzieki spersonalizowanemu, aktualnemu programowi nauczania z praktycznymi instrukcjami krok po kroku.
**Current focus:** Phase 7 - Polish & Optimization (IN PROGRESS)

## Current Position

Phase: 7 of 7 (Polish & Optimization)
Plan: 3 of 4 in current phase
Status: In Progress
Last activity: 2026-01-31 - Completed 07-01-PLAN.md (Responsive Dashboard)

Progress: [██████████████████] 97% (32/33 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 32
- Average duration: 7 min
- Total execution time: 3.9 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 00-foundation | 2/2 | 35 min | 17 min |
| 01-auth-basic-ui | 3/3 | 55 min | 18 min |
| 02-curriculum-generation | 7/7 | 57 min | 8 min |
| 03-learning-materials | 5/5 | 32 min | 6 min |
| 04-assessment-system | 4/4 | 18 min | 5 min |
| 05-notes-system-embeddings | 5/5 | 12 min | 2 min |
| 06-mentor-chatbot | 3/3 | 14 min | 5 min |
| 07-polish-optimization | 3/4 | 12 min | 4 min |

**Recent Trend:**
- Last 5 plans: 06-01 (3 min), 06-02 (4 min), 06-03 (7 min), 07-02 (3 min), 07-01 (4 min)
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
- Notes UI: Optimistic updates with useState for instant feedback
- Notes search: Bound server action pattern for search with courseId
- Mentor prompts: Socratic method with strict NIGDY/ZAWSZE rules
- Tool factory pattern: Context injection (userId, courseId) for per-session binding
- RAG threshold: 0.5 for better recall in chatbot context (vs 0.7 default)
- Chat API pattern: Auth + course ownership verification before streaming
- Chat API: Edge runtime for better streaming performance
- AI SDK v6 useChat: Use 'messages' prop (not deprecated 'initialMessages')
- Helicone integration: Gateway proxy pattern with conditional config (no overhead when disabled)
- Helicone: Factory functions (createAnthropic etc.) for baseURL override support
- Responsive breakpoint: lg (1024px) for sidebar visibility - tablet landscape cutoff

### Pending Todos

None yet.

### Blockers/Concerns

- RESOLVED: Prompt engineering dla metody sokratycznej (06-01 complete)
- Research needed: Fact-checking automation (addressed via grounded generation in Phase 3)
- Cost monitoring: Setup complete in Phase 0, track real usage patterns going forward
- User setup: Supabase URL Configuration required (Site URL, Redirect URLs)
- User setup: Supabase Storage bucket 'avatars' required for avatar uploads
- User setup: Run curriculum migration in Supabase SQL Editor
- User setup: Run section_content migration in Supabase SQL Editor
- User setup: TAVILY_API_KEY required for web search
- User setup: Run quizzes_schema migration in Supabase SQL Editor
- User setup: Run notes_schema migration in Supabase SQL Editor (includes RPC function)
- User setup: HELICONE_API_KEY optional for cost monitoring dashboard

## Session Continuity

Last session: 2026-01-31
Stopped at: Completed 07-01-PLAN.md (Responsive Dashboard)
Resume file: None
