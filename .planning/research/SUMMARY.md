# Research Summary: Wirtualny Mentor

**Project:** Wirtualny Mentor
**Domain:** Platforma edukacyjna AI z personalizowanym curriculum, chatbot-mentorem, quizami i web searchem
**Researched:** 2026-01-30
**Confidence:** HIGH

## Executive Summary

Wirtualny Mentor to platforma edukacyjna nowej generacji, która wykorzystuje AI do tworzenia personalizowanych programów nauczania z 5-poziomową strukturą (Początkujący → Guru). Badania potwierdzają, że w 2026 roku 79% zespołów L&D używa AI do personalizacji, a adaptacyjne platformy edukacyjne są standardem, nie nowością.

**Kluczowa decyzja architekturalna:** Next.js zamiast Vite (mimo preferencji z PROJECT.md) ze względu na natywne wsparcie dla streaming AI, SSR dla SEO (produkt publiczny) i bezproblemową integrację z Vercel AI SDK. Stack oparty na Supabase + pgvector eliminuje potrzebę osobnej vector database, co znacząco upraszcza architekturę. Multi-model strategy (Claude Sonnet 4.5 dla mentoringu, GPT-4.1 dla curriculum, Gemini 2.5 Flash dla quizów) wymaga dokładnego model tieringu od początku.

**Krytyczne ryzyka:** (1) Eksplozja kosztów tokenów przy skalowaniu – startupy regularnie niedoszacowują kosztów o 500-1000%, (2) Halucynacje AI w treściach edukacyjnych – LLM-y są niepoprawne w ~25% przypadków bez RAG, (3) Nadmierna zależność od AI podważa uczenie – metoda sokratyczna MUSI być zaimplementowana od początku, nie jako upgrade. Mitygacja wymaga caching, RAG z zaufanymi źródłami, aggressive prompt engineering i natychmiastowego monitoringu kosztów.

## Key Findings

### Recommended Stack

Stack zaprojektowany dla platformy z wymaganiami: streaming AI (chatbot), generowanie treści (curriculum + quizy), RAG (dostęp do notatek), web search (aktualna wiedza), publiczny produkt (SEO).

**Core technologies:**
- **Next.js 15.x** — Full-stack framework dla React z natywnym wsparciem dla streaming AI, API routes i SSR. Przewaga nad Vite: brak potrzeby konfiguracji SSR, 20 linii kodu dla AI streaming vs 100+ z Vite, optymalna integracja z Vercel AI SDK.
- **Vercel AI SDK 6.x** — Orchestration dla AI z useChat/useCompletion hooks, wsparcie dla 25+ providerów (Claude/GPT/Gemini), streaming responses, tool calling. Lżejszy niż LangChain.js i edge-native.
- **Supabase + pgvector** — BaaS z PostgreSQL, RLS, auth i wbudowanym pgvector dla embeddingów. Eliminuje potrzebę osobnej vector DB (Pinecone/Weaviate).
- **Tavily API** — RAG-optimized web search ($0.008/search, 1000 free/mies). Szybsze i lepiej zoptymalizowane dla RAG niż Perplexity czy Exa AI.
- **Zustand + TanStack Query** — State management: Zustand dla client state (~2KB, bez boilerplate), TanStack Query dla server state (caching, refetch).
- **shadcn/ui + Tailwind CSS 4.x** — Komponenty UI z copy-paste customization. Rozważ shadcn-chatbot-kit dla chat UI.

**Koszty (szacunek):**
- MVP: ~$0 (free tiers)
- 10K użytkowników: $200-500/mies (Vercel Pro, Supabase Pro, AI API, Tavily)

**Alternatywy odrzucone:**
- Vite → brak SSR, gorsze streaming AI
- LangChain.js → większy bundle, blokuje edge runtime
- Firebase → Firestore słabszy dla relacji, brak pgvector
- Pinecone → dodatkowa infrastruktura niepotrzebna na start

### Expected Features

**Must have (table stakes 2026):**
- Personalizowane ścieżki nauki — 79% L&D używa AI personalizacji, użytkownicy tego oczekują
- Rejestracja/logowanie + zapisywanie postępu — standard każdej platformy
- Quizy sprawdzające wiedzę — 60% edukatorów używa AI do quizów
- Adaptacyjne dostosowanie trudności — platformy jak Khanmigo ustaliły standard
- Responsywny design (mobile-friendly) — większość uczy się też na telefonie
- Feedback na odpowiedzi — natychmiastowa informacja zwrotna to baseline UX

