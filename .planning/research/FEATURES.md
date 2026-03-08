# Feature Landscape: Wirtualny Mentor

**Domain:** AI-powered personalized learning platform
**Researched:** 2026-01-30
**Confidence:** MEDIUM (based on multiple WebSearch sources cross-referenced)

---

## Table Stakes

Funkcje, których użytkownicy oczekują. Brak = produkt wydaje się niekompletny.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Personalizowane ścieżki nauki** | 79% zespolow L&D już używa AI do personalizacji; użytkownik oczekuje dostosowania do swojego poziomu | High | Kluczowe: analiza poziomu użytkownika, dopasowanie trudności |
| **Rejestracja i logowanie** | Standard każdej platformy edukacyjnej; bez tego brak zapisu postępu | Low | Supabase Auth - gotowe rozwiązanie |
| **Zapisywanie postępu nauki** | Użytkownik wraca do miejsca, gdzie skonczyl; oczekiwanie z każdej aplikacji | Low | Supabase DB - sync postępu |
| **Quizy sprawdzajace wiedzę** | 60% edukatorów używa AI do generowania quizów; standard edukacji | Medium | Różne typy pytań: jednokrotnego/wielokrotnego wyboru, otwarte |
| **Adaptacyjne dostosowanie trudności** | Platformy jak Khanmigo i inne dostosowuja w real-time; oczekiwanie 2026 | High | AI analizuje odpowiedzi i modyfikuje material |
| **Intuicyjny interfejs** | Common Sense Media ocenia UX jako kluczowy; slabe UX = odejście użytkowników | Medium | Inspiracja: NotebookLM, InsightsLM |
| **Responsywny design (mobile-friendly)** | Wiekszsc użytkowników uczy się tez na telefonie | Medium | Web-first ale mobile-friendly |
| **Materiały edukacyjne wysokiej jakości** | Treść musi być wartościowa; AI-generated content musi być zweryfikowany | High | Generowanie przez AI + możliwość weryfikacji |
| **Linki do zewnętrznych źródeł** | Uczenie się wymaga różnych perspektyw; użytkownik oczekuje źródeł | Low | Web search integration dla aktualności |
| **Feedback na odpowiedzi** | Natychmiastowa informacja zwrotna to standard 2026 | Medium | Wyjasnienia błędnych odpowiedzi |
| **Historia ukończonych kursów** | Użytkownik chce widziec swoj progres historyczny | Low | Dashboard z historia |

---

## Differentiators

Funkcje wyróżniające produkt. Nie oczekiwane, ale cenione.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **5-poziomowa struktura (Początkujący -> Guru)** | Jasna ścieżka rozwoju od zera do eksperta; unikalna progresja | Medium | Wymaga AI które rozumie poziomy ekspertyzy |
| **Chatbot-mentor z metoda sokratyczna** | Nie daje odpowiedzi, a prowadzi do odkrycia; jak Khanmigo | High | Wymaga prompt engineering dla stylu sokratycznego |
| **Dostęp mentora do notatek użytkownika** | Personalizacja na poziomie indywidualnych przemyslen | Medium | RAG z notatkami użytkownika |
| **Real-time web search dla aktualnej wiedzy** | Dziedziny dynamiczne (prawo, technologia) wymagają aktualności | High | Integracja Perplexity/Tavily API |
| **Praktyczne instrukcje narzędzi krok-po-kroku** | Większość platform teoretyzuje; tu konkretne komendy i instalacje | High | Wymaga strukturyzowanego generowania treści |
| **Analiza linków podanych przez użytkownika** | Użytkownik może dodac swoj material źródłowy | Medium | Web scraping + analiza AI |
| **Automatyczne flashcardy że spaced repetition** | Trendy 2026: Knowt, RemNote, LectureScribe - fiszki z AI | Medium | Algorytm spaced repetition (SM-2 lub podobny) |
| **Dodatkowe materiały przy błędnych odpowiedziach** | Adaptacyjna remediacja zamiast powtarzania testu | Medium | AI identyfikuje luki i generuje uzupełnienia |
| **Mozliwosc ręcznego przeskoczenia poziomu** | Dla zaawansowanych użytkowników który znaja już temat | Low | Test diagnostyczny przed poziomem |
| **Notatki użytkownika podczas nauki** | Aktywne uczenie się; notatki powiązane z materiałem | Medium | Editor z linkowaniem do sekcji kursu |
| **Wsparcie wielomodelowe (Claude/GPT/Gemini)** | Optymalizacja kosztów i jakości dla różnych zadań | High | Routing zapytan do odpowiedniego modelu |
| **Kontekstowe wyjaśnienia pojec** | Deep-linking do definicji i powiązań między koncepcjami | Medium | Knowledge graph lub semantic search |
| **Progress tracking z predykcja** | Przewidywanie ryzyka porzucenia kursu | High | ML na danych behawioralnych |
| **Eksport postępu i certyfikaty ukończeń** | Motywacja i dowod ukończeń (bez oficjalnej certyfikacji) | Low | PDF/obrazek z podsumowaniem |

