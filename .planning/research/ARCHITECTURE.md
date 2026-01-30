# Architecture Patterns

**Domain:** AI-powered personalized learning platform
**Researched:** 2026-01-30
**Confidence:** MEDIUM-HIGH (verified with official docs and multiple sources)

## Recommended Architecture

```
+------------------------------------------------------------------+
|                        FRONTEND (React + Vite)                    |
|  +------------------+  +------------------+  +------------------+ |
|  |   Auth Module    |  |  Learning UI     |  |   Chat Module    | |
|  | (Supabase Auth)  |  | (Course/Quiz)    |  |  (Mentor Bot)    | |
|  +------------------+  +------------------+  +------------------+ |
|           |                    |                    |             |
|           v                    v                    v             |
|  +----------------------------------------------------------+    |
|  |                    State Management (Zustand)             |    |
|  +----------------------------------------------------------+    |
|           |                    |                    |             |
+-----------|--------------------|--------------------|-------------+
            |                    |                    |
            v                    v                    v
+------------------------------------------------------------------+
|                    API LAYER (Edge Functions / API Routes)        |
|  +------------------+  +------------------+  +------------------+ |
|  |  Auth Handlers   |  | Content Gen API  |  |   Chat API       | |
|  +------------------+  +------------------+  +------------------+ |
|                                |                    |             |
|                    +-----------+--------------------+             |
|                    v                                              |
|  +----------------------------------------------------------+    |
|  |              AI Orchestration Layer                       |    |
|  |  +-------------+  +-------------+  +-------------+        |    |
|  |  | LLM Router  |  | RAG Engine  |  | Web Search  |        |    |
|  |  +-------------+  +-------------+  +-------------+        |    |
|  +----------------------------------------------------------+    |
+------------------------------------------------------------------+
            |                    |                    |
            v                    v                    v
+------------------------------------------------------------------+
|                         DATA LAYER                                |
|  +------------------+  +------------------+  +------------------+ |
|  |    Supabase      |  |  Vector Store    |  | External APIs    | |
|  |    (Postgres)    |  |  (pgvector)      |  | (Tavily/LLMs)    | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Auth Module** | Rejestracja, logowanie, sesje, profil | Supabase Auth, State Management |
| **Learning UI** | Wyswietlanie kursow, materialow, quizow | Content Gen API, State, Supabase |
| **Chat Module** | Interfejs chatbota mentora | Chat API, State Management |
| **State Management** | Globalny stan aplikacji, cache | Wszystkie moduly frontend |
| **Content Gen API** | Generowanie programow nauki, materialow | AI Orchestration, Supabase |
| **Chat API** | Obsluga konwersacji, streaming | AI Orchestration, Vector Store |
| **AI Orchestration** | Routing do modeli, RAG, web search | LLM APIs, Tavily, Vector Store |
| **Supabase** | Dane uzytkownikow, postep, notatki, kursy | Wszystkie API |
| **Vector Store** | Embeddingi notatek, wiedzy uzytkownika | RAG Engine, Supabase (pgvector) |

### Data Flow

**1. Tworzenie programu nauki:**
```
User Input (temat)
    -> Content Gen API
    -> AI Orchestration (model wybor + web search dla aktualnosci)
    -> LLM generuje program
    -> Zapis do Supabase (kursy, rozdzialy, materialy)
    -> UI renderuje program
```

**2. Chatbot mentor z RAG:**
```
User Message
    -> Chat API (streaming via Vercel AI SDK)
    -> AI Orchestration:
        1. Embed query
        2. findRelevantContent() z notatek usera (pgvector)
        3. Opcjonalnie: web search (Tavily) dla aktualnych info
        4. Kontekst + query -> LLM
    -> Streaming response -> UI
```

**3. Quiz adaptacyjny:**
```
User rozpoczyna quiz
    -> API pobiera pytania z Supabase
    -> User odpowiada
    -> API ocenia + zapisuje wynik
    -> Jesli bledna odpowiedz:
        -> AI generuje dodatkowe wyjasnienie
        -> Aktualizacja poziomu trudnosci (adaptive)
    -> Progress update w Supabase
```

**4. Notatki z dostepem dla chatbota:**
```
User tworzy notatke
    -> Zapis do Supabase (notes table)
    -> generateEmbeddings() -> Vector Store (pgvector)
    -> Notatka dostepna dla RAG w chatbocie