**Should have (differentiators):**
- 5-poziomowa struktura (Początkujący → Guru) — jasna ścieżka rozwoju
- Chatbot-mentor z metodą sokratyczną — NIE daje odpowiedzi, prowadzi do odkrycia (jak Khanmigo)
- Dostęp mentora do notatek użytkownika — RAG z osobistą wiedzą (unique value prop)
- Real-time web search dla aktualnej wiedzy — dynamiczne dziedziny wymagają świeżości
- Praktyczne instrukcje narzędzi krok-po-kroku — większość platform teoretyzuje, tu konkret
- Dodatkowe materiały przy błędnych odpowiedziach — adaptacyjna remediacja zamiast powtarzania testu

**Defer (v2+):**
- Wsparcie wielomodelowe — skomplikowane, zacznij od jednego (Claude), routing później
- Spaced repetition flashcards — trend 2026, ale nie blokuje MVP
- Predykcyjne analytics — wymaga danych historycznych
- PWA features — dodaj po walidacji web

**Anti-features (NIE budować):**
- Dawanie gotowych odpowiedzi przez AI — zabija myślenie krytyczne, 20-30% gorsza retencja
- Długie wideo bez interakcji — pasywne uczenie = niska retencja
- Oficjalne certyfikaty/dyplomy — wymaga akredytacji, poza zakresem
- Forum społecznościowe — wymaga moderacji, chatbot zastępuje potrzebę
- Gamifikacja z odznakami/punktami — powierzchowna motywacja

### Architecture Approach

Architektura warstwowa: Frontend (React + Zustand) → API Layer (Next.js API Routes) → AI Orchestration (model routing, RAG, web search) → Data Layer (Supabase + pgvector).

**Major components:**
1. **AI Orchestrator** — routing zapytań do odpowiednich modeli (Claude dla chat, GPT dla curriculum, Gemini dla quizów), RAG engine, web search integration. Krytyczne: oddzielenie logiki AI od logiki biznesowej.
2. **RAG Engine z pgvector** — embeddingi notatek użytkownika w Supabase, similarity search dla chatbota. Pattern: saveNoteWithEmbedding() → chunk + embed → pgvector; findRelevantNotes() → query embedding → match_notes RPC.
3. **Streaming Chat Infrastructure** — useChat hook (frontend) + streamText (backend) dla real-time responses. Next.js API routes zwracają DataStreamResponse.
4. **Service Layer** — abstrakcja dostępu do Supabase przez dedykowane serwisy (courseService, noteService). NIE wywołuj supabase.from() bezpośrednio z UI.
5. **Content Generation Pipeline** — tworzenie curriculum → chapters → materials → quizy. Streaming lub task queue dla długich operacji (Vercel hobby limit 10s).

**Key patterns:**
- Layered AI Orchestration — routing modeli niezależny od logiki app
- RAG z pgvector — brak dodatkowej vector DB
- Streaming responses — lepsza UX, natychmiastowy feedback
- Service layer + hooks — testowalne, nie tight coupling
- Caching AI responses — Supabase cache dla powtarzalnych treści

**Anti-patterns do uniknięcia:**
- Bezpośredni dostęp Supabase z UI → używaj service layer
- Jeden mega-endpoint /api/ai → rozdziel per funkcjonalność
- Synchroniczne generowanie dużych treści → streaming lub background jobs
- Embeddingi w pamięci → pgvector w Supabase
- Brak cache'owania AI → kosztowne i wolne

### Critical Pitfalls

**1. Eksplozja kosztów tokenów w produkcji**
Startupy regularnie niedoszacowują kosztów AI o 500-1000% przy skalowaniu. Jeden przypadek: $15k/mies → $60k/mies w 3 miesiące. **Mitygacja:** Model tiering (tanie modele do prostych zadań), A/B testing modeli, aggressive caching (30% redukcja kosztów), prompt engineering (15-30% mniej tokenów), monitoring od dnia 1. **Faza krytyczna:** 0-1 (architektura).

