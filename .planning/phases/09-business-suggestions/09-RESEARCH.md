# Phase 9: Business Suggestions - Research

**Researched:** 2026-03-08
**Domain:** AI-generated business suggestions inline in lessons, caching, rate limiting
**Confidence:** HIGH

## Summary

Faza 9 implementuje kontekstowe sugestie biznesowe generowane przez AI na podstawie tresci lekcji i opcjonalnego profilu biznesowego uzytkownika. Architektura jest niemal identyczna z istniejacym wzorcem Lesson Images (planner.ts + DAL + hook + content-renderer integration), z kluczowa roznica: sugestie sa generowane na zadanie (przycisk) zamiast automatycznie, i zwracaja tekst zamiast plikow graficznych.

Codebase jest bardzo dobrze przygotowany — wszystkie wzorce potrzebne do implementacji juz istnieja: `generateObject` (planner.ts, quiz), fuzzy heading match (content-renderer.tsx), inline rendering przy h2 (SectionImage), server action DAL (onboarding-dal.ts, gamification-dal.ts), idempotency (awardPoints). Nie potrzeba zadnych nowych zaleznosci npm.

**Krytyczne odkrycie:** Kolumna `profile_version` NIE ISTNIEJE w aktualnej migracji `user_business_profiles` (20260308120000). Design doc ja zaklada, ale faza 8 jej nie wdrozyla. Faza 9 musi dodac: (1) `profile_version INT DEFAULT 1` do `user_business_profiles`, (2) `profile_version` do TypeScript type `BusinessProfile`, (3) inkrementacje w `saveBusinessProfile()`. Typ `raw_answers` tez nie istnieje, ale nie jest potrzebny w fazie 9.

**Primary recommendation:** Reuse wzorzec 1:1 z Lesson Images (planner + DAL + hook + content-renderer), zamieniajac Storage/obrazy na tekst w DB. Dodac migracje z `profile_version` + tabela `business_suggestions` + rate limit sprawdzany server-side.

## Standard Stack

### Core (istniejace — zero nowych zaleznosci)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vercel AI SDK v6 | current | `generateObject()` z Zod schema | Uzywane w planner.ts, quiz, onboarding chat |
| OpenAI GPT-5.2 | current | Generowanie sugestii biznesowych | Ustawiony jako `curriculum` w providers.ts |
| Zod 4 | current | Schema walidacji input/output AI | Uzywane wszedzie (z importem `zod/v4`) |
| Supabase | current | DB + RLS + auth | Stack projektu |
| sonner | current | Toast notifications | Juz uzywany w gamification |
| lucide-react | current | Ikony (Lightbulb, Bookmark, X, RefreshCw) | Juz uzywany w calym projekcie |
| shadcn/ui | current | Card, Button, Badge, Tooltip | Juz zainstalowane |

### Alternatives Considered

Brak — CONTEXT.md blokuje: "Zero new npm dependencies". Wszystko na istniejacym stacku.

## Architecture Patterns

### Recommended Project Structure

```
src/lib/business-ideas/
  ├── ideas-dal.ts          # CRUD + rate limit check (server actions)
  ├── ideas-prompt.ts       # System prompt z branch: profil/bez profilu
  └── ideas-schema.ts       # Zod schema (output AI + request validation)

src/components/business-ideas/
  ├── InlineSuggestion.tsx   # Wariant compact (A) — karta inline przy h2
  └── GenerateSuggestionButton.tsx  # Przycisk "Pokaz pomysl" + limit counter

src/hooks/
  └── use-chapter-suggestion.ts  # Hook zarzadzajacy stanem sugestii per chapter

src/app/api/business-ideas/
  └── generate/route.ts     # POST endpoint (sync JSON, nie SSE)

src/types/
  └── business-ideas.ts     # TypeScript types

supabase/migrations/
  └── 20260309000001_business_suggestions.sql  # Tabela + ALTER profile_version
```

### Pattern 1: AI Planner (generateObject)

**What:** Uzycie `generateObject()` z Zod schema do structured output (0-1 sugestii)
**When to use:** Generowanie sugestii biznesowej z AI
**Reuse from:** `src/lib/images/planner.ts`

