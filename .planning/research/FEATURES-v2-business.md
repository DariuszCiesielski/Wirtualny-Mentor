# Feature Landscape: Business Enablement (v2.0)

**Domain:** Business onboarding + AI suggestions + lead generation w platformie EdTech
**Researched:** 2026-03-08
**Overall confidence:** MEDIUM-HIGH (wzorce onboardingu i lead gen dobrze udokumentowane, specyfika AI business suggestions mniej standardowa)

---

## Table Stakes

Funkcje, bez ktorych modul biznesowy bedzie niefunkcjonalny lub blednie odebrany.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Formularz profilowy (4 pola)** | Kazdy SaaS z personalizacja zbiera kontekst. Duolingo, Coursera, Udemy — wszystkie zaczynaja od "co chcesz osiagnac?" | Low | Auth (istniejace) | Select/radio, nie open text. 4 pola = sweet spot (kazde dodatkowe pole -10-15% completion rate). Branza, rola, cel, wielkosc firmy. |
| **Progress indicator w wizard** | Standard UX. Multi-step forms bez paska progresu maja 30-50% wyzszy drop-off. | Low | Formularz | Prosta belka krokow (1/3, 2/3, 3/3). shadcn/ui Progress lub custom stepper. |
| **Skip onboarding** | Blocking onboarding = #1 antypattern w SaaS. 40-80% uzytkownikow pomija onboarding jesli jest opcjonalny — to normalne. System musi dzialac bez profilu. | Low | Formularz | "Pomin na teraz" z powrotem przy nastepnej sesji (banner). Nie blokuj dostepu do dashboardu. |
| **Sugestie dzialajace BEZ profilu** | Jesli 80% pominie onboarding (realistyczne), sugestie nie moga byc martwe. Ogolne sugestie + zacheta do uzupelnienia profilu. | Med | AI prompt engineering | Prompt musi miec branch: profil istnieje -> personalizowane; brak -> ogolne z info "uzupelnij profil". |
| **Cache sugestii w DB** | Kazde otwarcie lekcji = wywolanie AI to koszty. Standard: generuj raz, cachuj, pokaz z DB. Input hash na invalidacje. | Med | DB schema (business_suggestions) | Wzorzec identyczny z lesson images (istniejacy). input_hash = md5(chapter_content + profile_version). |
| **Rate limiting** | Bez limitu uzytkownik moze wygenerowac setki sugestii (koszty AI). Standard w kazdym SaaS z AI. | Low | API route | 5/dzien free tier. Prosty count w DB (WHERE created_at > today). |
| **Dane kontaktowe z ENV** | MVP lead gen nie potrzebuje DB — ENV wystarczy. Standard bootstrap pattern. | Low | Zmienne srodowiskowe | CONTACT_EMAIL, CONTACT_PHONE, CONTACT_FORM_URL. Docelowo tabela DB (osobna faza). |
| **Disclaimer na sugestiach** | Prawny standard — AI suggestions NIE sa porada biznesowa. Kazda platforma z AI ma disclaimer. | Low | Brak | "Pomysly maja charakter inspiracyjny i nie stanowia rekomendacji biznesowej." |
| **Edycja profilu po onboardingu** | Uzytkownik musi moc zmienic odpowiedzi. Bez tego profil staje sie "dead data". | Low | Profil w DB | Sekcja w /profile. profile_version++ przy kazdej edycji. |
| **Responsywna strona pomyslow** | Zbiorcza strona z lista zapisanych/wygenerowanych pomyslow. Bez niej uzytkownik traci kontekst. | Med | business_suggestions, kursy | Filtr po kursie, sortowanie (najnowsze, zapisane). |

---

## Differentiators

