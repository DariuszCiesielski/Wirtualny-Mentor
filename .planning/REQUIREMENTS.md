# Requirements: Wirtualny Mentor

**Defined:** 2025-01-30
**Core Value:** Każdy może nauczyć się czegokolwiek dzięki spersonalizowanemu, aktualnemu programowi nauczania z praktycznymi instrukcjami krok po kroku.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Account

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can log in and session persists across browser refresh
- [x] **AUTH-03**: User can reset password via email link
- [x] **AUTH-04**: User can view and edit profile (name, avatar)

### Learning Program

- [x] **PROG-01**: User can input learning topic or goal (text input)
- [x] **PROG-02**: AI asks clarifying questions (goals, experience, available time)
- [x] **PROG-03**: AI generates personalized curriculum with 5 levels (Początkujący -> Średnio zaawansowany -> Zaawansowany -> Master -> Guru)
- [x] **PROG-04**: Each level contains structured chapters/sections
- [x] **PROG-05**: User can view full curriculum structure (table of contents)
- [x] **PROG-06**: User progress is saved and persists
- [x] **PROG-07**: User can have multiple courses in parallel (switch between topics)
- [x] **PROG-08**: Each level shows learning outcomes checklist ("After completing this level you will be able to...")
- [x] **PROG-09**: AI analyzes official curricula (schools, universities, certifications) and aligns generated program with market/education standards

### Learning Materials

- [x] **MAT-01**: AI generates textbook-like content for each section
- [x] **MAT-02**: Materials include links to external resources (docs, courses, articles)
- [x] **MAT-03**: Materials include practical tool links with URLs
- [x] **MAT-04**: Materials include step-by-step installation instructions
- [x] **MAT-05**: Materials include example commands with explanations
- [x] **MAT-06**: Materials include expected results and how to interpret them
- [x] **MAT-07**: Content is verifiable with citations/sources (anti-hallucination)
- [x] **MAT-08**: AI translates English source materials to Polish when needed

### Assessment System

- [x] **QUIZ-01**: Short quizzes after sections to check understanding
- [x] **QUIZ-02**: End-of-level test for each of 5 levels
- [x] **QUIZ-03**: User must pass test to unlock next level (default path)
- [x] **QUIZ-04**: User can manually skip level (for advanced users)
- [x] **QUIZ-05**: Wrong answers trigger additional remediation materials
- [x] **QUIZ-06**: User can retry test after reviewing remediation
- [x] **QUIZ-07**: Feedback on answers (why correct/incorrect)

### Mentor Chatbot

