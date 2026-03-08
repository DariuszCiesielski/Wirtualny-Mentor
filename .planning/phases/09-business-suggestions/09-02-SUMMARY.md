---
phase: 09-business-suggestions
plan: 02
subsystem: business-suggestions-api
tags: [api, hooks, ai, rate-limiting, caching]
requires: ["09-01"]
provides: ["POST /api/business-ideas/generate", "useChapterSuggestion hook"]
affects: ["09-03"]
tech-stack:
  added: []
  patterns: ["sync JSON endpoint", "optimistic updates with rollback", "input hash caching"]
key-files:
  created:
    - src/app/api/business-ideas/generate/route.ts
    - src/hooks/use-chapter-suggestion.ts
  modified: []
metrics:
  tasks: 2/2
  duration: ~4 min
  completed: 2026-03-08
---

# Phase 9 Plan 2: API Endpoint & Client Hook Summary

Sync JSON endpoint i React hook laczace backend (DAL/prompt/schema z 09-01) z frontendem (UI komponenty w 09-03).

## What Was Done

### Task 1: POST /api/business-ideas/generate endpoint
- **Commit:** cf98f3e
- Sync JSON endpoint: parse → auth → rate limit → cache → AI → save → return
- Rate limiting: 5 generacji dziennie (Europe/Warsaw timezone)
- Cache: input_hash + profile_version — ta sama lekcja + profil = cached result
- force=true pomija cache (refresh), liczy w limit
- Błąd AI → 500, limit NIE naliczony (nic nie zapisane do DB)
- Puste AI suggestions → zwraca null bez zapisu

### Task 2: useChapterSuggestion hook
- **Commit:** 9691447
- Pełny cykl życia: generate → display → bookmark/dismiss/refresh
- Optimistic updates z rollback dla bookmark i dismiss
- Double-click guard na generate (isGenerating flag)
- Toast notifications (sonner) dla wszystkich akcji
- initialSuggestion z server component dla persystencji po refresh

## Decisions Made

1. **reasoning z AI nie jest zapisywane do DB** — pole `reasoning` w schemacie AI służy do wewnętrznego uzasadnienia wyboru sekcji, ale tabela DB go nie ma. AI generuje reasoning (chain-of-thought), endpoint go pomija przy zapisie.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pominięcie pola reasoning w saveSuggestion**
- **Found during:** Task 1
- **Issue:** Schemat AI (`suggestionOutputSchema`) generuje pole `reasoning`, ale typ `BusinessSuggestion` i tabela DB go nie zawierają
- **Fix:** Usunięto `reasoning` z obiektu przekazywanego do `saveSuggestion()`
- **Files modified:** src/app/api/business-ideas/generate/route.ts

## Next Phase Readiness

Plan 09-03 (UI Components) ma teraz pełne API:
- Endpoint gotowy do wywoływania z komponentów
- Hook gotowy do użycia w chapter layout
- Typy współdzielone przez backend i frontend
