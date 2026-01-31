---
phase: 03-learning-materials
plan: 05
subsystem: materials-display
tags: [chapter-page, lazy-generation, react, ui]
completed: 2026-01-31

dependency_graph:
  requires:
    - 03-03 # DAL & API endpoint
    - 03-04 # Material display components
  provides:
    - chapter_detail_page
    - lazy_generation_pattern
    - generating_state_ui
  affects: []

tech_stack:
  added:
    - "@/components/ui/skeleton" # shadcn skeleton
    - "@/components/ui/alert" # shadcn alert
  patterns:
    - server_client_wiring_pattern
    - lazy_generation_on_first_visit
    - suspense_fallback

key_files:
  created:
    - src/components/materials/generating-state.tsx
    - src/components/materials/chapter-content.tsx
    - src/components/ui/skeleton.tsx
    - src/components/ui/alert.tsx
  modified:
    - src/app/(dashboard)/courses/[courseId]/[levelId]/[chapterId]/page.tsx

decisions: []

metrics:
  duration: 7 min
  tasks: 3/3
---

# Phase 03 Plan 05: Chapter Page with Lazy Generation Summary

**One-liner:** Chapter page z lazy generation - server przekazuje initialContent, client generuje przez API gdy null.

## What Was Built

1. **GeneratingState component** - Animowany loading state z 3 fazami (searching -> generating -> saving), skeleton UI i informacja o czekaniu

2. **ChapterContent component** - Kluczowy komponent z lazy generation pattern:
   - Przyjmuje `initialContent` z server component
   - Jesli null -> uruchamia fetch('/api/materials/generate')
   - Jesli nie null -> renderuje od razu bez API call
   - Wyswietla content, metadata, tools w grid, external resources, sources

3. **Chapter page integration** - Zaktualizowany page.tsx:
   - Server-side call `getSectionContent(chapterId)`
   - Przekazuje wynik jako `initialContent` do ChapterContent
   - Suspense z fallback GeneratingState
   - Course context dla lepszej generacji AI

## Server/Client Wiring Pattern

```
Server Component (page.tsx)
    |
    |-- getSectionContent(chapterId) --> Supabase
    |
    |-- existingContent (SectionContent | null)
    |
    v
Client Component (ChapterContent)
    |
    |-- initialContent prop
    |
    |-- if null: fetch('/api/materials/generate')
    |             |
    |             v
    |         POST to API -> AI generation -> save to DB
    |
    |-- if not null: render immediately
```

## Key Technical Decisions

- **Lazy on first visit:** Content generuje sie tylko przy pierwszym wejsciu na chapter - kolejne wizyty uzywa zapisanego contentu
- **Phase tracking:** UI pokazuje progress przez 3 fazy zamiast zwyklego spinnera
- **Tools grid:** 2 kolumny na desktop dla lepszego wykorzystania przestrzeni
- **Suspense:** Fallback dla server-side streaming

## Files Changed

| File | Change |
|------|--------|
| `src/components/materials/generating-state.tsx` | New - loading UI with phases |
| `src/components/materials/chapter-content.tsx` | New - lazy generation logic |
| `src/components/ui/skeleton.tsx` | New - shadcn skeleton |
| `src/components/ui/alert.tsx` | New - shadcn alert |
| `src/app/(dashboard)/courses/[courseId]/[levelId]/[chapterId]/page.tsx` | Modified - integration |

## Commits

| Hash | Message |
|------|---------|
| ad48fa2 | feat(03-05): add GeneratingState component with phase indicators |
| 17e0571 | feat(03-05): add ChapterContent with lazy generation pattern |
| c57a9bc | feat(03-05): integrate ChapterContent with lazy generation into chapter page |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing shadcn components**
- **Found during:** Task 1 and Task 2
- **Issue:** Skeleton i Alert nie byly zainstalowane
- **Fix:** Dodano przez `npx shadcn@latest add skeleton alert`
- **Files created:** `src/components/ui/skeleton.tsx`, `src/components/ui/alert.tsx`

**2. [Rule 1 - Bug] Nullable chapter properties**
- **Found during:** Task 3
- **Issue:** `chapter.description` i `chapter.estimated_minutes` moga byc null
- **Fix:** Dodano domyslne wartosci: `description || ""`, `estimated_minutes || 15`
- **Commit:** c57a9bc

## Verification Results

- [x] `npx tsc --noEmit` - brak bledow
- [x] GeneratingState pokazuje fazy generowania
- [x] ChapterContent implementuje lazy generation (fetch only when initialContent is null)
- [x] Chapter page laczy wszystkie komponenty
- [x] Suspense dla streaming
- [x] Server-client wiring jasno udokumentowany w komentarzach
- [x] Key links verified: ChapterContent import, fetch call, getSectionContent import

## Next Phase Readiness

Phase 3 complete. All material display infrastructure is in place:
- Types and schemas (03-01)
- Web search integration (03-02)
- DAL and API endpoint (03-03)
- Display components (03-04)
- Chapter page with lazy generation (03-05)

Ready for Phase 4 (Learning Progress).
