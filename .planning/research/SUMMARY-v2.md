# Research Summary — Business Enablement (v2.0)

**Milestone:** v2.0 "Business Enablement"
**Synteza:** 2026-03-08
**Pliki źródłowe:** STACK.md, FEATURES-v2-business.md, ARCHITECTURE.md, PITFALLS-v2.md

---

## Executive Summary

Wirtualny Mentor v2.0 dodaje moduł biznesowy: onboarding profilowy, sugestie AI oparte na treści lekcji i lead generation. Kluczowy wniosek z badań: **cały moduł można zbudować na istniejącym stacku bez instalacji nowych bibliotek.** React-hook-form, useChat, generateObject, SWR, shadcn/ui, Supabase — wszystko już działa w projekcie. To drastycznie zmniejsza ryzyko i czas implementacji. Jedyne zmiany infrastrukturalne to 2 nowe tabele w Supabase i 2 wpisy w MODEL_CONFIG.

Architektura nowych modułów replikuje sprawdzone wzorce z istniejącego kodu: DAL jako server actions (jak gamification-dal.ts), generateObject z Zod schema (jak quiz generation), useChat że streaming (jak mentor/clarifying chat), inline UI przy lekcji (jak lesson images). Każdy nowy komponent ma bezpośredni odpowiednik do skopiowania. Najwyzsze ryzyko integracji to modyfikacja content-renderera lekcji, który już zawiera images, notes i ask-mentor — dodanie kolejnego elementu grozi cognitive overload.

Trzy krytyczne pulapki dominuja ten milestone: (1) blokowanie istniejących funkcji onboardingiem — skip rate 80%+ jeśli obowiązkowy, (2) sugestie AI oderwane od kontekstu lekcji — niszczy zaufanie do całej platformy, (3) agresywne CTA niszczace zaufanie edukacyjne. Wszystkie trzy to decyzje projektowe, nie techniczne — trzeba je zaadresowac w fazie designu. Koszty AI (pulapka 4) wymagają wbudowania rate limitingu i cache od pierwszego dnia.

---

## Key Findings

### Ze STACK.md

- **Zero nowych bibliotek npm** — 100% potrzeb pokryte istniejącym stackem
- Wizard onboardingowy: prosty `useState<1|2|3>`, nie stepper library (3 kroki to za malo)
- Sugestie AI: `generateObject()` + Zod schema (sprawdzony wzorzec z quizów i image plannera)
- Rate limiting: `COUNT(*) WHERE created_at > today` w Supabase — bez Redis/Upstash
- Hash inputu: natywne Web Crypto API (`crypto.subtle.digest`), bez dodatkowych deps
- Model: GPT-4o-mini wystarczy (ARCHITECTURE.md rekomenduje tanszy model niz STACK.md)
- 2 nowe tabele + 1 ALTER TABLE — standardowe migracje

### Z FEATURES-v2-business.md

**Table stakes (must-have):**
- Formularz 4 pola (branża, rola, cel, wielkość) — każde dodatkowe pole = -10-15% completion
- Skip onboarding (NIGDY nie blokowac dostępu)
- Sugestie działające BEZ profilu (80% pominie onboarding)
- Cache sugestii w DB (input_hash)
- Rate limiting (5/dzień free)
- Disclaimer na sugestiach (wymog prawny)
- Edycja profilu po onboardingu

**Differentiators (should-have):**
- Opcjonalny chat AI doprecyzowujący (unikalna wartość, ale med-high complexity)
- Kontekstowe sugestie inline przy lekcji (wzorzec z lesson images)
- Warunkowe CTA po bookmark (2-5x wyższy CTR niz statyczne)
- Explainability — "dlaczego ta sugestia" (buduje zaufanie)

**Anti-features (NIE budujemy):**
- Blocking onboarding, dluga ankieta (>5 pytań), auto-generowanie sugestii
- Zawsze widoczne CTA, tracking w MVP, A/B testing, billing/subskrypcje
- Generowanie >1 sugestii na lekcje, marketplace pomysłów

### Z ARCHITECTURE.md

