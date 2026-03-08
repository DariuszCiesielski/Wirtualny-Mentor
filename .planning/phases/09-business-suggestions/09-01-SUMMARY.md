---
phase: 09-business-suggestions
plan: 01
subsystem: business-suggestions-backend
tags: [supabase, typescript, zod, ai-prompt, dal, server-actions]
requires: [phase-08]
provides: [business-suggestions-db, business-suggestions-types, business-suggestions-dal, ai-prompt-builder]
affects: [09-02, 09-03]
tech-stack:
  added: []
  patterns: [server-actions-dal, cache-invalidation-hash, daily-rate-limit, profile-versioning]
key-files:
  created:
    - supabase/migrations/20260309000001_business_suggestions.sql
    - src/types/business-ideas.ts
    - src/lib/business-ideas/ideas-schema.ts
    - src/lib/business-ideas/ideas-prompt.ts
    - src/lib/business-ideas/ideas-dal.ts
  modified:
    - src/types/onboarding.ts
    - src/lib/ai/providers.ts
    - src/lib/onboarding/onboarding-dal.ts
decisions:
  - id: "09-01-D1"
    title: "gpt-5.2 for suggestions"
    context: "Need quality business ideas from lesson content"
    choice: "gpt-5.2 (same as curriculum/mentor)"
  - id: "09-01-D2"
    title: "Warsaw timezone for daily limit"
    context: "Polish users — day boundary should match local time"
    choice: "Intl.DateTimeFormat for Europe/Warsaw offset detection"
metrics:
  duration: "~2 min"
  completed: "2026-03-08"
---

# Phase 9 Plan 1: Backend Foundation Summary

**One-liner:** DB migration + TypeScript types + Zod schemas + AI prompt builder + DAL with rate limiting and cache invalidation via profile versioning and content hashing.

## What Was Built

### Task 1: DB Migration + Types + Schemas
- **SQL migration** `20260309000001_business_suggestions.sql`: business_suggestions table with CHECK constraint on complexity, two indexes (user_date, user_chapter), RLS policies (SELECT/INSERT/UPDATE for own rows), profile_version column on user_business_profiles
- **TypeScript types** `business-ideas.ts`: BusinessSuggestion, GenerateSuggestionRequest, GenerateSuggestionResponse, DailyLimitResult
- **Zod schemas** `ideas-schema.ts`: suggestionOutputSchema (AI generateObject output, 0-1 suggestions), generateRequestSchema (POST body), computeInputHash (SHA-256 16-char hex for cache invalidation)
- **Updated** onboarding.ts: added profile_version to BusinessProfile interface

### Task 2: DAL + Prompt + Provider Config
- **Provider config**: Added `suggestions: openaiProvider('gpt-5.2')` to MODEL_CONFIG
- **Onboarding DAL update**: saveBusinessProfile() now fetches current profile_version and increments on save
- **AI prompt builder** `ideas-prompt.ts`: buildSuggestionPrompt() with dual branch (profile present → personalized, absent → universal), PROMPT_VERSION for cache invalidation, h2 heading extraction
- **DAL** `ideas-dal.ts`: getSuggestion (latest non-dismissed per chapter), getSuggestionWithCacheCheck (hash + version validation), saveSuggestion (INSERT only), bookmarkSuggestion (toggle), dismissSuggestion (soft delete), checkDailyLimit (5/day, Europe/Warsaw timezone)

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 490e3a8 | feat(09-01): DB migration, TypeScript types, and Zod schemas |
| 2 | 4a7c63d | feat(09-01): DAL, AI prompt, provider config |

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passes after both tasks
- All exports match plan specification
- RLS policies cover SELECT/INSERT/UPDATE

## Next Phase Readiness

Plan 09-02 (API route + streaming) can proceed — all backend foundation is in place:
- DAL functions ready for API consumption
- Zod schemas ready for request validation and AI generateObject
- AI prompt builder ready with profile branching
- Provider config has `suggestions` model key
