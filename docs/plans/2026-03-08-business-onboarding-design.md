# Design: Onboarding biznesowy + Pomysły biznesowe + Lead Generation

Data: 2026-03-08
Status: Zatwierdzony (po dual review: Claude Code + Codex)

## Cel

Trzy powiązane moduły, które:
1. Poznają sytuację biznesową użytkownika (onboarding)
2. Proponują pomysły na narzędzia/aplikacje przy lekcjach (sugestie AI)
3. Kierują zainteresowanych do kontaktu z twórcą platformy (lead gen)

## Zakres MVP

| Moduł | Opis | Faza |
|-------|------|------|
| Onboarding biznesowy | Hybryda: formularz 4 pól + opcjonalny chat AI doprecyzowujący | MVP |
| Sugestie narzędzi | AI analizuje lekcję + profil → pomysły na narzędzia (na żądanie) | MVP |
| Pomysły biznesowe | Jedna zbiorcza strona z filtrem po kursie | MVP |
| Lead generation / CTA | Warunkowe CTA (po zapisaniu pomysłu), dane kontaktowe z ENV | MVP |
| Klucze API użytkownika | Podłączenie Claude (plan płatny) | Osobna faza |
| Freemium (limity, billing) | 3 kursy/miesiąc free, płatny plan | Osobna faza |
| platform_contact_settings (DB) | Tabela z danymi kontaktowymi (white-label ready) | Osobna faza |
| business_suggestion_interactions | Tracking kliknięć i analityka | Osobna faza |

## Architektura — moduły domenowe

Wzorzec spójny z istniejącą architekturą (`src/lib/focus/`, `src/lib/gamification/`).

```
src/lib/onboarding/
  ├─ onboarding-dal.ts        — CRUD profilu biznesowego
  ├─ onboarding-prompt.ts     — system prompt dla opcjonalnego chatu AI
  └─ onboarding-schema.ts     — Zod schema profilu

src/lib/business-ideas/
  ├─ ideas-dal.ts             — CRUD sugestii
  ├─ ideas-prompt.ts          — prompt do analizy lekcji + profilu
  └─ ideas-schema.ts          — Zod schema sugestii (tablica 0-N)

src/components/onboarding/
  ├─ OnboardingWizard.tsx     — lekki wizard (nie blokujący, nie pełnoekranowy)
  ├─ OnboardingForm.tsx       — formularz 4 pól (branża, rola, cel, wielkość firmy)
  ├─ OnboardingChat.tsx       — opcjonalny chat AI doprecyzowujący (useChat)
  ├─ OnboardingBanner.tsx     — mała belka na dashboardzie (nieukończony onboarding)
  └─ BusinessProfileSummary.tsx — podgląd/edycja profilu

src/components/business-ideas/
  ├─ InlineSuggestion.tsx     — wariant A (compact) / C (hint), prop variant
  ├─ SuggestionCard.tsx       — pełna karta pomysłu z warunkowym CTA
  ├─ IdeasList.tsx            — zbiorcza lista z filtrem po kursie
  └─ ContactCTA.tsx           — blok kontaktowy (dane z ENV)

src/app/api/
  ├─ onboarding/refine/route.ts — opcjonalny streaming chat doprecyzowujący
  └─ business-ideas/generate/route.ts — generowanie sugestii (na żądanie)

src/app/(dashboard)/
  ├─ onboarding/page.tsx      — wizard onboardingowy
  └─ business-ideas/page.tsx  — zbiorcza strona pomysłów z filtrem
```

## Schemat bazy danych

### 1. Profil biznesowy użytkownika

```sql
CREATE TABLE user_business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  industry TEXT,              -- branża (kontrolowane pole z formularza)
  role TEXT,                  -- właściciel / freelancer / pracownik / student
  business_goal TEXT,         -- rozwój firmy / nowy biznes / rozwój osobisty
  company_size TEXT,          -- solo / 2-10 / 11-50 / 50+
  experience_summary TEXT,    -- opcjonalne podsumowanie z chatu AI
  raw_answers JSONB,          -- pełne odpowiedzi z chatu (na przyszłość)
  profile_version INT DEFAULT 1, -- wersjonowanie profilu (Codex insight)
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMPTZ,
  onboarding_skipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON user_business_profiles
  FOR ALL USING (auth.uid() = user_id);
```

### 2. Sugestie narzędzi biznesowych

```sql
CREATE TABLE business_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  business_potential TEXT,
  estimated_complexity TEXT CHECK (estimated_complexity IN ('prosty', 'średni', 'złożony')),
  relevant_section TEXT,        -- heading h2, przy którym pokazać inline
  model_name TEXT,              -- jaki model wygenerował (Codex insight)
  input_hash TEXT,              -- hash treści lekcji + profilu (idempotencja, Codex insight)
  profile_version INT,          -- wersja profilu przy generacji (Codex insight)
  is_bookmarked BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, chapter_id, title)
);

ALTER TABLE business_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own suggestions" ON business_suggestions
  FOR ALL USING (auth.uid() = user_id);
```

