# Roadmap: Wirtualny Mentor

## Overview

Wirtualny Mentor to platforma edukacyjna AI, która generuje spersonalizowane programy nauczania z 5 poziomami zaawansowania (Początkujący -> Guru). Milestone v1.0 (fazy 0-7) dostarczył kompletną platformę edukacyjną z auth, curriculum, materiałami, quizami, notatkami, chatbotem-mentorem i optymalizacją. Milestone v2.0 "Business Enablement" (fazy 8-10) dodaje profil biznesowy użytkownika, kontekstowe sugestie biznesowe generowane AI przy lekcjach i zbiorczą stronę pomysłów z lead generation.

## Phases

**Phase Numbering:**
- Integer phases (0, 1, 2...): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

### Milestone v1.0 (Complete)

- [x] **Phase 0: Foundation & AI Architecture** - Setup Next.js, Vercel AI SDK, model tiering strategy
- [x] **Phase 1: Auth & Basic UI** - Supabase auth, database schema, podstawowy interfejs
- [x] **Phase 2: Curriculum Generation** - Generowanie spersonalizowanego programu nauczania z 5 poziomami
- [x] **Phase 3: Learning Materials** - Materiały podręcznikowe z praktycznymi instrukcjami
- [x] **Phase 4: Assessment System** - Quizy, testy, adaptacyjna remediacja
- [x] **Phase 5: Notes System & Embeddings** - Notatki użytkownika z wektoryzacją do RAG
- [x] **Phase 6: Mentor Chatbot** - Chatbot z metodą sokratyczną i dostępem do notatek
- [x] **Phase 7: Polish & Optimization** - Responsywność, odświeżanie wiedzy, monitoring

### Milestone v2.0 — Business Enablement

- [ ] **Phase 8: Business Onboarding** - Profil biznesowy użytkownika z opcjonalnym chatem AI
- [ ] **Phase 9: Business Suggestions** - Kontekstowe sugestie biznesowe AI przy lekcjach
- [ ] **Phase 10: Business Ideas & Lead Generation** - Zbiorcza strona pomysłów z CTA kontaktowym

## Phase Details

### Phase 0: Foundation & AI Architecture
**Goal**: Infrastruktura AI gotowa do obsługi wielu modeli z monitoringiem kosztów
**Depends on**: Nothing (first phase)
**Requirements**: None (technical foundation)
**Success Criteria** (what must be TRUE):
  1. Projekt Next.js działa lokalnie z podstawową stroną
  2. Vercel AI SDK skonfigurowany z Claude, GPT i Gemini providerami
  3. Prosty endpoint AI zwraca streaming response
  4. Struktura katalogów gotowa na service layer i AI orchestration
  5. Cost monitoring setup (alerty budżetowe w providerach AI)
**Plans**: 2 plans

Plans:
- [x] 00-01-PLAN.md — Next.js 15 project setup z AI SDK 6 i strukturą katalogów ✓
- [x] 00-02-PLAN.md — Multi-model orchestration layer z cost tracking ✓

**Completed:** 2025-01-30

---

### Phase 1: Auth & Basic UI
**Goal**: Użytkownik może się zarejestrować, zalogować i widzieć podstawowy dashboard
**Depends on**: Phase 0
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, UX-01, UX-05
**Success Criteria** (what must be TRUE):
  1. Użytkownik może utworzyć konto z emailem i hasłem
  2. Użytkownik może się zalogować i sesja persystuje po odświeżeniu przeglądarki
  3. Użytkownik może zresetować hasło przez link emailowy
  4. Użytkownik widzi dashboard z opcją edycji profilu (imię, avatar)
  5. Interfejs jest czysty i intuicyjny (inspiracja NotebookLM)
  6. Dark mode działa poprawnie
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Supabase setup, shadcn/ui, dark mode infrastructure
- [x] 01-02-PLAN.md — Auth flows (login, register, password reset)
- [x] 01-03-PLAN.md — Protected dashboard i edycja profilu

**Completed:** 2025-01-30

---

