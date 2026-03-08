# AGENTS.md

## 1) Cel projektu
- Nazwa projektu: Wirtualny Mentor
- Problem biznesowy, który rozwiązujemy: Personalizowana platforma edukacyjna z AI — generuje kompleksowe programy nauczania od Początkującego do Guru z materiałami, quizami i chatbotem-mentorem.
- Główny użytkownik: Dariusz Ciesielski (właściciel/developer)
- Najważniejszy efekt (KPI): Użytkownik podaje temat → AI tworzy pełny kurs z 5 poziomami, lekcjami, quizami i wsparciem mentora.

## 2) Definicja "Done" dla zadań
- Feature działa lokalnie (`npm run dev`).
- Build produkcyjny przechodzi (`npm run build`).
- Jest krótka instrukcja użycia (jeśli dotyczy).
- Jest minimalna walidacja (build/lint/manual check).
- Ryzyka i ograniczenia są zapisane.

## 3) Styl komunikacji z właścicielem projektu
- Komunikuj po polsku i bez żargonu.
- Tłumacz decyzje techniczne prostym językiem.
- Dziel zadania na małe kroki i podawaj status.
- Na koniec każdej sesji: "co zrobione", "co dalej", "jak sprawdzić".

## 4) Zakres technologiczny
- Framework: Next.js 16 (App Router, Turbopack), React 19, TypeScript strict
- Styling: Tailwind CSS v4, shadcn/ui (New York, Zinc), system 6 motywów (domyślny: Szkło)
- Baza danych: Supabase (PostgreSQL + pgvector + RLS + Storage)
- AI: Vercel AI SDK v6, GPT-5.2 (curriculum + mentor), GPT-4o-mini (quizy, planner), text-embedding-3-small (RAG)
- Hosting/deploy: Vercel
- Integracje zewnętrzne: Tavily (web search), kie.ai + DALL-E 3 + Unsplash (obrazy), Helicone (monitoring)

## 5) Komendy projektu
- Instalacja: `npm install`
- Development: `npm run dev` (localhost:3000)
- Build: `npm run build`
- Lint: `npm run lint`
- Bundle analyzer: `ANALYZE=true npm run build`
- AI Bridge UI: `npm run ai:ui`

## 6) Architektura (krótko)
- Główne katalogi:
  - `src/lib/ai/` — prompty, schematy Zod, orchestracja AI
  - `src/lib/dal/` — Data Access Layer z auth verification
  - `src/lib/documents/` — ekstrakcja tekstu, chunking (PDF/DOCX/TXT)
  - `src/lib/images/` — providerzy obrazów (kie.ai, DALL-E, Unsplash) + AI Planner
  - `src/lib/focus/` — audio manager, presets, focus DAL
  - `src/lib/gamification/` — points, achievements, DAL
  - `src/components/` — UI components (focus, gamification, chat, curriculum)
  - `src/app/api/` — route handlers (streaming)
- Kluczowe moduły: Multi-model AI routing, RAG z materiałów źródłowych, Focus Panel (Pomodoro + sounds), Gamification
- Krytyczne przepływy: User Input → API Route → DAL (auth) → Supabase → AI Provider → Streaming → Client

## 7) Zasady bezpieczeństwa
- Nigdy nie pokazuj sekretów ani pełnej zawartości `.env`.
- Klucze API tylko po stronie backend/server function.
- Auth: ZAWSZE `getUser()`, NIGDY `getSession()` (CVE-2025-29927).
- Quiz scoring server-side — `correct_option` nigdy nie trafia do klienta.
- RLS z nested tables (EXISTS z course_id join).
- Przed zmianą danych produkcyjnych wymagaj potwierdzenia.

## 8) Reguły jakości kodu
- Zmiany mają być małe, czytelne i odwracalne.
- Nie refaktoruj szeroko bez potrzeby zadania.
- Utrzymuj spójne nazewnictwo i strukturę plików.
- Kod po angielsku, UI/UX po polsku (z polskimi diakrytykami!).
- Conventional commits (feat, fix, docs, chore, perf).

## 9) Workflow pracy w sesji
1. Potwierdź cel i kryterium sukcesu.
2. Zrób krótki plan wykonania.
3. Wprowadź zmiany iteracyjnie.
4. Uruchom weryfikację (`npm run build`).
5. Podsumuj wynik i następny krok.

## 10) Koordynacja AI (`.ai/`)
- Projekt używa folderu `.ai/` do koordynacji pracy wielu agentów.
- Przed rozpoczęciem pracy przeczytaj:
  - `.ai/PROJECT-STATE.md`
  - 3 najnowsze pliki w `.ai/handoffs/`
  - `.ai/leases.json`
- Pracuj tylko w ramach przydzielonego zadania i `allowed_paths`.
- Jeśli zakres plików jest zajęty przez innego agenta, zatrzymaj pracę i zgłoś `BLOCKED`.
- Na koniec sesji:
  - zaktualizuj `.ai/PROJECT-STATE.md`
  - dodaj handoff do `.ai/handoffs/`
  - zaktualizuj lub zwolnij lease w `.ai/leases.json`

## 11) Kontekst biznesowy
- Co działa dobrze: Pełny pipeline kursu (7 faz zakończonych), Focus Panel, Gamification, Lesson Images, RAG z materiałów źródłowych
- Co jest w budowie: System notatek z embeddingami (faza 05 — research)
- Co odkładamy/usuwamy: —
- Priorytet na najbliższy tydzień: Mobile UX fixes (orientation bug — w trakcie), faza 05 notatki
