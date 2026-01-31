---
phase: "05"
plan: "05"
subsystem: "notes-ui"
tags: ["notes", "search", "full-text", "ui"]

dependency-graph:
  requires: ["05-03"]
  provides: ["notes-listing-ui", "notes-search-ui"]
  affects: ["06-ai-chatbot"]

tech-stack:
  added: []
  patterns:
    - "Bound server action for search"
    - "Server component data fetching + client interactivity"

key-files:
  created:
    - "src/components/notes/notes-search.tsx"
    - "src/app/(dashboard)/courses/[courseId]/notes/page.tsx"
    - "src/app/(dashboard)/courses/[courseId]/notes/actions.ts"
    - "src/app/(dashboard)/courses/[courseId]/notes/notes-page-client.tsx"

decisions:
  - id: "notes-search-bound-action"
    choice: "Bound server action passed from server to client component"
    reason: "Type-safe courseId binding without closures in client components"
  - id: "notes-context-merge"
    choice: "Merge search results with context data post-query"
    reason: "Full-text search returns basic notes, context requires separate join query"

metrics:
  duration: "4 min"
  completed: "2026-01-31"
---

# Phase 05 Plan 05: Notes Listing Page Summary

## One-liner

Notes page with full-text search using bound server actions and context badges for chapter/level display.

## What was built

### 1. Notes Search Component (`notes-search.tsx`)

Client component with:
- Debounced search input with min 2 characters
- Loading state with Loader2 spinner
- SearchResultCard with context badges (level, chapter)
- Truncated content preview
- Empty state handling

### 2. Notes Page (`page.tsx`)

Server component that:
- Fetches course for ownership verification
- Fetches all notes with context using `getNotesWithContext`
- Binds searchNotesAction to courseId
- Passes data to client component

### 3. Server Actions (`actions.ts`)

`searchNotesAction`:
- Full-text search using PostgreSQL tsvector
- Merges search results with context data
- Returns NoteWithContext[] for display

### 4. Notes Page Client (`notes-page-client.tsx`)

Client component with:
- NotesSearch integration
- NoteItem cards with level/chapter badges
- EmptyState prompting user to add notes
- Date formatting in Polish locale
- Edit indicator for modified notes

## Key Patterns

**Bound Server Action:**
```typescript
const boundSearchAction = searchNotesAction.bind(null, courseId);
```
This pattern allows passing server actions with pre-bound parameters to client components.

**Context Merge Pattern:**
Search results are basic notes, context requires a separate query. We fetch both and merge client-side for display.

## Files Created/Modified

| File | Type | Purpose | Lines |
|------|------|---------|-------|
| `notes-search.tsx` | Component | Search input + results | 178 |
| `page.tsx` | Server Component | Data fetching | 41 |
| `actions.ts` | Server Actions | Search action | 55 |
| `notes-page-client.tsx` | Client Component | Interactive UI | 164 |

## Verification Results

- [x] notes-search.tsx exports NotesSearch
- [x] page.tsx fetches notes server-side with getNotesWithContext
- [x] actions.ts exports searchNotesAction
- [x] TypeScript compiles without errors
- [x] Empty state handled gracefully

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Notes UI complete. Ready for:
- Phase 6: AI Chatbot can use notes for RAG context
- Integration with chapter page (link to notes)

## Commits

| Hash | Message |
|------|---------|
| 6a03a7d | feat(05-05): create notes search component |
| 14665ad | feat(05-05): create notes page with search |
