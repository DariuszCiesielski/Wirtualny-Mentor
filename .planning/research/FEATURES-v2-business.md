# Feature Landscape: Business Enablement (v2.0)

**Domain:** Business onboarding + AI suggestions + lead generation w platformie EdTech
**Researched:** 2026-03-08
**Overall confidence:** MEDIUM-HIGH (wzorce onboardingu i lead gen dobrze udokumentowane, specyfika AI business suggestions mniej standardowa)

---

## Table Stakes

Funkcje, bez których moduł biznesowy będzie niefunkcjonalny lub błędnie odebrany.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Formularz profilowy (4 pola)** | Każdy SaaS z personalizacja zbiera kontekst. Duolingo, Coursera, Udemy — wszystkie zaczynaja od "co chcesz osiągnąć?" | Low | Auth (istniejące) | Select/radio, nie open text. 4 pola = sweet spot (każde dodatkowe pole -10-15% completion rate). Branza, rola, cel, wielkość firmy. |
| **Progress indicator w wizard** | Standard UX. Multi-step forms bez paska progresu mają 30-50% wyższy drop-off. | Low | Formularz | Prosta belka kroków (1/3, 2/3, 3/3). shadcn/ui Progress lub custom stepper. |
| **Skip onboarding** | Blocking onboarding = #1 antypattern w SaaS. 40-80% użytkowników pomija onboarding jeśli jest opcjonalny — to normalne. System musi działać bez profilu. | Low | Formularz | "Pomiń na teraz" z powrotem przy następnej sesji (banner). Nie blokuj dostępu do dashboardu. |
| **Sugestie działające BEZ profilu** | Jeśli 80% pominie onboarding (realistyczne), sugestie nie mogą być martwe. Ogólne sugestie + zachęta do uzupełnienia profilu. | Med | AI prompt engineering | Prompt musi mieć branch: profil istnieje -> personalizowane; brak -> ogólne z info "uzupełnij profil". |
| **Cache sugestii w DB** | Każde otwarcie lekcji = wywołanie AI to koszty. Standard: generuj raz, cachuj, pokaż z DB. Input hash na invalidacje. | Med | DB schema (business_suggestions) | Wzorzec identyczny z lesson images (istniejący). input_hash = md5(chapter_content + profile_version). |
| **Rate limiting** | Bez limitu użytkownik może wygenerować setki sugestii (koszty AI). Standard w każdym SaaS z AI. | Low | API route | 5/dzień free tier. Prosty count w DB (WHERE created_at > today). |
| **Dane kontaktowe z ENV** | MVP lead gen nie potrzebuje DB — ENV wystarczy. Standard bootstrap pattern. | Low | Zmienne środowiskowe | CONTACT_EMAIL, CONTACT_PHONE, CONTACT_FORM_URL. Docelowo tabela DB (osobna faza). |
| **Disclaimer na sugestiach** | Prawny standard — AI suggestions NIE są porada biznesowa. Każda platforma z AI ma disclaimer. | Low | Brak | "Pomysły mają charakter inspiracyjny i nie stanowią rekomendacji biznesowej." |
| **Edycja profilu po onboardingu** | Użytkownik musi moc zmienic odpowiedzi. Bez tego profil staje się "dead data". | Low | Profil w DB | Sekcja w /profile. profile_version++ przy każdej edycji. |
| **Responsywna strona pomysłów** | Zbiorcza strona z lista zapisanych/wygenerowanych pomysłów. Bez niej użytkownik traci kontekst. | Med | business_suggestions, kursy | Filtr po kursie, sortowanie (najnowsze, zapisane). |

---

## Differentiators