---

## Anti-Features

Funkcje których celowo NIE budowac. Typowe błędy w tej domenie.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Dawanie gotowych odpowiedzi przez AI** | Zabija myslenie krytyczne; badania pokazuja 20-30% gorsza retencja | Metoda sokratyczna - pytania naprowadzające |
| **Dlugie wideo bez interakcji** | Pasywne uczenie = niska retencja; użytkownik traci uwage | Mikro-lekcje (5-10 min) z quizami po każdej |
| **Monolityczne programy bez adaptacji** | Jeden rozmiar nie pasuje wszystkim; frustracja użytkowników | Adaptacyjne ścieżki z real-time dostosowaniem |
| **Zbyt wiele treści na raz** | Cognitive overload; badania L&D 2026 wskazuja to jako główny błąd | Chunking - male porcje + przerwy |
| **Oficjalne certyfikaty/dyplomy** | Wymaga akredytacji; odpowiedzialnosc prawna; poza zakresem MVP | Nieoficjalne "potwierdzenia ukończeń" |
| **Forum spolecznosciowe** | Wymaga moderacji; spamy; odciaga od core value | Chatbot-mentor zastepuje potrzebe spolecznosci |
| **Generowanie audio/podcastow** | Skomplikowane; wymaga TTS wysokiej jakości; poza MVP | Tekst + opcjonalne TTS w przyszłości |
| **Natywna aplikacja mobilna** | Kosztowna do utrzymania; web-first wystarczy na start | PWA lub responsive web |
| **Gamifikacja z odznakami/punktami** | Powierzchowna motywacja; nie prowadzi do głębokiego uczenia | Postepy oparte na rzeczywistym mistrzorstwie |
| **Integracja z mediami spolecznosciowymi** | Rozpraszanie; poza core value | Focus na nauce, nie na udostepnianiu |
| **Płatności/subskrypcje w v1** | Przedwczesna monetyzacja przed walidacja produktu | Darmowy produkt do walidacji, płatności później |
| **Czat grupowy/wspolpraca** | Komplikuje architekture; nie jest core value | Indywidualna nauka z AI mentorem |
| **Automatyczne aktualizacje kursów bez kontroli** | Użytkownik może być w trakcie kursu; zmiany mogą dezorientowac | Wersjonowanie kursów; użytkownik decyduje o aktualizacji |

---

## Feature Dependencies

```
Zaleznosci miedzy funkcjami:

[Rejestracja/Logowanie]
         |
         v
[Zapisywanie postepu] --> [Historia kursow]
         |
         v
[Personalizowane sciezki] <--> [Adaptacyjna trudnosc]
         |                            |
         v                            v
[Materialy edukacyjne] --------> [Quizy]
         |                            |
         v                            v
[Linki zewnetrzne] <-- [Web Search] [Feedback na odpowiedzi]
                                      |
                                      v
                            [Dodatkowe materialy przy bledach]

[Notatki uzytkownika] --> [Chatbot z dostepem do notatek]
                                      |
                                      v
                            [Metoda sokratyczna]

[Flashcardy] <-- [Spaced Repetition Algorithm]
```