- Architektura replikuje istniejące wzorce: DAL server actions, MODEL_CONFIG routing, generateObject, useChat
- **4 data flows:** onboarding (form + optional chat), suggestion generation (on-demand), contextual suggestions (from chapter), CTA (conditional UI)
- Kluczowa decyzja: `generateObject()` (nie streaming) dla sugestii — krótki structured output <3s
- DB: `user_business_profiles` (1 per user, UNIQUE) + `business_suggestions` (many per user)
- RLS: bezpośredni `auth.uid()` (jak user_points_log), NIE nested JOINs
- select-update/insert pattern (NIE upsert — znany problem PostgREST z partial index)
- Sugerowany build order: 4 fazy (DB+Form -> AI Chat+Dashboard -> Suggestions -> Context+CTA)

### Z PITFALLS-v2.md

**Krytyczne (3):**
1. Onboarding-wall blokujący edukacje — skip rate 80%+ jeśli obowiązkowy
2. Sugestie AI oderwane od kontekstu lekcji — banner blindness po 2-3 nietrafionych
3. CTA niszczacy zaufanie edukacyjne — efekt odwrotny od zamierzonego

**Umiarkowane (4):**
4. Niekontrolowane koszty AI — brak rate limitingu = niespodzianki na rachunku
5. Fuzzy heading mismatch — ZNANY bug, powtorzenie z lesson images
6. Profil nie wpływa realnie na kursy — "po co podawalem te dane?"
7. Strona pomysłów jako martwa lista — paralysis of choice

**Mniejsze (4):**
8. Chat onboardingowy bez limitu wiadomosci — max 5-7 turns
9. Sugestie bez persystencji — utrata po refreshu
10. RODO compliance — lead gen = cel marketingowy
11. Content-renderer overload — już 4 elementy przy h2

---

## Implications for Roadmap

### Sugerowana struktura faz

