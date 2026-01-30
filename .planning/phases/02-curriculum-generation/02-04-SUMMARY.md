---
phase: 02-curriculum-generation
plan: 04
subsystem: ai
tags: [ai-sdk, streaming, curriculum, openai, tavily, web-search]

# Dependency graph
requires:
  - phase: 02-02
    provides: curriculum schemas i typy
  - phase: 02-03
    provides: topic input i clarifying questions flow
provides:
  - Endpoint /api/curriculum/generate z streaming
  - CurriculumGenerator component z real-time progress
  - CurriculumPreview z accordion dla 5 poziomow
  - saveCurriculum server action
affects: [02-05, 02-06, 02-07]

# Tech tracking
tech-stack:
  added: [accordion, badge]
  patterns: [streaming-object-parsing, curriculum-generation-flow]

key-files:
  created:
    - src/app/api/curriculum/generate/route.ts
    - src/components/curriculum/curriculum-generator.tsx
    - src/components/curriculum/curriculum-preview.tsx
    - src/components/ui/accordion.tsx
    - src/components/ui/badge.tsx
  modified:
    - src/app/(dashboard)/courses/new/actions.ts
    - src/app/(dashboard)/courses/new/page.tsx

key-decisions:
  - "streamObject zamiast streamText dla structured curriculum output"
  - "Partial JSON parsing dla streaming preview"

patterns-established:
  - "Streaming object pattern: streamObject + manual buffer parsing dla partial UI"
  - "Curriculum save flow: transform AI schema -> DB schema -> saveCurriculumWithLevels"

# Metrics
duration: 8min
completed: 2026-01-30
---

# Phase 2 Plan 4: Curriculum Generation Summary

**Streaming curriculum generation endpoint z Tavily web search + Generator UI z real-time progress i Preview z accordion dla 5 poziomow**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-30T21:02:11Z
- **Completed:** 2026-01-30T21:10:01Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Endpoint /api/curriculum/generate z streaming structured output
- Web search dla aktualnych info i oficjalnych standardow nauczania (Tavily)
- CurriculumGenerator z real-time streaming progress dla kazdego z 5 poziomow
- CurriculumPreview z accordion, learning outcomes, rozdzialami i czasem
- saveCurriculum server action integrujacy AI output z baza danych
- Pelny flow: generate -> preview -> save -> redirect

## Task Commits

Each task was committed atomically:

1. **Task 1: Curriculum generation endpoint z web search** - `ce534eb` (feat)
2. **Task 2: Generator UI i preview components** - `88588b5` (feat)

## Files Created/Modified

- `src/app/api/curriculum/generate/route.ts` - Streaming curriculum generation endpoint z Tavily search
- `src/components/curriculum/curriculum-generator.tsx` - Generator UI z streaming progress display
- `src/components/curriculum/curriculum-preview.tsx` - Preview curriculum z accordion dla poziomow
- `src/app/(dashboard)/courses/new/actions.ts` - saveCurriculum server action
- `src/app/(dashboard)/courses/new/page.tsx` - Integracja generator + preview w flow
- `src/components/ui/accordion.tsx` - shadcn accordion component
- `src/components/ui/badge.tsx` - shadcn badge component

## Decisions Made

- **streamObject zamiast streamText**: AI SDK v6 streamObject daje structured JSON output z schema validation
- **Manual buffer parsing**: Streaming JSON wymaga partial parsing dla real-time UI - dodano recovery dla incomplete JSON
- **Graceful TAVILY_API_KEY handling**: Endpoint dziala bez Tavily (graceful degradation)
- **Transform function**: AI schema (camelCase) -> DB schema (snake_case) w saveCurriculum

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Usunieto maxTokens parameter**
- **Found during:** Task 1
- **Issue:** streamObject nie akceptuje maxTokens w AI SDK v6
- **Fix:** Usunieto parametr - domyslny limit wystarczajacy
- **Committed in:** ce534eb

**2. [Rule 3 - Blocking] Poprawiono Zod v4 error handling**
- **Found during:** Task 1
- **Issue:** error.errors nie istnieje w Zod v4, uzywa error.issues
- **Fix:** Zmieniono na error.issues
- **Committed in:** ce534eb

**3. [Rule 3 - Blocking] Dodano brakujace komponenty shadcn**
- **Found during:** Task 2
- **Issue:** Badge i Accordion nie byly zainstalowane
- **Fix:** npx shadcn add accordion badge
- **Committed in:** 88588b5

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** Wszystkie auto-fixy niezbedne dla poprawnego buildu. Brak scope creep.

## Issues Encountered

None - plan executed with minor API adjustments.

## User Setup Required

None - wykorzystuje istniejace TAVILY_API_KEY i OPENAI_API_KEY z poprzednich planow.

## Next Phase Readiness

- Curriculum generation flow kompletny
- Gotowe do 02-05 (Course detail page)
- Brak blockerow

---
*Phase: 02-curriculum-generation*
*Completed: 2026-01-30*
