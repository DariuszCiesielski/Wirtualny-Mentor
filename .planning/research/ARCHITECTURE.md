# Architecture Patterns — Business Onboarding & AI Suggestions

**Domain:** Business onboarding + AI-powered suggestions for existing AI learning platform
**Researched:** 2026-03-08
**Confidence:** HIGH (based on direct codebase analysis of existing patterns)

## Existing Architecture (Actual, Not Planned)

The platform uses a consistent layered pattern across all domain modules:

```
src/lib/{domain}/              — DAL (server actions), business logic
src/lib/ai/{domain}/           — AI prompts + Zod schemas
src/components/{domain}/       — React UI components
src/app/api/{domain}/          — API route handlers (streaming/REST)
src/app/(dashboard)/{domain}/  — Pages (Server Components)
```

**Established patterns (verified from codebase):**

| Pattern | Implementation | Example File |
|---------|---------------|--------------|
| DAL as server actions | `"use server"` + `createClient()` | `gamification-dal.ts` |
| Auth in every DAL call | `supabase.auth.getUser()` | `auth.ts` → `verifySession()` |
| Model routing | `MODEL_CONFIG` object in `providers.ts` | `getModel('quiz')` |
| Structured AI output | `generateObject()` + Zod schema | `quiz/` module |
| Streaming AI chat | `useChat()` + `streamText()` | `mentor/`, `curriculum/clarify/` |
| Multi-step wizard | Client component with step state | `courses/new/page.tsx` |
| Fire-and-forget side effects | `awardPoints().catch(() => {})` | `progress.ts` hookpoints |
| Feature gating | `canAccessPremiumFeature()` | `lesson-images` module |
| Conditional UI | Server-side data → conditional render | Dashboard cards |

## Integration Map — New Modules

```
EXISTING (modify)                         NEW (create)
─────────────────                         ───────────────
src/lib/dal/auth.ts ─────────────────────> src/lib/onboarding/onboarding-dal.ts
  (requireAuth, verifySession)              src/lib/business-ideas/business-ideas-dal.ts

src/lib/ai/providers.ts ─────────────────> Add: onboarding + businessIdeas to MODEL_CONFIG
  (MODEL_CONFIG object)

src/lib/ai/curriculum/prompts.ts ────────> Inject profile context into system prompt
  (CLARIFYING_SYSTEM_PROMPT)                (prompt enrichment, no schema change)

src/app/(dashboard)/layout.tsx ──────────> Render <OnboardingBanner /> (conditional)
src/app/(dashboard)/dashboard/page.tsx ──> Add BusinessProfileSummary card
src/app/(dashboard)/profile/page.tsx ────> Add "Profil biznesowy" section
src/components/layout/sidebar.tsx ───────> Add "Pomysly biznesowe" link

                                           src/lib/ai/onboarding/ (prompts.ts, schemas.ts)
                                           src/lib/ai/business-ideas/ (prompts.ts, schemas.ts)
                                           src/components/onboarding/ (wizard, form, chat, banner)
                                           src/components/business-ideas/ (card, list, button, CTA)
                                           src/app/api/onboarding/refine/ (streaming)
                                           src/app/api/business-ideas/generate/ (structured)
                                           src/app/api/business-ideas/remaining/ (quota)
                                           src/app/(dashboard)/onboarding/page.tsx
                                           src/app/(dashboard)/business-ideas/page.tsx
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `onboarding-dal.ts` | CRUD for `user_business_profiles` | Supabase, `auth.ts` |
| `business-ideas-dal.ts` | CRUD for `business_suggestions`, rate limit check | Supabase, `auth.ts` |
| `src/lib/ai/onboarding/` | Profile refinement prompts + Zod schemas | `providers.ts` |
| `src/lib/ai/business-ideas/` | Suggestion generation prompts + schemas | `providers.ts`, `onboarding-dal` (reads profile) |
| `/api/onboarding/refine` | Streaming chat for profile refinement | AI SDK `streamText`, `onboarding-dal` |
| `/api/business-ideas/generate` | Generate structured suggestion | AI SDK `generateObject`, `business-ideas-dal`, `onboarding-dal` |
| `/api/business-ideas/remaining` | GET remaining daily quota | `business-ideas-dal` |
| `OnboardingWizard` | Multi-step form + optional AI chat + summary | API routes, `onboarding-dal` |
| `SuggestionCard` | Display single suggestion with bookmark/CTA | `business-ideas-dal` |
| `SectionBusinessIdeaButton` | Chapter-context suggestion trigger | `/api/business-ideas/generate` |
| `OnboardingBanner` | Dashboard nudge to complete profile | `onboarding-dal` (read), localStorage (dismiss) |

## Data Flow

### Flow 1: Business Onboarding (Hybrid Form + AI)

```
[OnboardingWizard] (client component, follows courses/new/page.tsx pattern)
  │
  ├─ Step 1: Structured Form
  │   Fields: industry, business_stage, team_size, goals[], challenges[]
  │   → Server Action: saveBusinessProfile(formData)
  │   → INSERT user_business_profiles (partial, completed_at = null)
  │
  ├─ Step 2: AI Chat Refinement (OPTIONAL — user can skip)
  │   → POST /api/onboarding/refine (streaming via streamText)
  │   → useChat() on client (same pattern as ClarifyingChat)
  │   → System prompt includes Step 1 answers as context
  │   → AI asks follow-up questions about skills, budget, specifics
  │   → On isComplete: UPDATE user_business_profiles (enriched raw_answers)
  │
  └─ Step 3: Profile Summary + Confirm
      → Display parsed profile for review
      → Server Action: completeOnboarding()
      → UPDATE user_business_profiles SET completed_at = now()