```

## Patterns to Follow

### Pattern 1: Layered AI Orchestration
**What:** Oddzielenie logiki routingu modeli od logiki aplikacji
**When:** Gdy uzywasz wielu modeli AI do roznych zadan
**Why:** Pozwala na latwa zmiane modeli, optymalizacje kosztow, fallbacki

```typescript
// services/ai/orchestrator.ts
interface AIOrchestrator {
  generateCurriculum(topic: string, context: UserContext): Promise<Curriculum>;
  generateQuiz(chapter: Chapter): Promise<Quiz>;
  chat(messages: Message[], userContext: RAGContext): AsyncIterable<string>;
}

// Wewnetrznie routuje do odpowiednich modeli
const modelConfig = {
  curriculum: 'gpt-4o',      // Strukturalne generowanie
  quiz: 'gemini-2.0-flash',  // Szybkie, tanie
  chat: 'claude-sonnet',     // Konwersacje, mentoring
};
```

### Pattern 2: RAG z notatkami uzytkownika (pgvector)
**What:** Wykorzystanie pgvector w Supabase jako vector store
**When:** Chatbot potrzebuje dostepu do notatek/wiedzy uzytkownika
**Why:** Brak dodatkowej infrastruktury - pgvector jest czescia Supabase

```typescript
// Embedding i zapis notatki
async function saveNoteWithEmbedding(userId: string, content: string) {
  const chunks = generateChunks(content);
  const embeddings = await embedMany(chunks, 'text-embedding-3-small');

  await supabase.from('note_embeddings').insert(
    chunks.map((chunk, i) => ({
      user_id: userId,
      content: chunk,
      embedding: embeddings[i],
    }))
  );
}

// Retrieval dla chatbota
async function findRelevantNotes(userId: string, query: string) {
  const queryEmbedding = await embed(query);

  const { data } = await supabase.rpc('match_notes', {
    query_embedding: queryEmbedding,
    user_id: userId,
    match_threshold: 0.5,
    match_count: 5,
  });

  return data;
}
```

### Pattern 3: Streaming Chat z Vercel AI SDK
**What:** useChat hook + streamText dla real-time odpowiedzi
**When:** Chatbot mentor, dluzsze odpowiedzi AI
**Why:** Lepsza UX, natychmiastowa informacja zwrotna

```typescript
// Frontend: components/MentorChat.tsx
import { useChat } from '@ai-sdk/react';

function MentorChat() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: '/api/chat',
  });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>{m.role}: {m.content}</div>
      ))}
      {status === 'streaming' && <LoadingIndicator />}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  );
}

