---
phase: 09-business-suggestions
plan: 03
subsystem: business-suggestions-ui
tags: [react, shadcn-ui, content-renderer, inline-suggestion, chapter-integration]
dependency-graph:
  requires: [09-01, 09-02]
  provides: [business-suggestion-ui, inline-suggestion-rendering, generate-button]
  affects: [10-business-ideas]
tech-stack:
  added: []
  patterns: [findSectionSuggestion-fuzzy-match, suggestion-fallback-rendering]
key-files:
  created:
    - src/components/business-ideas/InlineSuggestion.tsx
    - src/components/business-ideas/GenerateSuggestionButton.tsx
  modified:
    - src/components/materials/content-renderer.tsx
    - src/components/materials/chapter-content.tsx
    - src/app/(dashboard)/courses/[courseId]/[levelId]/[chapterId]/page.tsx
    - src/app/(dashboard)/courses/[courseId]/[levelId]/[chapterId]/components/chapter-page-client.tsx
    - src/app/(dashboard)/courses/[courseId]/[levelId]/[chapterId]/components/chapter-content-with-chat.tsx
decisions: []
metrics:
  duration: ~8 min
  completed: 2026-03-08
---

# Phase 9 Plan 3: UI Components & Chapter Integration Summary

Komponenty UI sugestii biznesowych z pełną integracją w widoku lekcji — od server component (page.tsx) przez cały łańcuch komponentów do inline renderingu przy nagłówkach h2.

## Completed Tasks

### Task 1: InlineSuggestion + GenerateSuggestionButton

| Commit | Description |
|--------|-------------|
| 3e56671 | feat(09-03): add InlineSuggestion and GenerateSuggestionButton components |

**InlineSuggestion.tsx:**
- Compact card z amber border-left, nagłówek z Lightbulb icon + Badge complexity (prosty/średni/złożony z kolorami)
- Expandable "Potencjał biznesowy" section (ChevronDown/Up)
- 3 action buttons: Zapisz (bookmark toggle), Ukryj (dismiss), Odśwież (conditional)
- Profile callout z linkiem do /onboarding gdy brak profilu biznesowego
- fade-in animation, TooltipProvider

**GenerateSuggestionButton.tsx:**
- Outline button z Lightbulb icon, responsive text (mobile skrócony)
- Disabled states: brak treści, limit wyczerpany, w trakcie generowania
- Tooltip messages dla disabled states
- Daily limit counter "Pozostało X/5 na dziś"

### Task 2: Integration with content-renderer + chapter page

| Commit | Description |
|--------|-------------|
| e3cf2eb | feat(09-03): integrate business suggestions with content-renderer and chapter page |

**content-renderer.tsx:**
- `findSectionSuggestion()` — exact + fuzzy heading match (reuses stripHeadingNumber pattern)
- InlineSuggestion rendered after images/notes at matching h2
- 6 new props: suggestion, onBookmarkSuggestion, onDismissSuggestion, onRefreshSuggestion, showSuggestionRefresh, hasBusinessProfile

**page.tsx (server):**
- Parallel fetch: getSuggestion(chapterId) + getBusinessProfile()
- Passes initialSuggestion, hasBusinessProfile, profileVersion to client

**chapter-page-client.tsx → chapter-content-with-chat.tsx → chapter-content.tsx:**
- Full prop chain: initialSuggestion, hasBusinessProfile, profileVersion
- chapter-content.tsx: useChapterSuggestion hook integration
- GenerateSuggestionButton in metadata header area (beside "Regeneruj lekcję")
- Fallback rendering: InlineSuggestion at top of article when no h2 matches
- showSuggestionRefresh: compares suggestion.profile_version with current profileVersion
- suggestionMatchesH2 memo: checks if suggestion's relevant_section matches any h2 in content

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit` — passed (0 errors)
- `npm run build` — production build successful
- All routes compile correctly

## Next Phase Readiness

Phase 09 complete (3/3 plans). All business suggestions infrastructure ready:
- 09-01: DB schema + types + DAL
- 09-02: API endpoint + client hook
- 09-03: UI components + chapter integration

Ready for Phase 10 (Business Ideas & Lead Gen) which builds on saved suggestions.
