# Wirtualny Mentor

## What This Is

Personalizowana platforma nauki z AI, która generuje kompleksowe programy nauczania dla dowolnego tematu. Użytkownik podaje temat lub link do źródła, a AI tworzy strukturyzowany kurs od poziomu początkującego do guru, z materiałami jak w podręczniku, praktycznymi instrukcjami narzędzi, quizami i chatbotem-mentorem.

## Core Value

Każdy może nauczyć się czegokolwiek dzięki spersonalizowanemu, aktualnemu programowi nauczania z praktycznymi instrukcjami krok po kroku.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Program nauczania:**
- [ ] Użytkownik podaje temat lub link do źródła
- [ ] AI zadaje pytania doprecyzowujące (cele, doświadczenie, dostępny czas)
- [ ] AI generuje spersonalizowany program z 5 poziomami (Początkujący → Średnio zaawansowany → Zaawansowany → Master → Guru)
- [ ] Każdy poziom zawiera szczegółowe materiały jak w podręczniku
- [ ] Materiały zawierają linki do zewnętrznych zasobów (dokumentacje, kursy, artykuły)

**Praktyczne instrukcje:**
- [ ] AI podaje konkretne narzędzia z linkami
- [ ] Instrukcje instalacji krok po kroku
- [ ] Komendy do użycia z wyjaśnieniami
- [ ] Oczekiwane wyniki i jak je interpretować

**System oceny:**
- [ ] Quizy sprawdzające wiedzę w trakcie nauki
- [ ] Test końcowy na każdym poziomie
- [ ] Przejście do następnego poziomu po zdaniu testu
- [ ] Możliwość ręcznego przeskoczenia poziomu (dla zaawansowanych)
- [ ] Dodatkowe materiały przy błędnych odpowiedziach
- [ ] Możliwość powtórzenia testu

**Chatbot mentor:**
- [ ] Odpowiada na pytania użytkownika (nawet zaawansowane)
- [ ] Wspiera i motywuje
- [ ] Ma dostęp do notatek użytkownika
- [ ] Pełni rolę mentora/nauczyciela/coacha

**Notatki:**
- [ ] Użytkownik może tworzyć własne notatki podczas nauki
- [ ] Notatki zapisywane i dostępne później
- [ ] Chatbot może odwoływać się do notatek

**Aktualna wiedza:**
- [ ] Integracja z web search (aktualne informacje)
- [ ] Odświeżanie bazy wiedzy dla dynamicznych dziedzin (codziennie)
- [ ] AI może analizować linki podane przez użytkownika

**Konto użytkownika:**
- [ ] Rejestracja i logowanie
- [ ] Zapisywanie postępu nauki
- [ ] Historia ukończonych kursów

### Out of Scope

- Aplikacja mobilna (natywna) — web-first, mobile później
- Generowanie podcastów/audio — skupiamy się na tekście
- Społeczność/forum — użytkownik uczy się sam z AI
- Certyfikaty/dyplomy — nie wydajemy oficjalnych certyfikatów
- Płatności/subskrypcje w v1 — najpierw działający produkt

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
*Last updated: 2025-01-30 after initialization*