Funkcje wyróżniające produkt. Nie oczekiwane, ale wartościowe.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Opcjonalny chat AI doprecyzowujący** | Większość platform ma TYLKO formularz. Chat AI po formularzu to unikalna wartość — wyciąga niuanse, których selecty nie złapią. Coursera/Udemy tego nie mają. | Med-High | Streaming (useChat), AI prompt, formularz jako base | Krok 2 (opcjonalny): 2-3 pytania AI -> experience_summary. GPT-5.2 + generateObject na koniec. Formularz daje dane strukturalne, chat daje kontekst jakościowy. |
| **Kontekstowe sugestie inline przy lekcji** | Typowe platformy mają oddzielną sekcję "rekomendacje". Pokazanie sugestii PRZY TREŚCI która je inspirowała = wyższe zaangażowanie. Wzorzec "contextual CTA" z najlepszych SaaS. | Med | Content renderer (istniejący), relevant_section matching | Wariant A (compact card) pod h2. Reuse wzorca z lesson images (findSectionImage -> findSectionSuggestion). Fuzzy heading match (stripHeadingNumber). |
| **Warunkowe CTA (po zapisaniu)** | Większość SaaS pokazuje CTA zawsze = banner blindness. CTA po akcji użytkownika (bookmark) = 2-5x wyższy CTR. Mniej nachalne, bardziej skuteczne. | Low | is_bookmarked w DB | CTA pojawia się TYLKO gdy: zapisano pomysł, wrocono drugi raz, lub kliknieto "rozwiń". Eliminuje efekt "nachalna reklama". |
| **Wpływ profilu na generowanie kursów** | Kursy dopasowane do kontekstu biznesowego = unikalna wartość. Żadna platforma nie personalizuje TREŚCI kursu na podstawie profilu biznesowego. | Med | Istniejący ClarifyingChat, profil biznesowy | Wstrzyknięcie profilu do system prompt w curriculum generation. Subtelne: nie zmienia struktury kursu, ale dodaje kontekst branżowy do pytań doprecyzowujących i materiałów. |
| **Idempotencja sugestii (input_hash)** | Zapobiega duplikatom + umożliwia przycisk "Odśwież" gdy profil/treść się zmienily. Rzadko widywane w MVP — ale zapobiega tech debt. | Low | Hash computation | md5(truncated_content + profile_fields + profile_version). Porownanie przy renderze. |
| **"Na zadanie" zamiast auto-generacji** | Oszczędność kosztów AI + lepszy UX (użytkownik decyduje kiedy chce sugestie). Większość platform generuje automatycznie = drogie + często nierelewantne. | Low | UI (przycisk) | Przycisk "Pokaż pomysł biznesowy" zamiast auto-load. Explicit > implicit. |
| **Explainability — "dlaczego ta sugestia"** | Algolia, Dynamic Yield — najlepsze recommendation engines wyjasniaja DLACZEGO. Buduje zaufanie do AI. | Low | AI prompt | Pole w sugestii: "Na podstawie Twojej branży [X] i treści o [Y]..." Generowane przez AI razem z sugestia. |

---

## Anti-Features

Funkcje, których celowo NIE budujemy. Typowe błędy w tej domenie.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Pelnoekranowy blocking onboarding** | Najgorszy antypattern w SaaS. Uzytkownicy zamykaja karte/app. "Email verification before access, mandatory profile completion" = top time-to-value killers (źródło: DesignRevision, Flowjam). | Lekki wizard na osobnej stronie + banner na dashboardzie. Nigdy nie blokuj dostępu. |
| **Dluga ankieta (>5 pytań w formularzu)** | Każde pole ponad 4-5 obniża completion o 10-15% (źródło: Webstacks). Duolingo = 4 pytania. | 4 pola w formularzu. Reszta przez opcjonalny chat AI lub zbieranie z uzywania platformy (progressive profiling). |
| **Auto-generowanie sugestii przy otwarciu lekcji** | Kosztowne (AI call za każdym razem), często nierelewantne, spowalnia ładowanie lekcji. | Przycisk "Pokaż pomysł" = on-demand. Cache w DB po pierwszym generowaniu. |
| **Zawsze widoczne CTA kontaktowe** | Banner blindness + efekt "spamu" obniża zaufanie. Warunkowe CTA mają 2-5x wyższy CTR (źródło: HubSpot, ConvertFlow). | CTA pojawia się PO akcji użytkownika (bookmark, powrót, rozwiń). |
| **Osobna zakladka pomysłów w kursie** | Overengineering w MVP. Zbiorcza strona z filtrem po kursie wystarcza. | Jedna strona /business-ideas z filtrem. Per-kurs zakladka = osobna faza. |
| **Tracking/analityka interakcji w MVP** | Przedwczesna optymalizacja. Najpierw zbuduj feature, potem mierz. | business_suggestion_interactions = osobna faza po walidacji że sugestie są używane. |
| **A/B testing wariantow inline** | Wymaga infrastruktury (feature flags, metryki). Nie ma sensu przed product-market fit. | Zacznij od wariantu A (compact). Zmiana na C = 1 prop. A/B = osobna faza. |
| **Wlasne klucze API użytkownika w MVP** | Duza złożoność (szyfrowanie, walidacja, error handling, billing). Nie potrzebne do walidacji koncepcji. | Osobna faza. MVP używa platformowego klucza OpenAI. |
| **Subskrypcje/billing w MVP** | Stripe integration, webhooks, plan management = tygodnie pracy. Mieszanie z feature development = rozmycie focus. | subscription_tier kolumna w DB (manual, admin-only). Billing = całkowicie osobna faza. |
| **Generowanie więcej niz 1 sugestii na lekcje** | Więcej opcji = decision paralysis. 1 dobrze dopasowana > 3 ogólne. | 0-1 sugestia na lekcje w MVP. Schema pozwala na tablice 0-N (future-proof). |
| **Marketplace pomysłów / sharing** | Spolecznosciowe features = moderacja, prywatnosc, complexity. Poza core value. | Pomysły są prywatne per użytkownik. Sharing = inna domena. |

