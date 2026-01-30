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

- [ ] **PROG-01**: User can input learning topic or goal (text input)
- [ ] **PROG-02**: AI asks clarifying questions (goals, experience, available time)
- [ ] **PROG-03**: AI generates personalized curriculum with 5 levels (Poczatkujacy -> Srednio zaawansowany -> Zaawansowany -> Master -> Guru)
- [ ] **PROG-04**: Each level contains structured chapters/sections
- [ ] **PROG-05**: User can view full curriculum structure (table of contents)
- [ ] **PROG-06**: User progress is saved and persists
- [ ] **PROG-07**: User can have multiple courses in parallel (switch between topics)
- [ ] **PROG-08**: Each level shows learning outcomes checklist ("After completing this level you will be able to...")
- [ ] **PROG-09**: AI analyzes official curricula (schools, universities, certifications) and aligns generated program with market/education standards

### Learning Materials

- [ ] **MAT-01**: AI generates textbook-like content for each section
- [ ] **MAT-02**: Materials include links to external resources (docs, courses, articles)
- [ ] **MAT-03**: Materials include practical tool links with URLs
- [ ] **MAT-04**: Materials include step-by-step installation instructions
- [ ] **MAT-05**: Materials include example commands with explanations
- [ ] **MAT-06**: Materials include expected results and how to interpret them
- [ ] **MAT-07**: Content is verifiable with citations/sources (anti-hallucination)
- [ ] **MAT-08**: AI translates English source materials to Polish when needed

### Assessment System

- [ ] **QUIZ-01**: Short quizzes after sections to check understanding
- [ ] **QUIZ-02**: End-of-level test for each of 5 levels
- [ ] **QUIZ-03**: User must pass test to unlock next level (default path)
- [ ] **QUIZ-04**: User can manually skip level (for advanced users)
- [ ] **QUIZ-05**: Wrong answers trigger additional remediation materials
- [ ] **QUIZ-06**: User can retry test after reviewing remediation
- [ ] **QUIZ-07**: Feedback on answers (why correct/incorrect)

### Mentor Chatbot

- [ ] **CHAT-01**: User can ask questions about learning topic
- [ ] **CHAT-02**: Chatbot uses Socratic method (guides, doesn't give direct answers)
- [ ] **CHAT-03**: Chatbot has access to user's notes (RAG)
- [ ] **CHAT-04**: Chatbot provides support and motivation (coach role)
- [ ] **CHAT-05**: Chatbot can answer advanced questions (not limited to current level)
- [ ] **CHAT-06**: Responses are streamed in real-time

### Notes System

- [ ] **NOTE-01**: User can create notes while learning
- [ ] **NOTE-02**: User can view and browse saved notes
- [ ] **NOTE-03**: Notes are linked to specific lesson/section context
- [ ] **NOTE-04**: Notes are searchable
- [ ] **NOTE-05**: Notes are embedded in vector DB for chatbot RAG

### Current Knowledge

- [ ] **KNOW-01**: AI uses real-time web search for current information
- [ ] **KNOW-02**: User can provide link -> AI creates learning material from it
- [ ] **KNOW-03**: Knowledge base refreshes daily for dynamic domains (AI, tech, law)
- [ ] **KNOW-04**: Sources are cited in generated content

### User Experience

- [x] **UX-01**: Clean, intuitive interface inspired by NotebookLM
- [ ] **UX-02**: Responsive design (works on mobile)
- [ ] **UX-03**: Progress indicators (how far through level/course)
- [ ] **UX-04**: Navigation between sections/levels
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
| PROG-01 | Phase 2 | Pending |
| PROG-02 | Phase 2 | Pending |
| PROG-03 | Phase 2 | Pending |
| PROG-04 | Phase 2 | Pending |
| PROG-05 | Phase 2 | Pending |
| PROG-06 | Phase 2 | Pending |
| PROG-07 | Phase 2 | Pending |
| PROG-08 | Phase 2 | Pending |
| PROG-09 | Phase 2 | Pending |
| MAT-01 | Phase 3 | Pending |
| MAT-02 | Phase 3 | Pending |
| MAT-03 | Phase 3 | Pending |
| MAT-04 | Phase 3 | Pending |
| MAT-05 | Phase 3 | Pending |
| MAT-06 | Phase 3 | Pending |
| MAT-07 | Phase 3 | Pending |
| MAT-08 | Phase 3 | Pending |
| QUIZ-01 | Phase 4 | Pending |
| QUIZ-02 | Phase 4 | Pending |
| QUIZ-03 | Phase 4 | Pending |
| QUIZ-04 | Phase 4 | Pending |
| QUIZ-05 | Phase 4 | Pending |
| QUIZ-06 | Phase 4 | Pending |
| QUIZ-07 | Phase 4 | Pending |
| NOTE-01 | Phase 5 | Pending |
| NOTE-02 | Phase 5 | Pending |
| NOTE-03 | Phase 5 | Pending |
| NOTE-04 | Phase 5 | Pending |
| NOTE-05 | Phase 5 | Pending |
| CHAT-01 | Phase 6 | Pending |
| CHAT-02 | Phase 6 | Pending |
| CHAT-03 | Phase 6 | Pending |
| CHAT-04 | Phase 6 | Pending |
| CHAT-05 | Phase 6 | Pending |
| CHAT-06 | Phase 6 | Pending |
| KNOW-01 | Phase 2 | Pending |
| KNOW-02 | Phase 2 | Pending |
| KNOW-03 | Phase 7 | Pending |
| KNOW-04 | Phase 3 | Pending |
| UX-01 | Phase 1 | Complete |
| UX-02 | Phase 7 | Pending |
| UX-03 | Phase 2 | Pending |
| UX-04 | Phase 2 | Pending |
| UX-05 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2025-01-30*
*Last updated: 2025-01-30 after roadmap creation*