**2. Halucynacje AI w treściach edukacyjnych**
LLM-y niepoprawne w ~25% przypadków bez weryfikacji. 47% źródeł wygenerowanych przez AI ma błędne dane. W edukacji = uczenie błędów. **Mitygacja:** RAG z zaufanymi źródłami, obowiązkowe cytaty, warstwa weryfikacji, disclaimery, feedback loop dla zgłaszania błędów. **Faza krytyczna:** generowanie programów i wszystkie fazy z content generation.

**3. Latencja web search w czasie rzeczywistym**
Różnice między API: 358ms (najszybsze) vs 5.49s (najwolniejsze) = 15x. Operacje RAG mogą być 41% całkowitej latencji. **Mitygacja:** Wybierz szybkie API (Tavily, Exa), aggressive caching, streaming responses, background prefetching, graceful fallback bez searchu. **Faza krytyczna:** web search integration.

**4. Nadmierna zależność od AI podważa uczenie**
Paradoks: narzędzie do nauki blokuje rzeczywiste uczenie. AI podaje gotowe odpowiedzi = brak krytycznego myślenia. 50% studentów czuje się mniej związanych z nauczycielem przy AI. **Mitygacja:** Metoda sokratyczna (pytania naprowadzające, nie odpowiedzi), progresywne podpowiedzi, obowiązkowe wyjaśnienia, delayed answers, metryki głębokości zrozumienia. **Faza krytyczna:** chatbot-mentor i quizy.

**5. Złożoność multi-model architecture**
Mieszanie providerów (OpenAI/Anthropic/Gemini) znacząco zwiększa złożoność. Różne API, formaty, limity, awarie. **Mitygacja:** Abstrakcja providerów (Vercel AI SDK + jednolity format), zacznij od jednego providera (Claude), dodawaj tylko gdy uzasadnione, fallback strategy, monitoring per-model. **Faza krytyczna:** 0 (architektura).

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 0: Foundation & AI Architecture
**Rationale:** Krytyczne decyzje o kosztach i architekturze MUSZĄ być podjęte przed pisaniem kodu aplikacji. Pułapka #1 (eksplozja kosztów) i #5 (multi-model complexity) są nieodwracalne po implementacji.

**Delivers:**
- Next.js setup z Vercel AI SDK
- Model tiering strategy (Claude/GPT/Gemini routing)
- Cost monitoring setup (alerty budżetowe)
- AI Orchestrator skeleton

**Stack:** Next.js 15, Vercel AI SDK 6, @ai-sdk/anthropic + openai + google

**Addresses:**
- Pułapka #1 (eksplozja kosztów) — model tiering od początku
- Pułapka #5 (multi-model complexity) — abstrakcja providerów

**Research flag:** SKIP — Vercel AI SDK jest dobrze udokumentowany, standard patterns

---

### Phase 1: Auth, Database & Basic UI
**Rationale:** Personalizacja wymaga użytkownika i jego danych. Wszystkie inne funkcje (progress tracking, notatki, RAG) zależą od auth. Prosta faza z gotowymi rozwiązaniami (Supabase Auth).

**Delivers:**
- Supabase setup: PostgreSQL + RLS + Auth
- Rejestracja/logowanie (email/password)
- User profiles + preferencje
- Database schema (users, courses, chapters, progress, notes)
- Basic UI (landing, dashboard, course navigation)

**Stack:** Supabase, shadcn/ui, Tailwind CSS 4, Zustand

**Addresses:**
- Table stakes: rejestracja, logowanie, zapisywanie postępu
- Architektura: Service Layer + Database Schema

**Research flag:** SKIP — Supabase Auth jest dobrze udokumentowany

---

### Phase 2: Curriculum Generation (Core Value Prop)
**Rationale:** Generowanie programów nauczania to core value proposition. Musi być wcześnie do walidacji konceptu. Wymaga web searchu dla aktualności (dziedziny dynamiczne) i ochrony przed halucynacjami.

**Delivers:**
- AI generuje 5-poziomowy program (Początkujący → Guru)
- Web search integration (Tavily) dla aktualności
- RAG z zaufanymi źródłami (nie tylko LLM knowledge cutoff)
- Cytowanie źródeł w materiałach
- Caching wygenerowanych programów

