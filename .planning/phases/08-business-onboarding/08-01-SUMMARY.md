---
phase: 08-business-onboarding
plan: 01
subsystem: onboarding
tags: [database, types, zod, dal, ai-prompt, shadcn-ui]
requires: []
provides: [user_business_profiles-table, business-profile-types, onboarding-dal, onboarding-schemas, onboarding-prompt, popover-command-components]
affects: [08-02, 08-03, 08-04]
tech-stack:
  added: []
  patterns: [server-actions-dal, zod-v4-validation, rls-policies]
key-files:
  created:
    - supabase/migrations/20260308120000_business_profiles.sql
    - src/types/onboarding.ts
    - src/lib/onboarding/schemas.ts
    - src/lib/onboarding/prompts.ts
    - src/lib/onboarding/onboarding-dal.ts
    - src/components/ui/command.tsx
  modified:
    - src/lib/ai/providers.ts
    - src/components/ui/popover.tsx
    - src/components/ui/dialog.tsx
decisions:
  - id: onboarding-model
    description: "GPT-4o-mini for onboarding chat (cheap structured output)"
  - id: upsert-safe
    description: "UPSERT with onConflict user_id (safe — full UNIQUE, not partial index)"
metrics:
  duration: 3min
  completed: 2026-03-08
---

# Phase 8 Plan 1: Business Onboarding Foundation Summary

**One-liner:** Migracja SQL z RLS, typy TS, schematy Zod v4, DAL server actions, prompt AI onboardingu i komponenty shadcn/ui (Popover + Command).

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | DB migration + types + schemas + prompt + provider | b11b243 | migration, onboarding.ts, schemas.ts, prompts.ts, providers.ts |
| 2 | DAL server actions + shadcn/ui Popover+Command | 71370c2 | onboarding-dal.ts, command.tsx, popover.tsx |

## What Was Built

### Database (migration)
- Tabela `user_business_profiles`: id, user_id (UNIQUE FK), industry, role, business_goal, company_size, experience_summary, onboarding_completed, timestamps
- Trigger auto-update `updated_at`
- RLS: SELECT/INSERT/UPDATE z `auth.uid() = user_id`

### TypeScript Types
- `BusinessProfile` — pełny interfejs tabeli
- `BusinessProfileInput` — dane z formularza (industry, role, business_goal, company_size?)

### Zod Schemas (zod/v4)
- `businessProfileSchema` — walidacja formularza z polskimi komunikatami
- `onboardingChatSchema` — structured output AI (question, isComplete, experience_summary)

### AI Prompt
- `ONBOARDING_CHAT_SYSTEM_PROMPT` — kontekstowy prompt z placeholderami {industry}, {role}, {goal}
- Instrukcje: 2-3 pytania, jedno na turę, profesjonalny ton, po polsku

### DAL Server Actions
- `getBusinessProfile()` — SELECT + maybeSingle
- `saveBusinessProfile(input)` — UPSERT + onboarding_completed=true + revalidatePath
- `isOnboardingCompleted()` — quick boolean check

### AI Provider Config
- `onboarding: openaiProvider('gpt-4o-mini')` dodany do MODEL_CONFIG

### shadcn/ui Components
- `Command` — nowy komponent (combobox/autocomplete)
- `Popover` — już istniał, bez zmian

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

1. **GPT-4o-mini for onboarding** — tani model wystarczający do prostego chatu z structured output
2. **UPSERT safe** — user_id ma pełny UNIQUE constraint (nie partial index), więc upsert działa poprawnie z PostgREST

## Next Phase Readiness

Plan 08-02 (formularz onboardingu) może korzystać z:
- Schematów Zod do walidacji formularza
- DAL do zapisu profilu
- Typów TS do type safety
- Komponentów Popover + Command do combobox branży/roli
