# Feature Landscape: Wirtualny Mentor

**Domain:** AI-powered personalized learning platform
**Researched:** 2026-01-30
**Confidence:** MEDIUM (based on multiple WebSearch sources cross-referenced)

---

## Table Stakes

Funkcje, ktorych uzytkownicy oczekuja. Brak = produkt wydaje sie niekompletny.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Personalizowane sciezki nauki** | 79% zespolow L&D juz uzywa AI do personalizacji; uzytkownik oczekuje dostosowania do swojego poziomu | High | Kluczowe: analiza poziomu uzytkownika, dopasowanie trudnosci |
| **Rejestracja i logowanie** | Standard kazdej platformy edukacyjnej; bez tego brak zapisu postepu | Low | Supabase Auth - gotowe rozwiazanie |
| **Zapisywanie postepu nauki** | Uzytkownik wraca do miejsca, gdzie skonczyl; oczekiwanie z kazdej aplikacji | Low | Supabase DB - sync postepu |
| **Quizy sprawdzajace wiedze** | 60% edukatorow uzywa AI do generowania quizow; standard edukacji | Medium | Rozne typy pytan: jednokrotnego/wielokrotnego wyboru, otwarte |
| **Adaptacyjne dostosowanie trudnosci** | Platformy jak Khanmigo i inne dostosowuja w real-time; oczekiwanie 2026 | High | AI analizuje odpowiedzi i modyfikuje material |
| **Intuicyjny interfejs** | Common Sense Media ocenia UX jako kluczowy; slabe UX = odejscie uzytkownikow | Medium | Inspiracja: NotebookLM, InsightsLM |
| **Responsywny design (mobile-friendly)** | Wiekszsc uzytkownikow uczy sie tez na telefonie | Medium | Web-first ale mobile-friendly |
| **Materialy edukacyjne wysokiej jakosci** | Tresc musi byc wartosciowa; AI-generated content musi byc zweryfikowany | High | Generowanie przez AI + mozliwosc weryfikacji |
| **Linki do zewnetrznych zrodel** | Uczenie sie wymaga roznych perspektyw; uzytkownik oczekuje zrodel | Low | Web search integration dla aktualnosci |
| **Feedback na odpowiedzi** | Natychmiastowa informacja zwrotna to standard 2026 | Medium | Wyjasnienia blednych odpowiedzi |
| **Historia ukonczonych kursow** | Uzytkownik chce widziec swoj progres historyczny | Low | Dashboard z historia |

---

## Differentiators

Funkcje wyrozniajace produkt. Nie oczekiwane, ale cenione.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **5-poziomowa struktura (Poczatkujacy -> Guru)** | Jasna sciezka rozwoju od zera do eksperta; unikalna progresja | Medium | Wymaga AI ktore rozumie poziomy ekspertyzy |
| **Chatbot-mentor z metoda sokratyczna** | Nie daje odpowiedzi, a prowadzi do odkrycia; jak Khanmigo | High | Wymaga prompt engineering dla stylu sokratycznego |
| **Dostep mentora do notatek uzytkownika** | Personalizacja na poziomie indywidualnych przemyslen | Medium | RAG z notatkami uzytkownika |
| **Real-time web search dla aktualnej wiedzy** | Dziedziny dynamiczne (prawo, technologia) wymagaja aktualnosci | High | Integracja Perplexity/Tavily API |
| **Praktyczne instrukcje narzedzi krok-po-kroku** | Wiekszosc platform teoretyzuje; tu konkretne komendy i instalacje | High | Wymaga strukturyzowanego generowania tresci |
| **Analiza linkow podanych przez uzytkownika** | Uzytkownik moze dodac swoj material zrodlowy | Medium | Web scraping + analiza AI |
| **Automatyczne flashcardy ze spaced repetition** | Trendy 2026: Knowt, RemNote, LectureScribe - fiszki z AI | Medium | Algorytm spaced repetition (SM-2 lub podobny) |
| **Dodatkowe materialy przy blednych odpowiedziach** | Adaptacyjna remediacja zamiast powtarzania testu | Medium | AI identyfikuje luki i generuje uzupelnienia |
| **Mozliwosc recznego przeskoczenia poziomu** | Dla zaawansowanych uzytkownikow ktory znaja juz temat | Low | Test diagnostyczny przed poziomem |
| **Notatki uzytkownika podczas nauki** | Aktywne uczenie sie; notatki powiazane z materialem | Medium | Editor z linkowaniem do sekcji kursu |
| **Wsparcie wielomodelowe (Claude/GPT/Gemini)** | Optymalizacja kosztow i jakosci dla roznych zadan | High | Routing zapytan do odpowiedniego modelu |
| **Kontekstowe wyjasnienia pojec** | Deep-linking do definicji i powiazan miedzy koncepcjami | Medium | Knowledge graph lub semantic search |
| **Progress tracking z predykcja** | Przewidywanie ryzyka porzucenia kursu | High | ML na danych behawioralnych |
| **Eksport postepu i certyfikaty ukonczen** | Motywacja i dowod ukonczen (bez oficjalnej certyfikacji) | Low | PDF/obrazek z podsumowaniem |

