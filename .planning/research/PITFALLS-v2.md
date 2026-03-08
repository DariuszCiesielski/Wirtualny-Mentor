# Pułapki Domeny: Business Enablement (v2.0)

**Domena:** Onboarding biznesowy + sugestie AI + lead generation w istniejącej platformie EdTech
**Projekt:** Wirtualny Mentor v2.0
**Data badań:** 2026-03-08
**Poziom pewności:** HIGH (weryfikacja z istniejącym kodem + dane branżowe 2026)

---

## Pułapki Krytyczne

Błędy powodujące porzucenie funkcji, utratę zaufania użytkowników lub wymuszające przepisanie.

---

### Pułapka 1: Onboarding-wall — blokowanie wartości edukacyjnej

**Co idzie nie tak:** Onboarding biznesowy wyświetlany PRZED dostępem do kursu. Użytkownik przyszedł uczyć się AI/programowania, a widzi formularz o branży i budżecie. 72% użytkowników porzuca onboarding z wieloma krokami. W kontekście Wirtualnego Mentora: użytkownik już ma konto i kursy — dodanie obowiązkowego onboardingu to regresja UX.

**Dlaczego się zdarza:** Zespół chce zebrać dane profilowe od wszystkich, więc wstawia onboarding jako gate. Logika: "im więcej danych, tym lepsze sugestie AI".

**Konsekwencje:**
- Skip rate 80%+ (potwierdzone w dual review Claude Code + Codex)
- Użytkownicy, którzy pominęli onboarding, nigdy nie wrócą do uzupełnienia profilu
- Istniejący użytkownicy (v1.0) odczuwają regresję — "wcześniej działało bez tego"
- Każde dodatkowe pole formularza kosztuje ~7% konwersji

**Zapobieganie:**
- Onboarding jako **opcjonalny, progresywny** — nie blokować żadnej istniejącej funkcji
- Zbierać dane kontekstowo: pytanie o branżę PRZY generowaniu kursu (gdzie to ma sens)
- Max 4 pola formularza (branża, rola, cel, doświadczenie)
- Osobny "Profil biznesowy" w ustawieniach, nie modalne okno przy logowaniu
- Wskaźnik postępu + przycisk "Pomiń" ZAWSZE widoczny
- Progressive disclosure: LinkedIn pattern — zbierz minimum, resztę potem

**Wykrywanie:**
- Metryka: onboarding completion rate < 40% = problem
- Metryka: czas do pierwszej akcji po rejestracji wzrasta
- Feedback: "po co mi te pytania?"

**Faza:** Phase 8 (Onboarding) — krytyczne od pierwszego dnia