### Grupy zależności:

1. **Auth + Progress** (Low complexity) - fundament, musi być pierwszy
2. **Content Generation** (High complexity) - core value, wymaga AI pipeline
3. **Assessment System** (Medium complexity) - zależy od content
4. **Mentor Chatbot** (High complexity) - zależy od notatek i content
5. **Web Search** (Medium complexity) - enhancement, może być dodany później
6. **Spaced Repetition** (Medium complexity) - enhancement, po podstawowych quizach

---

## MVP Recommendation

### Dla MVP, priorytet:

**Must Have (Phase 1-2):**
1. Rejestracja i logowanie (table stakes)
2. Generowanie programu nauczania z AI (core value)
3. 5-poziomowa struktura kursu (differentiator)
4. Podstawowe materiały edukacyjne (table stakes)
5. Quizy na koncu każdego poziomu (table stakes)
6. Zapisywanie postępu (table stakes)

**Should Have (Phase 3-4):**
7. Chatbot-mentor (differentiator)
8. Notatki użytkownika (differentiator)
9. Praktyczne instrukcje narzędzi (differentiator)
10. Adaptacyjna trudność (table stakes 2026)

**Nice to Have (Phase 5+):**
11. Real-time web search (differentiator)
12. Spaced repetition flashcardy (differentiator)
13. Dostęp mentora do notatek (differentiator)
14. Analiza linków użytkownika (differentiator)

### Defer to post-MVP:

- **Wsparcie wielomodelowe**: Skomplikowane; zacznij od jednego modelu (Claude), dodaj routing później
- **Predykcyjne analytics**: Wymaga danych historycznych; zbuduj po zebraniu danych
- **Eksport certyfikatow**: Nice-to-have; nie blokuje core value
- **PWA features**: Dodaj po walidacji web

---

## Sources

### HIGH Confidence (Multiple sources agree):
- [360Learning - AI Learning Platforms 2026](https://360learning.com/blog/ai-learning-platforms/)
- [Khanmigo - Khan Academy AI Tutor](https://www.khanmigo.ai/)
- [Disco - Personalized Learning Platform 2026](https://www.disco.co/blog/ai-powered-personalized-learning-platform)
- [Absorb LMS - AI Learning Platforms 2026](https://www.absorblms.com/blog/top-ai-learning-platforms)

### MEDIUM Confidence (Single authoritative source):
- [EdTech Trends 2025-2030](https://emerline.com/blog/edtech-trends)
- [eSchool News - 49 Predictions 2026](https://www.eschoolnews.com/innovative-teaching/2026/01/01/draft-2026-predictions/)
- [Docebo - AI Learning Platforms 2026](https://www.docebo.com/learning-network/blog/ai-learning-platforms/)

### LOW Confidence (WebSearch only, needs validation):
- [Airmeet - L&D Mistakes 2026](https://www.airmeet.com/hub/blog/learning-and-development-mistakes-to-avoid-in-2026-dos-donts-checklist/)
- [AI Invasion - Challenges in Education](https://www.ainvasion.com/10-critical-challenges-of-ai-in-education/)
- [SocratiQ Paper on Arxiv](https://arxiv.org/html/2502.00341v1)

---

## Kluczowe Wnioski dla Roadmapy

1. **Authentication + Progress Tracking musi być pierwszy** - bez tego nie ma personalizacji
2. **Content Generation jest core value** - tutaj najwiecej wysiłku
3. **Quizy to table stakes 2026** - użytkownicy oczekują assessment
4. **Metoda sokratyczna to differentiator** - Khanmigo udowodnilo wartość
5. **Web search to enhancement** - ważne dla aktualności, ale nie blokuje MVP
6. **Spaced repetition to trend 2026** - Knowt, RemNote, LectureScribe pokazuja kierunek

### Ryzyko:
- Content generation quality - wymaga dobrych promptow i weryfikacji
- Metoda sokratyczna - wymaga zaawansowanego prompt engineering
- Multi-model routing - skomplikowane, może być overkill na start