### Phase 2: Curriculum Generation
**Goal**: AI generuje spersonalizowany program nauczania z 5 poziomami na podstawie tematu i pytań doprecyzowujących
**Depends on**: Phase 1
**Requirements**: PROG-01, PROG-02, PROG-03, PROG-04, PROG-05, PROG-06, PROG-07, PROG-08, PROG-09, KNOW-01, KNOW-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. Użytkownik może wpisać temat lub podać link do źródła
  2. AI zadaje pytania doprecyzowujące (cele, doświadczenie, dostępny czas)
  3. AI generuje curriculum z 5 poziomami (Początkujący -> Guru), każdy z rozdziałami
  4. Użytkownik widzi pełną strukturę curriculum (spis treści)
  5. Postęp użytkownika jest zapisywany i persystuje między sesjami
  6. Nawigacja między sekcjami i poziomami działa płynnie
  7. Użytkownik widzi pasek postępu (ile przeszedł z kursu)
  8. AI wykorzystuje web search dla aktualnych informacji (Tavily)
  9. Użytkownik może mieć wiele kursów równolegle i przełączać się między nimi
  10. Każdy poziom wyświetla learning outcomes ("Po ukończeniu tego poziomu będziesz umiał...")
  11. AI analizuje oficjalne programy nauczania (szkoły, uczelnie) i dopasowuje kurs do standardów rynkowych
**Plans**: 7 plans in 4 waves

Plans:
- [x] 02-01-PLAN.md — Database schema dla courses/levels/chapters/progress (Wave 1) ✓
- [x] 02-02-PLAN.md — Tavily client i Zod schemas dla curriculum (Wave 1) ✓
- [x] 02-03-PLAN.md — Topic input i clarifying questions flow (Wave 2) ✓
- [x] 02-04-PLAN.md — Curriculum generation z web search (Wave 2) ✓
- [x] 02-05-PLAN.md — Curriculum TOC view i nawigacja (Wave 3) ✓
- [x] 02-06-PLAN.md — Progress tracking, progress bar, chapter navigation (Wave 4) ✓
- [x] 02-07-PLAN.md — Multi-course dashboard i course cards (Wave 4) ✓

**Completed:** 2026-01-31

---

### Phase 3: Learning Materials
**Goal**: Każda sekcja curriculum zawiera materiały jak w podręczniku z praktycznymi instrukcjami
**Depends on**: Phase 2
**Requirements**: MAT-01, MAT-02, MAT-03, MAT-04, MAT-05, MAT-06, MAT-07, MAT-08, KNOW-04
**Success Criteria** (what must be TRUE):
  1. Każda sekcja zawiera wygenerowaną treść w stylu podręcznika
  2. Materiały zawierają linki do zewnętrznych zasobów (dokumentacje, kursy, artykuły)
  3. Materiały zawierają konkretne narzędzia z linkami URL
  4. Instrukcje instalacji są krok po kroku
  5. Komendy do użycia mają wyjaśnienia i oczekiwane wyniki
  6. Źródła są cytowane w wygenerowanych treściach (anti-halucynacja)
  7. Angielskie materiały źródłowe są tłumaczone na polski
**Plans**: 5 plans in 3 waves

Plans:
- [x] 03-01-PLAN.md — Database schema i TypeScript types dla section_content (Wave 1) ✓
- [x] 03-02-PLAN.md — AI prompts i web search tools dla grounded generation (Wave 1) ✓
- [x] 03-03-PLAN.md — DAL i API endpoint dla material generation (Wave 2) ✓
- [x] 03-04-PLAN.md — Markdown renderer i UI components (Wave 2) ✓
- [x] 03-05-PLAN.md — Chapter page z lazy content generation (Wave 3) ✓

**Completed:** 2026-01-31

---

### Phase 4: Assessment System
**Goal**: Użytkownik jest testowany z wiedzy przez quizy i testy, z adaptacyjną remediacją przy błędach
**Depends on**: Phase 3
**Requirements**: QUIZ-01, QUIZ-02, QUIZ-03, QUIZ-04, QUIZ-05, QUIZ-06, QUIZ-07
**Success Criteria** (what must be TRUE):
  1. Po sekcjach pojawiają się krótkie quizy sprawdzające zrozumienie
  2. Na końcu każdego poziomu jest test końcowy
  3. Użytkownik musi zdać test, żeby odblokować następny poziom (domyślna ścieżka)
  4. Użytkownik może ręcznie przeskoczyć poziom (dla zaawansowanych)
  5. Błędne odpowiedzi wywołują dodatkowe materiały remediacyjne
  6. Użytkownik może powtórzyć test po przerobieniu remediacji
  7. Feedback na odpowiedzi wyjaśnia dlaczego poprawna/błędna
**Plans**: 4 plans in 3 waves

Plans:
- [x] 04-01-PLAN.md — Quiz database schema i TypeScript types (Wave 1) ✓
- [x] 04-02-PLAN.md — Quiz generation engine z AI prompts i DAL (Wave 1) ✓
- [x] 04-03-PLAN.md — Quiz UI components i scoring (Wave 2) ✓
- [x] 04-04-PLAN.md — Level progression, skip mechanism i remediation (Wave 3) ✓

**Completed:** 2026-01-31

---

