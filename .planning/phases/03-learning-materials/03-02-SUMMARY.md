---
phase: 03-learning-materials
plan: 02
subsystem: ai
tags: [ai-sdk, tavily, prompts, tools, web-search, material-generation]

# Dependency graph
requires:
  - phase: 02-curriculum-generation
    provides: AI orchestration, Tavily client, model providers
  - phase: 03-01
    provides: Material content schemas
provides:
  - System prompts for grounded material generation
  - AI SDK tools for web search and content extraction
  - MATERIAL_GENERATION_PROMPT with citation rules
  - RESEARCH_SYSTEM_PROMPT for resource gathering
  - TRANSLATION_PROMPT for EN->PL conversion
affects: [03-03-material-generation, 03-04-content-rendering]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AI SDK v6 tool definition with inputSchema
    - Multi-step tool calling for grounded generation

key-files:
  created:
    - src/lib/ai/materials/prompts.ts
    - src/lib/ai/materials/tools.ts
  modified: []

key-decisions:
  - "AI SDK v6 inputSchema zamiast parameters dla tool definition"
  - "Prompt wymaga interpretacji wynikow dla kazdego praktycznego przykladu"

patterns-established:
  - "Tool error handling z success flag pattern"
  - "Unique source IDs z timestamp + index"

# Metrics
duration: 6min
completed: 2026-01-31
---

# Phase 3 Plan 2: AI Tools i Prompts Summary

**System prompts dla grounded material generation z Tavily web search tools i wymaganiem interpretacji wynikow praktycznych**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-31T06:03:56Z
- **Completed:** 2026-01-31T06:09:37Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- Prompty dla AI material generation z cytatami i interpretacja wynikow
- AI SDK tools do wyszukiwania zasobow edukacyjnych przez Tavily
- Tools do ekstrakcji tresci z URL-i
- Grounding pattern zapobiegajacy halucynacjom URL-i

## Task Commits

Each task was committed atomically:

1. **Task 1: Prompts dla material generation** - `4b7ed5f` (feat)
2. **Task 2: AI SDK tools dla web search** - `9792757` (feat)

## Files Created/Modified
- `src/lib/ai/materials/prompts.ts` - System prompts: RESEARCH, MATERIAL_GENERATION, TRANSLATION, CONTENT_GENERATION_USER
- `src/lib/ai/materials/tools.ts` - searchResourcesTool, extractContentTool, materialGenerationTools

## Decisions Made
- AI SDK v6 uzywa `inputSchema` zamiast `parameters` dla tool definition
- Explicit type annotations dla execute function parameters (TypeScript strictness)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fix AI SDK v6 tool syntax**
- **Found during:** Task 2 (AI SDK tools)
- **Issue:** Plan uzyl `parameters` z AI SDK v5 syntax, ale projekt uzywa AI SDK v6 ktory wymaga `inputSchema`
- **Fix:** Zmieniono `parameters` na `inputSchema`, dodano explicit type annotations
- **Files modified:** src/lib/ai/materials/tools.ts
- **Verification:** `npx tsc --noEmit` przechodzi bez bledow
- **Committed in:** 9792757 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix niezbedny dla kompilacji TypeScript. Brak scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Prompty i tools gotowe do uzycia w generation endpoint
- Kolejny plan: 03-03 implementuje API route i lazy generation

---
*Phase: 03-learning-materials*
*Completed: 2026-01-31*
