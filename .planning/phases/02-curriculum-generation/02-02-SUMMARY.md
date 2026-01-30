---
phase: 02-curriculum-generation
plan: 02
subsystem: ai
tags: [tavily, web-search, zod, schemas, prompts, curriculum]

# Dependency graph
requires:
  - phase: 01-auth-basic-ui
    provides: Podstawowa struktura aplikacji i auth
  - phase: 02-01
    provides: AI providers i typy
provides:
  - Tavily web search client (searchWeb, extractUrls)
  - Curriculum Zod schemas z walidacja 5 poziomow
  - System prompts dla clarifying questions i curriculum generation
  - API endpoint /api/search
affects: [02-03, 02-04, 02-05, 03-fact-checking]

# Tech tracking
tech-stack:
  added: ["@tavily/core"]
  patterns: ["lazy-initialization", "structured-output-schemas"]

key-files:
  created:
    - src/lib/tavily/client.ts
    - src/lib/ai/curriculum/schemas.ts
    - src/lib/ai/curriculum/prompts.ts
    - src/app/api/search/route.ts
  modified:
    - package.json

key-decisions:
  - "Lazy initialization Tavily client dla unikniecia bledow build-time"
  - "5 poziomow curriculum: Poczatkujacy, Srednio zaawansowany, Zaawansowany, Master, Guru"
  - "Prompty w jezyku polskim"

patterns-established:
  - "Lazy initialization: Inicjalizacja klienta API przy pierwszym uzyciu zamiast na poziomie modulu"
  - "Curriculum structure: 5 poziomow z 3-7 learning outcomes i 3-10 rozdzialami kazdy"

# Metrics
duration: 8min
completed: 2026-01-30
---

# Phase 02 Plan 02: AI Tooling Summary

**Tavily web search client z lazy initialization i Zod schemas dla curriculum z 5 poziomami**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-30T20:32:17Z
- **Completed:** 2026-01-30T20:40:XX
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Tavily SDK zainstalowany i wrapper z searchWeb/extractUrls
- API endpoint /api/search z walidacja Zod
- Zod schemas dla curriculum (8 schemas, curriculumSchema wymaga 5 poziomow)
- System prompts w polskim dla clarifying questions i curriculum generation

## Task Commits

1. **Task 1: Tavily client i web search endpoint** - `5e9d9a8` (feat)
2. **Task 2: Curriculum Zod schemas i system prompts** - `81d5ca6` (feat)

## Files Created/Modified

- `src/lib/tavily/client.ts` - Tavily API wrapper z searchWeb i extractUrls
- `src/app/api/search/route.ts` - Web search endpoint z walidacja Zod
- `src/lib/ai/curriculum/schemas.ts` - 8 Zod schemas dla structured AI output
- `src/lib/ai/curriculum/prompts.ts` - 3 system prompts po polsku
- `package.json` - Dodany @tavily/core

## Decisions Made

1. **Lazy initialization Tavily client** - Klient Tavily inicjalizowany przy pierwszym wywolaniu funkcji zamiast na poziomie modulu. Zapobiega bledom build-time gdy TAVILY_API_KEY nie jest ustawiony.

2. **5 poziomow curriculum** - Ustalona struktura: Poczatkujacy, Srednio zaawansowany, Zaawansowany, Master, Guru. Schema wymaga dokladnie 5 poziomow (.length(5)).

3. **Prompty po polsku** - Wszystkie system prompts napisane w jezyku polskim zgodnie z zalozeniami projektu.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Lazy initialization Tavily client**
- **Found during:** Task 1 (build verification)
- **Issue:** Tavily SDK wyrzucal blad przy build-time gdy TAVILY_API_KEY nie byl ustawiony - inicjalizacja na poziomie modulu wykonywala sie podczas kompilacji
- **Fix:** Zmieniono na lazy initialization - getTavilyClient() tworzy klienta przy pierwszym uzyciu
- **Files modified:** src/lib/tavily/client.ts
- **Verification:** npm run build przechodzi bez bledow
- **Committed in:** 5e9d9a8

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix konieczny dla poprawnego buildu. Brak scope creep.

## Issues Encountered

None - po naprawie lazy initialization build przeszedl bez problemow.

## User Setup Required

**External services require manual configuration.** Uzytkownik musi:

1. Utworzyc konto na https://tavily.com
2. Skopiowac API key z dashboard
3. Dodac do `.env.local`:
   ```
   TAVILY_API_KEY=your_tavily_api_key
   ```

TAVILY_API_KEY jest juz w `.env.example` (dodany w Phase 0).

## Next Phase Readiness

- Tavily client gotowy do integracji z AI w Plan 03
- Schemas gotowe dla Output.object() w Vercel AI SDK
- Prompts gotowe do uzycia w generateObject()
- Brak blockerow

---
*Phase: 02-curriculum-generation*
*Completed: 2026-01-30*