```typescript
// Source: src/lib/images/planner.ts (verified in codebase)
import { generateObject } from 'ai'
import { z } from 'zod/v4'
import { getModel } from '@/lib/ai/providers'

const suggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string().describe('Krotki, chwytliwy tytul pomyslu'),
      description: z.string().describe('Opis pomyslu 2-3 zdania'),
      business_potential: z.string().describe('Potencjal biznesowy 1-2 zdania'),
      estimated_complexity: z.enum(['prosty', 'sredni', 'zlozony']),
      relevant_section: z.string().describe('Heading h2 sekcji, przy ktorej pokazac'),
      reasoning: z.string().describe('Dlaczego ten pomysl pasuje'),
    })
  ).min(0).max(1),
})

const result = await generateObject({
  model: getModel('curriculum'), // GPT-5.2
  schema: suggestionSchema,
  system: SUGGESTION_SYSTEM_PROMPT,
  prompt: userPrompt,
})
```

**UWAGA:** W `providers.ts` NIE MA klucza `suggestions` — nalezy albo dodac nowy klucz do `MODEL_CONFIG`, albo uzyc istniejacego `'curriculum'` (GPT-5.2). Rekomendacja: dodaj `suggestions: openaiProvider('gpt-5.2')` do MODEL_CONFIG dla jasnosci.

### Pattern 2: Server Action DAL (CRUD + auth)

**What:** Server actions z auth verification i revalidatePath
**When to use:** CRUD operacji na sugestiach
**Reuse from:** `src/lib/onboarding/onboarding-dal.ts`, `src/lib/gamification/gamification-dal.ts`

```typescript
// Source: src/lib/onboarding/onboarding-dal.ts (verified)
"use server";
import { createClient } from "@/lib/supabase/server";

export async function getSuggestion(chapterId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('business_suggestions')
    .select('*')
    .eq('user_id', user.id)
    .eq('chapter_id', chapterId)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}
```

### Pattern 3: Fuzzy Heading Match (reuse)

**What:** Dopasowanie `relevant_section` z AI do faktycznego h2 w content-renderer
**When to use:** Renderowanie sugestii inline
**Reuse from:** `src/components/materials/content-renderer.tsx` linia 39-60

```typescript
// Source: content-renderer.tsx (verified)
function stripHeadingNumber(text: string): string {
  return text.replace(/^\d+\.\s*/, '');
}

function findSectionSuggestion(
  suggestion: BusinessSuggestion | undefined,
  headingText: string,
): BusinessSuggestion | undefined {
  if (!suggestion?.relevant_section) return undefined;
  if (suggestion.relevant_section === headingText) return suggestion;
  const stripped = stripHeadingNumber(headingText);
  if (stripHeadingNumber(suggestion.relevant_section) === stripped) return suggestion;
  return undefined;
}
```

### Pattern 4: Rate Limit (server-side count)

**What:** Limit 5 generowan dziennie, sprawdzany server-side
**Reuse from:** Wzorzec `awardPoints` (idempotency check w gamification-dal.ts)

```typescript
// Wzorzec z gamification-dal.ts (idempotency check)
export async function checkDailyLimit(userId: string): Promise<{ remaining: number; allowed: boolean }> {
  const supabase = await createClient();
  // Midnight Warsaw = UTC offset
  const todayStart = getTodayMidnightWarsaw();

  const { count } = await supabase
    .from('business_suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString());

  const used = count ?? 0;
  const MAX_DAILY = 5;
  return { remaining: MAX_DAILY - used, allowed: used < MAX_DAILY };
}
```

### Pattern 5: Input Hash (idempotency)

**What:** Hash tresci lekcji + profilu zapobiega duplikatom i umozliwia cache invalidation
**Implementation:** `crypto.createHash('sha256')` (Node.js built-in, zero deps)

```typescript
import { createHash } from 'crypto';

function computeInputHash(
  chapterId: string,
  contentTruncated: string,
  profile: BusinessProfile | null,
  promptVersion: string,
): string {
  const parts = [
    chapterId,
    contentTruncated.slice(0, 4000),
    profile?.industry ?? '',
    profile?.role ?? '',
    profile?.business_goal ?? '',
    profile?.experience_summary ?? '',
    promptVersion,
  ];
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 16);
}
```

