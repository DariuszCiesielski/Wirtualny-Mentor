---
phase: 02-curriculum-generation
plan: 01
subsystem: database
tags: [supabase, postgresql, rls, uuid, typescript, dal]

# Dependency graph
requires:
  - phase: 01-auth-basic-ui
    provides: auth.users table, Supabase integration, DAL pattern
provides:
  - Database schema for courses, levels, outcomes, chapters, progress
  - TypeScript types for all curriculum entities
  - DAL functions for course CRUD and progress tracking
  - RLS policies for user data isolation
affects: [02-curriculum-generation, 03-fact-checking, 05-progress-tracking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Multi-table RLS with course_id join pattern"
    - "Nested Supabase select with relations"
    - "UUID array for completed_chapters/completed_levels"

key-files:
  created:
    - supabase/migrations/20260130000001_courses_schema.sql
    - src/types/database.ts
    - src/lib/dal/courses.ts
    - src/lib/dal/progress.ts
  modified: []

key-decisions:
  - "5 fixed levels: Poczatkujacy -> Srednio zaawansowany -> Zaawansowany -> Master -> Guru"
  - "RLS via course_id join for nested tables (levels, chapters, outcomes)"
  - "UUID arrays for tracking completion instead of join tables"
  - "Automatic updated_at/last_activity_at via PostgreSQL triggers"

patterns-established:
  - "DAL pattern: async functions with createClient() from @/lib/supabase/server"
  - "Error handling: throw new Error with descriptive messages"
  - "Nested selects: course -> levels -> outcomes/chapters via Supabase relations"

# Metrics
duration: 5min
completed: 2026-01-30
---

# Phase 02 Plan 01: Curriculum Database Schema Summary

**6 tabel PostgreSQL z 24 RLS policies + TypeScript DAL dla course CRUD i progress tracking**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-30T20:32:36Z
- **Completed:** 2026-01-30T20:37:35Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments

- Kompletny schemat bazy danych dla curriculum (6 tabel)
- 24 RLS policies dla pelnej izolacji danych uzytkownikow
- TypeScript types dla wszystkich encji bazy danych
- DAL z 12 funkcjami dla course CRUD i progress tracking
- Triggery dla automatycznych timestampow

## Task Commits

1. **Task 1: Database migration dla curriculum schema** - `25289ed` (feat)
2. **Task 2: DAL dla course operations i progress tracking** - `2c5d220` (feat)

## Files Created/Modified

- `supabase/migrations/20260130000001_courses_schema.sql` - 6 tabel, RLS, indexy, triggery
- `src/types/database.ts` - TypeScript types dla Course, CourseLevel, Chapter, UserProgress, etc.
- `src/lib/dal/courses.ts` - createCourse, saveCurriculumWithLevels, getCourse, getUserCourses, updateCourseStatus, deleteCourse
- `src/lib/dal/progress.ts` - getProgress, updateProgress, markChapterComplete, moveToNextChapter, calculateProgressPercentage, getProgressStats

## Decisions Made

1. **5 stalych poziomow w jezyku polskim** - Poczatkujacy, Srednio zaawansowany, Zaawansowany, Master, Guru - zamiast dynamicznych level names, dla spojnosci UI
2. **UUID arrays dla completion tracking** - `completed_chapters UUID[]` zamiast join table - prostsze queries i atomowe updates
3. **RLS via course_id join** - Nested tables (levels, outcomes, chapters) sprawdzaja ownership przez `EXISTS (SELECT 1 FROM courses WHERE ...)`
4. **ON DELETE CASCADE** - Usuwanie kursu automatycznie usuwa wszystkie nested data

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration:**
- Run migration in Supabase Dashboard -> SQL Editor
- Execute contents of `supabase/migrations/20260130000001_courses_schema.sql`

## Next Phase Readiness

- Schemat gotowy do uzycia przez curriculum generation API
- DAL funkcje gotowe do integracji z server actions
- TypeScript types moga byc importowane w komponentach
- Brakuje: API routes dla curriculum generation, UI komponenty

---
*Phase: 02-curriculum-generation*
*Completed: 2026-01-30*
