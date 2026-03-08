# Phase 8: Business Onboarding — Context

> Decisions from discuss-phase session (2026-03-08).
> These decisions are LOCKED — researcher and planner should not re-question them.

## A: Formularz vs Chat — flow onboardingu

**Decyzja: Hybryda — krótki formularz (1 ekran) + opcjonalny chat AI**

- **Gdzie:** Dedykowana strona `/onboarding` (link z bannera) + ta sama treść dostępna z `/profile`
- **Flow:** Formularz (4 pola, 1 ekran) → przycisk "Doprecyzuj z AI" → chat (3-5 wiadomości) → AI generuje `experience_summary`
- **Ekrany:** Jeden ekran — nie wizard. 4 pola to za mało na wielokrokowy wizard
- **Chat AI:** Zadaje pytania o kontekst biznesowy (wyzwania, cele, doświadczenie z technologią) i generuje tekstowe `experience_summary` (2-3 zdania)

**Flow użytkownika:**
```
Dashboard → Banner "Uzupełnij profil biznesowy" → /onboarding
  → Formularz (branża, rola, cel, firma) → [Zapisz]
  → Opcjonalnie: "Chcesz doprecyzować? Porozmawiaj z AI" → Chat (3-5 pytań)
  → AI generuje experience_summary → Zapisz → Redirect do dashboard
```

## B: Banner i zachęty

- **Kiedy pojawia się:** Przy każdym załadowaniu dashboardu gdy `onboarding_completed = false`
- **Dismiss:** Przycisk "X" — ukrywa banner do końca sesji (stan React, nie DB). Wraca po odświeżeniu/ponownym otwarciu
- **Kiedy znika na stałe:** Wyłącznie po wypełnieniu profilu
- **Gdzie:** Tylko dashboard
- **Żadnej persystencji dismiss w DB** — wystarczy `useState`

## C: Pola profilu biznesowego

| Pole | Typ | Wymagane | Opcje/Format |
|------|-----|----------|-------------|
| Branża | Combobox (select + wpisywanie) | Tak | ~15 branż (IT, Marketing, Finanse, E-commerce, Edukacja, Produkcja, Zdrowie, Prawo, Nieruchomości, Gastronomia, Logistyka, Media, Consulting, Usługi, Inne) + free-text "Inne" |
| Rola | Combobox | Tak | ~8 ról (Właściciel firmy, Manager, Freelancer, Specjalista, Student, Początkujący przedsiębiorca, Dyrektor/C-level, Inna) |
| Cel biznesowy | Textarea (max 200 znaków) | Tak | Placeholder: "np. Chcę zautomatyzować obsługę klienta w mojej firmie" |
| Wielkość firmy | Select | Nie | Jednoosobowa, 2-10, 11-50, 51-200, 200+, Nie mam firmy |
| experience_summary | Auto (AI) | — | Generowane przez chat AI, nie edytowane ręcznie |

## D: Integracja z curriculum

- **Mechanizm:** Inject `experience_summary` + `industry` + `role` + `business_goal` do system promptu przy generowaniu pytań doprecyzowujących + curriculum
- **Z profilem:** AI dodaje 1-2 pytania biznesowe (np. "Jak chcesz to zastosować w [branża]?") + curriculum ma praktyczne przykłady z branży
- **Bez profilu:** Standardowy flow bez zmian
- **Nie zmieniamy UI** — tylko prompt jest bogatszy

## Deferred Ideas

_(Pomysły wykraczające poza fazę 8 — do rozważenia w przyszłych fazach)_

Brak.

---
*Created: 2026-03-08*