**Źródła:**
- [SaaS Onboarding Best Practices 2026](https://designrevision.com/blog/saas-onboarding-best-practices)
- [100+ User Onboarding Statistics 2026](https://userguiding.com/blog/user-onboarding-statistics)
- [Progressive Onboarding — UserPilot](https://userpilot.com/blog/progressive-onboarding/)

---

### Pułapka 2: Sugestie AI oderwane od kontekstu lekcji

**Co idzie nie tak:** AI generuje sugestie biznesowe, które nie mają związku z aktualnie czytaną lekcją. Użytkownik czyta o "pętlach for w Pythonie" i widzi sugestię "Otwórz agencję marketingową". Model halucynuje lub generuje zbyt ogólne pomysły.

**Dlaczego się zdarza:**
- Prompt nie zawiera wystarczającego kontekstu lekcji (zbyt krótki snippet)
- Model dostaje profil użytkownika, ale nie treść sekcji
- Brak quality gate — każda odpowiedź AI jest wyświetlana bez filtrowania
- Presja na "AI everywhere" bez analizy, gdzie AI faktycznie dodaje wartość

**Konsekwencje:**
- Użytkownicy ignorują sugestie po 2-3 nietrafionych (banner blindness)
- Feature staje się martwym kodem — nikt nie klika
- Podważa zaufanie do jakości AI na CAŁEJ platformie (w tym mentora i quizów)

**Zapobieganie:**
- Kontekst do prompta: **treść sekcji + tytuł rozdziału + nazwa kursu + profil użytkownika**
- Quality gate: AI ocenia własną sugestię (confidence score), wyświetlaj tylko gdy > 0.7
- **On-demand** (przycisk), nie automatyczne — użytkownik decyduje kiedy chce sugestie
- Fallback: "Nie mam trafnej sugestii dla tej sekcji" zamiast wymuszania odpowiedzi
- Testowanie: 20 różnych lekcji x profili → ręczna ocena trafności przed shipem

**Wykrywanie:**
- Click-through rate na sugestiach < 5% = sugestie nietrafione
- Użytkownicy nie bookmarkują żadnych sugestii
- Feedback: "to nie ma sensu", "co to ma wspólnego z lekcją?"

**Faza:** Phase 9 (AI Suggestions) — wymaga iteracji prompta

**Źródła:**
- [Generative AI in EdTech: 5 Pitfalls — AWS](https://aws.amazon.com/blogs/publicsector/generative-ai-in-edtech-5-pitfalls-to-avoid-for-long-term-success/)
- [EdTech Pitfalls with AI — Brookings](https://www.brookings.edu/articles/how-to-avoid-past-edtech-pitfalls-as-we-begin-using-ai-to-scale-impact-in-education/)

---

### Pułapka 3: CTA/lead gen niszczący zaufanie edukacyjne

**Co idzie nie tak:** Użytkownik widzi "Porozmawiaj z ekspertem" lub "Zamów konsultację" w kontekście edukacyjnym. Czuje się jak w lejku sprzedażowym, nie na platformie do nauki. W 2026 użytkownicy są bardziej sceptyczni niż kiedykolwiek wobec ukrytych intencji sprzedażowych.

**Dlaczego się zdarza:** Zespół chce monetyzować i umieszcza CTA zbyt wcześnie, zbyt agresywnie, bez wcześniejszego dostarczenia wartości. Presja na szybkie wyniki biznesowe.

**Konsekwencje:**
- Utrata zaufania do platformy ("to nie edukacja, to reklama")
- Negatywne recenzje, churn istniejących użytkowników
- Użytkownicy blokują/ignorują WSZYSTKIE nowe elementy UI (w tym wartościowe sugestie)
- Efekt odwrotny: mniej leadów niż bez CTA, bo użytkownicy uciekają

**Zapobieganie:**
- CTA **warunkowe** — dopiero po bookmarkowaniu sugestii (użytkownik sam wyraził zainteresowanie)
- CTA jako wartość, nie sprzedaż: "Chcesz wdrożyć ten pomysł? Oto następne kroki" (nie "Kup teraz")
- **Nigdy** nie przerywać lekcji CTA — tylko na dedykowanej stronie pomysłów
- Limit: max 1 CTA na stronę, nigdy w treści lekcji
- Język: "Dowiedz się więcej" > "Skontaktuj się z nami" > "Zamów"
- CTA powinno wyglądać jak naturalny następny krok, nie jak reklama

**Wykrywanie:**
- NPS spada po wdrożeniu CTA
- Bounce rate na stronach z CTA wyższy niż bez
- Feedback w mentorze: pytania o "reklamy" na platformie
- Churn rate wzrasta w segmencie istniejących użytkowników

**Faza:** Phase 10 (Lead Generation) — ostatnia, po walidacji sugestii

**Źródła:**
- [B2B Lead Generation 2026: Trust, Timing, Clarity](https://www.ironpaper.com/webintel/b2b-lead-generation-in-2026-trust-timing-clarity)

---

### Pułapka 4: Niekontrolowane koszty AI per user

**Co idzie nie tak:** Każde kliknięcie "Pokaż sugestię biznesową" to wywołanie GPT-5.2. Jeden aktywny użytkownik generuje 50+ sugestii dziennie. Przy ~$0.01-0.05/call to $0.50-2.50/dzień/użytkownika. 100 aktywnych użytkowników = $50-250/dzień bez przychodu.

**Dlaczego się zdarza:**
- Brak rate limitingu per user (istniejący system nie ma tego wzorca)
- Brak cachowania — ta sama sekcja, ten sam profil = nowe wywołanie AI
- Brak globalnego budżetu per user/dzień
- "Najpierw zbudujmy, potem zoptymalizujemy" — ale koszty rosną od dnia 1

**Konsekwencje:**
- Rachunek za API eksploduje (znany problem SaaS z AI — koszty rosną szybciej niż przychody)
- Wymuszenie wyłączenia funkcji lub nagłego ograniczenia (frustracja użytkowników)
- Projekt staje się nieopłacalny zanim zdobędzie płacących użytkowników

**Zapobieganie:**
- **Cache agresywny:** sugestia per (section_heading, course_id, user_profile_hash) — ta sama sekcja + profil = cached response z DB
- **Rate limit per user:** max 10-20 sugestii/dzień (wzorzec z `user_points_log` w gamification — idempotentny insert)
- **Tańszy model na screening:** GPT-4o-mini do oceny "czy ta sekcja nadaje się do sugestii" ($0.00075/1K tokens) → GPT-5.2 tylko gdy tak
- **DB persistence:** sugestie zapisywane w DB, nie generowane na żywo za każdym razem
- **Monitoring:** Helicone JUŻ zintegrowane w `providers.ts` — dodać alerty na koszty per endpoint
- **Circuit breaker:** globalny miesięczny budżet, po przekroczeniu → fallback na cached/generic sugestie

**Wykrywanie:**
- Helicone dashboard: koszt per endpoint rośnie > 20% tydzień do tygodnia
- Pojedynczy user odpowiada za > 10% kosztów AI
- Stosunek unique sugestie / total API calls < 0.5 (powtórki bez cache)

**Faza:** Phase 9 (AI Suggestions) — wbudować od początku, NIE dodawać post-factum

**Źródła:**
- [AI API Cost & Throughput Management 2025](https://skywork.ai/blog/ai-api-cost-throughput-pricing-token-math-budgets-2025/)
- [API Rate Limiting Best Practices 2025](https://zuplo.com/learning-center/10-best-practices-for-api-rate-limiting-in-2025)
- [Rate Limiting in AI Gateway](https://www.truefoundry.com/blog/rate-limiting-in-llm-gateway)

---

## Pułapki Umiarkowane

Błędy powodujące opóźnienia, dług techniczny lub degradację UX.

---

### Pułapka 5: Fuzzy matching sekcji — powtórzenie błędu z lesson images

**Co idzie nie tak:** Sugestie AI powiązane z `section_heading` (jak lesson images). AI zwraca heading zmodyfikowany (bez numeru, zmieniona interpunkcja). Sugestia nie pasuje do żadnej sekcji w rendererze.

**Dlaczego się zdarza:** To ZNANY problem w tym projekcie. `stripHeadingNumber()` + fuzzy fallback w `content-renderer.tsx` (linia 39-57) rozwiązuje to dla obrazów, ale nowy feature może nie reużyć tego kodu. Planner (`src/lib/images/planner.ts`) ma explicit prompt "Copy the heading EXACTLY" — ale AI nadal czasem modyfikuje headingi.

**Konsekwencje:**
- Sugestie "osierocone" — wygenerowane ale nie wyświetlone
- Użytkownik klika "Pokaż sugestię" i nic się nie dzieje
- DB pełne niepowiązanych rekordów

**Zapobieganie:**
- **Reużyć** `stripHeadingNumber()` i wzorzec fuzzy match z lesson images
- **Wyodrębnić** shared utility: `matchSectionHeading(aiHeading, actualHeadings)` w `src/lib/utils/`
- **Walidacja w API:** AI response → sprawdź czy heading istnieje w lekcji → fallback na najbliższy match
- **Prompt engineering:** skopiować wzorzec z `planner.ts` — "Copy the heading EXACTLY as it appears in the list below, including any numbering"
- **Normalizacja przy zapisie:** zapisuj w DB znormalizowany heading (stripped), matchuj po stripped version

**Wykrywanie:**
- Sugestia w DB ale brak wyświetlenia w UI (monitoring mismatch rate)
- Logi: "No section found for heading: ..."
- Metryka: generated suggestions count vs displayed suggestions count

**Faza:** Phase 9 (AI Suggestions) — refactor na początku fazy, przed implementacją sugestii

---

### Pułapka 6: Profil biznesowy nie wpływa realnie na jakość kursów

**Co idzie nie tak:** Użytkownik wypełnia profil (branża, doświadczenie, cel biznesowy), ale generowane kursy są identyczne jak bez profilu. Feature obiecuje personalizację, ale jej nie dostarcza.

**Dlaczego się zdarza:**
- Prompt curriculum generation (`src/lib/ai/`) nie inkorporuje danych z profilu
- Profil zapisany w osobnej tabeli, ale nie queryowany przy generowaniu
- Brak A/B testowania: "czy kurs z profilem jest lepszy?"
- Zmiana istniejących promptów to ryzyko regresji (działający system)

**Konsekwencje:**
- Użytkownik czuje się oszukany — "po co podawałem te dane?"
- Onboarding completion rate spada (word of mouth: "to nic nie zmienia")
- Feature wygląda jak data harvesting, nie personalizacja

**Zapobieganie:**
- **Jasna ścieżka danych:** profil → prompt injection → measurable difference w output
- **A/B test:** wygeneruj kurs z i bez profilu, porównaj ręcznie (min. 5 par)
- **Transparentność:** pokaż użytkownikowi JAK profil wpłynął ("Kurs dostosowany do branży: marketing")
- **Iteracyjne dodawanie:** najpierw 1 pole (branża) z widocznym wpływem, potem rozszerzaj
- **Regression testing:** zestaw testowych promptów, porównanie output przed i po zmianie

**Wykrywanie:**
- Porównanie kursów: profil filled vs empty — jeśli identyczne, feature nie działa
- Użytkownicy nie uzupełniają profilu po pierwszym kursie (brak perceived value)
- Feedback: "kurs jest za ogólny mimo podania branży"

**Faza:** Phase 11 (Profile Integration) — wymaga modyfikacji istniejących promptów curriculum

---

### Pułapka 7: Strona pomysłów biznesowych jako martwa lista

**Co idzie nie tak:** Strona agregująca pomysły to flat lista 50+ pozycji bez struktury. Użytkownik nie wie od czego zacząć, nie wraca na stronę. Paralysis of choice.

**Dlaczego się zdarza:** Łatwo zbudować "lista z bazy danych" (SELECT * FROM suggestions), trudno zbudować "wartościowe narzędzie do eksploracji pomysłów".

**Konsekwencje:**
- Niska retencja na stronie pomysłów (bounce < 30s)
- CTA nie konwertują (zbyt dużo opcji = brak decyzji)
- Strona staje się "cmentarzyskiem pomysłów"

**Zapobieganie:**
- **Filtry:** po kursie, po typie (narzędzie/usługa/produkt), po złożoności wdrożenia
- **Sortowanie:** po popularności (bookmarks), po dacie, po trafności do profilu
- **Grupowanie:** po kursie/temacie, nie flat list
- **Limit wyświetlania:** top 5-10 z opcją "pokaż więcej" (progressive disclosure)
- **Actionable:** każdy pomysł z "następnymi krokami" (nie tylko tytuł + opis)
- **Wzorzec z istniejącego kodu:** dashboard z kursami — karty z progress, nie listy

**Wykrywanie:**
- Czas na stronie < 30s = lista nie angażuje
- Scroll depth < 30% = zbyt długa lista
- Bookmark rate < 2% = pomysły nie są wartościowe lub nie wyróżniają się

**Faza:** Phase 10 (Business Ideas Page)

---

### Pułapka 8: Migracja istniejących użytkowników — NULL handling

**Co idzie nie tak:** Nowe tabele (business_profiles, business_suggestions) wymagają migracji. Istniejący użytkownicy nie mają profilu → NULL handling wszędzie. RLS policies na nowych tabelach muszą współgrać z istniejącym łańcuchem.

**Dlaczego się zdarza:** Focus na new user flow, zapominanie o 100% istniejących użytkowników bez profilu biznesowego.

**Konsekwencje:**
- NULL pointer crashes w UI dla istniejących użytkowników
- RLS blokuje dostęp do sugestii (brak JOIN path)
- Istniejące API routes nie obsługują opcjonalnego profilu
- 500 errors na dashboardzie po deployu v2.0

**Zapobieganie:**
- **Profil nullable:** `business_profiles` jako osobna tabela z LEFT JOIN, NIE dodatkowe kolumny w `auth.users`
- **Graceful degradation:** brak profilu = domyślne sugestie (bez personalizacji), nie error
- **RLS pattern:** `business_suggestions` → `auth.uid()` (bezpośredni, jak `user_points_log`), NIE nested JOINs
- **Migration test:** manualne testy na koncie bez profilu biznesowego PRZED deployem
- **WAŻNE:** NIE używać upsert z partial index (znany problem z PostgREST — patrz lesson images `saveLessonImage`)

**Wykrywanie:**
- Error rate w logach po deployu v2.0
- Istniejący użytkownik widzi pusty ekran lub 500
- RLS "new row violates" errors w Supabase logs

**Faza:** Phase 8 (Onboarding) — schema design na początku fazy

---

## Pułapki Mniejsze

Problemy powodujące irytację, ale naprawialne bez dużego refactoru.

---

### Pułapka 9: Chat onboardingowy bez limitu wiadomości

**Co idzie nie tak:** Opcjonalny chat AI do doprecyzowania profilu (hybryda formularz + chat). Użytkownik rozmawia 30 minut zamiast 2. Koszt rośnie, wartość dodatkowa maleje po 3-4 wiadomościach.

**Zapobieganie:**
- Max 5-7 wiadomości w chacie onboardingowym
- Po 5 wiadomościach: "Mam wystarczająco informacji. Oto Twój profil:" → structured extraction
- `generateObject()` z Zod schema na koniec chatu (jak quiz generation)
- Osobna instancja `useChat` (nie współdzielić z mentorem — inny endpoint, inny limit)

**Faza:** Phase 8 (Onboarding)

---

### Pułapka 10: Sugestie bez persystencji — utrata po refreshu

**Co idzie nie tak:** Sugestia AI generowana on-demand, wyświetlana w UI, ale nie zapisana w DB. Użytkownik odświeża stronę — sugestia zniknęła. To ZNANY problem w tym projekcie — lesson images miały identyczny issue przed dodaniem DB persistence + signed URL cache.

**Zapobieganie:**
- Sugestie zapisywane w `business_suggestions` od pierwszego wywołania
- Pattern z `lesson_images`: saveSuggestion() po wygenerowaniu, getLessonSuggestions() przy mount
- Unique constraint: (user_id, chapter_id, section_heading) — idempotentne
- `initialSuggestions` przekazywane z server component (jak `initialImages` w lesson images)
- WAŻNE: select→update/insert pattern (NIE upsert — partial index niekompatybilny z PostgREST)

**Faza:** Phase 9 (AI Suggestions) — schema design od początku

---

### Pułapka 11: Bookmark/CTA analytics bez privacy compliance (RODO)

**Co idzie nie tak:** Śledzenie kliknięć CTA i bookmarków bez informowania użytkownika. RODO wymaga informowania o przetwarzaniu danych w celach marketingowych (lead generation jest celem marketingowym).

**Zapobieganie:**
- Privacy notice w onboardingu: "Twoje dane pomagają nam lepiej dopasować sugestie"
- Opcja opt-out z sugestii biznesowych i lead generation
- Dane profilowe osobne od danych edukacyjnych (łatwiejsze usuwanie na żądanie)
- Nie eksportować danych użytkowników do zewnętrznych CRM bez explicite zgody
- Prawo do usunięcia: CASCADE DELETE na business_profiles → business_suggestions

**Faza:** Phase 8 (Onboarding) — RODO compliance od początku

---

### Pułapka 12: Nowy UI element w content-renderer zaburzający flow lekcji

**Co idzie nie tak:** Dodanie przycisku "Sugestia biznesowa" przy każdej sekcji h2 (jak SectionImage, GenerateImageButton) sprawia, że lekcja wygląda jak świąteczna choinka — obrazy, notatki, sugestie, przyciski do mentora. Cognitive overload.

**Zapobieganie:**
- Sugestie biznesowe jako **osobna sekcja pod lekcją** lub **sidebar panel** (jak inline mentor chat), NIE inline przy każdym h2
- Alternatywnie: jeden przycisk na całą lekcję ("Sugestie biznesowe dla tej lekcji"), nie per sekcja
- Jeśli per sekcja: ikonka dyskretna (jak SectionNoteIndicator badge), nie pełny button

**Faza:** Phase 9 (AI Suggestions) — decyzja o placement na początku

---

## Ostrzeżenia per faza

| Faza | Temat | Prawdopodobna pułapka | Mitygacja |
|------|-------|----------------------|-----------|
| Phase 8 | Onboarding | Blokowanie istniejących funkcji formularzem | Opcjonalny, progresywny, max 4 pola |
| Phase 8 | Schema | NULL handling dla istniejących userów | LEFT JOIN, graceful degradation |
| Phase 8 | Chat AI | Nieograniczona rozmowa onboardingowa | Max 5-7 wiadomości, structured extraction |
| Phase 8 | RODO | Brak zgody na przetwarzanie danych biznesowych | Privacy notice, opt-out, CASCADE DELETE |
| Phase 9 | Sugestie AI | Oderwane od kontekstu lekcji | Pełny kontekst w prompcie + quality gate |
| Phase 9 | Koszty | Brak rate limitingu i cache | Cache + limit per user + model tiering |
| Phase 9 | Section matching | Fuzzy heading mismatch | Reużyć stripHeadingNumber, shared utility |
| Phase 9 | Persystencja | Utrata sugestii po refreshu | DB save pattern z lesson images |
| Phase 9 | UI | Przeładowany content-renderer | Osobna sekcja/sidebar, nie inline per h2 |
| Phase 10 | CTA | Agresywna sprzedaż | Warunkowe (po bookmark), wartościowy język |
| Phase 10 | Pomysły | Martwa lista bez struktury | Filtry, grupowanie, top-N, progressive disclosure |
| Phase 11 | Profil → kurs | Brak widocznego wpływu profilu | A/B test, transparentność, iteracyjne dodawanie |

---

## Ryzyka integracji z istniejącym systemem

| Istniejący komponent | Ryzyko integracji | Mitygacja |
|---------------------|-------------------|-----------|
| `content-renderer.tsx` | Nowy UI element (sugestia) w rendererze lekcji — już zawiera images, notes, ask-mentor | Komponent injectable (jak SectionImage), lub osobna sekcja pod treścią |
| `providers.ts` (MODEL_CONFIG) | Nowy endpoint do sugestii — brak entry w config | Dodać do MODEL_CONFIG (`suggestions: openaiProvider('gpt-5.2')`), reużyć Helicone proxy |
| `src/lib/dal/` | Nowe DAL pliki muszą być spójne z istniejącym wzorcem | Kopiować pattern z `notes.ts` / `lesson-images.ts` |
| RLS policies | Nowe tabele wymagają policies — złożone JOINy = wolne | Bezpośredni `auth.uid()` (jak `user_points_log`), nie nested ownership chain |
| `useChat` (AI SDK v6) | Chat onboardingowy vs mentor chat — ryzyko kolizji stanu | Osobna instancja useChat, inny API route, nie współdzielić stanu |
| PostgREST + partial index | `upsert()` nie działa z partial unique index | select→update/insert pattern (lekcja z lesson images) |
| Gamification | Punkty za bookmarkowanie sugestii? | Opcjonalne — dodać PO walidacji engagement, nie w MVP |
| `stripHeadingNumber()` | Duplikacja logiki fuzzy matching | Wyodrębnić do shared utility PRZED implementacją sugestii |

---

## Podsumowanie: Top 5 pułapek dla v2.0 Business Enablement

1. **Onboarding-wall blokujący edukację** — KRYTYCZNE: skip rate 80%+ jeśli obowiązkowy
2. **Sugestie AI oderwane od kontekstu** — KRYTYCZNE: niszczy zaufanie do całej platformy
3. **CTA niszczący zaufanie edukacyjne** — KRYTYCZNE: efekt odwrotny od zamierzonego
4. **Niekontrolowane koszty AI** — WYSOKIE: brak rate limitingu = niespodzianki na rachunku
5. **Fuzzy heading mismatch** — ŚREDNIE ale znane: powtórzenie istniejącego bugu

**Rekomendacja:** Pułapki 1-3 to decyzje projektowe — adresować w fazie designu (Phase 8). Pułapka 4 to architektura — wbudować od początku (Phase 9). Pułapka 5 to refactor — wyodrębnić shared utility przed implementacją sugestii.

---

## Źródła

### Onboarding i UX
- [SaaS Onboarding Best Practices 2026 — Design Revision](https://designrevision.com/blog/saas-onboarding-best-practices)
- [100+ User Onboarding Statistics 2026 — UserGuiding](https://userguiding.com/blog/user-onboarding-statistics)
- [Progressive Onboarding — UserPilot](https://userpilot.com/blog/progressive-onboarding/)
- [7 User Onboarding Best Practices 2026 — Formbricks](https://formbricks.com/blog/user-onboarding-best-practices)

### AI w EdTech
- [Generative AI in EdTech: 5 Pitfalls — AWS](https://aws.amazon.com/blogs/publicsector/generative-ai-in-edtech-5-pitfalls-to-avoid-for-long-term-success/)
- [EdTech Pitfalls with AI — Brookings](https://www.brookings.edu/articles/how-to-avoid-past-edtech-pitfalls-as-we-begin-using-ai-to-scale-impact-in-education/)
- [Ed-Tech Putting AI Before Expertise — Inside Higher Ed](https://www.insidehighered.com/opinion/columns/learning-innovation/2025/10/23/ed-tech-companies-are-putting-ai-educator-expertise)

### Lead Generation i zaufanie
- [B2B Lead Generation 2026: Trust, Timing, Clarity — Ironpaper](https://www.ironpaper.com/webintel/b2b-lead-generation-in-2026-trust-timing-clarity)

### Koszty AI i rate limiting
- [AI API Cost & Throughput Management 2025 — Skywork](https://skywork.ai/blog/ai-api-cost-throughput-pricing-token-math-budgets-2025/)
- [API Rate Limiting Best Practices 2025 — Zuplo](https://zuplo.com/learning-center/10-best-practices-for-api-rate-limiting-in-2025)
- [Rate Limiting in AI Gateway — TrueFoundry](https://www.truefoundry.com/blog/rate-limiting-in-llm-gateway)

### Analiza istniejącego kodu
- `src/components/materials/content-renderer.tsx` — stripHeadingNumber(), fuzzy match (linie 39-57)
- `src/lib/images/planner.ts` — prompt "Copy heading EXACTLY", Zod schema
- `src/lib/ai/providers.ts` — MODEL_CONFIG, Helicone integration
- `src/lib/dal/lesson-images.ts` — select→update/insert pattern (nie upsert z partial index)
- `src/lib/dal/notes.ts` — DAL pattern do replikacji
