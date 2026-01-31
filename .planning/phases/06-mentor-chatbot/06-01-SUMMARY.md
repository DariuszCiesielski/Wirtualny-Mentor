---
phase: 06-mentor-chatbot
plan: 01
subsystem: ai-chatbot
tags: [ai, chat, rag, tools, prompts]
dependency-graph:
  requires: [05-notes-system-embeddings]
  provides: [mentor-prompts, search-notes-tool]
  affects: [06-02-chat-api, 06-03-chat-ui]
tech-stack:
  added: []
  patterns: [tool-factory, context-injection, prompt-engineering]
key-files:
  created:
    - src/lib/ai/mentor/prompts.ts
    - src/lib/ai/mentor/tools.ts
  modified: []
decisions:
  - key: socratic-method
    choice: "Strict Socratic - NIGDY gotowe odpowiedzi"
    rationale: "Pedagogical approach forcing active learning"
  - key: tool-threshold
    choice: "0.5 similarity threshold"
    rationale: "Lower threshold for better recall in RAG context"
  - key: content-truncation
    choice: "500 chars per note"
    rationale: "Balance context window vs detail"
metrics:
  duration: 3 min
  completed: 2026-01-31
---

# Phase 06 Plan 01: System Prompt & Tool Definition Summary

**One-liner:** Socratic mentor prompt with strict no-answer rules plus RAG tool factory for user notes retrieval.

## What Was Built

### MENTOR_SYSTEM_PROMPT (prompts.ts)

System prompt defining AI mentor behavior:

1. **Metoda sokratyczna** - Core rule: NEVER give answers, ALWAYS guide with questions
2. **Transformation examples** - Three few-shot examples showing wrong vs right responses
3. **Coach persona** - Emotional support, normalize difficulties, motivate
4. **Notes integration** - When/how to use searchNotes tool
5. **Level flexibility** - Can answer advanced questions with scaffolding

### createSearchNotesTool (tools.ts)

Factory function for RAG tool:

```typescript
interface ToolContext {
  userId: string;
  courseId: string;
}

createSearchNotesTool(context: ToolContext) -> AI SDK tool
```

Features:
- Polish description with usage examples
- Semantic search via `searchNotesSemantic` from DAL
- 0.5 threshold for better recall
- 500 char truncation for context window management
- Returns `{ found: boolean, notes?: [...], message?: string }`

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Socratic strictness | NIGDY/ZAWSZE rules | Forces active learning pattern |
| Search threshold | 0.5 (vs 0.7 default) | Better recall for chatbot context |
| Content truncation | 500 chars | Fits ~5 notes in context window |
| Tool factory pattern | Context injection | Allows per-session binding |

## Files Created

```
src/lib/ai/mentor/
  prompts.ts    # MENTOR_SYSTEM_PROMPT export
  tools.ts      # createSearchNotesTool factory
```

## Integration Points

- **Imports from:** `@/lib/dal/notes` (searchNotesSemantic)
- **Used by:** 06-02 chat API route (next plan)
- **Pattern follows:** `src/lib/ai/materials/tools.ts` (tool definition)

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| c9b2b0d | feat(06-01): create mentor chatbot system prompt |
| 7aa83ac | feat(06-01): create searchNotes tool factory for RAG |

## Next Phase Readiness

Ready for 06-02:
- [x] System prompt exported as constant
- [x] Tool factory accepts context, returns AI SDK tool
- [x] Both TypeScript-clean (tsc --noEmit passes)
- [x] Tool integrates with existing DAL pattern

API route will import both and wire into `streamText()` call.
