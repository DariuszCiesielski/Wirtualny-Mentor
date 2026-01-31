---
phase: 04-assessment-system
plan: 01
subsystem: database
tags: [postgresql, supabase, rls, zod, typescript, quiz]

# Dependency graph
requires:
  - phase: 02-curriculum-generation
    provides: courses, course_levels, chapters tables
provides:
  - quizzes table with JSONB questions
  - quiz_attempts table for result tracking
  - level_unlocks table for progression gating
  - TypeScript types for quiz entities
  - Zod schemas for AI quiz generation
affects: [04-02, 04-03, 04-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "JSONB questions storage with TypeScript interfaces"
    - "Discriminated union for question types (multiple_choice, true_false)"
    - "Row/Application type separation (snake_case/camelCase)"

key-files:
  created:
    - supabase/migrations/20260131100001_quizzes_schema.sql
    - src/types/quiz.ts
    - src/lib/ai/quiz/schemas.ts
  modified: []

key-decisions:
  - "JSONB for questions array (flexible, no join overhead)"
  - "CHECK constraint for exactly one parent (chapter_id XOR level_id)"
  - "Bloom's taxonomy classification for question difficulty assessment"

patterns-established:
  - "Quiz question with wrongExplanations map for each option"
  - "Remediation content structure for failed attempts"
  - "Zod .describe() annotations for AI generation guidance"

# Metrics
duration: 3min
completed: 2026-01-31
---

# Phase 4 Plan 01: Quiz Schema and Types Summary

**Database schema with quizzes/attempts/unlocks tables, TypeScript types, and Zod schemas for AI quiz generation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-31T07:18:58Z
- **Completed:** 2026-01-31T07:21:57Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- Created 3-table quiz system with RLS policies via course ownership
- TypeScript types with Row (snake_case) and Application (camelCase) variants
- Zod schemas with discriminated unions for multiple_choice and true_false questions
- Bloom's taxonomy integration for pedagogical question classification

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration dla quiz schema** - `49cd88e` (feat)
2. **Task 2: TypeScript types i Zod schemas** - `b28069b` (feat)

## Files Created/Modified
- `supabase/migrations/20260131100001_quizzes_schema.sql` - Quiz tables, RLS, indexes
- `src/types/quiz.ts` - Quiz, QuizAttempt, LevelUnlock types with input/result types
- `src/lib/ai/quiz/schemas.ts` - Zod schemas for AI generation validation

## Decisions Made
- JSONB for questions array - flexible schema, no join overhead for question retrieval
- CHECK constraint ensures exactly one parent (chapter_id XOR level_id) per quiz
- Bloom's taxonomy levels (remembering, understanding, applying, analyzing) for question classification
- Remediation content stored in quiz_attempts for failed attempt feedback

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Database migration required.** Run the following in Supabase SQL Editor:
- `supabase/migrations/20260131100001_quizzes_schema.sql`

## Next Phase Readiness
- Schema ready for quiz generation service (04-02)
- Types and schemas ready for AI integration
- RLS policies configured for user data isolation

---
*Phase: 04-assessment-system*
*Completed: 2026-01-31*