// Backend: api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const relevantNotes = await findRelevantNotes(userId, lastMessage);

  const result = streamText({
    model: openai('gpt-4o'),
    system: `Jestes mentorem. Oto notatki uzytkownika: ${relevantNotes}`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

### Pattern 4: Service Layer dla Supabase
**What:** Abstrakcja dostepu do bazy przez dedykowane serwisy
**When:** Zawsze - nie wywoluj Supabase bezposrednio z komponentow UI
**Why:** Testowalnosc, czytelnosc, latwa zmiana implementacji

```typescript
// services/courses.ts
export const courseService = {
  async getByUser(userId: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*, chapters(*), progress(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },

  async updateProgress(courseId: string, chapterId: string, progress: number) {
    // ...
  }
};

// Uzycie w komponencie przez hook
// hooks/useCourses.ts
export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getByUser(currentUserId),
  });
}
```

### Pattern 5: Web Search dla aktualnej wiedzy
**What:** Integracja Tavily API dla real-time informacji
**When:** Tematy dynamiczne (programowanie, prawo, technologie)
**Why:** LLM ma stala wiedze - web search dostarcza aktualne dane

```typescript
// services/ai/webSearch.ts
import { tavily } from '@tavily/core';

export async function searchCurrentInfo(query: string): Promise<SearchResult[]> {
  const response = await tavily.search({
    query,
    searchDepth: 'advanced',
    includeAnswer: true,
    maxResults: 5,
  });

  return response.results.map(r => ({
    title: r.title,
    content: r.content,
    url: r.url,
    relevanceScore: r.score,
  }));
}

// Uzycie w generowaniu materialow
async function generateChapterContent(chapter: Chapter) {
  // Pobierz aktualne info jesli temat dynamiczny
  const currentInfo = chapter.requiresCurrentInfo
    ? await searchCurrentInfo(chapter.topic)
    : [];

  return await orchestrator.generateContent(chapter, currentInfo);
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Bezposredni dostep do Supabase z UI
**What:** Wywolywanie `supabase.from()` bezposrednio w komponentach React
**Why bad:** Tight coupling, trudne testowanie, rozprosziona logika
**Instead:** Uzyj service layer + custom hooks

```typescript
// ZLE
function CourseList() {
  useEffect(() => {
    supabase.from('courses').select('*').then(/* ... */);
  }, []);
}

// DOBRZE
function CourseList() {
  const { data: courses } = useCourses(); // hook uzywa service
}
```

### Anti-Pattern 2: Jeden mega-endpoint dla AI
**What:** `/api/ai` ktory obsluguje wszystko
**Why bad:** Trudne skalowanie, brak izolacji bledow, nieczytelny kod
**Instead:** Oddzielne endpointy per funkcjonalnosc

```typescript
// ZLE
// /api/ai/route.ts - 500 linii obslugi wszystkiego

// DOBRZE
// /api/chat/route.ts - streaming chat
// /api/generate-curriculum/route.ts - generowanie programu
// /api/generate-quiz/route.ts - generowanie quizow
```

### Anti-Pattern 3: Synchroniczne generowanie duzych tresci
**What:** Czekanie az caly program nauki/material sie wygeneruje
**Why bad:** Timeout (Vercel 10s dla hobby), zla UX
**Instead:** Streaming lub task queue

```typescript
// ZLE - timeout po 10s
const curriculum = await generateFullCurriculum(topic); // moze trwac minuty

// DOBRZE - streaming
const stream = await streamCurriculum(topic);
for await (const chapter of stream) {
  yield chapter; // frontend renderuje inkrementalnie
}

// LUB - background job
const jobId = await queueCurriculumGeneration(topic);
// Frontend polluje status lub uzywa realtime subscription
```

### Anti-Pattern 4: Embeddingi w pamieci
**What:** Trzymanie embeddingów w tablicy JS zamiast vector DB
**Why bad:** Nie skaluje sie, znika po restarcie, wolne similarity search
**Instead:** pgvector w Supabase

```typescript
// ZLE
const embeddings: Map<string, number[]> = new Map();

// DOBRZE - pgvector
// SQL w Supabase:
// CREATE EXTENSION vector;
// CREATE TABLE note_embeddings (
//   id uuid PRIMARY KEY,
//   embedding vector(1536),
//   ...
// );
```

### Anti-Pattern 5: Brak cache'owania odpowiedzi AI
**What:** Generowanie tych samych tresci wielokrotnie
**Why bad:** Kosztowne, wolne, niepotrzebne zuzycie API
**Instead:** Cache w Supabase lub Redis

```typescript
// DOBRZE - cache materialow
async function getOrGenerateChapterContent(chapterId: string) {
  // Sprawdz cache
  const cached = await supabase
    .from('chapter_content')
    .select('content')
    .eq('id', chapterId)
    .single();

  if (cached.data) return cached.data.content;

  // Generuj i zapisz
  const content = await generateChapterContent(chapterId);
  await supabase.from('chapter_content').insert({ id: chapterId, content });

  return content;
}
```

## Database Schema Overview

```sql
-- Users (managed by Supabase Auth, extended)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  display_name TEXT,
  learning_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses (wygenerowane programy nauki)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  initial_query TEXT, -- co user wpisal
  status TEXT DEFAULT 'generating', -- generating, ready, archived
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters (rozdzialy kursu z 5 poziomami)
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses ON DELETE CASCADE,
  title TEXT NOT NULL,
  level INTEGER CHECK (level BETWEEN 1 AND 5), -- 1=Poczatkujacy, 5=Guru
  order_index INTEGER,
  content TEXT, -- wygenerowany material
  external_links JSONB, -- linki do zasobow
  status TEXT DEFAULT 'pending' -- pending, generating, ready
);

-- User Progress
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  course_id UUID REFERENCES courses ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  quiz_score INTEGER,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, chapter_id)
);

-- Quizzes
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters ON DELETE CASCADE,
  questions JSONB NOT NULL, -- [{question, options, correct, explanation}]
  passing_score INTEGER DEFAULT 70
);

-- Quiz Attempts
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  quiz_id UUID REFERENCES quizzes ON DELETE CASCADE,
  answers JSONB,
  score INTEGER,
  passed BOOLEAN,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Notes
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  course_id UUID REFERENCES courses,
  chapter_id UUID REFERENCES chapters,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note Embeddings (dla RAG)
CREATE TABLE note_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users NOT NULL,
  chunk_content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat History
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  course_id UUID REFERENCES courses,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_courses_user ON courses(user_id);
CREATE INDEX idx_chapters_course ON chapters(course_id);
CREATE INDEX idx_progress_user_course ON user_progress(user_id, course_id);
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_note_embeddings_user ON note_embeddings(user_id);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(1536),
  match_user_id UUID,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  chunk_content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ne.id,
    ne.chunk_content,
    1 - (ne.embedding <=> query_embedding) AS similarity
  FROM note_embeddings ne
  WHERE ne.user_id = match_user_id
    AND 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **AI API costs** | $50-100/mies | Tiered models, cache agresywnie | Dedykowane limity, queue system |