```

**Model choice:** `gpt-4o-mini` — profile refinement is simple structured conversation. Follows quiz generation precedent.

```typescript
// Addition to src/lib/ai/providers.ts
export const MODEL_CONFIG = {
  // ... existing entries unchanged
  onboarding: openaiProvider('gpt-4o-mini'),
  businessIdeas: openaiProvider('gpt-4o-mini'),
} as const;
```

### Flow 2: Business Suggestion Generation (On-Demand)

```
[User clicks "Zasugeruj pomysl biznesowy"]
  │
  ├─ Client: check remaining quota (GET /api/business-ideas/remaining)
  │   → If 0: show "Limit wyczerpany" message, disable button
  │
  └─ POST /api/business-ideas/generate
      Body: { context?: { courseId, chapterId, sectionHeading } }
      │
      API route:
      ├─ 1. verifySession()
      ├─ 2. getRemainingQuota(userId) → reject if 0
      ├─ 3. getBusinessProfile(userId) → reject if no profile
      ├─ 4. If context: load chapter/course metadata from DAL
      ├─ 5. generateObject({ model, schema, system, prompt })
      ├─ 6. createSuggestion(userId, result) → INSERT business_suggestions
      └─ 7. Return suggestion JSON → client renders SuggestionCard
```

**Key decision: `generateObject()` not streaming.** Suggestions are short structured outputs (~5 fields). Generation takes <3s with gpt-4o-mini. Streaming adds complexity without UX benefit. This matches the quiz generation pattern.

### Flow 3: Contextual Suggestions (from Chapter)

```
[ChapterPage → SectionBusinessIdeaButton (near h2)]
  │
  Same API as Flow 2, with context payload:
  { courseId, chapterId, sectionHeading: "Marketing w social mediach" }
  │
  Prompt construction:
  ├─ User business profile (industry, stage, goals)
  ├─ Course topic
  ├─ Chapter title + section heading
  └─ Truncated section content (max 2000 chars, like image planner)
  │
  → AI generates contextual business suggestion tied to lesson content
```

### Flow 4: CTA / Lead Generation (Conditional UI)

```
[User bookmarks a suggestion]
  → Server Action: bookmarkSuggestion(suggestionId)
  → UPDATE business_suggestions SET is_bookmarked = true
  │
  [SuggestionCard re-renders]
  → is_bookmarked = true → show CTACard
  → CTACard reads: process.env.BUSINESS_CTA_EMAIL, BUSINESS_CTA_PHONE
  → "Potrzebujesz pomocy z wdrozeniem? Skontaktuj sie z nami"
  │
  No new API needed — purely conditional rendering + ENV vars
```

## Database Schema

```sql
-- Business profile (1 per user)
CREATE TABLE user_business_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  industry TEXT,                    -- branza
  business_stage TEXT,              -- pomysl / startup / dzialajaca firma
  team_size TEXT,                   -- solo / 2-5 / 6-20 / 20+
  goals JSONB DEFAULT '[]',        -- cele biznesowe (array of strings)
  challenges JSONB DEFAULT '[]',   -- wyzwania (array of strings)
  skills JSONB DEFAULT '[]',       -- umiejetnosci (array of strings)
  budget_range TEXT,               -- budzet na rozwoj
  raw_answers JSONB DEFAULT '{}',  -- pelne odpowiedzi z AI refinement
  completed_at TIMESTAMPTZ,        -- kiedy ukonczono onboarding (null = in progress)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI business suggestions