---

## Feature Dependencies

```
Auth (istniejace)
  +---> Formularz profilowy (4 pola)
  |       +---> Opcjonalny chat AI doprecyzowujacy
  |       +---> Edycja profilu (/profile)
  |       +---> Wplyw profilu na kursy (ClarifyingChat prompt)
  |
Content Renderer (istniejący) + DB schema
  +---> Przycisk "Pokaz pomysl" przy lekcji
          +---> AI generowanie sugestii (API route)
          |       +---> Cache w DB (input_hash)
          |       +---> Rate limiting
          +---> Inline suggestion (wariant A)
                  +---> Bookmark / dismiss
                          +---> Warunkowe CTA kontaktowe
                                  +---> Dane z ENV

Sugestie w DB
  +---> Strona zbiorcza /business-ideas (filtr, lista)
```

**Krytyczna ścieżka:** DB schema -> Formularz -> AI sugestie -> Inline render -> CTA

**Rownolegle po DB schema:**
- Onboarding wizard (formularz + banner)
- Strona pomysłów (pusta z komunikatem "stwórz kurs")

**Zależy od istniejących modułów:**
- Content Renderer — dodanie przyciskow/kart inline (wzorzec lesson images)
- ClarifyingChat — wstrzyknięcie profilu do promptu
- Sidebar — nowa pozycja "Pomysły biznesowe"
- Profile page — nowa sekcja "Profil biznesowy"

---

## MVP Recommendation

### Priorytet 1: Fundament (musi być gotowe pierwsze)

1. **DB schema** — user_business_profiles + business_suggestions + migracje + RLS
2. **DAL** — CRUD dla profilu i sugestii (server actions, auth check)
3. **Formularz profilowy** — 4 pola + skip + banner na dashboardzie

### Priorytet 2: Core value (główna wartość biznesowa)

4. **AI sugestie na zadanie** — przycisk, API route, prompt, cache, rate limit
5. **Inline rendering** — wariant A (compact card) pod h2 w content renderer
6. **Bookmark / dismiss** — reakcje użytkownika na sugestie

### Priorytet 3: Engagement loop

7. **Warunkowe CTA** — po bookmark, dane z ENV, disclaimer
8. **Strona zbiorcza /business-ideas** — lista z filtrem po kursie
9. **Wpływ profilu na kursy** — wstrzyknięcie do ClarifyingChat prompt

### Defer to post-MVP

- **Chat AI doprecyzowujący** — med-high complexity, niska krytyczność. Formularz wystarcza na start. Design doc definiuje go jako opcjonalny krok — można włączyć jeśli czas pozwoli.
- **Analityka interakcji** — po walidacji że sugestie są używane
- **A/B test wariantow** — po zebraniu baseline metryk
- **Klucze API użytkownika** — osobna faza (szyfrowanie, Anthropic routing)
- **Freemium/billing** — osobna faza (Stripe, webhooks)
- **Explainability** — niska złożoność, ale wymaga prompt tuning. Dobry kandydat na quick-win post-MVP.

---

## Wzorce z rynku — co działa

### Onboarding (Duolingo, Coursera, Notion, Airtable)

| Platform | Pattern | Insight |
|----------|---------|---------|
| Duolingo | 4 pytania -> natychmiast wartość (pierwsza lekcja) | Zloty standard. Time-to-value < 60s. |
| Coursera | Cel kariery -> rekomendacje kursów. Profil wpływa na content. | Deklaratywne preferencje + behavioral signals. |
| Notion | Wizard z templatem workspace. Progressive disclosure. | Wartość widoczna od razu (szablon). |
| Airtable | Multi-step z wizualnymi opcjami (ikony zamiast tekstu). | Visual choices > text lists. |

