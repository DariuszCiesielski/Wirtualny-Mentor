# Roadmap: Wirtualny Mentor

## Overview

Wirtualny Mentor to platforma edukacyjna AI, która generuje spersonalizowane programy nauczania z 5 poziomami zaawansowania (Poczatkujacy -> Guru). Projekt budujemy w 8 fazach: od fundamentow infrastruktury AI, przez autentykacje i generowanie curriculum, az po system quizow, notatek z embeddingami i chatbota-mentora wykorzystujacego metode sokratyczna. Koncowe fazy dopracowuja UX i dodaja automatyczne odswiezanie wiedzy.

## Phases

**Phase Numbering:**
- Integer phases (0, 1, 2...): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 0: Foundation & AI Architecture** - Setup Next.js, Vercel AI SDK, model tiering strategy ✓
- [x] **Phase 1: Auth & Basic UI** - Supabase auth, database schema, podstawowy interfejs
- [x] **Phase 2: Curriculum Generation** - Generowanie spersonalizowanego programu nauczania z 5 poziomami ✓
- [ ] **Phase 3: Learning Materials** - Materialy podre­cznikowe z praktycznymi instrukcjami
- [ ] **Phase 4: Assessment System** - Quizy, testy, adaptacyjna remediacja
- [ ] **Phase 5: Notes System & Embeddings** - Notatki uzytkownika z wektoryzacja do RAG
- [ ] **Phase 6: Mentor Chatbot** - Chatbot z metoda sokratyczna i dostepem do notatek
- [ ] **Phase 7: Polish & Optimization** - Responsywnosc, odswiezanie wiedzy, monitoring

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
- [ ] 03-01-PLAN.md — Database schema i TypeScript types dla section_content (Wave 1)
- [ ] 03-02-PLAN.md — AI prompts i web search tools dla grounded generation (Wave 1)
- [ ] 03-03-PLAN.md — DAL i API endpoint dla material generation (Wave 2)
- [ ] 03-04-PLAN.md — Markdown renderer i UI components (Wave 2)
- [ ] 03-05-PLAN.md — Chapter page z lazy content generation (Wave 3)

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
**Plans**: TBD

Plans:
- [ ] 04-01: Quiz generation engine
- [ ] 04-02: Quiz-taking UI i scoring
- [ ] 04-03: Level progression i skip mechanism
- [ ] 04-04: Adaptive remediation

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
**Plans**: TBD

Plans:
- [ ] 05-01: Notes CRUD i linking do sekcji
- [ ] 05-02: Embedding pipeline (chunking, vectorization, pgvector)
- [ ] 05-03: Notes search UI

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
**Plans**: TBD

Plans:
- [ ] 06-01: Chat UI (useChat, streaming)
- [ ] 06-02: RAG integration (notatki uzytkownika)
- [ ] 06-03: Socratic method prompting
- [ ] 06-04: Coach persona i context management

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
**Plans**: TBD

Plans:
- [ ] 07-01: Responsive design audit i fixes
- [ ] 07-02: Knowledge refresh mechanism (scheduled jobs)
- [ ] 07-03: Cost monitoring dashboard
- [ ] 07-04: Performance optimization

## Progress

**Execution Order:**
Phases execute in numeric order: 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Foundation & AI Architecture | 2/2 | ✓ Complete | 2025-01-30 |
| 1. Auth & Basic UI | 3/3 | ✓ Complete | 2025-01-30 |
| 2. Curriculum Generation | 7/7 | ✓ Complete | 2026-01-31 |
| 3. Learning Materials | 0/5 | Planned | - |
| 4. Assessment System | 0/4 | Not started | - |
| 5. Notes System & Embeddings | 0/3 | Not started | - |
| 6. Mentor Chatbot | 0/4 | Not started | - |
| 7. Polish & Optimization | 0/4 | Not started | - |

**Total:** 12/32 plans complete (38%)

---
*Roadmap created: 2025-01-30*
*Last updated: 2026-01-31*
