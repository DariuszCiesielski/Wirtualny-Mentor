---
phase: 02-curriculum-generation
plan: 07
subsystem: ui
tags: [dashboard, course-list, multi-course, course-card]

# Dependency graph
requires:
  - phase: 02-05
    provides: Course detail page, DAL functions
provides:
  - Courses listing page at /courses
  - CourseCard component with progress display
  - formatDistanceToNow helper for Polish relative dates
  - Active sidebar link to /courses
affects: [dashboard-improvements, course-management]

# Tech tracking
tech-stack:
  added: []
  patterns: [responsive-grid, empty-state, relative-time]

key-files:
  created:
    - src/app/(dashboard)/courses/page.tsx
    - src/components/curriculum/course-card.tsx
  modified:
    - src/lib/utils.ts
    - src/components/layout/sidebar.tsx

key-decisions:
  - "Grid layout: 1/2/3 columns responsive"
  - "CourseCard shows progress bar only for active courses"
  - "formatDistanceToNow returns Polish strings (X min temu)"

patterns-established:
  - "Empty state pattern: icon + heading + description + CTA"
  - "Card grid: gap-6 md:grid-cols-2 lg:grid-cols-3"

# Metrics
duration: ~8min (interrupted, completed manually)
completed: 2026-01-31
---

# Phase 2 Plan 7: Multi-Course Dashboard Summary

**Lista kursow uzytkownika z progress info i mozliwoscia tworzenia nowych**

## Performance

- **Duration:** ~8 min (przerwane + manualne ukonczenie)
- **Started:** 2026-01-30T22:00:00Z
- **Completed:** 2026-01-31
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Strona /courses wyswietla wszystkie kursy uzytkownika w gridzie
- CourseCard z progress bar, badge statusu, szacowany czas
- Empty state zacheca do utworzenia pierwszego kursu
- formatDistanceToNow dla polskich dat (X min temu, Xh temu, X dni temu)
- Link "Moje kursy" aktywny w sidebar

## Task Commits

1. **Task 1+2: Courses page i CourseCard** - `e172098` (feat)

## Files Created/Modified

- `src/app/(dashboard)/courses/page.tsx` - Courses listing page
- `src/components/curriculum/course-card.tsx` - Course card with progress
- `src/lib/utils.ts` - Added formatDistanceToNow helper
- `src/components/layout/sidebar.tsx` - Activated /courses link

## Decisions Made

- **Responsive grid:** 1 col mobile → 3 cols desktop
- **Progress bar in card:** Tylko dla status='active'
- **Status badges:** draft/generating/active/completed/archived z roznymi wariantami

## Deviations from Plan

- Plan zakladal update dashboard z "Ostatnie kursy" - pominiety (nie krytyczny)
- TypeScript fix: requireAuth() returns User directly

## Issues Encountered

- Wave 4 przerwana bledem narzedzia
- Blad TypeScript: `{ user } = await requireAuth()` → `user = await requireAuth()`

## User Setup Required

None.

## Next Phase Readiness

- Uzytkownik moze zarzadzac wieloma kursami
- Nawigacja do kursow z sidebar dziala
- Gotowe do Phase 3 (Learning Materials) i Phase 4 (Quizzes)

---
*Phase: 02-curriculum-generation*
*Completed: 2026-01-31*