### Pattern 6: Sync JSON Endpoint (nie SSE)

**What:** POST endpoint zwracajacy JSON (nie streaming SSE)
**When to use:** Generowanie 1 sugestii to szybka operacja (~2-5s), nie potrzeba streamingu
**Reuse from:** `src/app/api/materials/generate-image/route.ts` (verified — sync JSON)

### Anti-Patterns to Avoid

- **NIE uzywaj SSE/streaming** — 1 sugestia generuje sie w ~2-5s, SSE to overengineering (w przeciwienstwie do lesson images ktore generuja 2+ obrazy sekwencyjnie)
- **NIE uzywaj upsert()** z PostgREST — jesli bedzie partial unique index (wzorzec z lesson-images: select + update/insert)
- **NIE cachuj wyniku "0 sugestii"** — jesli AI zwroci pusta tablice, NIE zapisuj do DB (pozwol retry)
- **NIE uzywaj `getSession()`** — zawsze `getUser()` (CVE-2025-29927)
- **NIE blokuj UI na ladowanie** — przycisk + skeleton/spinner przy docelowej sekcji

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured AI output | Custom JSON parsing | `generateObject()` z Zod schema | Gwarantuje typ, retries wbudowane |
| Hash computation | Custom hash function | `crypto.createHash('sha256')` | Node.js built-in, zero deps |
| Toast notifications | Custom notification system | `sonner` (juz zainstalowany) | Uzywany w gamification |
| UI components (Card, Badge) | Custom styled divs | shadcn/ui components | Juz w projekcie, spojne z designem |
| Fuzzy heading match | Custom fuzzy matching | `stripHeadingNumber()` z content-renderer | Przetestowane, dziala z lesson images |
| Auth verification | Custom middleware | `supabase.auth.getUser()` + RLS | Wzorzec CVE-safe uzywany wszedzie |
| Timezone-aware dates | Custom timezone logic | `Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw' })` | Natywne API przegladarki/Node.js |

## Common Pitfalls

### Pitfall 1: profile_version nie istnieje w DB

**What goes wrong:** Design doc zaklada `profile_version` w `user_business_profiles`, ale aktualna migracja (20260308120000) jej NIE MA.
**Why it happens:** Faza 8 wdrozyla uproszczony schemat bez wersjonowania.
**How to avoid:** Migracja fazy 9 MUSI dodac `ALTER TABLE user_business_profiles ADD COLUMN profile_version INT NOT NULL DEFAULT 1` + zaktualizowac `BusinessProfile` TypeScript type + dodac inkrementacje w `saveBusinessProfile()`.
**Warning signs:** Brak `profile_version` w `onboarding-dal.ts`, `schemas.ts`, `types/onboarding.ts`.

### Pitfall 2: Midnight timezone dla rate limitu

**What goes wrong:** `new Date().setHours(0,0,0,0)` uzywa UTC, nie Europe/Warsaw.
**Why it happens:** JavaScript Date domyslnie uzywa UTC w Node.js.
**How to avoid:** Uzyj dedicated function:
```typescript
function getTodayMidnightWarsaw(): Date {
  const now = new Date();
  const warsawStr = now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
  // warsawStr = "2026-03-08" (ISO format)
  return new Date(warsawStr + 'T00:00:00+01:00'); // CET, or +02:00 for CEST
  // Lepiej: uzywaj RPC w Supabase z AT TIME ZONE 'Europe/Warsaw'
}
```
**Recommendation:** Sprawdzaj limit w SQL: `WHERE created_at >= (now() AT TIME ZONE 'Europe/Warsaw')::date::timestamptz` — bardziej niezawodne niz JS.

### Pitfall 3: Race condition — multi-tab limit bypass

**What goes wrong:** Uzytkownik otwiera 5 tabow, klika "Generuj" w kazdym — limit sprawdzany client-side przepuszcza wszystkie.
**Why it happens:** Client-side check jest optymistyczny.
**How to avoid:** Limit MUSI byc sprawdzany server-side w API route (atomowo). Client-side check to tylko UX optimization (disable button).
**Warning signs:** Limit sprawdzany tylko w hooku/komponencie bez server-side validation.