---

## Anti-Features

Funkcje ktorych celowo NIE budowac. Typowe bledy w tej domenie.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Dawanie gotowych odpowiedzi przez AI** | Zabija myslenie krytyczne; badania pokazuja 20-30% gorsza retencja | Metoda sokratyczna - pytania naprowadzajace |
| **Dlugie wideo bez interakcji** | Pasywne uczenie = niska retencja; uzytkownik traci uwage | Mikro-lekcje (5-10 min) z quizami po kazdej |
| **Monolityczne programy bez adaptacji** | Jeden rozmiar nie pasuje wszystkim; frustracja uzytkownikow | Adaptacyjne sciezki z real-time dostosowaniem |
| **Zbyt wiele tresci na raz** | Cognitive overload; badania L&D 2026 wskazuja to jako glowny blad | Chunking - male porcje + przerwy |
| **Oficjalne certyfikaty/dyplomy** | Wymaga akredytacji; odpowiedzialnosc prawna; poza zakresem MVP | Nieoficjalne "potwierdzenia ukonczen" |
| **Forum spolecznosciowe** | Wymaga moderacji; spamy; odciaga od core value | Chatbot-mentor zastepuje potrzebe spolecznosci |
| **Generowanie audio/podcastow** | Skomplikowane; wymaga TTS wysokiej jakosci; poza MVP | Tekst + opcjonalne TTS w przyszlosci |
| **Natywna aplikacja mobilna** | Kosztowna do utrzymania; web-first wystarczy na start | PWA lub responsive web |
| **Gamifikacja z odznakami/punktami** | Powierzchowna motywacja; nie prowadzi do glebokiego uczenia | Postepy oparte na rzeczywistym mistrzorstwie |
| **Integracja z mediami spolecznosciowymi** | Rozpraszanie; poza core value | Focus na nauce, nie na udostepnianiu |
| **Platnosci/subskrypcje w v1** | Przedwczesna monetyzacja przed walidacja produktu | Darmowy produkt do walidacji, platnosci pozniej |
| **Czat grupowy/wspolpraca** | Komplikuje architekture; nie jest core value | Indywidualna nauka z AI mentorem |
| **Automatyczne aktualizacje kursow bez kontroli** | Uzytkownik moze byc w trakcie kursu; zmiany moga dezorientowac | Wersjonowanie kursow; uzytkownik decyduje o aktualizacji |

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

### Grupy zaleznosci:

1. **Auth + Progress** (Low complexity) - fundament, musi byc pierwszy
2. **Content Generation** (High complexity) - core value, wymaga AI pipeline
3. **Assessment System** (Medium complexity) - zalezy od content
4. **Mentor Chatbot** (High complexity) - zalezy od notatek i content
5. **Web Search** (Medium complexity) - enhancement, moze byc dodany pozniej
6. **Spaced Repetition** (Medium complexity) - enhancement, po podstawowych quizach

---

## MVP Recommendation

### Dla MVP, priorytet:

**Must Have (Phase 1-2):**
1. Rejestracja i logowanie (table stakes)
2. Generowanie programu nauczania z AI (core value)
3. 5-poziomowa struktura kursu (differentiator)
4. Podstawowe materialy edukacyjne (table stakes)
5. Quizy na koncu kazdego poziomu (table stakes)
6. Zapisywanie postepu (table stakes)

**Should Have (Phase 3-4):**
7. Chatbot-mentor (differentiator)
8. Notatki uzytkownika (differentiator)
9. Praktyczne instrukcje narzedzi (differentiator)
10. Adaptacyjna trudnosc (table stakes 2026)

**Nice to Have (Phase 5+):**
11. Real-time web search (differentiator)
12. Spaced repetition flashcardy (differentiator)
13. Dostep mentora do notatek (differentiator)
14. Analiza linkow uzytkownika (differentiator)

### Defer to post-MVP:

- **Wsparcie wielomodelowe**: Skomplikowane; zacznij od jednego modelu (Claude), dodaj routing pozniej
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

1. **Authentication + Progress Tracking musi byc pierwszy** - bez tego nie ma personalizacji
2. **Content Generation jest core value** - tutaj najwiecej wysilku
3. **Quizy to table stakes 2026** - uzytkownicy oczekuja assessment
4. **Metoda sokratyczna to differentiator** - Khanmigo udowodnilo wartosc
5. **Web search to enhancement** - wazne dla aktualnosci, ale nie blokuje MVP
6. **Spaced repetition to trend 2026** - Knowt, RemNote, LectureScribe pokazuja kierunek

### Ryzyko:
- Content generation quality - wymaga dobrych promptow i weryfikacji
- Metoda sokratyczna - wymaga zaawansowanego prompt engineering
- Multi-model routing - skomplikowane, moze byc overkill na start
