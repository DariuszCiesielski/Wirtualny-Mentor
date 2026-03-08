# Roadmap: Wirtualny Mentor

## Overview

Wirtualny Mentor to platforma edukacyjna AI, ktora generuje spersonalizowane programy nauczania z 5 poziomami zaawansowania (Poczatkujacy -> Guru). Milestone v1.0 (fazy 0-7) dostarczyl kompletna platforme edukacyjna z auth, curriculum, materialami, quizami, notatkami, chatbotem-mentorem i optymalizacja. Milestone v2.0 "Business Enablement" (fazy 8-10) dodaje profil biznesowy uzytkownika, kontekstowe sugestie biznesowe generowane AI przy lekcjach i zbiorcza strone pomyslow z lead generation.

## Phases

**Phase Numbering:**
- Integer phases (0, 1, 2...): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

### Milestone v1.0 (Complete)

- [x] **Phase 0: Foundation & AI Architecture** - Setup Next.js, Vercel AI SDK, model tiering strategy
- [x] **Phase 1: Auth & Basic UI** - Supabase auth, database schema, podstawowy interfejs
- [x] **Phase 2: Curriculum Generation** - Generowanie spersonalizowanego programu nauczania z 5 poziomami
- [x] **Phase 3: Learning Materials** - Materialy podrecznikowe z praktycznymi instrukcjami
- [x] **Phase 4: Assessment System** - Quizy, testy, adaptacyjna remediacja
- [x] **Phase 5: Notes System & Embeddings** - Notatki uzytkownika z wektoryzacja do RAG
- [x] **Phase 6: Mentor Chatbot** - Chatbot z metoda sokratyczna i dostepem do notatek
- [x] **Phase 7: Polish & Optimization** - Responsywnosc, odswiezanie wiedzy, monitoring

### Milestone v2.0 — Business Enablement

- [ ] **Phase 8: Business Onboarding** - Profil biznesowy uzytkownika z opcjonalnym chatem AI
- [ ] **Phase 9: Business Suggestions** - Kontekstowe sugestie biznesowe AI przy lekcjach
- [ ] **Phase 10: Business Ideas & Lead Generation** - Zbiorcza strona pomyslow z CTA kontaktowym

## Phase Details

### Phase 0: Foundation & AI Architecture
**Goal**: Infrastruktura AI gotowa do obslugi wielu modeli z monitoringiem kosztow
**Depends on**: Nothing (first phase)
**Requirements**: None (technical foundation)
**Success Criteria** (what must be TRUE):
  1. Projekt Next.js dziala lokalnie z podstawowa strona
  2. Vercel AI SDK skonfigurowany z Claude, GPT i Gemini providerami
  3. Prosty endpoint AI zwraca streaming response
  4. Struktura katalogow gotowa na service layer i AI orchestration
  5. Cost monitoring setup (alerty budzectowe w providerach AI)
**Plans**: 2 plans

Plans:
- [x] 00-01-PLAN.md — Next.js 15 project setup z AI SDK 6 i struktura katalogow ✓
- [x] 00-02-PLAN.md — Multi-model orchestration layer z cost tracking ✓

**Completed:** 2025-01-30

---

### Phase 1: Auth & Basic UI
**Goal**: Uzytkownik moze sie zarejestrowac, zalogowac i widziec podstawowy dashboard
**Depends on**: Phase 0
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, UX-01, UX-05
**Success Criteria** (what must be TRUE):
  1. Uzytkownik moze utworzyc konto z emailem i haslem
  2. Uzytkownik moze sie zalogowac i sesja persystuje po odswiezeniu przegladarki
  3. Uzytkownik moze zresetowac haslo przez link emailowy
  4. Uzytkownik widzi dashboard z opcja edycji profilu (imie, avatar)
  5. Interfejs jest czysty i intuicyjny (inspiracja NotebookLM)
  6. Dark mode dziala poprawnie
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Supabase setup, shadcn/ui, dark mode infrastructure
- [x] 01-02-PLAN.md — Auth flows (login, register, password reset)
- [x] 01-03-PLAN.md — Protected dashboard i edycja profilu

**Completed:** 2025-01-30

---