**Stack:** Vercel AI SDK (GPT-4.1 structured outputs), Tavily API, pgvector (dla source embeddings)

**Addresses:**
- Differentiator: 5-poziomowa struktura
- Pułapka #2 (halucynacje) — RAG + cytaty obowiązkowe
- Pułapka #3 (latencja) — Tavily (szybkie API) + caching

**Research flag:** CONSIDER — może wymagać research dla optimal prompts (curriculum generation), ale podstawowy pattern jest znany

---

### Phase 3: Chapter Content & Materials Generation
**Rationale:** Po wygenerowaniu struktury potrzeba wypełnić ją treścią. Krytyczna faza dla jakości edukacyjnej.

**Delivers:**
- Generowanie materiałów "podręcznikowych" per rozdział
- Praktyczne instrukcje krok-po-kroku (instalacje, komendy)
- Linki do zewnętrznych zasobów
- Streaming generation (długie treści)
- Weryfikacja faktów (automated fact-checking gdzie możliwe)

**Stack:** Vercel AI SDK (Claude Sonnet 4.5 dla długich treści), streamText, Supabase caching

**Addresses:**
- Table stakes: materiały edukacyjne wysokiej jakości
- Differentiator: praktyczne instrukcje narzędzi
- Pułapka #2 (halucynacje) — weryfikacja faktów, disclaimery

**Research flag:** CONSIDER — prompt engineering dla wysokiej jakości materiałów może wymagać iteracji

---

### Phase 4: Quiz System & Adaptive Remediation
**Rationale:** Quizy to table stakes 2026. Adaptacyjna remediacja to differentiator który chroni przed pułapką #4 (nadmierna zależność od AI).

**Delivers:**
- AI generuje quizy (single/multiple choice, otwarte)
- Quiz-taking UI (shadcn components)
- Scoring + feedback natychmiastowy
- Adaptive remediation: dodatkowe materiały przy błędach
- Progress tracking per rozdział
- Item Response Theory (IRT) dla kalibracji trudności pytań

**Stack:** Gemini 2.5 Flash (szybkie, tanie dla quizów), custom quiz engine (brak dominującej biblioteki)

**Addresses:**
- Table stakes: quizy sprawdzające wiedzę, adaptacyjne dostosowanie trudności
- Differentiator: dodatkowe materiały przy błędnych odpowiedziach
- Pułapka #4 (nadmierna zależność AI) — feedback wymusza zrozumienie

**Research flag:** SKIP — quiz generation jest prostym use case'em, IRT dobrze udokumentowane

---

### Phase 5: Notes System & Embeddings (RAG Preparation)
**Rationale:** Notatki użytkownika to fundament dla RAG chatbota (Phase 6). pgvector setup musi być przed chatbotem.

**Delivers:**
- CRUD notatek podczas nauki
- Chunking + embedding notatek (OpenAI text-embedding-3-small)
- Zapis do pgvector (Supabase)
- match_notes() RPC function dla similarity search
- UI: editor notatek + linkowanie do rozdziałów

**Stack:** Supabase pgvector extension, OpenAI embeddings API, HNSW index

**Addresses:**
- Differentiator: notatki użytkownika podczas nauki
- Architektura: RAG Engine z pgvector

**Research flag:** SKIP — pgvector z Supabase jest dobrze udokumentowany

---

### Phase 6: Mentor Chatbot z RAG (Metoda Sokratyczna)
**Rationale:** Chatbot-mentor to kluczowy differentiator. Wymaga metody sokratycznej od początku (nie upgrade później) dla ochrony przed pułapką #4.

**Delivers:**
- Chat UI (shadcn-chatbot-kit lub custom)
- useChat hook + streaming responses
- RAG: findRelevantNotes() z pgvector przed każdym zapytaniem
- Metoda sokratyczna: AI zadaje pytania naprowadzające, NIE daje odpowiedzi
- Chat history w Supabase
- Context management (długie konwersacje)

**Stack:** Vercel AI SDK useChat, Claude Sonnet 4.5 (empatia, długi kontekst), pgvector RAG

