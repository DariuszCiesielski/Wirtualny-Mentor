---
phase: 02-curriculum-generation
plan: 05
subsystem: ui
tags: [curriculum, toc, collapsible, progress-tracking, navigation]

# Dependency graph
requires:
  - phase: 02-01
    provides: Database schema (courses, levels, chapters, progress)
  - phase: 02-04
    provides: DAL functions (getCourse, getProgress, getProgressStats)
provides:
  - Course detail page with full curriculum Table of Contents
  - LevelCard component with collapsible learning outcomes
  - ChapterList component with progress indicators
  - Navigation to individual chapters
affects: [02-06, 02-07, lesson-view, chapter-navigation]

# Tech tracking
tech-stack:
  added: [@radix-ui/react-collapsible]
  patterns: [collapsible-toc, progress-indicators, expandable-state]

key-files:
  created:
    - src/app/(dashboard)/courses/[courseId]/layout.tsx
    - src/app/(dashboard)/courses/[courseId]/page.tsx
    - src/components/curriculum/curriculum-toc.tsx
    - src/components/curriculum/level-card.tsx
    - src/components/curriculum/chapter-list.tsx
    - src/components/ui/collapsible.tsx
  modified: []

key-decisions:
  - "Default expand current level in TOC for immediate context"
  - "Use level_outcomes array for learning outcomes display"
  - "Progress indicators: green=completed, primary=current, muted=pending"

patterns-established:
  - "Collapsible TOC: expand/collapse state managed in parent CurriculumTOC"
  - "Progress visual feedback: consistent color coding across components"

# Metrics
duration: 5min
completed: 2026-01-30
---

# Phase 2 Plan 5: Curriculum TOC View Summary

**Strona kursu z pelnym spisem tresci, collapsible levels i progress indicators dla nawigacji po curriculum**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-30T21:12:27Z
- **Completed:** 2026-01-30T21:17:09Z
- **Tasks:** 2
- **Files modified:** 7 (6 created + 1 collapsible dependency)

## Accomplishments

- Strona /courses/[courseId] wyswietla pelna strukture kursu z meta info
- 5 poziomow jako collapsible cards z learning outcomes
- Rozdzialy maja progress indicators (completed/current/pending)
- Link "Kontynuuj nauke" nawiguje do aktualnego rozdzialu
- Domyslnie rozwiniety aktualny poziom dla natychmiastowego kontekstu

## Task Commits

Each task was committed atomically:

1. **Task 1: Course page i layout** - `ed1c1f0` (feat)
2. **Task 2: TOC components - LevelCard i ChapterList** - `703b6a1` (feat)

## Files Created/Modified

- `src/app/(dashboard)/courses/[courseId]/layout.tsx` - Server layout z auth i data fetching
- `src/app/(dashboard)/courses/[courseId]/page.tsx` - Course detail page z header i TOC
- `src/components/curriculum/curriculum-toc.tsx` - Kontener TOC z expandable state
- `src/components/curriculum/level-card.tsx` - Collapsible level card z outcomes
- `src/components/curriculum/chapter-list.tsx` - Lista rozdzialow z progress
- `src/components/ui/collapsible.tsx` - Radix collapsible wrapper (shadcn)

## Decisions Made

- **Default expand current level:** Uzytkownik widzi od razu gdzie jest w kursie
- **level_outcomes for learning outcomes:** Uzycie relacji z bazy zamiast embedded array
- **Progress color coding:** green=completed, primary=current, muted=pending - konsystentne w calej aplikacji

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Strona kursu gotowa do wyswietlania curriculum
- Linki do rozdzialow (/courses/[courseId]/[levelId]/[chapterId]) przygotowane
- Brakuje: strona rozdzialu (chapter page) dla faktycznego wyswietlania lekcji
- Ready for: Plan 02-06 (chapter view) i 02-07 (lesson content)

---
*Phase: 02-curriculum-generation*
*Completed: 2026-01-30*
