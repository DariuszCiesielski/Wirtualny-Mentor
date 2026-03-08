# Technology Stack — Business Enablement (v2.0)

**Projekt:** Wirtualny Mentor
**Badanie:** 2026-03-08
**Wymiar:** Dodatki do stacku dla onboardingu biznesowego, sugestii AI i lead generation
**Pewnosc ogolna:** WYSOKA

## Kluczowy wniosek

**Nie trzeba instalowac ZADNYCH nowych bibliotek.** Caly modul biznesowy mozna zbudowac na istniejacym stacku. To znaczaco zmniejsza ryzyko i czas implementacji.

Istniejacy stack (Next.js 16, React 19, Vercel AI SDK v6, Supabase, shadcn/ui, react-hook-form, Zod 4, SWR, sonner) pokrywa 100% potrzeb nowych funkcji.

---

## Istniejacy stack — mapowanie na nowe funkcje

### Onboarding Wizard (formularz + opcjonalny chat AI)

| Potrzeba | Rozwiazanie z istniejacego stacku | Wersja | Dlaczego |
|----------|-----------------------------------|--------|----------|
| Formularz 4 pol | `react-hook-form` + `@hookform/resolvers` + `zod` | 7.71.1 / 5.2.2 / 4.3.6 | Juz w projekcie, shadcn `form.tsx` gotowy |
| Select (branza, rola, cel, wielkosc) | shadcn `select.tsx` (Radix Select) | Juz w projekcie | Komponent UI juz istnieje |
| Wizard (kroki 1-2-3) | Wlasny state machine (useState/useReducer) | React 19 | 3 kroki to za malo na biblioteke stepper — prosty `step` state wystarczy |
| Chat AI doprecyzowujacy | `useChat` z `@ai-sdk/react` + streaming API route | 3.0.64 | Identyczny wzorzec jak MentorChat i InlineMentorChat |
| Walidacja | `zod` schema + `zodResolver` | 4.3.6 | Spojny z reszta projektu |
| Toast (powiadomienia) | `sonner` | 2.0.7 | Juz uzywany wszedzie |

**Wzorzec wizarda:** Nie instalowac zadnej biblioteki stepper. Wzorzec z 3 krokami to prosty `const [step, setStep] = useState<1|2|3>(1)` z warunkowym renderowaniem. Biblioteki typu `react-step-wizard` dodaja niepotrzebna zlozonosc.

### AI Business Suggestions (generowanie pomyslow)

| Potrzeba | Rozwiazanie z istniejacego stacku | Dlaczego |
|----------|-----------------------------------|----------|
| Generowanie sugestii | `generateObject` z Vercel AI SDK v6 + Zod schema | Identyczny wzorzec jak quiz generation i image planner |
| Model AI | GPT-5.2 via `openaiProvider` | Juz skonfigurowany w `providers.ts` |
| Structured output | Zod schema dla tablicy sugestii | Sprawdzony wzorzec (quizy, planner) |
| Inline rendering | Wlasne komponenty React | shadcn Card + Badge wystarczaja |
| Cache/idempotencja | `input_hash` w DB (Supabase) | Brak potrzeby dodatkowego cache layer |

### Agregacja pomyslow + filtrowanie

| Potrzeba | Rozwiazanie z istniejacego stacku | Dlaczego |
|----------|-----------------------------------|----------|
| Lista z filtrem po kursie | `swr` + Supabase query | SWR juz uzyty w projekcie, filtrowanie po stronie DB |
| UI listy | shadcn Card + Badge + Select (filtr) | Wszystkie komponenty istnieja |
| Stany puste | Wlasne komponenty (tekst + CTA) | Proste, nie wymaga biblioteki |

### Lead Generation / CTA

| Potrzeba | Rozwiazanie | Dlaczego |
|----------|-------------|----------|
| Warunkowe CTA | Logika w komponencie (is_bookmarked check) | Czysty React, zero dodatkowych deps |
| Dane kontaktowe | `process.env.CONTACT_*` w server component | 3 zmienne ENV, bez dodatkowej infrastruktury |
| Mailto/tel linki | Natywne HTML `<a href="mailto:">` | Zero JS potrzebne |

---

## Rozszerzenie MODEL_CONFIG