Funkcje wyrozniajace produkt. Nie oczekiwane, ale wartosciowe.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Opcjonalny chat AI doprecyzowujacy** | Wiekszosc platform ma TYLKO formularz. Chat AI po formularzu to unikalna wartosc — wyciaga niuanse, ktorych selecty nie zlapia. Coursera/Udemy tego nie maja. | Med-High | Streaming (useChat), AI prompt, formularz jako base | Krok 2 (opcjonalny): 2-3 pytania AI -> experience_summary. GPT-5.2 + generateObject na koniec. Formularz daje dane strukturalne, chat daje kontekst jakosciowy. |
| **Kontekstowe sugestie inline przy lekcji** | Typowe platformy maja oddzielna sekcje "rekomendacje". Pokazanie sugestii PRZY TRESCI ktora je inspirowala = wyzsze zaangazowanie. Wzorzec "contextual CTA" z najlepszych SaaS. | Med | Content renderer (istniejacy), relevant_section matching | Wariant A (compact card) pod h2. Reuse wzorca z lesson images (findSectionImage -> findSectionSuggestion). Fuzzy heading match (stripHeadingNumber). |
| **Warunkowe CTA (po zapisaniu)** | Wiekszosc SaaS pokazuje CTA zawsze = banner blindness. CTA po akcji uzytkownika (bookmark) = 2-5x wyzszy CTR. Mniej nachalne, bardziej skuteczne. | Low | is_bookmarked w DB | CTA pojawia sie TYLKO gdy: zapisano pomysl, wrocono drugi raz, lub kliknieto "rozwin". Eliminuje efekt "nachalna reklama". |
| **Wplyw profilu na generowanie kursow** | Kursy dopasowane do kontekstu biznesowego = unikalna wartosc. Zadna platforma nie personalizuje TRESCI kursu na podstawie profilu biznesowego. | Med | Istniejacy ClarifyingChat, profil biznesowy | Wstrzykniecie profilu do system prompt w curriculum generation. Subtelne: nie zmienia struktury kursu, ale dodaje kontekst branzowy do pytan doprecyzowujacych i materialow. |
| **Idempotencja sugestii (input_hash)** | Zapobiega duplikatom + umozliwia przycisk "Odswiez" gdy profil/tresc sie zmienily. Rzadko widywane w MVP — ale zapobiega tech debt. | Low | Hash computation | md5(truncated_content + profile_fields + profile_version). Porownanie przy renderze. |
| **"Na zadanie" zamiast auto-generacji** | Oszczednosc kosztow AI + lepszy UX (uzytkownik decyduje kiedy chce sugestie). Wiekszosc platform generuje automatycznie = drogie + czesto nierelewantne. | Low | UI (przycisk) | Przycisk "Pokaz pomysl biznesowy" zamiast auto-load. Explicit > implicit. |
| **Explainability — "dlaczego ta sugestia"** | Algolia, Dynamic Yield — najlepsze recommendation engines wyjasniaja DLACZEGO. Buduje zaufanie do AI. | Low | AI prompt | Pole w sugestii: "Na podstawie Twojej branzy [X] i tresci o [Y]..." Generowane przez AI razem z sugestia. |

---

## Anti-Features