### Phase 5: Notes System & Embeddings
**Goal**: Użytkownik może tworzyć notatki podczas nauki, które są wektoryzowane dla chatbota
**Depends on**: Phase 3
**Requirements**: NOTE-01, NOTE-02, NOTE-03, NOTE-04, NOTE-05
**Success Criteria** (what must be TRUE):
  1. Użytkownik może tworzyć notatki podczas nauki
  2. Użytkownik może przeglądać i edytować zapisane notatki
  3. Notatki są powiązane z konkretną lekcją/sekcją
  4. Notatki są przeszukiwalne (full-text search)
  5. Notatki są embedowane w pgvector dla RAG chatbota
**Plans**: 5 plans in 3 waves

Plans:
- [x] 05-01-PLAN.md — Notes database schema i TypeScript types (Wave 1) ✓
- [x] 05-02-PLAN.md — Embedding generation functions (Wave 1) ✓
- [x] 05-03-PLAN.md — Notes DAL i Server Actions z embedowaniem (Wave 2) ✓
- [x] 05-04-PLAN.md — Notes UI components na stronie rozdziału (Wave 3) ✓
- [x] 05-05-PLAN.md — Notes search page z full-text search (Wave 3) ✓

**Completed:** 2026-01-31

---

### Phase 6: Mentor Chatbot
**Goal**: Chatbot-mentor odpowiada na pytania metodą sokratyczną z dostępem do notatek użytkownika
**Depends on**: Phase 5
**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06
**Success Criteria** (what must be TRUE):
  1. Użytkownik może zadawać pytania o temat nauki
  2. Chatbot używa metody sokratycznej (naprowadza, nie daje gotowych odpowiedzi)
  3. Chatbot ma dostęp do notatek użytkownika (RAG z pgvector)
  4. Chatbot wspiera i motywuje (rola coacha)
  5. Chatbot odpowiada na zaawansowane pytania (nie ograniczony do aktualnego poziomu)
  6. Odpowiedzi są streamowane w czasie rzeczywistym
**Plans**: 3 plans in 2 waves

Plans:
- [x] 06-01-PLAN.md — Mentor prompts i searchNotes tool (Wave 1) ✓
- [x] 06-02-PLAN.md — Chat API endpoint z streaming (Wave 1) ✓
- [x] 06-03-PLAN.md — Chat UI page i nawigacja (Wave 2) ✓

**Completed:** 2026-01-31

---

### Phase 7: Polish & Optimization
**Goal**: Aplikacja jest responsywna, wiedza odświeżana automatycznie, koszty monitorowane
**Depends on**: Phase 6
**Requirements**: UX-02, KNOW-03
**Success Criteria** (what must be TRUE):
  1. Aplikacja działa poprawnie na urządzeniach mobilnych (responsywny design)
  2. Baza wiedzy odświeżana automatycznie dla dynamicznych dziedzin (AI, tech, prawo)
  3. Dashboard z metrykami kosztów AI dostępny dla administratora
  4. Performance zoptymalizowany (lazy loading, caching)
**Plans**: 4 plans in 3 waves

Plans:
- [x] 07-01-PLAN.md — Responsive design z collapsible sidebar i mobile drawer (Wave 1) ✓
- [x] 07-02-PLAN.md — Helicone integration dla AI cost monitoring (Wave 1) ✓
- [x] 07-03-PLAN.md — Knowledge refresh mechanism z Vercel Cron Jobs (Wave 2) ✓
- [x] 07-04-PLAN.md — Bundle analyzer, lazy loading, performance optimization (Wave 3) ✓

**Completed:** 2026-01-31

---

### Phase 8: Business Onboarding
**Goal**: Użytkownik może opisać swój kontekst biznesowy, a platforma wykorzystuje go do personalizacji nauki
**Depends on**: Phase 7 (existing platform)
**Requirements**: ONB-01, ONB-02, ONB-03, ONB-04, ONB-05, ONB-06
**Success Criteria** (what must be TRUE):
  1. Użytkownik może wypełnić formularz profilu biznesowego (branża, rola, cel, wielkość firmy) i zapisać go
  2. Użytkownik może opcjonalnie doprecyzować profil w krótkim chacie z AI, a AI generuje z tego podsumowanie
  3. Dashboard wyświetla banner zachęcający do uzupełnienia profilu (znika po ukończeniu onboardingu)
  4. Użytkownik może edytować profil biznesowy ze strony /profile w dowolnym momencie
  5. Przy tworzeniu nowego kursu AI uwzględnia profil biznesowy użytkownika w pytaniach doprecyzowujących
**Plans**: 4 plans in 3 waves

