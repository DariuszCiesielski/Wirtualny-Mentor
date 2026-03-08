# Phase 10 — Business Ideas & Lead Generation — CONTEXT

> Decisions from discuss-phase session (2026-03-08).
> Dual review: Claude Code + Codex. User resolved conflicts.

## 1. Layout strony `/business-ideas`

**Decyzja:** Jednokolumnowa lista kart z expand/collapse.

- **Pierwsze 3 karty rozwinięte domyślnie**, pozostałe zwinięte
- Karta wizualnie spójna z `InlineSuggestion` (ten sam akcent Lightbulb, kolorystyka amber)
- Stan zwinięty pokazuje: tytuł, 2-3 linie opisu, badge złożoności, źródło (kurs + rozdział), akcje
- Stan rozwinięty dodaje: pełny opis, pełny blok „Potencjał biznesowy", CTA kontaktowe
- Źródło kursu: mała etykieta pod tytułem ("z kursu: X · Rozdział: Y") z linkiem do lekcji
- Akcje na karcie: „Zobacz szczegóły" (expand), „Przejdź do lekcji" (link), „Usuń z zapisanych" (un-bookmark)
- Mobile: ta sama lista, full-width, CTA stacked vertically
- Strona respektuje `ContentContainer` (szerokość z localStorage)

**Nie robimy:** gridu, osobnej strony szczegółów, paginacji (MVP)

## 2. CTA kontaktowe

**Decyzja:** CTA widoczne **tylko w rozwiniętej karcie**, na dole.

- W stanie zwiniętym: mały link w stopce karty „Chcesz to omówić?"
- Po rozwinięciu: subtelny box z danymi kontaktowymi
- Nagłówek CTA: „Chcesz sprawdzić, czy ten pomysł ma sens w Twoim przypadku?"
- Opis CTA: „Możemy omówić zakres, wykonalność i prostą wersję startową."
- Dane z ENV: `CONTACT_EMAIL`, `CONTACT_PHONE`, `CONTACT_FORM_URL`
- Wyświetlamy tylko skonfigurowane dane (graceful degradation)
- Jeśli jest `CONTACT_FORM_URL` → główny przycisk „Napisz wiadomość" linkuje do formularza
- Jeśli nie ma formularza → `mailto:` link
- Jeśli żadna zmienna nie jest ustawiona → CTA nie renderuje się
- Mini-disclaimer przy CTA: „To inspiracja, nie gotowa rekomendacja biznesowa."

**Nie robimy:** CTA na wszystkich kartach naraz, floating CTA, globalnego CTA na dole strony

## 3. Filtrowanie i puste stany

**Decyzja:** Dropdown filtr po kursie + sortowanie (data, złożoność).

### Filtrowanie
- Select/dropdown „Wszystkie kursy" → lista kursów (tylko te z bookmarkowanymi sugestiami)
- Sortowanie: „Ostatnio zapisane" (domyślne) + „Złożoność"
- Bez sortowania „Kurs A-Z" (redundantne z filtrem po kursie)
- Licznik: „3 pomysły" obok filtrów

### Strona pokazuje
- TYLKO bookmarkowane sugestie (`is_bookmarked = true`)
- Odrzucone (dismissed) nie są pokazywane

### Puste stany (3 osobne)

1. **Brak kursów:**
   „Nie masz jeszcze kursów, więc nie ma z czego tworzyć pomysłów biznesowych."
   → Przycisk: „Utwórz pierwszy kurs" → `/courses/new`

2. **Brak bookmarków (ale są kursy):**
   „Nie masz jeszcze zapisanych pomysłów. Podczas czytania lekcji kliknij 💡 żeby wygenerować sugestię, a potem zapisz te, do których chcesz wrócić."
   → Przycisk: „Przejdź do kursów" → `/courses`

3. **Filtr bez wyników:**
   „Brak zapisanych pomysłów dla wybranego kursu."
   → Link: „Wyczyść filtr"

## 4. Disclaimer

**Decyzja:** Raz na górze strony, pod nagłówkiem, jako neutralny Alert z ikoną Info.

- Treść: „Pomysły na tej stronie mają charakter inspiracyjny i edukacyjny. Przed wdrożeniem oceń ich wykonalność, koszty i dopasowanie do swojej firmy."
- Styl: neutralny Alert/Card (nie czerwony), ikona `Info`, czytelny ale nieinwazyjny
- Nie powtarzamy na każdej karcie (wyjątek: mini-disclaimer przy CTA w rozwiniętej karcie)
- Disclaimer NIE pojawia się na `InlineSuggestion` w lekcji (faza 9 — za dużo szumu)

## 5. Sidebar

- Nowa pozycja w nawigacji: „Pomysły biznesowe" z ikoną `Lightbulb`
- Pozycja: po „Notatki", przed „Profil"
- Href: `/business-ideas`

## 6. Nowy DAL (do zbadania w research)

Potrzebne nowe funkcje w `ideas-dal.ts`:
- `getBookmarkedSuggestions(userId, courseId?)` — lista bookmarkowanych z JOIN na kursy/rozdziały (tytuły)
- `getCoursesWithBookmarks(userId)` — lista kursów do filtra dropdown

## Deferred Ideas (poza fazą 10)

- `business_suggestion_interactions` — tracking viewed/bookmarked/contact_clicked (analityka)
- `platform_contact_settings` — tabela DB zamiast ENV (white-label ready)
- Paginacja listy pomysłów (gdy > 50 pomysłów)
- A/B test wariantów inline (compact vs hint)
- Wyszukiwarka po tytule/opisie pomysłów