### Phase 2: Curriculum Generation
**Goal**: AI generuje spersonalizowany program nauczania z 5 poziomami na podstawie tematu i pytan doprecyzowujacych
**Depends on**: Phase 1
**Requirements**: PROG-01, PROG-02, PROG-03, PROG-04, PROG-05, PROG-06, PROG-07, PROG-08, PROG-09, KNOW-01, KNOW-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. Uzytkownik moze wpisac temat lub podac link do zrodla
  2. AI zadaje pytania doprecyzowujace (cele, doswiadczenie, dostepny czas)
  3. AI generuje curriculum z 5 poziomami (Poczatkujacy -> Guru), kazdy z rozdzialami
  4. Uzytkownik widzi pelna strukture curriculum (spis tresci)
  5. Postep uzytkownika jest zapisywany i persystuje miedzy sesjami
  6. Nawigacja miedzy sekcjami i poziomami dziala plynnie
  7. Uzytkownik widzi pasek postepu (ile przeszedl z kursu)
  8. AI wykorzystuje web search dla aktualnych informacji (Tavily)
  9. Uzytkownik moze miec wiele kursow rownolegle i przelaczac sie miedzy nimi
  10. Kazdy poziom wyswietla learning outcomes ("Po ukonczeniu tego poziomu bedziesz umial...")
  11. AI analizuje oficjalne programy nauczania (szkoly, uczelnie) i dopasowuje kurs do standardow rynkowych
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
**Goal**: Kazda sekcja curriculum zawiera materialy jak w podreczniku z praktycznymi instrukcjami
**Depends on**: Phase 2
**Requirements**: MAT-01, MAT-02, MAT-03, MAT-04, MAT-05, MAT-06, MAT-07, MAT-08, KNOW-04
**Success Criteria** (what must be TRUE):
  1. Kazda sekcja zawiera wygenerowana tresc w stylu podrecznika
  2. Materialy zawieraja linki do zewnetrznych zasobow (dokumentacje, kursy, artykuly)
  3. Materialy zawieraja konkretne narzedzia z linkami URL
  4. Instrukcje instalacji sa krok po kroku
  5. Komendy do uzycia maja wyjasnienia i oczekiwane wyniki
  6. Zrodla sa cytowane w wygenerowanych tresciach (anti-halucynacja)
  7. Angielskie materialy zrodlowe sa tlumaczone na polski
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
**Goal**: Uzytkownik jest testowany z wiedzy przez quizy i testy, z adaptacyjna remediacja przy bledach
**Depends on**: Phase 3
**Requirements**: QUIZ-01, QUIZ-02, QUIZ-03, QUIZ-04, QUIZ-05, QUIZ-06, QUIZ-07
**Success Criteria** (what must be TRUE):
  1. Po sekcjach pojawiaja sie krotkie quizy sprawdzajace zrozumienie
  2. Na koncu kazdego poziomu jest test koncowy
  3. Uzytkownik musi zdac test, zeby odblokowac nastepny poziom (domyslna sciezka)
  4. Uzytkownik moze reczenie przeskoczyc poziom (dla zaawansowanych)
  5. Bledne odpowiedzi wywoluja dodatkowe materialy remediacyjne
  6. Uzytkownik moze powtorzyc test po przerobeniu remediacji
  7. Feedback na odpowiedzi wyjasnia dlaczego poprawna/bledna
**Plans**: 4 plans in 3 waves

Plans:
- [x] 04-01-PLAN.md — Quiz database schema i TypeScript types (Wave 1) ✓
- [x] 04-02-PLAN.md — Quiz generation engine z AI prompts i DAL (Wave 1) ✓
- [x] 04-03-PLAN.md — Quiz UI components i scoring (Wave 2) ✓
- [x] 04-04-PLAN.md — Level progression, skip mechanism i remediation (Wave 3) ✓

**Completed:** 2026-01-31

---

### Phase 5: Notes System & Embeddings
**Goal**: Uzytkownik moze tworzyc notatki podczas nauki, ktore sa wektoryzowane dla chatbota
**Depends on**: Phase 3
**Requirements**: NOTE-01, NOTE-02, NOTE-03, NOTE-04, NOTE-05
**Success Criteria** (what must be TRUE):
  1. Uzytkownik moze tworzyc notatki podczas nauki
  2. Uzytkownik moze przegladac i edytowac zapisane notatki
  3. Notatki sa powiazane z konkretna lekcja/sekcja
  4. Notatki sa przeszukiwalne (full-text search)
  5. Notatki sa embedowane w pgvector dla RAG chatbota
**Plans**: 5 plans in 3 waves

Plans:
- [x] 05-01-PLAN.md — Notes database schema i TypeScript types (Wave 1) ✓
- [x] 05-02-PLAN.md — Embedding generation functions (Wave 1) ✓
- [x] 05-03-PLAN.md — Notes DAL i Server Actions z embedowaniem (Wave 2) ✓
- [x] 05-04-PLAN.md — Notes UI components na stronie rozdzialu (Wave 3) ✓
- [x] 05-05-PLAN.md — Notes search page z full-text search (Wave 3) ✓

**Completed:** 2026-01-31

---

### Phase 6: Mentor Chatbot
**Goal**: Chatbot-mentor odpowiada na pytania metoda sokratyczna z dostepem do notatek uzytkownika
**Depends on**: Phase 5
**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06
**Success Criteria** (what must be TRUE):
  1. Uzytkownik moze zadawac pytania o temat nauki
  2. Chatbot uzywa metody sokratycznej (naprowadza, nie daje gotowych odpowiedzi)
  3. Chatbot ma dostep do notatek uzytkownika (RAG z pgvector)
  4. Chatbot wspiera i motywuje (rola coacha)
  5. Chatbot odpowiada na zaawansowane pytania (nie ograniczony do aktualnego poziomu)
  6. Odpowiedzi sa streamowane w czasie rzeczywistym
