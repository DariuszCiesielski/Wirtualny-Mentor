# Requirements: Wirtualny Mentor

**Defined:** 2025-01-30
**Core Value:** Kazdy moze nauczyc sie czegokolwiek dzieki spersonalizowanemu, aktualnemu programowi nauczania z praktycznymi instrukcjami krok po kroku.

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
- [x] **PROG-03**: AI generates personalized curriculum with 5 levels (Poczatkujacy -> Srednio zaawansowany -> Zaawansowany -> Master -> Guru)
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

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Gamification

- **GAM-01**: Achievement badges for completing levels
- **GAM-02**: Streak tracking for daily learning
- **GAM-03**: Leaderboards (optional, opt-in)

### Social

- **SOC-01**: Share progress on social media
- **SOC-02**: Public profile with completed courses

### Export

- **EXP-01**: Export notes as PDF
- **EXP-02**: Export curriculum as document
- **EXP-03**: Print-friendly view

### Advanced AI

- **ADV-01**: Voice interaction with mentor
- **ADV-02**: AI-generated audio summaries (podcast-style)
- **ADV-03**: Spaced repetition flashcards (auto-generated)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Native mobile app | Web-first, mobile responsive sufficient for v1 |
| Official certificates/diplomas | Requires certification authority, legal complexity |
| Community forum | Adds moderation burden, focus on 1:1 AI mentoring |
| Payment/subscriptions | Ship working product first, monetize later |
| Multi-language content | Start with Polish, add languages in v2 |
| Video content generation | High complexity, text+links sufficient for v1 |
| Real-time collaboration | Solo learning experience for v1 |
| Offline mode | Requires AI, always needs internet |

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

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2025-01-30*
*Last updated: 2026-01-31 - Phase 6 complete (CHAT-01 through CHAT-06)*