### Pitfall 4: Cache invalidation — dismissed suggestions

**What goes wrong:** Uzytkownik dismissuje sugestie, generuje nowa (inny tytul) — stara dismissed sugestia wciaz widoczna na /business-ideas.
**Why it happens:** UNIQUE(user_id, chapter_id, title) pozwala na wiele rekordow per chapter.
**How to avoid:** Przy generowaniu nowej sugestii NIE nadpisuj dismissed rekordow (CONTEXT.md: "nowy tytul = nowy rekord"). Na liscie /business-ideas filtruj: `is_dismissed = false` LUB `is_bookmarked = true`.

### Pitfall 5: ContentRenderer juz ma duzo propsow

**What goes wrong:** Dodanie kolejnych propsow (suggestion, onGenerateSuggestion, etc.) sprawia ze komponent staje sie trudny do utrzymania.
**Why it happens:** ContentRenderer juz ma 16 propsow (images, notes, mentor, etc.).
**How to avoid:** Sugestia jest 1 per chapter (nie per section jak images/notes), wiec potrzeba tylko 2-3 nowych propsow: `suggestion?: BusinessSuggestion`, `suggestionLoading?: boolean`. Nie potrzeba `onGenerateSuggestion` w ContentRenderer — przycisk generowania jest w HEADERZE lekcji (CONTEXT.md), nie w content-renderer.

### Pitfall 6: AI zwraca heading ktory nie istnieje

**What goes wrong:** AI w `relevant_section` zwraca zmodyfikowany heading (np. bez numeru).
**Why it happens:** To samo co w lesson images — AI stripuje numery z headingow.
**How to avoid:** (1) Prompt explicitnie mowi "kopiuj heading DOKLADNIE" (reuse z planner.ts), (2) fuzzy match `stripHeadingNumber()` jako fallback, (3) fallback na poczatek lekcji jesli zadne h2 nie pasuje.

## Code Examples

### Przykladowy API Route (sync JSON)

```typescript
// Source: wzorzec z src/app/api/materials/generate-image/route.ts
// POST /api/business-ideas/generate

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'
import { generateSuggestion } from '@/lib/business-ideas/ideas-prompt'
import { checkDailyLimit, saveSuggestion, getCachedSuggestion } from '@/lib/business-ideas/ideas-dal'
import { computeInputHash } from '@/lib/business-ideas/ideas-schema'

const requestSchema = z.object({
  chapterId: z.string().uuid(),
  courseId: z.string().uuid(),
  content: z.string().max(10000),
  chapterTitle: z.string(),
  courseTopic: z.string().optional(),
  force: z.boolean().optional(), // true = regenerate (Odswiez)
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit check (server-side, atomowy)
  const limit = await checkDailyLimit(user.id)
  if (!limit.allowed) {
    return NextResponse.json({
      error: 'Dzisiejszy limit zostal wykorzystany',
      remaining: 0,
    }, { status: 429 })
  }

  // ... reszta logiki (cache check, AI call, save)
}
```

### Przykladowy InlineSuggestion (compact variant)

```typescript
// Wariant A (compact) — z CONTEXT.md
// Reuse: Card, Badge z shadcn/ui; Lightbulb, Bookmark, X, RefreshCw z lucide-react

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lightbulb, Bookmark, X, RefreshCw } from 'lucide-react'

interface InlineSuggestionProps {
  suggestion: BusinessSuggestion
  variant?: 'compact' | 'hint'
  showRefresh?: boolean
  onBookmark?: () => void
  onDismiss?: () => void
  onRefresh?: () => void
}
```

### Przykladowy Hook (use-chapter-suggestion)