- [x] **CHAT-01**: User can ask questions about learning topic
- [x] **CHAT-02**: Chatbot uses Socratic method (guides, doesn't give direct answers)
- [x] **CHAT-03**: Chatbot has access to user's notes (RAG)
- [x] **CHAT-04**: Chatbot provides support and motivation (coach role)
- [x] **CHAT-05**: Chatbot can answer advanced questions (not limited to current level)
- [x] **CHAT-06**: Responses are streamed in real-time

### Notes System

- [x] **NOTE-01**: User can create notes while learning
- [x] **NOTE-02**: User can view and browse saved notes
- [x] **NOTE-03**: Notes are linked to specific lesson/section context
- [x] **NOTE-04**: Notes are searchable
- [x] **NOTE-05**: Notes are embedded in vector DB for chatbot RAG

### Current Knowledge

- [x] **KNOW-01**: AI uses real-time web search for current information
- [x] **KNOW-02**: User can provide link -> AI creates learning material from it
- [ ] **KNOW-03**: Knowledge base refreshes daily for dynamic domains (AI, tech, law)
- [x] **KNOW-04**: Sources are cited in generated content

### User Experience

- [x] **UX-01**: Clean, intuitive interface inspired by NotebookLM
- [ ] **UX-02**: Responsive design (works on mobile)
- [x] **UX-03**: Progress indicators (how far through level/course)
- [x] **UX-04**: Navigation between sections/levels
- [x] **UX-05**: Dark mode support

## v2.0 Requirements — Business Enablement

Requirements for milestone v2.0. Each maps to roadmap phases (starting from Phase 8).

### Business Onboarding

- [x] **ONB-01**: Użytkownik może wypełnić formularz profilu biznesowego (branża, rola, cel, wielkość firmy)
- [x] **ONB-02**: Użytkownik może opcjonalnie doprecyzować profil w krótkim chacie z AI (2-3 pytania)
- [x] **ONB-03**: AI generuje podsumowanie profilu (experience_summary) z odpowiedzi chatu
- [x] **ONB-04**: Dashboard wyświetla banner zachęcający do uzupełnienia profilu (dopóki onboarding nie ukończony)
- [x] **ONB-05**: Użytkownik może edytować profil biznesowy ze strony /profile
- [x] **ONB-06**: Profil biznesowy wpływa na generowanie kursów (wstrzyknięcie kontekstu do ClarifyingChat)

### Business Suggestions

- [x] **SUG-01**: Użytkownik może wygenerować sugestię biznesową na żądanie (przycisk przy lekcji)
- [x] **SUG-02**: AI analizuje treść lekcji + profil biznesowy i generuje 0-1 sugestii (structured output)
- [x] **SUG-03**: Sugestie bez profilu biznesowego działają (ogólne, mniej spersonalizowane)
- [x] **SUG-04**: Sugestie są cache'owane w DB (brak ponownych wywołań AI dla tej samej lekcji)
- [x] **SUG-05**: Użytkownik może zapisać (bookmark) lub odrzucić (dismiss) sugestie
- [x] **SUG-06**: Rate limit: max 5 generowań sugestii dziennie (free tier)
- [x] **SUG-07**: Sugestia wyświetla się inline przy odpowiedniej sekcji lekcji (fuzzy heading match)
- [x] **SUG-08**: Input hash + profile version zapewniają idempotencję i invalidację cache
- [x] **SUG-09**: Przełączalny wariant wyświetlania inline: compact (A) / hint (C)

### Business Ideas Page

- [x] **IDEAS-01**: Zbiorcza strona pomysłów biznesowych w sidebarze (/business-ideas)
- [x] **IDEAS-02**: Filtrowanie pomysłów po kursie
- [x] **IDEAS-03**: Widok pełnej karty pomysłu (tytuł, opis, potencjał, złożoność)

### Lead Generation

- [x] **LEAD-01**: Warunkowe CTA kontaktowe (pojawia się po bookmarku lub powrocie do pomysłu)
- [x] **LEAD-02**: Dane kontaktowe ze zmiennych środowiskowych (CONTACT_EMAIL, CONTACT_PHONE, CONTACT_FORM_URL)
- [x] **LEAD-03**: Disclaimer "charakter inspiracyjny, nie rekomendacja biznesowa"

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Subscription & Billing

- **BILL-01**: Free tier: max 3 kursy/miesiąc
- **BILL-02**: Płatny plan z wyższymi limitami
- **BILL-03**: Integracja płatności (Stripe)

### User API Keys

- **KEY-01**: Użytkownik może podłączyć własny klucz Anthropic (Claude)
- **KEY-02**: Claude poprawia jakość kursów i sugestii
- **KEY-03**: Szyfrowanie kluczy w DB (AES + ENV)

### White-Label

- **WL-01**: Dane kontaktowe w tabeli DB (platform_contact_settings)
- **WL-02**: Multi-tenant support

### Analytics

- **ANAL-01**: Tracking interakcji z sugestiami (viewed/bookmarked/contact_clicked)
- **ANAL-02**: Telemetria onboardingu (completion rate, skip rate)
- **ANAL-03**: A/B test wariantów inline (compact vs hint)

### Previously Deferred (v1 era)

- **GAM-01**: Achievement badges for completing levels (DONE — shipped post-v1)
- **GAM-02**: Streak tracking for daily learning (DONE — shipped post-v1)
- **SOC-01**: Share progress on social media
- **SOC-02**: Public profile with completed courses
- **EXP-01**: Export notes as PDF
- **EXP-02**: Export curriculum as document
- **ADV-01**: Voice interaction with mentor
- **ADV-02**: AI-generated audio summaries (podcast-style)
- **ADV-03**: Spaced repetition flashcards (auto-generated)

## Out of Scope (v2.0)

| Feature | Reason |
|---------|--------|
| Native mobile app | Web-first, mobile responsive sufficient |
| Official certificates/diplomas | Requires certification authority, legal complexity |
| Community forum | Adds moderation burden, focus on 1:1 AI mentoring |
| Payment/subscriptions | Separate milestone (after v2.0 validation) |
| Multi-language content | Start with Polish |
| Video content generation | High complexity, text+links sufficient |
| User API keys (Anthropic) | Separate milestone (security complexity) |
| White-label platform | Separate milestone (multi-tenant complexity) |
| Analytics/telemetry | Separate milestone (need user base first) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| PROG-01 | Phase 2 | Complete |
| PROG-02 | Phase 2 | Complete |
| PROG-03 | Phase 2 | Complete |
| PROG-04 | Phase 2 | Complete |
| PROG-05 | Phase 2 | Complete |
| PROG-06 | Phase 2 | Complete |
| PROG-07 | Phase 2 | Complete |
| PROG-08 | Phase 2 | Complete |
| PROG-09 | Phase 2 | Complete |
| MAT-01 | Phase 3 | Complete |
| MAT-02 | Phase 3 | Complete |
| MAT-03 | Phase 3 | Complete |
| MAT-04 | Phase 3 | Complete |
| MAT-05 | Phase 3 | Complete |
| MAT-06 | Phase 3 | Complete |
| MAT-07 | Phase 3 | Complete |
| MAT-08 | Phase 3 | Complete |
| QUIZ-01 | Phase 4 | Complete |
| QUIZ-02 | Phase 4 | Complete |
| QUIZ-03 | Phase 4 | Complete |
| QUIZ-04 | Phase 4 | Complete |
| QUIZ-05 | Phase 4 | Complete |
| QUIZ-06 | Phase 4 | Complete |
| QUIZ-07 | Phase 4 | Complete |
| NOTE-01 | Phase 5 | Complete |
| NOTE-02 | Phase 5 | Complete |
| NOTE-03 | Phase 5 | Complete |
| NOTE-04 | Phase 5 | Complete |
| NOTE-05 | Phase 5 | Complete |
| CHAT-01 | Phase 6 | Complete |
| CHAT-02 | Phase 6 | Complete |
| CHAT-03 | Phase 6 | Complete |
| CHAT-04 | Phase 6 | Complete |
| CHAT-05 | Phase 6 | Complete |
| CHAT-06 | Phase 6 | Complete |
| KNOW-01 | Phase 2 | Complete |
| KNOW-02 | Phase 2 | Complete |
| KNOW-03 | Phase 7 | Pending |
| KNOW-04 | Phase 3 | Complete |
| UX-01 | Phase 1 | Complete |
| UX-02 | Phase 7 | Pending |
| UX-03 | Phase 2 | Complete |
| UX-04 | Phase 2 | Complete |
| UX-05 | Phase 1 | Complete |
| ONB-01 | Phase 8 | Complete |
| ONB-02 | Phase 8 | Complete |
| ONB-03 | Phase 8 | Complete |
| ONB-04 | Phase 8 | Complete |
| ONB-05 | Phase 8 | Complete |
| ONB-06 | Phase 8 | Complete |
| SUG-01 | Phase 9 | Complete |
| SUG-02 | Phase 9 | Complete |
| SUG-03 | Phase 9 | Complete |
| SUG-04 | Phase 9 | Complete |
| SUG-05 | Phase 9 | Complete |
| SUG-06 | Phase 9 | Complete |
| SUG-07 | Phase 9 | Complete |
| SUG-08 | Phase 9 | Complete |
| SUG-09 | Phase 9 | Complete |
| IDEAS-01 | Phase 10 | Complete |
| IDEAS-02 | Phase 10 | Complete |
| IDEAS-03 | Phase 10 | Complete |
| LEAD-01 | Phase 10 | Complete |
| LEAD-02 | Phase 10 | Complete |
| LEAD-03 | Phase 10 | Complete |

**v1 Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

**v2.0 Coverage:**
- v2.0 requirements: 21 total (ONB: 6, SUG: 9, IDEAS: 3, LEAD: 3)
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2025-01-30*
*v2.0 requirements added: 2026-03-08*
*Last updated: 2026-03-08 — ONB-01..06 complete (phase 8)*
