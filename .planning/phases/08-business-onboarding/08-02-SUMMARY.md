---
phase: 08-business-onboarding
plan: "02"
subsystem: onboarding-ui
tags: [combobox, form, onboarding, shadcn]
dependency-graph:
  requires: ["08-01"]
  provides: ["Combobox component", "BusinessProfileForm", "/onboarding page"]
  affects: ["08-03"]
tech-stack:
  added: ["@radix-ui/react-tooltip (shadcn tooltip)"]
  patterns: ["Popover+Command composition (Combobox)", "Controlled form with Zod validation"]
key-files:
  created:
    - src/components/onboarding/combobox.tsx
    - src/components/onboarding/business-profile-form.tsx
    - src/app/(dashboard)/onboarding/page.tsx
    - src/components/ui/tooltip.tsx
  modified: []
decisions:
  - id: "08-02-D1"
    decision: "Combobox uses shouldFilter=false with manual filtering for custom value support"
    reason: "cmdk's built-in filter doesn't support adding custom items dynamically"
  - id: "08-02-D2"
    decision: "Tooltip component added via shadcn CLI for disabled AI button"
    reason: "Required for 'Wkrótce dostępne' tooltip on disabled Doprecyzuj z AI button"
metrics:
  duration: "~3 min"
  completed: "2026-03-08"
---

# Phase 08 Plan 02: Business Profile Form Summary

Formularz profilu biznesowego z reusable Combobox i strona /onboarding -- 4 pola (branża, rola, cel, wielkość firmy) z walidacją Zod i integracją z DAL.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Komponent Combobox (reusable) | 606ab55 | combobox.tsx |
| 2 | Formularz BusinessProfileForm + strona /onboarding | 2af3af3 | business-profile-form.tsx, page.tsx, tooltip.tsx |

## Implementation Details

### Task 1: Combobox
- Popover + Command composition with search filtering (shouldFilter=false, manual filter)
- `allowCustom` prop shows "Użyj: {search}" button when no match found
- Also shows custom option at end of filtered list when partial matches exist
- Check icon for selected option, ChevronsUpDown trigger icon
- Width synced to trigger via `--radix-popover-trigger-width`

### Task 2: BusinessProfileForm + /onboarding page
- 4 controlled fields: industry (Combobox), role (Combobox), business_goal (Textarea), company_size (Select)
- Both Comboboxes have allowCustom=true with predefined Polish industry/role options
- Zod validation via businessProfileSchema from schemas.ts
- saveBusinessProfile DAL call on submit with sonner toast feedback
- "Doprecyzuj z AI" button rendered disabled with tooltip "Wkrótce dostępne" (plan 03)
- Server component page calls getBusinessProfile() for edit pre-fill
- initialData prop enables both create and edit flows

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added shadcn tooltip component**
- **Found during:** Task 2
- **Issue:** Tooltip component not installed, needed for disabled "Doprecyzuj z AI" button
- **Fix:** `npx shadcn@latest add tooltip`
- **Files created:** src/components/ui/tooltip.tsx
- **Commit:** included in 2af3af3

## Verification

- `npx tsc --noEmit` -- zero errors
- `npm run build` -- zero errors, /onboarding route listed
- Combobox exports: options, value, onChange, allowCustom props
- Form has 4 fields: 2x Combobox, 1x Textarea, 1x Select
- saveBusinessProfile called on submit with Zod-validated data

## Next Phase Readiness

Plan 08-03 (AI Chat refinement) can proceed:
- BusinessProfileForm has `onSuccess` callback ready for integration
- "Doprecyzuj z AI" button is rendered and can be enabled
- Form state is controlled, allowing external updates from AI chat