**Wniosek:** 3-5 kroków, visual, nie blokuj dostępu, pokaż wartość natychmiast.

### AI Suggestions (Algolia, Dynamic Yield, Udemy)

| Platform | Pattern | Insight |
|----------|---------|---------|
| Algolia | "We suggested this because..." | Explainability buduje zaufanie. |
| Udemy | Rekomendacje coraz trafniejsze z uzywaniem. | Behavioral signals > declared preferences. |
| Dynamic Yield | Real-time personalization na podstawie kontekstu + historii. | Kontekst biezacej strony + profil. |

**Wniosek:** Wyjaśnij DLACZEGO AI sugeruje. "Na podstawie Twojej branży i treści o X..."

### Lead Generation (HubSpot, ConvertFlow)

| Platform | Pattern | Insight |
|----------|---------|---------|
| HubSpot | CTA po akcji (download, bookmark) = 2-5x wyższy CTR niz statyczne. | Warunkowe > statyczne. |
| ConvertFlow | Dynamic CTA na podstawie user journey stage. | Personalizacja CTA. |

**Wniosek:** Warunkowe CTA po bookmark to validated pattern. Action-oriented copy: "Omow ten pomysł" > "Skontaktuj się".

---

## Confidence Assessment

| Feature Area | Confidence | Reason |
|-------------|------------|--------|
| Onboarding wizard UX | HIGH | Dobrze udokumentowane wzorce (Duolingo, Coursera, Notion). Wiele źródeł zgodnych. |
| Formularz 4 pola | HIGH | Badania jednoznaczne: 4-5 pol = optimal. Każde kolejne -10-15% completion. |
| AI suggestions inline | MEDIUM | Pattern "contextual recommendations" jest znany, ale "AI business tool suggestions przy lekcji" to niszowy case. Brak bezpośrednich benchmarkow. |
| Warunkowe CTA | MEDIUM-HIGH | HubSpot/ConvertFlow potwierdzają warunkowe CTA. Specyfika "po bookmark" jest logiczna, ale brak twardych danych dla EdTech. |
| Rate limiting | HIGH | Standard w każdym SaaS z AI. Prosta implementacja. |
| Progressive profiling | HIGH | Dobrze udokumentowany pattern (Webstacks, UserPilot). Formularz teraz, chat/behavior później. |
| Explainability | MEDIUM | Algolia/Dynamic Yield stosuja. Wartosc w budowaniu zaufania potwierdzona, ale effort vs. impact niejasny. |

---

## Sources

### HIGH Confidence
- [SaaS Onboarding Best Practices 2026 - DesignRevision](https://designrevision.com/blog/saas-onboarding-best-practices)
- [SaaS Onboarding UX Patterns - DesignStudioUIUX](https://www.designstudiouiux.com/blog/saas-onboarding-ux/)
- [Multi-Step Form Best Practices - Webstacks](https://www.webstacks.com/blog/multi-step-form)
- [Onboarding Wizard Analysis - UserPilot](https://userpilot.com/blog/onboarding-wizard/)
- [User Onboarding Best Practices 2026 - Formbricks](https://formbricks.com/blog/user-onboarding-best-practices)

### MEDIUM Confidence
- [EdTech Onboarding Best Practices - UserPilot](https://userpilot.com/blog/customer-onboarding-in-edtech/)
- [EdTech Onboarding Examples - Appcues](https://www.appcues.com/blog/edtech-onboarding-examples)
- [AI UX Design in SaaS - UserPilot](https://userpilot.com/blog/ai-ux-design/)
- [Top SaaS AI Features 2025 - ProCreator](https://procreator.design/blog/top-saas-ai-features-your-product-needs/)
- [Lead Generation CTA Examples - WiserNotify](https://wisernotify.com/blog/lead-generation-cta/)
- [EdTech Lead Generation Funnel - Insivia](https://www.insivia.com/how-edtech-saas-companies-build-a-consistent-lead-generation-funnel/)

### LOW Confidence
- [Lead Generation Statistics 2026 - DesignRush](https://www.designrush.com/agency/digital-marketing/lead-generation/trends/lead-generation-statistics)
- [Wizard UI Pattern - Eleken](https://www.eleken.co/blog-posts/wizard-ui-pattern-explained) (single source, ale zgodne z innymi)