Jedyna zmiana w istniejacym kodzie AI — dodac 2 klucze do `src/lib/ai/providers.ts`:

```typescript
export const MODEL_CONFIG = {
  // ...istniejace (mentor, curriculum, quiz, embedding)
  businessIdeas: openaiProvider('gpt-5.2'),    // structured output dla sugestii
  onboardingChat: openaiProvider('gpt-5.2'),   // reuse mentor model dla chatu
} as const;
```

**Dlaczego GPT-5.2 a nie GPT-4o-mini:**
- Sugestie biznesowe wymagaja rozumienia kontekstu branzy + tresci lekcji — GPT-4o-mini moze dawac zbyt ogolne wyniki
- Chat onboardingowy wymaga empatii i doprecyzowania — jak mentor
- Koszt kontrolowany przez on-demand (max 5/dzien free) + cache (input_hash)

---

## Baza danych — nowe tabele

| Tabela | Wzorzec | Ryzyko |
|--------|---------|--------|
| `user_business_profiles` | Identyczny jak `focus_sessions` — UUID PK, user_id FK, RLS | NISKIE |
| `business_suggestions` | Identyczny jak `user_points_log` — UUID PK, user_id FK, UNIQUE constraint, RLS | NISKIE |
| ALTER `wm_allowed_users` | Dodanie 2 kolumn (subscription_tier, subscription_expires_at) | NISKIE |

**Hash implementacja (zero deps, natywne Web Crypto API):**

```typescript
async function computeInputHash(lessonContent: string, profileVersion: number): Promise<string> {
  const input = `${lessonContent}::${profileVersion}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

Web Crypto API jest natywne w Node 18+ i wszystkich nowoczesnych przegladarkach. Next.js 16 wymaga Node 18+.

---

## Czego NIE dodawac (i dlaczego)

| Biblioteka | Dlaczego NIE | Co zamiast |
|------------|-------------|------------|
| `react-step-wizard` / `@mantine/stepper` | 3 kroki to za malo na dedykowana biblioteke, dodaje bundle bloat | `useState<1\|2\|3>` |
| `@tanstack/react-query` | `swr` juz w projekcie, nie mieszac dwoch cache managerow | `swr` z `mutate()` |
| `nanoid` / `uuid` | Supabase `gen_random_uuid()` generuje ID po stronie DB | DB-generated UUIDs |
| `crypto-js` / `hash.js` | Web Crypto API (`crypto.subtle.digest`) jest natywne | Natywne Web Crypto |
| `rate-limiter-flexible` / `upstash` | Rate limit 5/dzien to prosty COUNT query | `SELECT COUNT(*) WHERE created_at > now() - interval '1 day'` |
| `zustand` / `jotai` | Stan wizarda jest lokalny (3 kroki), brak potrzeby global state | React useState/useReducer |
| Osobna biblioteka email (nodemailer) | CTA to linki mailto/tel, nie wysylanie maili | Natywny HTML `<a>` |

---

## Nowe zmienne srodowiskowe

```env
# Lead generation — dane kontaktowe (MVP)
CONTACT_EMAIL=kontakt@example.com
CONTACT_PHONE=+48123456789
CONTACT_FORM_URL=https://example.com/kontakt
```

**Walidacja:** Server-side check w komponencie CTA — jesli brak zmiennych, nie renderuj CTA (graceful degradation).

---

## Wzorce do reuse (nie implementowac od nowa)

| Wzorzec | Zrodlo w kodzie | Reuse w nowym module |
|---------|----------------|---------------------|
| Fuzzy heading matching | `ContentRenderer` (stripHeadingNumber) | `relevant_section` w InlineSuggestion |
| useChat + streaming | `MentorChat`, `InlineMentorChat` | OnboardingChat |
| generateObject + Zod schema | Quiz generation, Image Planner | Business suggestions generation |
| Fire-and-forget side effects | Gamification (`awardPoints().catch(() => {})`) | Suggestion saving po generacji |
| DAL pattern (server actions + auth) | `focus-dal.ts`, `gamification-dal.ts` | onboarding-dal.ts, ideas-dal.ts |
| Inline content przy h2 | `SectionImage`, `SectionNoteIndicator` | `InlineSuggestion` przy sekcji |
| Conditional banner | (nowy, ale prosty pattern) | `OnboardingBanner` na dashboardzie |