Plans:
- [x] 08-01-PLAN.md — DB migration, typy, schematy, DAL, prompts, provider config, shadcn Popover+Command ✓
- [x] 08-02-PLAN.md — Komponent Combobox, formularz BusinessProfileForm, strona /onboarding ✓
- [x] 08-03-PLAN.md — Chat AI onboardingu (API + UI), banner na dashboardzie ✓
- [x] 08-04-PLAN.md — Integracja: flow /onboarding, edycja w /profile, curriculum prompt injection ✓

**Completed:** 2026-03-08

---

### Phase 9: Business Suggestions
**Goal**: Użytkownik otrzymuje kontekstowe sugestie biznesowe przy lekcjach, dopasowane do jego profilu i treści
**Depends on**: Phase 8 (business profile needed for personalized suggestions)
**Requirements**: SUG-01, SUG-02, SUG-03, SUG-04, SUG-05, SUG-06, SUG-07, SUG-08, SUG-09
**Success Criteria** (what must be TRUE):
  1. Użytkownik może kliknąć przycisk przy lekcji i otrzymać sugestię biznesową wygenerowaną przez AI na podstawie treści + profilu (lub ogólną bez profilu)
  2. Sugestia wyświetla się inline przy odpowiedniej sekcji lekcji i można ją przełączać między widokiem compact a hint
  3. Sugestie są cache'owane w DB — ponowne otwarcie lekcji nie wywołuje AI, a zmiana profilu invaliduje cache
  4. Użytkownik może zapisać (bookmark) lub odrzucić (dismiss) sugestie
  5. Generowanie sugestii jest limitowane do 5 dziennie
**Plans**: 3 plans in 3 waves

Plans:
- [x] 09-01-PLAN.md — DB migration, typy, schema, DAL, AI prompt, provider config ✓
- [x] 09-02-PLAN.md — API endpoint POST + hook useChapterSuggestion ✓
- [x] 09-03-PLAN.md — UI komponenty InlineSuggestion + integracja z content-renderer i chapter page ✓

**Completed:** 2026-03-08

---

### Phase 10: Business Ideas & Lead Generation
**Goal**: Użytkownik ma jedno miejsce do przeglądania wszystkich pomysłów biznesowych z możliwością kontaktu
**Depends on**: Phase 9 (suggestions must exist to aggregate)
**Requirements**: IDEAS-01, IDEAS-02, IDEAS-03, LEAD-01, LEAD-02, LEAD-03
**Success Criteria** (what must be TRUE):
  1. Użytkownik widzi w sidebarze link do strony /business-ideas z listą wszystkich zapisanych (bookmarked) sugestii
  2. Użytkownik może filtrować pomysły po kursie i widzieć pełną kartę każdego pomysłu (tytuł, opis, potencjał, złożoność)
  3. Po zapisaniu pomysłu (bookmark) lub powrocie do niego pojawia się CTA kontaktowe z danymi z ENV
  4. Każda sugestia biznesowa zawiera disclaimer o charakterze inspiracyjnym
**Plans**: 2 plans in 2 waves

Plans:
- [x] 10-01-PLAN.md — Typy, DAL, nawigacja sidebar/mobile, ContactCTA ✓
- [x] 10-02-PLAN.md — Server page /business-ideas, BusinessIdeasClient, IdeaCard ✓

**Completed:** 2026-03-08

## Progress

**Execution Order:**
v1.0: 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 (complete)
v2.0: 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Foundation & AI Architecture | 2/2 | Complete | 2025-01-30 |
| 1. Auth & Basic UI | 3/3 | Complete | 2025-01-30 |
| 2. Curriculum Generation | 7/7 | Complete | 2026-01-31 |
| 3. Learning Materials | 5/5 | Complete | 2026-01-31 |
| 4. Assessment System | 4/4 | Complete | 2026-01-31 |
| 5. Notes System & Embeddings | 5/5 | Complete | 2026-01-31 |
| 6. Mentor Chatbot | 3/3 | Complete | 2026-01-31 |
| 7. Polish & Optimization | 4/4 | Complete | 2026-01-31 |
| 8. Business Onboarding | 4/4 | Complete | 2026-03-08 |
| 9. Business Suggestions | 3/3 | Complete | 2026-03-08 |
| 10. Business Ideas & Lead Generation | 2/2 | Complete | 2026-03-08 |

**v1.0 Total:** 33/33 plans complete (100%)
**v2.0 Total:** 9/9 plans (100%) — all phases complete

---
*Roadmap created: 2025-01-30*
*v2.0 phases added: 2026-03-08*
*Last updated: 2026-03-08 — phase 10 complete, milestone v2.0 done*
