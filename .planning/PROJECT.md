# Wirtualny Mentor

## What This Is

Personalizowana platforma nauki z AI, która generuje kompleksowe programy nauczania dla dowolnego tematu. Użytkownik podaje temat lub link do źródła, a AI tworzy strukturyzowany kurs od poziomu początkującego do guru, z materiałami jak w podręczniku, praktycznymi instrukcjami narzędzi, quizami i chatbotem-mentorem.

## Core Value

Każdy może nauczyć się czegokolwiek dzięki spersonalizowanemu, aktualnemu programowi nauczania z praktycznymi instrukcjami krok po kroku.

## Requirements

### Validated (v1.0 — shipped)

**Program nauczania:** Temat/link → pytania doprecyzowujące → 5-poziomowy kurs (Początkujący → Guru) z materiałami, linkami, instrukcjami
**Praktyczne instrukcje:** Narzędzia z linkami, instalacja krok po kroku, komendy z wyjaśnieniami
**System oceny:** Quizy, testy końcowe, progresja poziomów, skip, remediacja, powtarzanie
**Chatbot mentor:** Metoda sokratyczna, RAG z notatek, coaching, streaming
**Notatki:** CRUD, linkowanie do lekcji, embedding w pgvector, search
**Aktualna wiedza:** Tavily web search, analiza linków, cytowanie źródeł
**Konto:** Rejestracja, logowanie, profil, postęp, historia
**Dodatkowe (post-v1):** Focus Panel (Pomodoro + sounds), Gamification (punkty + odznaki), Lesson Images (AI + stock), Materiały źródłowe (PDF/DOCX/TXT → RAG), Inline Mentor Chat

### Active

## Current Milestone: v2.0 Business Enablement

**Goal:** Przekształcenie platformy edukacyjnej w narzędzie generujące wartość biznesową — onboarding poznaje użytkownika, AI proponuje pomysły na narzędzia przy lekcjach, lead generation kieruje do kontaktu.

**Target features:**
- Onboarding biznesowy (hybryda: formularz + opcjonalny chat AI)
- Sugestie narzędzi biznesowych (AI analizuje lekcję + profil, na żądanie)
- Strona pomysłów biznesowych (zbiorcza z filtrem po kursie)
- Lead generation (warunkowe CTA kontaktowe)
- Wpływ profilu na generowanie kursów (lepsze dopasowanie)

**Design doc:** `docs/plans/2026-03-08-business-onboarding-design.md`

### Out of Scope (v2.0)

- Aplikacja mobilna (natywna) — web-first
- Generowanie podcastów/audio — skupiamy się na tekście
- Społeczność/forum — użytkownik uczy się sam z AI
- Certyfikaty/dyplomy — nie wydajemy oficjalnych certyfikatów
- Klucze API użytkownika (user_api_keys) — osobna faza
- Freemium (limity, billing, subscription) — osobna faza
- White-label (platform_contact_settings w DB) — osobna faza
- Analityka interakcji (business_suggestion_interactions) — osobna faza

## Context

**Inspiracja UI:**
- NotebookLM od Google
- InsightsLM (SuperRAG) - istniejący projekt użytkownika z podobnym interfejsem

**Istniejący stack do wykorzystania:**
- React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Supabase (database, auth, storage)
- Deployment: Vercel

**Przykładowe tematy nauki:**
- "Chcę zostać prawnikiem w Polsce"
- "Chcę nauczyć się tworzenia aplikacji"
- "Naucz mnie korzystać z Claude Code" (z linkiem)

**Użytkownik:**
- Nie jest osobą techniczną
- Potrzebuje rozwiązań prostych w utrzymaniu

## Constraints

- **Stack**: React + TypeScript + Supabase (znany z poprzednich projektów, reuse możliwy)
- **AI Models**: Mix modeli (Claude do mentoringu, GPT do generowania treści strukturalnych, Gemini do quizów) — optymalizacja kosztów i jakości
- **Web Search**: Wymagana integracja z API wyszukiwania dla aktualnej wiedzy (Perplexity, Tavily, lub wbudowane w modele)
- **Skalowalność**: Produkt publiczny — architektura musi obsłużyć wielu użytkowników
- **Prostota**: Rozwiązania muszą być możliwe do utrzymania bez głębokiej wiedzy technicznej

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mix modeli AI zamiast jednego | Różne modele lepsze w różnych zadaniach, optymalizacja kosztów | — Pending |
| Stack jak InsightsLM | Użytkownik zna ten stack, możliwy reuse komponentów | — Pending |
| Web search integration | Wymóg aktualnej wiedzy, szczególnie dla dynamicznych dziedzin | — Pending |
| 5 poziomów nauczania | Początkujący → Guru daje jasną ścieżkę rozwoju | — Pending |

---
*Last updated: 2026-03-08 — milestone v2.0 Business Enablement started*