**Phase 8: Business Onboarding (fundament)**
- Rationale: Wszystko zależy od DB schema i profilu. Formularz bez AI to standalone deliverable.
- Delivers: Profil biznesowy, wizard 3-step, banner na dashboardzie, sekcja w /profile
- Features: formularz 4 pola, skip, progress indicator, edycja profilu, graceful degradation
- Pitfalls to avoid: onboarding-wall (#1), NULL handling (#8), RODO (#11)
- Research needed: NIE — wzorce dobrze udokumentowane (Duolingo, Coursera)

**Phase 9: AI Business Suggestions (core value)**
- Rationale: Główna wartość biznesowa milestone'u. Wymaga profilu z Phase 8.
- Delivers: Generowanie sugestii on-demand, cache, rate limit, strona /business-ideas
- Features: przycisk "Pokaż pomysł", generateObject, input_hash cache, 5/dzień limit, disclaimer
- Pitfalls to avoid: oderwane od kontekstu (#2), koszty AI (#4), persystencja (#10), fuzzy match (#5)
- Research needed: TAK — prompt engineering dla sugestii wymaga iteracji, quality gate do zdefiniowania

**Phase 10: Contextual Integration + Lead Gen**
- Rationale: Warstwa engagement na dzialajacych sugestiach. CTA MUSI być ostatnie (po walidacji).
- Delivers: Sugestie inline przy lekcji, bookmark, warunkowe CTA, wpływ profilu na kursy
- Features: SectionBusinessIdeaButton, bookmark/dismiss, ContactCTA, curriculum prompt enrichment
- Pitfalls to avoid: CTA niszczacy zaufanie (#3), content-renderer overload (#12), martwa lista (#7)
- Research needed: CZĘŚCIOWO — placement sugestii w content-renderer wymaga prototypu (sidebar vs inline vs pod lekcja)

**Opcjonalnie (post-MVP):**
- Chat AI doprecyzowujący profil (med-high complexity, niska krytyczność w MVP)
- Explainability ("dlaczego ta sugestia")
- Analityka interakcji
- Billing/subskrypcje (Stripe — całkowicie osobna faza)

### Research Flags

| Faza | Potrzebuje research? | Powod |
|------|---------------------|-------|
| Phase 8 (Onboarding) | NIE | Sprawdzone wzorce SaaS, każdy komponent ma odpowiednik w kodzie |
| Phase 9 (Suggestions) | TAK | Prompt engineering dla kontekstowych sugestii biznesowych to niszowy case. Quality gate do zdefiniowania. Model choice (GPT-4o-mini vs GPT-5.2) wymaga testow |
| Phase 10 (Context+CTA) | CZĘŚCIOWO | Placement sugestii w content-renderer — prototyp decyzyjny (sidebar vs inline). CTA language/timing — walidacja z uzytkownikami |

---

## Confidence Assessment

| Obszar | Pewność | Uzasadnienie |
|--------|---------|-------------|
| Stack | HIGH | Pelna analiza package.json — zero nowych deps. Każdy wzorzec zweryfikowany w istniejącym kodzie. |
| Features | MEDIUM-HIGH | Onboarding i lead gen dobrze udokumentowane. "AI business suggestions przy lekcji" to niszowy case bez bezpośrednich benchmarkow. |
| Architecture | HIGH | Oparta na bezpośredniej analizie istniejącego kodu. Każdy nowy komponent ma odpowiednik do replikacji. |
| Pitfalls | HIGH | Pulapki zweryfikowane z branzowymi źródłami 2025-2026 + analiza istniejących bugow w projekcie (fuzzy match, PostgREST upsert). |

### Luki do zaadresowania

1. **Model choice niezgodnosc:** STACK.md rekomenduje GPT-5.2, ARCHITECTURE.md rekomenduje GPT-4o-mini. Decyzja wymaga testow jakości sugestii na 10-20 przykladach.
2. **Placement sugestii w lekcji:** Brak konsensusu — FEATURES mowi "inline compact card pod h2", PITFALLS mowi "osobna sekcja pod lekcja lub sidebar". Wymaga prototypu.
3. **Quality gate dla sugestii:** Wspomniany w PITFALLS (confidence score > 0.7), ale brak szczegółowej implementacji. Do zdefiniowania w Phase 9.
4. **Progressive profiling:** Wspomniany jako wzorzec, ale brak szczegółowego planu zbierania danych behawioralnych. Dobrze — to post-MVP.

---

## Key Decisions for Roadmapper

1. **3 fazy, nie 4** — chat AI doprecyzowujący odlozony do post-MVP (formularz 4 pol wystarcza na start)
2. **On-demand, nie auto** — sugestie generowane na zadanie użytkownika (przycisk), nie automatycznie
3. **CTA ostatnie** — dopiero po walidacji że sugestie są używane i wartościowe
4. **Graceful degradation** — cały moduł opcjonalny, platforma działa identycznie bez profilu biznesowego
5. **Zero nowych deps** — brak ryzyka nowych bibliotek, cały milestone na istniejącym stacku

---

## Aggregated Sources

### HIGH Confidence
- Bezposrednia analiza kodu: providers.ts, gamification-dal.ts, content-renderer.tsx, lesson-images.ts, notes.ts, auth.ts, curriculum/prompts.ts
- [SaaS Onboarding Best Practices 2026 — DesignRevision](https://designrevision.com/blog/saas-onboarding-best-practices)
- [Multi-Step Form Best Practices — Webstacks](https://www.webstacks.com/blog/multi-step-form)
- [100+ User Onboarding Statistics 2026 — UserGuiding](https://userguiding.com/blog/user-onboarding-statistics)
- [API Rate Limiting Best Practices 2025 — Zuplo](https://zuplo.com/learning-center/10-best-practices-for-api-rate-limiting-in-2025)

### MEDIUM Confidence
- [Generative AI in EdTech: 5 Pitfalls — AWS](https://aws.amazon.com/blogs/publicsector/generative-ai-in-edtech-5-pitfalls-to-avoid-for-long-term-success/)
- [EdTech Pitfalls with AI — Brookings](https://www.brookings.edu/articles/how-to-avoid-past-edtech-pitfalls-as-we-begin-using-ai-to-scale-impact-in-education/)
- [B2B Lead Generation 2026 — Ironpaper](https://www.ironpaper.com/webintel/b2b-lead-generation-in-2026-trust-timing-clarity)
- [AI API Cost Management — Skywork](https://skywork.ai/blog/ai-api-cost-throughput-pricing-token-math-budgets-2025/)
- [EdTech Onboarding — UserPilot](https://userpilot.com/blog/customer-onboarding-in-edtech/)