### 3. Subscription tier (rozszerzenie istniejącej tabeli)

```sql
-- Tier subskrypcji w wm_allowed_users (osobna domena od profilu biznesowego)
ALTER TABLE wm_allowed_users
  ADD COLUMN subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'paid')),
  ADD COLUMN subscription_expires_at TIMESTAMPTZ;
```

### Tabele odłożone na osobne fazy

```sql
-- Faza: Klucze API użytkownika
-- user_api_keys (provider, encrypted_key, is_active)

-- Faza: Analityka interakcji
-- business_suggestion_interactions (action: viewed/bookmarked/contact_clicked)

-- Faza: White-label
-- platform_contact_settings (contact_email, phone, form_url, cta_heading)
```

## Przepływy danych

### Onboarding (hybryda: formularz + opcjonalny chat)

```
Logowanie → layout dashboardu sprawdza onboarding_completed
  → false (brak rekordu lub onboarding_completed=false)
    → Dashboard z małą belką u góry: "Uzupełnij profil biznesowy"
       Klik → /onboarding (lekki wizard, NIE pełnoekranowy)
       [Pomiń na teraz] → zamyka belkę na tę sesję (skipped_at = now())
                          → wraca przy następnej sesji
    → Wizard /onboarding:
       Krok 1: Formularz 4 pól (kontrolowane, wymagane):
         - Branża (select z opcjami + "Inna")
         - Rola (select: właściciel / freelancer / pracownik / student)
         - Cel biznesowy (select: rozwój firmy / nowy biznes / rozwój osobisty)
         - Wielkość firmy (select: solo / 2-10 / 11-50 / 50+)
       Krok 2 (opcjonalny): "Chcesz doprecyzować?" → krótki chat AI (2-3 pytania)
         AI dopytuje o specyfikę branży, doświadczenie, konkretne potrzeby
         AI generuje experience_summary (generateObject, Zod)
       Krok 3: Podsumowanie — użytkownik widzi i koryguje dane
       → Zapis do DB (onboarding_completed=true) → redirect /dashboard
  → true → dashboard (bez belki)

Edycja profilu → /profile → sekcja "Profil biznesowy" → [Edytuj]
  → Przy edycji: profile_version++
```

### Sugestie narzędzi (na żądanie)

```
Otwarcie lekcji → sprawdź:
  1. Sugestia dla tego rozdziału już istnieje w DB?
     → TAK → render z cache (0 wywołań AI)
              Sprawdź input_hash — jeśli treść/profil się zmienił, pokaż [Odśwież]
     → NIE → pokaż przycisk "Pokaż pomysł biznesowy" przy lekcji
  2. Klik "Pokaż pomysł biznesowy":
     → Sprawdź rate limit (max 5 generowań/dzień free)
     → fetch /api/business-ideas/generate
        → AI (GPT-5.1/5.2) analizuje:
           treść lekcji (truncated 4000 chars) + profil biznesowy (lub ogólny kontekst)
        → Zwraca: tablica 0-1 sugestii (docelowo 0-3)
        → Zapis do DB (z model_name, input_hash, profile_version)
        → render inline (wariant A lub C)
     → Jeśli AI zwróci 0 sugestii → komunikat "Brak pomysłów dla tej lekcji"
  3. Brak profilu biznesowego?
     → Sugestie działają (ogólne, mniej spersonalizowane)
     → Info: "Uzupełnij profil dla trafniejszych sugestii"

Rate limit: max 5 generowań/dzień (free), bez limitu (paid — przyszłość)
Idempotencja: input_hash zapobiega duplikatom przy powtórnym generowaniu
```

### Lead generation (warunkowe CTA)

```
CTA kontaktowe NIE pojawia się domyślnie przy sugestii.
CTA pojawia się gdy:
  → Użytkownik zapisał pomysł (is_bookmarked=true)
  → Użytkownik wrócił do pomysłu drugi raz
  → Użytkownik kliknął "rozwiń" na karcie pomysłu

CTA:
  → Dane kontaktowe z ENV (CONTACT_EMAIL, CONTACT_PHONE, CONTACT_FORM_URL)
  → Opcje: mailto:, tel:, link do formularza

Disclaimer (Codex insight):
  "Powyższe pomysły mają charakter inspiracyjny i nie stanowią
  rekomendacji biznesowej. Skontaktuj się, żeby omówić wykonalność."
```

## Modele AI

