# Phase 08 Plan 03: Onboarding Chat & Dashboard Banner Summary

Streaming chat AI z structured output (isComplete + experience_summary) + banner na dashboardzie zachęcający do uzupełnienia profilu biznesowego.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | API endpoint chatu + OnboardingChat | a3a45a6 | `src/app/api/onboarding/chat/route.ts`, `src/components/onboarding/onboarding-chat.tsx` |
| 2 | Banner na dashboardzie + integracja | d90c34b | `src/components/onboarding/onboarding-banner.tsx`, `src/app/(dashboard)/dashboard/page.tsx` |

## What Was Built

### API Endpoint (`/api/onboarding/chat`)
- Auth check (getUser), streaming response
- System prompt z placeholderami {industry}, {role}, {goal}
- Structured output via `Output.object({ schema: onboardingChatSchema })`
- Model: gpt-4o-mini (onboarding task)

### OnboardingChat Component
- useChat + DefaultChatTransport (wzorzec z clarifying-chat)
- Auto-initial message z danymi profilu
- Finish po 5 turach usera LUB AI isComplete=true
- "Zakończ i zapisz" zapisuje experience_summary do DB
- "Przejdź dalej bez chatu" pomija chat (saveBusinessProfile bez summary)

### OnboardingBanner Component
- Session-based dismiss (useState, nie DB)
- Link do /onboarding, ikony Briefcase + X + ArrowRight
- Styling: rounded-lg border bg-primary/5

### Dashboard Integration
- Parallel fetch: isOnboardingCompleted() z courses i notes
- Warunkowe renderowanie bannera: `{!onboardingCompleted && <OnboardingBanner />}`

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Reuse clarifying-chat pattern (convertToCoreMessages, parseAIResponse) | Sprawdzony wzorzec, spójność kodu |
| Session-based banner dismiss (useState, not localStorage) | Prostsze, zgodne z planem |
| Parallel isOnboardingCompleted fetch | Nie spowalnia dashboard load |

## Verification

- [x] `npx tsc --noEmit` passes
- [x] `npm run build` passes
- [x] API route exports POST handler
- [x] OnboardingChat uses useChat with DefaultChatTransport
- [x] Banner conditionally rendered on dashboard
- [x] Banner has X dismiss button (useState)
- [x] Banner links to /onboarding
- [x] All UI strings use Polish diacritics

## Metrics

- Duration: ~2 min
- Completed: 2026-03-08
- Files created: 3
- Files modified: 1
