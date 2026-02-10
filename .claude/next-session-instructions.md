# Stan projektu po sesji width-toggle (2026-02-10)

## Co zostało zrobione

### Generowanie quizów - NAPRAWIONE (v0.12.0)
- Model quiz: `gpt-4o-mini` (OpenAI) zamiast `gemini-2.0-flash`
- Schemat Zod przepisany (bez discriminatedUnion/record)
- Typ `wrongExplanations`: `WrongExplanation[]` zamiast `Record<string,string>`

### UI quizu - NAPRAWIONE (v0.12.0)
- Wąski tekst feedbacku - zastąpiono Alert prostym div (CSS grid bug)
- Polskie etykiety badge'ów (Łatwe/Średnie/Trudne, Zapamiętywanie/Rozumienie/...)
- Progress bar z etykietą liczbową (3/6)
- Full-width przyciski na mobile

### Globalny toggle szerokości - NOWE (v0.13.0)
- `ContentContainer` + `useContentWidth` hook + `ContentWidthToggle`
- 4 opcje: Wąski (2xl) / Standard (4xl) / Szeroki (6xl) / Pełny (full)
- Tekstowe etykiety (segmented control), nie ikony
- Wspólna preferencja w localStorage (`wm-content-width`)
- Zastosowano w 7 widokach: lekcja, quiz, kurs, test, notatki globalne, notatki kursu, lista kursów

## Tag: v0.13.0-width-toggle

## Potencjalne przyszłe zadania
- Faza 5: System notatek z embeddings (research w `.planning/phases/05-notes-system-embeddings/`)
- Testy E2E dla quizów
- Optymalizacja performance (lazy loading komponentów quizu)