Funkcje, ktorych celowo NIE budujemy. Typowe bledy w tej domenie.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Pelnoekranowy blocking onboarding** | Najgorszy antypattern w SaaS. Uzytkownicy zamykaja karte/app. "Email verification before access, mandatory profile completion" = top time-to-value killers (zrodlo: DesignRevision, Flowjam). | Lekki wizard na osobnej stronie + banner na dashboardzie. Nigdy nie blokuj dostepu. |
| **Dluga ankieta (>5 pytan w formularzu)** | Kazde pole ponad 4-5 obniza completion o 10-15% (zrodlo: Webstacks). Duolingo = 4 pytania. | 4 pola w formularzu. Reszta przez opcjonalny chat AI lub zbieranie z uzywania platformy (progressive profiling). |
| **Auto-generowanie sugestii przy otwarciu lekcji** | Kosztowne (AI call za kazdym razem), czesto nierelewantne, spowalnia ladowanie lekcji. | Przycisk "Pokaz pomysl" = on-demand. Cache w DB po pierwszym generowaniu. |
| **Zawsze widoczne CTA kontaktowe** | Banner blindness + efekt "spamu" obniza zaufanie. Warunkowe CTA maja 2-5x wyzszy CTR (zrodlo: HubSpot, ConvertFlow). | CTA pojawia sie PO akcji uzytkownika (bookmark, powrot, rozwin). |
| **Osobna zakladka pomyslow w kursie** | Overengineering w MVP. Zbiorcza strona z filtrem po kursie wystarcza. | Jedna strona /business-ideas z filtrem. Per-kurs zakladka = osobna faza. |
| **Tracking/analityka interakcji w MVP** | Przedwczesna optymalizacja. Najpierw zbuduj feature, potem mierz. | business_suggestion_interactions = osobna faza po walidacji ze sugestie sa uzywane. |
| **A/B testing wariantow inline** | Wymaga infrastruktury (feature flags, metryki). Nie ma sensu przed product-market fit. | Zacznij od wariantu A (compact). Zmiana na C = 1 prop. A/B = osobna faza. |
| **Wlasne klucze API uzytkownika w MVP** | Duza zlozonosc (szyfrowanie, walidacja, error handling, billing). Nie potrzebne do walidacji koncepcji. | Osobna faza. MVP uzywa platformowego klucza OpenAI. |
| **Subskrypcje/billing w MVP** | Stripe integration, webhooks, plan management = tygodnie pracy. Mieszanie z feature development = rozmycie focus. | subscription_tier kolumna w DB (manual, admin-only). Billing = calkowicie osobna faza. |
| **Generowanie wiecej niz 1 sugestii na lekcje** | Wiecej opcji = decision paralysis. 1 dobrze dopasowana > 3 ogolne. | 0-1 sugestia na lekcje w MVP. Schema pozwala na tablice 0-N (future-proof). |
| **Marketplace pomyslow / sharing** | Spolecznosciowe features = moderacja, prywatnosc, complexity. Poza core value. | Pomysly sa prywatne per uzytkownik. Sharing = inna domena. |

---

## Feature Dependencies

