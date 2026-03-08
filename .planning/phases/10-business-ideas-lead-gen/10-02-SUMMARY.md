---
phase: 10-business-ideas-lead-gen
plan: 02
subsystem: business-ideas-ui
tags: [react, next.js, shadcn, expand-collapse, filtering]

dependency-graph:
  requires: [10-01]
  provides: [business-ideas-page, idea-card, filter-sort]
  affects: []

tech-stack:
  added: []
  patterns: [optimistic-update, server-page-with-env, expand-collapse-cards]

key-files:
  created:
    - src/app/(dashboard)/business-ideas/page.tsx
    - src/components/business-ideas/BusinessIdeasClient.tsx
    - src/components/business-ideas/IdeaCard.tsx
  modified: []

decisions:
  - id: DEC-1002-01
    description: "Contact info read from server ENV (not NEXT_PUBLIC_) for security"
  - id: DEC-1002-02
    description: "Optimistic un-bookmark with rollback on failure, not pessimistic"
  - id: DEC-1002-03
    description: "IdeaCard uses same complexity colors and border-l-amber-500 as InlineSuggestion"

metrics:
  duration: ~2 min
  completed: 2026-03-08
---

# Phase 10 Plan 02: Business Ideas Page Summary

Strona /business-ideas z listą zapisanych pomysłów, filtrowaniem po kursie, sortowaniem, expand/collapse i CTA kontaktowym.

## What Was Built

### Server Page (`page.tsx`)
- Auth via `requireAuth()`, parallel DAL calls for suggestions + courses
- Contact info from server-only ENV vars (CONTACT_EMAIL, CONTACT_PHONE, CONTACT_FORM_URL)
- Wraps `BusinessIdeasClient` in `ContentContainer`

### BusinessIdeasClient
- State: items (optimistic), selectedCourseId, sortBy, expandedIds
- Filter by course (Select dropdown), sort by date/complexity
- First 3 cards expanded by default, reset on filter change
- Optimistic un-bookmark with rollback + toast on failure
- 3 empty states: no courses, no bookmarks, filter no results
- Disclaimer Alert with Info icon at top
- Item count Badge with Polish plural forms

### IdeaCard
- Visually consistent with InlineSuggestion (border-l-amber-500, bg-card/50, Lightbulb icon)
- Collapsed: title, 2-line description, complexity badge, source links, actions
- Expanded: full description, business potential section, ContactCTA
- Source links: clickable course + chapter links
- Actions: expand/collapse, go to lesson, remove bookmark
- "Chcesz to omówić?" teaser in collapsed state

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| 2f860fa | feat(10-02): server page + BusinessIdeasClient with filters and empty states |
| 049132f | feat(10-02): IdeaCard with expand/collapse, source links, and ContactCTA |

## Verification

- `npm run build` passes without errors
- `/business-ideas` route visible in build output
- IdeaCard imports ContactCTA correctly
- Lesson links use level_id in URL path

## Next Phase Readiness

No blockers. Phase 10 complete (2/2 plans done).
