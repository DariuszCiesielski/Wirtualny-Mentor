---
phase: 02-curriculum-generation
plan: 03
subsystem: ui
tags: [react, useChat, streaming, vercel-ai-sdk, shadcn, zod, curriculum]

# Dependency graph
requires:
  - phase: 02-01
    provides: Database schema dla courses, TypeScript types
  - phase: 02-02
    provides: AI providers, clarificationSchema, CLARIFYING_SYSTEM_PROMPT
provides:
  - Topic input component z walidacja
  - Strona /courses/new z 4-krokowym stepperem
  - API endpoint /api/curriculum/clarify z streaming
  - ClarifyingChat component z useChat hook
affects: [02-04, 02-05, 02-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useChat z DefaultChatTransport dla streaming chat"
    - "UIMessage.parts zamiast content dla tekstu"
    - "State machine dla multi-step form"

key-files:
  created:
    - src/components/curriculum/topic-input.tsx
    - src/app/(dashboard)/courses/new/page.tsx
    - src/app/(dashboard)/courses/new/actions.ts
    - src/app/api/curriculum/clarify/route.ts
    - src/components/curriculum/clarifying-chat.tsx
    - src/components/ui/textarea.tsx
  modified: []

key-decisions:
  - "DefaultChatTransport zamiast api prop (nowe API Vercel AI SDK v6)"
  - "UIMessage.parts zamiast content (breaking change w AI SDK)"
  - "sendMessage({ text }) zamiast sendMessage({ content })"

patterns-established:
  - "Streaming chat: useChat + DefaultChatTransport + toUIMessageStreamResponse"
  - "Multi-step wizard: state machine z steps array i currentStep"
  - "Message parsing: getMessageText() dla ekstrakcji tekstu z UIMessage.parts"

# Metrics
duration: 15min
completed: 2026-01-30
---

# Phase 02 Plan 03: Topic Input & Clarifying Questions Summary

**Strona /courses/new z topic input, 4-krokowym stepperem i streaming chat dla pytan doprecyzowujacych AI**

## Performance

- **Duration:** 15 min
- **Started:** 2026-01-30T21:42:00Z
- **Completed:** 2026-01-30T21:57:00Z
- **Tasks:** 2
- **Files created:** 6

## Accomplishments

- TopicInput component z walidacja tematu (min 3 znaki) i opcjonalnego URL
- Strona /courses/new z 4-krokowym wizardem (Temat -> Pytania -> Generowanie -> Podglad)
- API endpoint /api/curriculum/clarify ze streaming structured output
- ClarifyingChat component z useChat hook, message history, klikalnymi opcjami

## Task Commits

1. **Task 1: Topic input component i new course page** - `63e9188` (feat)
2. **Task 2: Clarifying chat endpoint i component** - `e0dcf95` (feat)

## Files Created/Modified

- `src/components/curriculum/topic-input.tsx` - Formularz z textarea dla tematu i input dla URL
- `src/app/(dashboard)/courses/new/page.tsx` - Multi-step wizard z state machine
- `src/app/(dashboard)/courses/new/actions.ts` - Server action initiateCourseCreation
- `src/app/api/curriculum/clarify/route.ts` - Streaming endpoint z Output.object
- `src/components/curriculum/clarifying-chat.tsx` - Chat UI z useChat i DefaultChatTransport
- `src/components/ui/textarea.tsx` - shadcn Textarea component

## Decisions Made

1. **DefaultChatTransport zamiast api prop** - Vercel AI SDK v6 zmieniło API useChat. Teraz wymaga transport object zamiast prostego api string. Uzywamy DefaultChatTransport({ api }) dla HTTP transport.

2. **UIMessage.parts zamiast content** - Nowa wersja SDK uzywa parts array zamiast content string. Dodano helper getMessageText() do ekstrakcji tekstu.

3. **sendMessage({ text }) zamiast { content }** - Breaking change w API sendMessage - property zmieniło nazwe z content na text.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Dostosowanie do Vercel AI SDK v6 API**
- **Found during:** Task 2 (ClarifyingChat implementation)
- **Issue:** Plan zakladal stare API useChat z `api` prop i `input`/`handleInputChange`/`handleSubmit`. SDK v6 ma inne API.
- **Fix:** Uzyto DefaultChatTransport, sendMessage({ text }), UIMessage.parts
- **Files modified:** src/components/curriculum/clarifying-chat.tsx
- **Verification:** npm run build przechodzi bez bledow
- **Committed in:** e0dcf95

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Konieczne dostosowanie do aktualnej wersji SDK. Brak scope creep.

## Issues Encountered

- API useChat zmieniło sie znacznie w v6 (brak input/handleInputChange/handleSubmit, content -> text, UIMessage.content -> parts)
- Rozwiazanie: Przeczytanie typow z node_modules i dostosowanie kodu

## User Setup Required

**External services require configuration:**
- OPENAI_API_KEY wymagany dla /api/curriculum/clarify (GPT-4.1)
- Juz skonfigurowany w .env.local jesli wczesniejsze fazy dzialaly

## Next Phase Readiness

- Flow Topic -> Clarify gotowy i dzialajacy
- Nastepny krok: integracja z curriculum generation (Plan 04)
- ClarifyingChat wywoluje onComplete z zebranym userInfo
- Brakuje: faktyczne generowanie curriculum po zebraniu informacji

---
*Phase: 02-curriculum-generation*
*Completed: 2026-01-30*