**Addresses:**
- Differentiator: chatbot-mentor z metodą sokratyczną, dostęp do notatek użytkownika
- Pułapka #4 (nadmierna zależność) — metoda sokratyczna MUST HAVE
- Table stakes: intuicyjny interfejs

**Research flag:** CONSIDER — prompt engineering dla metody sokratycznej może wymagać research i iteracji

---

### Phase 7: Polish & Optimization
**Rationale:** Po core features, czas na dopracowanie UX, mobile, cost optimization.

**Delivers:**
- Mobile-friendly responsive design (wszystkie ekrany)
- Onboarding z expectations management (możliwości i limity AI)
- Dashboard historii ukończonych kursów
- Eksport postępu/certyfikaty (nieoficjalne)
- Performance optimization
- Cost monitoring dashboards (dla foundera)
- Runbooks dla maintenance

**Stack:** Vercel Analytics, Supabase monitoring

**Addresses:**
- Table stakes: responsywny design, historia ukończonych kursów
- Pułapka #6 (UX cognitive overload) — progressive disclosure, chunking
- Pułapka #8 (brak strategii maintenance) — runbooks, dashboards

**Research flag:** SKIP — standard practices, dobrze znane

---

### Phase Ordering Rationale

**Zależności techniczne:**
```
Phase 0 (Foundation) → brak zależności, MUSI być pierwszy
Phase 1 (Auth + DB) → wymaga Phase 0
Phase 2 (Curriculum) → wymaga Phase 1 (user), Phase 0 (AI infra)
Phase 3 (Content) → wymaga Phase 2 (struktura do wypełnienia)
Phase 4 (Quizy) → wymaga Phase 3 (materiały do przetestowania)
Phase 5 (Notes + Embeddings) → wymaga Phase 1 (user), Phase 3 (content do notowania)
Phase 6 (Chatbot) → wymaga Phase 5 (RAG), Phase 3 (wiedza do rozmowy)
Phase 7 (Polish) → wymaga wszystkich poprzednich
```

**Mitygacja pułapek:**
- Phase 0 adresuje pułapki #1 (koszty) i #5 (multi-model) — nieodwracalne decyzje
- Phase 2-3 adresują pułapkę #2 (halucynacje) — RAG + weryfikacja od początku
- Phase 4-6 adresują pułapkę #4 (nadmierna zależność) — metoda sokratyczna core design
- Phase 2 adresuje pułapkę #3 (latencja) — Tavily + caching strategy

**Groupowanie funkcji:**
- Foundation + Auth (Phases 0-1): infrastruktura
- Content Generation (Phases 2-3): core value proposition, najważniejsze do walidacji
- Assessment + Knowledge (Phases 4-5): table stakes + RAG prep
- Interaction (Phase 6): differentiator (chatbot)
- Polish (Phase 7): UX enhancement

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2 (Curriculum Generation):** Prompt engineering dla strukturyzowanego outputu (5 poziomów), web search integration patterns
- **Phase 3 (Content Generation):** Prompt engineering dla wysokiej jakości materiałów edukacyjnych, fact-checking automation
- **Phase 6 (Chatbot Sokratyczny):** Prompt engineering dla metody sokratycznej — to jest trudne i wymaga iteracji

**Phases with standard patterns (skip research-phase):**
- **Phase 0 (Foundation):** Vercel AI SDK dobrze udokumentowany
- **Phase 1 (Auth + DB):** Supabase Auth + RLS są standardowe
- **Phase 4 (Quizy):** Quiz generation to prosty use case
- **Phase 5 (Notes + Embeddings):** pgvector z Supabase dobrze udokumentowany
- **Phase 7 (Polish):** Standard UX practices

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Oficjalne dokumentacje Vercel AI SDK, Supabase, Next.js. Multi-source agreement dla wyboru Tavily vs konkurencja. |
| Features | MEDIUM | Oparte na multiple WebSearch sources (360Learning, Khanmigo, Disco). Table stakes zweryfikowane przez statystyki (79% L&D używa AI, 60% edukatorów używa AI do quizów). Differentiators oparte na successful products (Khanmigo dla sokratycznej metody). |
| Architecture | MEDIUM-HIGH | Oficjalne docs dla Vercel AI SDK RAG patterns i Supabase pgvector. Layered architecture zweryfikowana przez multiple sources. Database schema oparte na standard e-learning patterns. |
| Pitfalls | MEDIUM-HIGH | Koszty tokenów i halucynacje zweryfikowane multiple authoritative sources (Duke University, OpenAI, research papers). Latencja RAG zweryfikowana przez technical benchmarks. Pedagogiczne pitfalls zweryfikowane przez NPR, edukacyjne research. |