**Plans**: 3 plans in 2 waves

Plans:
- [x] 06-01-PLAN.md — Mentor prompts i searchNotes tool (Wave 1) ✓
- [x] 06-02-PLAN.md — Chat API endpoint z streaming (Wave 1) ✓
- [x] 06-03-PLAN.md — Chat UI page i nawigacja (Wave 2) ✓

**Completed:** 2026-01-31

---

### Phase 7: Polish & Optimization
**Goal**: Aplikacja jest responsywna, wiedza odswiezana automatycznie, koszty monitorowane
**Depends on**: Phase 6
**Requirements**: UX-02, KNOW-03
**Success Criteria** (what must be TRUE):
  1. Aplikacja dziala poprawnie na urzadzeniach mobilnych (responsywny design)
  2. Baza wiedzy odswiezana automatycznie dla dynamicznych dziedzin (AI, tech, prawo)
  3. Dashboard z metrykami kosztow AI dostepny dla administratora
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
**Goal**: Uzytkownik moze opisac swoj kontekst biznesowy, a platforma wykorzystuje go do personalizacji nauki
**Depends on**: Phase 7 (existing platform)
**Requirements**: ONB-01, ONB-02, ONB-03, ONB-04, ONB-05, ONB-06
**Success Criteria** (what must be TRUE):
  1. Uzytkownik moze wypelnic formularz profilu biznesowego (branza, rola, cel, wielkosc firmy) i zapisac go
  2. Uzytkownik moze opcjonalnie doprecyzowac profil w krotkim chacie z AI, a AI generuje z tego podsumowanie
  3. Dashboard wyswietla banner zachecajacy do uzupelnienia profilu (znika po ukonczeniu onboardingu)
  4. Uzytkownik moze edytowac profil biznesowy ze strony /profile w dowolnym momencie
  5. Przy tworzeniu nowego kursu AI uwzglednia profil biznesowy uzytkownika w pytaniach doprecyzowujacych
**Plans**: 4 plans in 3 waves

Plans:
- [ ] 08-01-PLAN.md — DB migration, typy, schematy, DAL, prompts, provider config, shadcn Popover+Command
- [ ] 08-02-PLAN.md — Komponent Combobox, formularz BusinessProfileForm, strona /onboarding
- [ ] 08-03-PLAN.md — Chat AI onboardingu (API + UI), banner na dashboardzie
- [ ] 08-04-PLAN.md — Integracja: flow /onboarding, edycja w /profile, curriculum prompt injection

---

### Phase 9: Business Suggestions
**Goal**: Uzytkownik otrzymuje kontekstowe sugestie biznesowe przy lekcjach, dopasowane do jego profilu i tresci
**Depends on**: Phase 8 (business profile needed for personalized suggestions)
**Requirements**: SUG-01, SUG-02, SUG-03, SUG-04, SUG-05, SUG-06, SUG-07, SUG-08, SUG-09
**Success Criteria** (what must be TRUE):
  1. Uzytkownik moze kliknac przycisk przy lekcji i otrzymac sugestie biznesowa wygenerowana przez AI na podstawie tresci + profilu (lub ogolna bez profilu)
  2. Sugestia wyswietla sie inline przy odpowiedniej sekcji lekcji i mozna ja przelaczac miedzy widokiem compact a hint
  3. Sugestie sa cache'owane w DB — ponowne otwarcie lekcji nie wywoluje AI, a zmiana profilu invaliduje cache
  4. Uzytkownik moze zapisac (bookmark) lub odrzucic (dismiss) sugestie
  5. Generowanie sugestii jest limitowane do 5 dziennie

---

### Phase 10: Business Ideas & Lead Generation
**Goal**: Uzytkownik ma jedno miejsce do przegladania wszystkich pomyslow biznesowych z mozliwoscia kontaktu
**Depends on**: Phase 9 (suggestions must exist to aggregate)
**Requirements**: IDEAS-01, IDEAS-02, IDEAS-03, LEAD-01, LEAD-02, LEAD-03
**Success Criteria** (what must be TRUE):
  1. Uzytkownik widzi w sidebarze link do strony /business-ideas z lista wszystkich zapisanych (bookmarked) sugestii
  2. Uzytkownik moze filtrowac pomysly po kursie i widziec pelna karte kazdego pomyslu (tytul, opis, potencjal, zlozonosc)
  3. Po zapisaniu pomyslu (bookmark) lub powrocie do niego pojawia sie CTA kontaktowe z danymi z ENV
  4. Kazda sugestia biznesowa zawiera disclaimer o charakterze inspiracyjnym

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
| 8. Business Onboarding | 0/4 | Planned | — |
| 9. Business Suggestions | 0/? | Pending | — |
| 10. Business Ideas & Lead Generation | 0/? | Pending | — |

**v1.0 Total:** 33/33 plans complete (100%)
**v2.0 Total:** 0/4+ plans (0%) — phase 8 planned

---
*Roadmap created: 2025-01-30*
*v2.0 phases added: 2026-03-08*
*Last updated: 2026-03-08*