CREATE TABLE business_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES user_business_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,                   -- np. "marketing", "automatyzacja", "produkt"
  rationale TEXT,                  -- dlaczego ta sugestia pasuje
  suggested_courses JSONB DEFAULT '[]', -- powiazane tematy kursow [{title, topic}]
  difficulty TEXT,                 -- latwe / srednie / trudne
  estimated_impact TEXT,           -- potencjalny wplyw
  is_bookmarked BOOLEAN DEFAULT false,
  context JSONB DEFAULT '{}',      -- kontekst generowania {courseId, chapterId, sectionHeading}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rate limiting: no separate table needed
-- Query: COUNT(*) FROM business_suggestions
--        WHERE user_id = X AND created_at > now() - interval '1 day'

-- RLS policies (follow existing pattern from courses/notes)
ALTER TABLE user_business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile"
  ON user_business_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own suggestions"
  ON business_suggestions FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_business_suggestions_user ON business_suggestions(user_id);
CREATE INDEX idx_business_suggestions_user_date ON business_suggestions(user_id, created_at DESC);
```

## New Files to Create

### Library Layer

```
src/lib/onboarding/
  onboarding-dal.ts          — "use server" DAL
    Functions: getBusinessProfile, saveBusinessProfile, updateBusinessProfile,
               completeOnboarding, hasCompletedOnboarding
    Pattern: follows gamification-dal.ts

src/lib/business-ideas/
  business-ideas-dal.ts      — "use server" DAL
    Functions: createSuggestion, getUserSuggestions, bookmarkSuggestion,
               getRemainingQuota, getSuggestionsByContext
    Pattern: follows notes.ts DAL

src/lib/ai/onboarding/
  prompts.ts                 — ONBOARDING_REFINE_SYSTEM_PROMPT
    Pattern: follows curriculum/prompts.ts (Polish, structured, max N turns)
  schemas.ts                 — refinementResponseSchema (question, options, isComplete, collectedInfo)
    Pattern: follows curriculum/schemas.ts (clarificationSchema)

src/lib/ai/business-ideas/
  prompts.ts                 — SUGGESTION_SYSTEM_PROMPT (profile + optional chapter context)
    Pattern: follows curriculum/prompts.ts
  schemas.ts                 — businessSuggestionSchema (title, description, category, rationale, etc.)
    Pattern: follows quiz/schemas.ts (generateObject-compatible)
```

### API Routes

```
src/app/api/onboarding/
  refine/route.ts            — POST: streamText for profile refinement
    Pattern: follows api/curriculum/clarify/route.ts

src/app/api/business-ideas/
  generate/route.ts          — POST: generateObject for suggestion
    Pattern: follows api/quiz/ generation
  remaining/route.ts         — GET: remaining daily quota (simple count)
    Pattern: simple REST endpoint
```

### Components

```
src/components/onboarding/
  onboarding-wizard.tsx      — Multi-step wizard (Step state machine)
    Pattern: follows courses/new/page.tsx (STEPS array, Stepper component)
  onboarding-form.tsx        — Step 1: shadcn form (Select, Checkbox, Input)
    Pattern: follows profile-form.tsx
  onboarding-chat.tsx        — Step 2: AI refinement chat
    Pattern: follows ClarifyingChat (useChat, isComplete detection)
  onboarding-banner.tsx      — Dismissible banner for dashboard
    Pattern: follows focus mode dismiss (localStorage + useSyncExternalStore)
  profile-summary.tsx        — Compact profile card for dashboard
    Pattern: follows existing dashboard Card components

src/components/business-ideas/
  suggestion-card.tsx        — Single suggestion display
    Pattern: follows existing Card component usage
  suggestions-list.tsx       — List with optional filters
    Pattern: follows notes list
  generate-button.tsx        — "Zasugeruj pomysl" button with quota badge
    Pattern: follows GenerateImageButton (quota indicator)
  section-idea-button.tsx    — Chapter section context button
    Pattern: follows SectionAskButton (ContentRenderer integration)
  cta-card.tsx               — Contact CTA (conditional on bookmark)
    Pattern: simple Card with ENV-driven content