| **Database** | Supabase Free/Pro | Supabase Pro, Read replicas | Custom Postgres, sharding |
| **Vector search** | pgvector wystarczy | pgvector z indexem HNSW | Pinecone/Weaviate dedicated |
| **Streaming** | Vercel Edge ok | Vercel Edge ok | Dedicated streaming infra |
| **Background jobs** | Brak potrzeby | Inngest/Trigger.dev | Dedicated queue (BullMQ) |

## Build Order (Dependencies)

Kolejnosc budowania oparta na zaleznosach technicznych:

### Phase 1: Foundation (brak zaleznosci)
1. **Supabase setup** - baza, auth, RLS
2. **React app skeleton** - Vite, routing, basic layout
3. **Service layer boilerplate** - struktura folderow, typy

### Phase 2: Auth & User (wymaga Phase 1)
4. **Auth flow** - rejestracja, logowanie, sesja
5. **User profile** - preferencje nauki
6. **Protected routes** - middleware auth

### Phase 3: AI Core (wymaga Phase 1)
7. **AI Orchestrator setup** - konfiguracja modeli, routing
8. **Web search integration** - Tavily API
9. **Streaming infrastructure** - Vercel AI SDK config

### Phase 4: Learning Content (wymaga Phase 2 + 3)
10. **Curriculum generation** - tworzenie programow nauki
11. **Chapter content** - materialy jak w podreczniku
12. **External links** - integracja zasobow

### Phase 5: Knowledge & Chat (wymaga Phase 3 + 4)
13. **Notes system** - CRUD notatek
14. **pgvector embeddings** - RAG setup
15. **Mentor chatbot** - chat z RAG

### Phase 6: Assessment (wymaga Phase 4)
16. **Quiz generation** - AI generuje pytania
17. **Quiz taking** - interfejs, scoring
18. **Adaptive remediation** - dodatkowe materialy przy bledach
19. **Progress tracking** - dashboard postepu

### Phase 7: Polish (wymaga wszystkich)
20. **Course navigation** - plynne przejscia miedzy poziomami
21. **Knowledge refresh** - cykliczne odswiezanie dla dynamicznych tematow
22. **Mobile responsiveness** - UI optymalizacja

## Diagram zaleznosci budowania

```
Phase 1: Foundation
    |
    +---> Phase 2: Auth & User
    |         |
    |         v
    +---> Phase 3: AI Core
              |
              v
         Phase 4: Learning Content
              |
              +---> Phase 5: Knowledge & Chat
              |
              +---> Phase 6: Assessment
                         |
                         v
                    Phase 7: Polish
```

## Sources

### HIGH Confidence (Official Documentation)
- [Vercel AI SDK - RAG Chatbot Guide](https://ai-sdk.dev/cookbook/guides/rag-chatbot)
- [Vercel AI SDK - useChat Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
- [Supabase React Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-react)
- [Supabase Auth Quickstart](https://supabase.com/docs/guides/auth/quickstarts/react)

### MEDIUM Confidence (Verified Multiple Sources)
- [AI Platform Architecture Guide - Medium](https://medium.com/@mastercloudarchitect/building-next-gen-ai-platforms-a-complete-architecture-guide-part-1-e813c83d11be)
- [EdTech Microservices Architecture - IEEE](https://ieeexplore.ieee.org/document/9686535/)
- [Supabase Best Practices - Leanware](https://www.leanware.co/insights/supabase-best-practices)
- [LLM Orchestration Frameworks 2026 - AI Multiple](https://research.aimultiple.com/llm-orchestration/)
- [Tavily vs Perplexity Comparison](https://alphacorp.ai/perplexity-search-api-vs-tavily-the-better-choice-for-rag-and-agents-in-2025/)
- [RAG Tools Comparison - Meilisearch](https://www.meilisearch.com/blog/rag-tools)

### LOW Confidence (Single Source / WebSearch Only)
- [E-learning Database Schema - GeeksforGeeks](https://www.geeksforgeeks.org/sql/how-to-design-a-database-for-online-learning-platform/)
- [Adaptive Quiz Architecture - various blog posts]

---

**Key Takeaway:** Architektura opiera sie na warstwach: Frontend (React + Zustand) -> API Layer (Edge Functions) -> AI Orchestration (multi-model routing, RAG, web search) -> Data Layer (Supabase + pgvector). Kluczowe jest oddzielenie logiki AI od logiki biznesowej oraz uzycie streaming dla lepszej UX.