---

## Integracja z istniejacym kodem

### Modyfikacje istniejacych plikow

| Plik | Zmiana | Ryzyko |
|------|--------|--------|
| `src/lib/ai/providers.ts` | Dodac `businessIdeas` i `onboardingChat` do MODEL_CONFIG | NISKIE — addytywne, 2 linie |
| Sidebar component | Nowa pozycja "Pomysly biznesowe" | NISKIE — addytywne, 1 link |
| `src/app/(dashboard)/page.tsx` | OnboardingBanner (conditional render) | NISKIE — addytywne, warunkowy komponent |
| `[chapterId]/page.tsx` | Przycisk "Pokaz pomysl" + InlineSuggestion | SREDNIE — modyfikacja renderowania lekcji |
| `src/app/(dashboard)/profile/page.tsx` | Sekcja "Profil biznesowy" | NISKIE — nowa sekcja |

### Nowe pliki (struktura z design doc)

```
src/lib/onboarding/
  onboarding-dal.ts        — CRUD profilu biznesowego (wzorzec: focus-dal.ts)
  onboarding-prompt.ts     — system prompt dla chatu AI
  onboarding-schema.ts     — Zod schema profilu

src/lib/business-ideas/
  ideas-dal.ts             — CRUD sugestii (wzorzec: gamification-dal.ts)
  ideas-prompt.ts          — prompt do analizy lekcji + profilu
  ideas-schema.ts          — Zod schema sugestii

src/components/onboarding/
  OnboardingWizard.tsx     — 3-step wizard (useState)
  OnboardingForm.tsx       — react-hook-form + zodResolver
  OnboardingChat.tsx       — useChat (wzorzec: InlineMentorChat)
  OnboardingBanner.tsx     — warunkowa belka na dashboardzie
  BusinessProfileSummary.tsx

src/components/business-ideas/
  InlineSuggestion.tsx     — compact/hint variant
  SuggestionCard.tsx       — pelna karta pomyslu
  IdeasList.tsx            — zbiorcza lista z filtrem (SWR)
  ContactCTA.tsx           — warunkowe CTA (dane z ENV)

src/app/api/onboarding/refine/route.ts
src/app/api/business-ideas/generate/route.ts
src/app/(dashboard)/onboarding/page.tsx
src/app/(dashboard)/business-ideas/page.tsx
```

---

## Ocena pewnosci

| Obszar | Poziom | Uzasadnienie |
|--------|--------|-------------|
| Zero nowych deps | WYSOKI | Pelna analiza package.json vs design doc — wszystko pokryte |
| MODEL_CONFIG extension | WYSOKI | Wzorzec juz dziala, addytywna zmiana |
| Web Crypto dla hash | WYSOKI | Natywne API, Node 18+ (Next.js 16 wymaga tego) |
| Rate limit via DB COUNT | SREDNI | Dziala dla MVP (5/dzien), przy >1000 userach moze wymagac Redis/Upstash |
| Wizard bez stepper lib | WYSOKI | 3 kroki, prosty state, shadcn components wystarczaja |
| SWR dla agregacji | WYSOKI | Juz uzywany w projekcie, mutate() dla odswiezania |

---

## Implikacje dla roadmapy

1. **Zero nowych instalacji npm** — caly modul biznesowy na istniejacym stacku, bez ryzyka nowych deps
2. **Addytywne zmiany** — nowe pliki i minimalne modyfikacje istniejacych
3. **Sprawdzone wzorce** — kazdy nowy komponent ma odpowiednik w istniejacym kodzie do skopiowania
4. **Najwyzsze ryzyko integracji:** modyfikacja `[chapterId]/page.tsx` (inline suggestions obok tresci lekcji) — wymaga ostroznosci zeby nie zepsuc renderowania lekcji, lesson images, notatek sekcyjnych
5. **DB migracje:** 2 nowe tabele + 1 ALTER TABLE — standardowe, niskie ryzyko
6. **Brak blokujacych zaleznosci** — mozna zaczac od dowolnego modulu (onboarding, sugestie, lub lead gen)