```
Auth (istniejace)
  +---> Formularz profilowy (4 pola)
  |       +---> Opcjonalny chat AI doprecyzowujacy
  |       +---> Edycja profilu (/profile)
  |       +---> Wplyw profilu na kursy (ClarifyingChat prompt)
  |
Content Renderer (istniejacy) + DB schema
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

**Krytyczna sciezka:** DB schema -> Formularz -> AI sugestie -> Inline render -> CTA

**Rownolegle po DB schema:**
- Onboarding wizard (formularz + banner)
- Strona pomyslow (pusta z komunikatem "stwórz kurs")

**Zalezy od istniejacych modulow:**
- Content Renderer — dodanie przyciskow/kart inline (wzorzec lesson images)
- ClarifyingChat — wstrzykniecie profilu do promptu
- Sidebar — nowa pozycja "Pomysly biznesowe"
- Profile page — nowa sekcja "Profil biznesowy"

---

## MVP Recommendation

### Priorytet 1: Fundament (musi byc gotowe pierwsze)

1. **DB schema** — user_business_profiles + business_suggestions + migracje + RLS
2. **DAL** — CRUD dla profilu i sugestii (server actions, auth check)
3. **Formularz profilowy** — 4 pola + skip + banner na dashboardzie

### Priorytet 2: Core value (glowna wartosc biznesowa)

4. **AI sugestie na zadanie** — przycisk, API route, prompt, cache, rate limit
5. **Inline rendering** — wariant A (compact card) pod h2 w content renderer
6. **Bookmark / dismiss** — reakcje uzytkownika na sugestie

### Priorytet 3: Engagement loop

7. **Warunkowe CTA** — po bookmark, dane z ENV, disclaimer
8. **Strona zbiorcza /business-ideas** — lista z filtrem po kursie
9. **Wplyw profilu na kursy** — wstrzykniecie do ClarifyingChat prompt

### Defer to post-MVP

- **Chat AI doprecyzowujacy** — med-high complexity, niska krytycznosc. Formularz wystarcza na start. Design doc definiuje go jako opcjonalny krok — mozna wlaczyc jesli czas pozwoli.
- **Analityka interakcji** — po walidacji ze sugestie sa uzywane
- **A/B test wariantow** — po zebraniu baseline metryk
- **Klucze API uzytkownika** — osobna faza (szyfrowanie, Anthropic routing)
- **Freemium/billing** — osobna faza (Stripe, webhooks)
- **Explainability** — niska zlozonosc, ale wymaga prompt tuning. Dobry kandydat na quick-win post-MVP.

---

## Wzorce z rynku — co dziala

### Onboarding (Duolingo, Coursera, Notion, Airtable)

| Platform | Pattern | Insight |
|----------|---------|---------|
| Duolingo | 4 pytania -> natychmiast wartosc (pierwsza lekcja) | Zloty standard. Time-to-value < 60s. |
| Coursera | Cel kariery -> rekomendacje kursow. Profil wplywa na content. | Deklaratywne preferencje + behavioral signals. |
| Notion | Wizard z templatem workspace. Progressive disclosure. | Wartość widoczna od razu (szablon). |
| Airtable | Multi-step z wizualnymi opcjami (ikony zamiast tekstu). | Visual choices > text lists. |

**Wniosek:** 3-5 krokow, visual, nie blokuj dostepu, pokaz wartosc natychmiast.

### AI Suggestions (Algolia, Dynamic Yield, Udemy)

| Platform | Pattern | Insight |
|----------|---------|---------|
| Algolia | "We suggested this because..." | Explainability buduje zaufanie. |
| Udemy | Rekomendacje coraz trafniejsze z uzywaniem. | Behavioral signals > declared preferences. |
| Dynamic Yield | Real-time personalization na podstawie kontekstu + historii. | Kontekst biezacej strony + profil. |

**Wniosek:** Wyjasnij DLACZEGO AI sugeruje. "Na podstawie Twojej branzy i tresci o X..."

### Lead Generation (HubSpot, ConvertFlow)

| Platform | Pattern | Insight |
|----------|---------|---------|
| HubSpot | CTA po akcji (download, bookmark) = 2-5x wyzszy CTR niz statyczne. | Warunkowe > statyczne. |
| ConvertFlow | Dynamic CTA na podstawie user journey stage. | Personalizacja CTA. |

**Wniosek:** Warunkowe CTA po bookmark to validated pattern. Action-oriented copy: "Omow ten pomysl" > "Skontaktuj sie".

---

## Confidence Assessment

| Feature Area | Confidence | Reason |
|-------------|------------|--------|
| Onboarding wizard UX | HIGH | Dobrze udokumentowane wzorce (Duolingo, Coursera, Notion). Wiele zrodel zgodnych. |
| Formularz 4 pola | HIGH | Badania jednoznaczne: 4-5 pol = optimal. Kazde kolejne -10-15% completion. |
| AI suggestions inline | MEDIUM | Pattern "contextual recommendations" jest znany, ale "AI business tool suggestions przy lekcji" to niszowy case. Brak bezposrednich benchmarkow. |
| Warunkowe CTA | MEDIUM-HIGH | HubSpot/ConvertFlow potwierdzaja warunkowe CTA. Specyfika "po bookmark" jest logiczna, ale brak twardych danych dla EdTech. |
| Rate limiting | HIGH | Standard w kazdym SaaS z AI. Prosta implementacja. |
| Progressive profiling | HIGH | Dobrze udokumentowany pattern (Webstacks, UserPilot). Formularz teraz, chat/behavior pozniej. |
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