```typescript
// Wzorzec z use-chapter-images.ts (uproszczony — sync JSON, nie SSE)
'use client'
import { useState, useEffect, useCallback } from 'react'

export function useChapterSuggestion(
  chapterId: string,
  initialSuggestion?: BusinessSuggestion | null,
) {
  const [suggestion, setSuggestion] = useState(initialSuggestion ?? null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)

  const generate = useCallback(async (params: GenerateParams) => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/business-ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (res.status === 429) {
        setRemaining(0)
        return
      }
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSuggestion(data.suggestion)
      setRemaining(data.remaining)
    } finally {
      setIsGenerating(false)
    }
  }, [])

  // ... bookmark, dismiss, refresh callbacks

  return { suggestion, isGenerating, remaining, generate, bookmark, dismiss, refresh }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Auto-generacja sugestii | Na zadanie (przycisk) | Design v2 (Codex review) | Oszczednosc kosztow AI, lepszy UX |
| SSE streaming | Sync JSON | Decyzja fazy 9 | 1 sugestia ~2-5s, SSE to overengineering |
| `z.union` / `z.discriminatedUnion` | `z.array().min(0).max(1)` | Wzorzec quiz/planner | Kompatybilnosc ze structured outputs |

**Kluczowe API z codebase:**
- `getModel('curriculum')` → GPT-5.2 (dla sugestii, bo wymaga zrozumienia kontekstu biznesowego)
- `getModel('quiz')` → GPT-4o-mini (alternatywa — tanszy, ale mniej kontekstowy)
- Import Zod: `import { z } from 'zod/v4'` (NIE `'zod'`)

## Open Questions

1. **Ktory model dla sugestii: GPT-5.2 czy GPT-4o-mini?**
   - GPT-5.2 (`curriculum`): lepsze zrozumienie kontekstu biznesowego, ~$0.01/call
   - GPT-4o-mini (`quiz`): tanszy (~$0.002/call), ale slabszy w personalizacji
   - Rekomendacja: GPT-5.2 — sugestie sa wartosciowe tylko gdy sa trafne; 5/dzien max = max $0.05/dzien/user
   - CONTEXT.md nie specyfikuje modelu — Claude's discretion

2. **Czy strona /business-ideas (zbiorcza lista) wchodzi w faze 9?**
   - Design doc ja opisuje, ale wymagania SUG-01..SUG-09 dotycza inline sugestii
   - Rekomendacja: prosta strona /business-ideas w fazie 9 (lista + filtr) — naturalne miejsce na przeglad bookmarks
   - Odroczenie oznaczaloby brak widoku zapisanych pomyslow

3. **Rate limit: COUNT(*) w SQL vs dedykowany counter?**
   - COUNT per request: proste, ale O(n) przy duzej ilosci rekordow
   - Dedykowany counter w osobnej tabeli: szybszy, ale dodatkowa tabela
   - Rekomendacja: COUNT — max 5 rekordow/dzien/user, O(1) z indeksem na (user_id, created_at)

## Sources

### Primary (HIGH confidence)
- `src/lib/images/planner.ts` — wzorzec generateObject + Zod schema (verified in codebase)
- `src/lib/dal/lesson-images.ts` — wzorzec DAL, select+update/insert (verified)
- `src/lib/ai/providers.ts` — MODEL_CONFIG, getModel() (verified)
- `src/lib/onboarding/onboarding-dal.ts` — wzorzec server action DAL (verified)
- `src/lib/gamification/gamification-dal.ts` — idempotency check (verified)
- `src/components/materials/content-renderer.tsx` — fuzzy heading match, h2 rendering (verified)
- `src/hooks/use-chapter-images.ts` — wzorzec client hook (verified)
- `supabase/migrations/20260308120000_business_profiles.sql` — aktualna migracja BEZ profile_version (verified)

### Secondary (MEDIUM confidence)
- `docs/plans/2026-03-08-business-onboarding-design.md` — design doc (zatwierdzony)
- `.planning/phases/09-business-suggestions/CONTEXT.md` — user decisions (locked)

### Tertiary (LOW confidence)
- Brak — wszystko zweryfikowane w codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — weryfikacja w codebase, zero nowych deps
- Architecture: HIGH — 1:1 reuse istniejacych wzorcow (planner, DAL, hook, content-renderer)
- Pitfalls: HIGH — odkryte przez analiz kodu (profile_version gap, PostgREST upsert issue)
- DB schema: HIGH — design doc zatwierdzony + weryfikacja aktualnych migracji

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stabilny stack, zero zmian w depedencjach)