**Overall confidence:** HIGH

Główne zalecenia (stack, architecture, critical pitfalls) oparte na oficjalnych dokumentacjach i multiple verified sources. Features i niektóre pedagogiczne aspekty oparte na WebSearch + industry consensus (MEDIUM), ale spójne z 2026 trends.

### Gaps to Address

**1. Optimal prompt engineering dla metody sokratycznej**
**Gap:** Brak konkretnych przykładów prompts dla metody sokratycznej w kontekście różnych dziedzin nauki. Khanmigo nie ujawnia swoich prompts.
**Handle:** Phase 6 planning wymaga eksperymentów z różnymi prompt strategies. A/B testing różnych podejść. Może wymagać /gsd:research-phase podczas fazy 6.

**2. Fact-checking automation w praktyce**
**Gap:** Jak faktycznie zautomatyzować weryfikację faktów w treściach edukacyjnych? Źródła mówią "zrób to", ale nie pokazują jak.
**Handle:** Phase 3 planning: research automated fact-checking tools/APIs (Google Fact Check Explorer API, ClaimBuster, iffy.news API). Może wymagać manual review na początku z późniejszą automatyzacją.

**3. Item Response Theory implementation dla adaptive quizów**
**Gap:** Teoretycznie dobrze znane, ale implementacja w JavaScript/TypeScript może wymagać research bibliotek.
**Handle:** Phase 4 planning: check czy istnieją JS libraries dla IRT (cat-js, irt.js) lub zaimplementować uproszczoną wersję (Rasch model).

**4. Cost estimation accuracy**
**Gap:** Podane koszty ($200-500/mies dla 10K users) to szerokie szacunki. Faktyczne zużycie tokenów zależy od faktycznego usage pattern.
**Handle:** Phase 0: setup detailed token tracking od pierwszych testów. Zbieraj real data do refinement cost model. Buffer 2x w budżecie na nieprzewidziane.

