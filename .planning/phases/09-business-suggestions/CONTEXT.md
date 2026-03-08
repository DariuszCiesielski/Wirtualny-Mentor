# Context: Phase 9 — Business Suggestions

Created: 2026-03-08
Source: Dual review (Claude Code + Codex) → user-approved decisions

## Phase Goal

Użytkownik otrzymuje kontekstowe sugestie biznesowe przy lekcjach, dopasowane do jego profilu i treści.

## Decisions

### A. Umiejscowienie i trigger generowania

- **1 przycisk per rozdział** — w headerze lekcji (obok tytułu/metadanych), NIE per sekcja h2
- AI analizuje całą treść lekcji + profil → zwraca 1 sugestię + `relevant_section` (heading h2)
- Sugestia renderuje się **inline pod dopasowanym h2** — fuzzy match z `stripHeadingNumber` (reuse z `content-renderer.tsx`)
- **Fallback:** jeśli sekcja nie pasuje → sugestia pod opisem rozdziału (top of lesson)
- **Loading state:** przycisk → spinner "Analizuję lekcję..." + skeleton placeholder w miejscu docelowym
- **Disabled:** gdy lekcja nie ma wygenerowanej treści → tooltip "Najpierw wygeneruj materiały"
- **Double-click guard:** lokalny `inFlight` state blokuje kolejne kliknięcia

### B. Interakcje z sugestią inline

- **4 akcje na karcie:** Zobacz więcej, Zapisz, Ukryj, Odśwież
- **Ukryj (dismiss):** soft delete (`is_dismissed=true`), karta znika z lekcji, ale sugestia dostępna na /business-ideas. Przywracalna.
- **Zapisz (bookmark):** ikona toggle (Bookmark) + sonner toast "Pomysł zapisany". Idempotentna operacja. Dismiss po bookmark NIE kasuje bookmarku.
- **Odśwież:** nowe wywołanie AI, liczy się w limit dzienny. Jeśli zwróci identyczny wynik → toast "Nie znaleziono lepszego pomysłu".
- **"Pokaż inną":** NIE w MVP — semantycznie to samo co Odśwież
- **CTA kontaktowe:** NIE pojawia się po bookmark (to faza 10)
- **Wariant UI:** compact domyślnie, globalny tryb (nie per sugestia). Zmiana = 1 prop.
- **Dismiss + ponowne generowanie:** nowy tytuł = nowy rekord (nie nadpisuj dismissed)

### C. Degradacja bez profilu biznesowego

- Przycisk generowania **zawsze dostępny**, niezależnie od profilu
- **Prompt z profilem:** "dopasuj pomysł do branży [X], roli [Y], celu [Z] i doświadczenia"
- **Prompt bez profilu:** "wygeneruj uniwersalny pomysł dla typowego użytkownika tej lekcji; unikaj udawanej personalizacji"
- **Profil częściowy:** prompt używa tego co jest (nie traktuj jako brak)
- **Callout pod kartą** (gdy brak profilu): "Uzupełnij profil biznesowy, żeby sugestie były dopasowane do Twojej branży" + link /onboarding
- Callout lekki i lokalny (przy sugestii), NIE pełnoekranowy blok

### D. Rate limiting i odświeżanie cache

- **Limit:** 5 nowych generowań dziennie na użytkownika
- **Reset:** midnight **Europe/Warsaw** (produkt polski, spójność z użytkownikiem)
- **Liczy się w limit:** pierwsze generowanie per rozdział + każde Odśwież
- **NIE liczy się:** odczyt z cache, ponowne otwarcie lekcji, odświeżenie po zmianie profilu (max 1x per zmiana `profile_version`)
- **Failed request:** NIE naliczaj limitu, pozwól retry
- **UI licznik:** "Pozostało X/5 na dziś" — mały tekst przy przycisku
- **Po wyczerpaniu:** przycisk disabled + tooltip "Dzisiejszy limit został wykorzystany"
- **Cache:** rekord ważny jeśli zgadza się `input_hash` (treść lekcji + chapter_id + pola profilu + wersja promptu)
- **Przycisk Odśwież na karcie:** ikona RefreshCw, widoczny gdy `profile_version` w sugestii < aktualny `profile_version` użytkownika. Tooltip: "Profil zmieniony — odśwież pomysł"
- **Atomowy check:** limit sprawdzany server-side (nie tylko UI) — obsługa wielu tabów
- **Fallback `profile_version`:** jeśli kolumna nie istnieje, użyj `updated_at` z profilu jako części hasha

## Reuse from existing codebase

| Wzorzec | Źródło | Zastosowanie w fazie 9 |
|---------|--------|----------------------|
| Fuzzy heading match | `content-renderer.tsx` (`stripHeadingNumber`) | Dopasowanie `relevant_section` do h2 |
| Inline rendering przy h2 | Lesson Images (`SectionImage`) | `InlineSuggestion` przy dopasowanym h2 |
| Skeleton loading | `SectionImageSkeleton` | Placeholder podczas generowania |
| AI planner pattern | `src/lib/images/planner.ts` | `generateObject()` z GPT-4o-mini/5.2 |
| Sonner toast | Gamification (`AchievementToast`) | Bookmark/dismiss feedback |
| Soft banner/callout | `OnboardingBanner` | Callout "uzupełnij profil" pod kartą |
| Fire-and-forget | Gamification (`awardPoints`) | Opcjonalne side effects |
| idempotency | `awardPoints` (duplicate check) | Bookmark toggle, limit check |

## Deferred ideas (out of scope for phase 9)

- "Pokaż inną" (rotacja sugestii) — wymaga multi-generation
- A/B test compact vs hint — wymaga telemetrii
- CTA kontaktowe po bookmark — faza 10
- Analityka interakcji (viewed/bookmarked/contact_clicked) — osobna faza
- Przełączanie compact↔hint per user preference — po walidacji MVP
