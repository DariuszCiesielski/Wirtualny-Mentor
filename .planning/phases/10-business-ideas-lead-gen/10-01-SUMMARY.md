---
phase: 10-business-ideas-lead-gen
plan: 01
subsystem: business-ideas
tags: [types, dal, navigation, lead-gen]
requires: [phase-09]
provides: [bookmarked-suggestions-dal, contact-cta, business-ideas-nav]
affects: [10-02]
tech-stack:
  added: []
  patterns: [postrest-join, nav-item-pattern]
key-files:
  created:
    - src/components/business-ideas/ContactCTA.tsx
  modified:
    - src/types/business-ideas.ts
    - src/lib/business-ideas/ideas-dal.ts
    - src/components/layout/sidebar.tsx
    - src/components/layout/mobile-nav.tsx
decisions: []
metrics:
  duration: ~3min
  completed: 2026-03-08
---

# Phase 10 Plan 01: Foundation (Types, DAL, Navigation, ContactCTA) Summary

DAL z PostgREST JOIN na courses/chapters, nawigacja Lightbulb w sidebar/mobile, ContactCTA do lead generation.

## What Was Done

### Task 1: Types + DAL

- Added `BookmarkedSuggestionWithContext` type with course/chapter context fields (course_title, chapter_title, level_id)
- Added `ContactInfo` type (email, phone, formUrl)
- Implemented `getBookmarkedSuggestions(userId, courseId?)` — queries business_suggestions with PostgREST JOIN on courses and chapters, maps to typed result, supports optional course filter
- Implemented `getCoursesWithBookmarks(userId)` — returns deduplicated list of courses that have bookmarked suggestions

### Task 2: Navigation + ContactCTA

- Added "Pomysly biznesowe" nav item with Lightbulb icon in both sidebar.tsx and mobile-nav.tsx (positioned after Notatki, before Profil)
- Created ContactCTA component — renders contact options (email, phone, form URL) with primary action button and disclaimer text

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| c326eb7 | feat(10-01): add types and DAL for bookmarked suggestions with context |
| 152aa4c | feat(10-01): add business ideas navigation and ContactCTA component |

## Verification

- `npm run build` passes
- Both new types exported from business-ideas.ts
- Both new DAL functions exported from ideas-dal.ts
- Lightbulb icon present in both sidebar and mobile-nav
- ContactCTA component exports correctly

## Next Phase Readiness

Plan 10-02 can proceed — all foundation artifacts are in place.