| Zastosowanie | Model domyślny | Przyszłość (plan płatny) |
|-------------|----------------|--------------------------|
| Onboarding chat (opcjonalny) | GPT-5.2 | Claude (jeśli podłączony) |
| Sugestie biznesowe | GPT-5.1/5.2 | Claude (jeśli podłączony) |
| Generowanie kursów | GPT-5.2 (bez zmian) | Claude (jeśli podłączony) |
| Quizy | GPT-4o-mini (bez zmian) | Bez zmian |

Informacja w UI (strona /profile, sekcja "Modele AI"):
- OpenAI domyślny, wliczony w plan Free
- Anthropic (Claude) dostępny po przejściu na plan płatny + własny klucz API
- "Zaawansowany model może poprawić jakość kursów i sugestii, ale generowanie będzie droższe"

## Sugestie inline — warianty A i C (przełączalne)

```
Wariant A (compact) — prop variant="compact":
┌─────────────────────────────────────────┐
│ 💡 Pomysł biznesowy                      │
│ Automatyczny planer postów               │
│ Narzędzie do planowania contentu...      │
│ [Zobacz więcej →]                        │
└─────────────────────────────────────────┘

Wariant C (hint) — prop variant="hint":
── 💡 Ten temat ma potencjał biznesowy → Zobacz pomysł ──
```

Zaczynamy od wariantu A. Przełączenie na C = zmiana 1 propa.
Użytkownik może reagować: [Zapisz] [Nie dla mnie] [Pokaż inną] (Codex insight).

## Nawigacja

```
Sidebar:
  ├─ Dashboard
  ├─ Moje kursy
  ├─ Notatki
  ├─ Pomysły biznesowe ← NOWE (zbiorcza strona z filtrem po kursie)
  └─ Profil

Kurs (bez osobnej zakładki w MVP — tylko inline przy lekcji):
  → Pomysły z danego kursu widoczne na zbiorczej stronie przez filtr
```

## Wpływ na istniejący kod

### Modyfikacje

- `dashboard/page.tsx` — OnboardingBanner (mała belka, dopóki nie ukończy)
- `courses/new/page.tsx` — wstrzyknięcie profilu biznesowego do ClarifyingChat prompt
- `[chapterId]/page.tsx` — przycisk "Pokaż pomysł biznesowy" + InlineSuggestion
- `profile/page.tsx` — sekcja "Profil biznesowy" + info o modelach AI
- `layout sidebar` — nowa pozycja "Pomysły biznesowe"

### Bez zmian

- Focus Panel, Gamification, Notatki, Quizy
- Auth flow (login/register)
- Materiały źródłowe (PDF/DOCX)
- providers.ts (Anthropic routing w osobnej fazie)

## Znane ryzyka i mitigacje

| Ryzyko | Mitigacja |
|--------|-----------|
| AI w chacie nie wyciągnie kluczowych info | Formularz zbiera dane strukturalne, chat tylko doprecyzowuje |
| relevant_section — kruche dopasowanie heading | Fuzzy matching (stripHeadingNumber) jak w lesson images |
| Kosztowne wywołania AI | Na żądanie (nie automatycznie), rate limit 5/dzień, cache + input_hash |
| 80% użytkowników pominie onboarding | Sugestie działają też bez profilu (ogólne) + mała belka zachęcająca |
| Sugestie nieaktualne po zmianie profilu | profile_version + input_hash → przycisk "Odśwież" |
| CTA wygląda jak nachalna reklama | Warunkowe CTA (po zapisaniu pomysłu) + disclaimer |
| Brak kursów = pusta strona pomysłów | Komunikat "Stwórz pierwszy kurs, żeby zobaczyć pomysły biznesowe" |

## Zmienne środowiskowe (nowe)

```env
# Lead generation — dane kontaktowe (MVP, docelowo tabela DB)
CONTACT_EMAIL=kontakt@example.com
CONTACT_PHONE=+48123456789
CONTACT_FORM_URL=https://example.com/kontakt
```

## Odłożone na osobne fazy

1. **Klucze API użytkownika** — `user_api_keys`, szyfrowanie, walidacja, Anthropic provider routing
2. **Freemium** — limity 3 kursy/miesiąc, billing, subscription management
3. **platform_contact_settings** — tabela DB zamiast ENV (white-label ready)
4. **business_suggestion_interactions** — tracking viewed/bookmarked/contact_clicked
5. **A/B test wariantów** inline (A vs C) z metrykami
6. **Telemetria produktu** — ile osób kończy onboarding, klika CTA (Codex insight)
7. **Zakładka pomysłów per kurs** — rozszerzenie zbiorczej strony

## Źródła review

- Claude Code: krytyczna analiza (7 poprawek uwzględnionych)
- Codex (Cursor): niezależny review (ocena 7/10, kluczowe insights: profile_version, input_hash, warunkowe CTA, hybryda onboardingu, na żądanie zamiast auto)