```

### Pages

```
src/app/(dashboard)/onboarding/
  page.tsx                   — Full-page onboarding wizard
    Pattern: "use client" page like courses/new/page.tsx

src/app/(dashboard)/business-ideas/
  page.tsx                   — All suggestions list
    Pattern: Server Component page like notes/page.tsx
```

## Modifications to Existing Files

| File | Change | Risk |
|------|--------|------|
| `src/lib/ai/providers.ts` | Add `onboarding` + `businessIdeas` to MODEL_CONFIG | LOW — additive only |
| `src/app/(dashboard)/layout.tsx` | Load profile, render `<OnboardingBanner />` | LOW — conditional render |
| `src/app/(dashboard)/dashboard/page.tsx` | Load profile, render `<ProfileSummary />` card | LOW — additive card |
| `src/components/layout/sidebar.tsx` | Add "Pomysly biznesowe" nav link | LOW — one link |
| `src/app/(dashboard)/profile/page.tsx` | Add business profile section | LOW — below existing |
| `src/lib/ai/curriculum/prompts.ts` | Inject profile context into system prompt | MEDIUM — prompt change |
| `ContentRenderer` (chapter) | Add `SectionBusinessIdeaButton` to h2 actions | MEDIUM — existing render logic |

## Patterns to Follow

### Pattern 1: DAL Server Actions (match gamification-dal.ts)

```typescript
// src/lib/onboarding/onboarding-dal.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export async function getBusinessProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_business_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function saveBusinessProfile(userId: string, input: BusinessProfileInput) {
  const supabase = await createClient();
  // Use select→update/insert pattern (like saveLessonImage)
  const { data: existing } = await supabase
    .from("user_business_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { data } = await supabase
      .from("user_business_profiles")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    return data;
  }

  const { data } = await supabase
    .from("user_business_profiles")
    .insert({ user_id: userId, ...input })
    .select()
    .single();
  return data;
}
```

### Pattern 2: Rate Limiting via DB Count

```typescript
// src/lib/business-ideas/business-ideas-dal.ts
export async function getRemainingQuota(userId: string): Promise<number> {
  const supabase = await createClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("business_suggestions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneDayAgo);

  const FREE_DAILY_LIMIT = 5;
  return Math.max(0, FREE_DAILY_LIMIT - (count || 0));
}
```

### Pattern 3: generateObject for Short Structured Output

```typescript
// src/app/api/business-ideas/generate/route.ts
import { generateObject } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { suggestionSchema } from '@/lib/ai/business-ideas/schemas';

const result = await generateObject({
  model: getModel('businessIdeas'),
  schema: suggestionSchema,
  system: buildSuggestionPrompt(profile, context),
  prompt: "Wygeneruj pomysl biznesowy dla tego uzytkownika.",
});
// result.object is typed as BusinessSuggestion
```

### Pattern 4: Conditional Banner Dismiss (match useFocusMode)

```typescript
// OnboardingBanner dismiss state
const DISMISS_KEY = "wm-onboarding-dismissed";
// Use localStorage + useSyncExternalStore (SSR-compatible)
// Same pattern as existing useFocusMode / useContentWidth
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Background Suggestion Generation
**What:** Auto-generating suggestions on login/cron.
**Why bad:** Wastes AI tokens, users may not want unsolicited suggestions.
**Instead:** On-demand only (explicit button click). User controls when AI runs.

### Anti-Pattern 2: Storing Profile in user_metadata
**What:** Using `supabase.auth.updateUser({ data: { businessProfile: ... }})`.
**Why bad:** Auth metadata is for auth (name, avatar). Business profile has its own schema, queries, foreign keys, and RLS.
**Instead:** Dedicated `user_business_profiles` table.

### Anti-Pattern 3: Requiring Onboarding Before Course Creation
**What:** Blocking course creation until business profile exists.
**Why bad:** Existing users have courses. Onboarding must be additive, never blocking.
**Instead:** Profile is optional enrichment. Courses work without it. When profile exists, curriculum prompts get richer context.

### Anti-Pattern 4: Streaming for Suggestion Generation
**What:** Using `streamText`/`useChat` for suggestion generation.
**Why bad:** Suggestions are 5-field structured objects, <3s generation. Streaming adds UX complexity (skeleton states, partial render) without benefit.
**Instead:** `generateObject()` → JSON → display card. Reserve streaming for long-form (curriculum, mentor chat, profile refinement).

### Anti-Pattern 5: Separate Auth/Access Patterns
**What:** Creating new middleware or auth checks for business modules.
**Why bad:** Duplicates logic, risks CVE-2025-29927.
**Instead:** Use existing `requireAuth()`, `verifySession()`, `requireAllowedUser()` from `src/lib/dal/auth.ts`.

### Anti-Pattern 6: Upsert for user_business_profiles
**What:** Using `.upsert()` with UNIQUE constraint.
**Why bad:** PostgREST upsert with complex constraints has known issues (lesson-images precedent).
**Instead:** select→update/insert pattern (verified working in saveLessonImage).

## Suggested Build Order

Based on dependency analysis:

```
Phase 1: DB + DAL + Onboarding Form (standalone, no AI)
  ├── SQL: CREATE TABLE user_business_profiles + RLS
  ├── SQL: CREATE TABLE business_suggestions + RLS
  ├── onboarding-dal.ts (CRUD, server actions)
  ├── OnboardingWizard with form-only flow (no AI chat)
  ├── /onboarding page
  ├── Profile page: business profile section
  └── MODEL_CONFIG: add onboarding + businessIdeas entries
  Dependencies: None

Phase 2: AI Refinement + Dashboard Integration
  ├── AI prompts + schemas for onboarding (refinementResponseSchema)
  ├── /api/onboarding/refine route (streaming)
  ├── OnboardingChat component (optional wizard step)
  ├── OnboardingBanner on dashboard layout
  ├── BusinessProfileSummary card on dashboard
  └── Sidebar: "Pomysly biznesowe" link (conditional)
  Dependencies: Phase 1 (tables + DAL must exist)

Phase 3: Business Suggestions (core)
  ├── AI prompts + schemas for suggestions (suggestionSchema)
  ├── business-ideas-dal.ts (CRUD, quota)
  ├── /api/business-ideas/generate route
  ├── /api/business-ideas/remaining route
  ├── SuggestionCard, GenerateButton components
  ├── Suggestions list page (/business-ideas)
  └── Rate limiting (5/day)
  Dependencies: Phase 1 (profile must exist for context)

Phase 4: Contextual Suggestions + CTA + Enrichment
  ├── SectionBusinessIdeaButton (ContentRenderer integration)
  ├── Context-aware prompts (chapter content → suggestion)
  ├── Bookmark functionality (server action + UI)
  ├── CTACard (conditional on bookmark, ENV-driven)
  ├── Curriculum prompt enrichment (profile → better courses)
  └── Gamification hookpoint: awardPoints on suggestion bookmark
  Dependencies: Phase 3 + chapter page integration
```

### Build Order Rationale

1. **Phase 1 first** because everything depends on the database tables and DAL. Form-only onboarding delivers value immediately without AI complexity.
2. **Phase 2 second** because AI refinement builds on the form data from Phase 1, and dashboard integration makes the profile visible.
3. **Phase 3 third** because suggestions require a completed profile (Phase 1+2) to generate meaningful results.
4. **Phase 4 last** because contextual suggestions and CTA are enhancements that layer on top of working suggestion infrastructure.

## Sources

- Direct codebase analysis (HIGH confidence):
  - `src/lib/dal/auth.ts` — auth patterns (getUser, requireAuth, verifySession, canAccessPremiumFeature)
  - `src/lib/ai/providers.ts` — MODEL_CONFIG pattern, model routing
  - `src/lib/ai/curriculum/schemas.ts` — Zod schema patterns for AI (clarificationSchema, userInfoSchema)
  - `src/lib/ai/curriculum/prompts.ts` — system prompt patterns (Polish, structured, turn limits)
  - `src/lib/gamification/gamification-dal.ts` — "use server" DAL pattern, fire-and-forget
  - `src/lib/dal/source-documents.ts` — DAL CRUD pattern, getClient helper
  - `src/app/(dashboard)/layout.tsx` — layout structure (FocusShell, Sidebar, Header)
  - `src/app/(dashboard)/dashboard/page.tsx` — dashboard data loading (Promise.all, conditional cards)
  - `src/app/(dashboard)/courses/new/page.tsx` — multi-step wizard pattern (STEPS, Stepper)
  - `src/app/(dashboard)/profile/page.tsx` — profile page structure
  - `src/components/layout/sidebar.tsx` — navigation structure
  - CLAUDE.md — saveLessonImage select→update/insert pattern, PostgREST upsert limitation