**5. Mobile UX dla chat + note-taking**
**Gap:** Chatbot + notatki na mobile screen to challenge (small screen estate). Sources nie dostarczają mobile-specific patterns.
**Handle:** Phase 7 planning: research mobile chat UX patterns (WhatsApp, Telegram dla chat; Notion, Bear dla notes). User testing na mobile early.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction)
- [Vercel AI SDK - RAG Chatbot Guide](https://ai-sdk.dev/cookbook/guides/rag-chatbot)
- [Vercel AI SDK - useChat Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
- [Supabase AI & Vectors Guide](https://supabase.com/docs/guides/ai)
- [Supabase pgvector Extension](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Supabase Auth Quickstart React](https://supabase.com/docs/guides/auth/quickstarts/react)
- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query v5 Docs](https://tanstack.com/query/v5/docs/framework/react/overview)

**Research Papers & Authoritative Institutions:**
- [Duke University: It's 2026. Why Are LLMs Still Hallucinating?](https://blogs.library.duke.edu/blog/2026/01/05/its-2026-why-are-llms-still-hallucinating/)
- [OpenAI: Why Language Models Hallucinate](https://openai.com/index/why-language-models-hallucinate/)
- [NPR: The Risks of AI in Schools](https://www.npr.org/2026/01/14/nx-s1-5674741/ai-schools-education)

### Secondary (MEDIUM confidence)

**Industry Comparisons & Best Practices:**
- [Vite vs Next.js 2025 Comparison](https://strapi.io/blog/vite-vs-nextjs-2025-developer-framework-comparison)
- [LangChain vs Vercel AI SDK Comparison](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide)
- [Tavily vs Exa vs Perplexity AI Search Comparison 2025](https://www.humai.blog/tavily-vs-exa-vs-perplexity-vs-you-com-the-complete-ai-search-api-comparison-2025/)
- [Perplexity vs Tavily for RAG 2025](https://alphacorp.ai/perplexity-search-api-vs-tavily-the-better-choice-for-rag-and-agents-in-2025/)
- [RAG Tools Comparison - Meilisearch](https://www.meilisearch.com/blog/rag-tools)
- [Embedding Models Comparison 2025](https://elephas.app/blog/best-embedding-models)
- [State Management in 2025 - Redux vs Zustand vs Jotai](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)

**EdTech Industry Sources:**
- [360Learning - AI Learning Platforms 2026](https://360learning.com/blog/ai-learning-platforms/)
- [Khan Academy Khanmigo AI Tutor](https://www.khanmigo.ai/)
- [Disco - AI-Powered Personalized Learning 2026](https://www.disco.co/blog/ai-powered-personalized-learning-platform)
- [Absorb LMS - Top AI Learning Platforms 2026](https://www.absorblms.com/blog/top-ai-learning-platforms)
- [Docebo - AI Learning Platforms 2026](https://www.docebo.com/learning-network/blog/ai-learning-platforms/)
- [eSchool News - 49 EdTech Predictions 2026](https://www.eschoolnews.com/innovative-teaching/2026/01/01/draft-2026-predictions/)

**Cost & Scaling:**
- [LLM Cost Optimization: Stop Overpaying 5-10x in 2026](https://byteiota.com/llm-cost-optimization-stop-overpaying-5-10x-in-2026/)
- [The LLM Cost Paradox](https://www.ikangai.com/the-llm-cost-paradox-how-cheaper-ai-models-are-breaking-budgets/)
- [Token Burnout: Why AI Costs Are Climbing](https://labs.adaline.ai/p/token-burnout-why-ai-costs-are-climbing)

**Architecture & RAG:**
- [23 RAG Pitfalls and How to Fix Them](https://www.nb-data.com/p/23-rag-pitfalls-and-how-to-fix-them)
- [Real-Time RAG: Streaming Vector Embeddings](https://www.striim.com/blog/real-time-rag-streaming-vector-embeddings-and-low-latency-ai-search/)
- [AI Platform Architecture Guide - Medium](https://medium.com/@mastercloudarchitect/building-next-gen-ai-platforms-a-complete-architecture-guide-part-1-e813c83d11be)
- [LLM Orchestration Frameworks 2026](https://research.aimultiple.com/llm-orchestration/)
- [Multi-Agent Multi-LLM Architecture Guide](https://collabnix.com/multi-agent-multi-llm-systems-the-future-of-ai-architecture-complete-guide-2025/)

**UX & Pedagogy:**
- [10 Critical Challenges of AI in Education](https://www.ainvasion.com/10-critical-challenges-of-ai-in-education/)
- [Negative Effects of AI in Education](https://www.velvetech.com/blog/ai-in-education-risks-and-concerns/)
- [LMS User Experience: Importance & Factors](https://www.docebo.com/learning-network/blog/lms-user-experience/)
- [How to Fact-Check AI Content Like a Pro](https://www.articulate.com/blog/how-to-fact-check-ai-content-like-a-pro/)

### Tertiary (LOW confidence, needs validation)

- [shadcn-chatbot-kit](https://github.com/Blazity/shadcn-chatbot-kit) — GitHub repo, może być nieaktualny
- [react-quiz-component](https://www.npmjs.com/package/react-quiz-component) — stary package, wątpliwa jakość
- [E-learning Database Schema - GeeksforGeeks](https://www.geeksforgeeks.org/sql/how-to-design-a-database-for-online-learning-platform/) — ogólny tutorial, nie specyficzny dla AI platforms
- [EdTech Trends 2025-2030](https://emerline.com/blog/edtech-trends) — single blog post
- [Airmeet - L&D Mistakes 2026](https://www.airmeet.com/hub/blog/learning-and-development-mistakes-to-avoid-in-2026-dos-donts-checklist/) — marketing content

---

**Research completed:** 2026-01-30
**Ready for roadmap:** YES

**Next steps:**
1. Orchestrator powinien użyć tego SUMMARY.md jako kontekstu dla gsd-roadmapper
2. gsd-roadmapper stworzy szczegółowy ROADMAP.md z user stories
3. Phases 2, 3, 6 prawdopodobnie będą wymagały /gsd:research-phase dla prompt engineering
