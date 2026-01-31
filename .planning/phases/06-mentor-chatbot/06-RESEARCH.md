# Phase 6: Mentor Chatbot - Research

**Researched:** 2026-01-31
**Domain:** AI chat with RAG, Socratic method prompting, streaming UI
**Confidence:** HIGH

## Summary

Faza 6 implementuje chatbot-mentor ktory odpowiada na pytania uzytkownika metoda sokratyczna, z dostepem do notatek uzytkownika poprzez RAG (Retrieval Augmented Generation). Projekt ma juz kompletna infrastrukture: AI SDK z useChat hook, pgvector z funkcja `search_notes_semantic`, oraz wzorzec `DefaultChatTransport` uzyty w clarifying-chat.

Kluczowe decyzje architektoniczne:
- **Chat transport:** `DefaultChatTransport` z custom API endpoint `/api/chat/mentor`
- **RAG integration:** Tool-based retrieval - AI wywoluje tool `searchNotes` gdy potrzebuje kontekstu
- **Socratic prompting:** System prompt z konkretnymi instrukcjami: zadawaj pytania naprowadzajace, nie dawaj gotowych odpowiedzi
- **Coach persona:** Wsparcie emocjonalne i motywacja w system prompt
- **Streaming:** `streamText` + `toUIMessageStreamResponse` (istniejacy wzorzec)
- **Context management:** Opcjonalna persystencja historii chatu w bazie

**Primary recommendation:** Uzyj tool-based RAG - AI decyduje kiedy wyszukac notatki uzytkownika. System prompt laczy role: Socratic teacher + supportive coach + RAG-aware assistant.

## Standard Stack

### Core (juz w projekcie)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | ^6.0.62 | `streamText`, tools, `stopWhen` | Juz uzyty w projekcie, unified streaming |
| `@ai-sdk/react` | ^1.0.0 | `useChat` hook | Juz uzyty w clarifying-chat |
| `@ai-sdk/anthropic` | ^1.0.0 | Claude model | Claude Sonnet 4 - najlepszy dla mentoringu |

### Supporting (juz w projekcie)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | ^3.x | Tool input validation | Definicja schematu dla searchNotes tool |
| pgvector | built-in | Vector search | Juz skonfigurowany w Phase 5 |

### Chat Persistence (opcjonalne)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Supabase | existing | Chat history table | Jesli chcemy persistent chat sessions |

**Installation:**
```bash
# Brak nowych instalacji - wszystko juz jest w projekcie
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   └── ai/
│       └── mentor/
│           ├── prompts.ts          # System prompt dla mentora
│           └── tools.ts            # searchNotes tool definition
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── mentor/
│   │           └── route.ts        # Streaming chat endpoint
│   └── (dashboard)/
│       └── courses/[courseId]/
│           └── chat/
│               ├── page.tsx        # Chat page (server component)
│               └── components/
│                   └── mentor-chat.tsx  # Chat UI (client component)
└── types/
    └── chat.ts                     # Chat-related types (optional)
```

### Pattern 1: Tool-Based RAG Retrieval

**What:** AI uzywa tool `searchNotes` aby pobrac kontekst z notatek uzytkownika
**When to use:** Zawsze dla RAG chatbota - model decyduje kiedy potrzebuje kontekstu
**Example:**
```typescript
// lib/ai/mentor/tools.ts
import { tool } from 'ai';
import { z } from 'zod';
import { searchNotesSemantic } from '@/lib/dal/notes';

export const searchNotesTool = tool({
  description: `Wyszukaj w notatkach uzytkownika informacje zwiazane z pytaniem.
Uzyj tego narzedzia kiedy:
- Uzytkownik pyta o cos co mogl zapisac w notatkach
- Potrzebujesz kontekstu z wczesniejszej nauki
- Chcesz odniesc sie do notatek uzytkownika`,
  inputSchema: z.object({
    query: z.string().describe('Fraza do wyszukania w notatkach'),
  }),
  execute: async ({ query }, { userId, courseId }) => {
    const results = await searchNotesSemantic(userId, courseId, query, 0.6, 5);

    if (results.length === 0) {
      return { found: false, message: 'Brak notatek na ten temat' };
    }

    return {
      found: true,
      notes: results.map(r => ({
        content: r.content,
        similarity: r.similarity,
      })),
    };
  },
});
```

### Pattern 2: Socratic Method System Prompt

**What:** System prompt ktory nakazuje AI stosowac metode sokratyczna
**When to use:** Zawsze dla mentor chatbota - kluczowa cecha
**Example:**
```typescript
// lib/ai/mentor/prompts.ts
export const MENTOR_SYSTEM_PROMPT = `Jestes Wirtualnym Mentorem - przyjaznym, wspierajacym nauczycielem AI.

## Twoja rola
Pomagasz uzytkownikowi uczyc sie tematu kursu poprzez naprowadzajace pytania i wsparcie.

## Metoda sokratyczna - KLUCZOWE
NIGDY nie dawaj gotowych odpowiedzi. Zamiast tego:
1. Zadawaj pytania naprowadzajace
2. Pomagaj uzytkownikowi samodzielnie dojsc do rozwiazania
3. Rozbijaj zlozonne problemy na mniejsze kroki
4. Jesli uzytkownik sie myli, zadaj pytanie ktore pomoze mu dostrzec blad

Przyklady:
- Zamiast "Odpowiedz to X" -> "Co myslisz ze stanie sie jesli...?"
- Zamiast "Uzyj funkcji Y" -> "Jakie podejscie mogloby tutaj zadzialac?"
- Zamiast "Blad jest w linii 5" -> "Przeanalizujmy co robi ta czesc kodu..."

## Wsparcie i motywacja (rola coacha)
- Doceniaj postepy uzytkownika
- Normalizuj trudnosci ("To jest wyzwanie dla wielu osob")
- Zachecaj do eksperymentowania
- Swietuj male zwyciestwa

## Dostep do notatek (RAG)
Masz dostep do notatek uzytkownika przez tool searchNotes.
- Uzyj go gdy pytanie moze dotyczyc wczesniejszej nauki
- Odwoluj sie do notatek: "Widzę, że wcześniej zapisałeś..."
- Pomoz uzytkownikowi laczyc nowa wiedze z poprzednia

## Zaawansowane pytania
Mozesz odpowiadac na pytania wykraczajace poza aktualny poziom.
Jesli temat jest zaawansowany, zaznacz to i zaproponuj sciezke do zrozumienia.

## Jezyk
Odpowiadaj ZAWSZE po polsku. Uzywaj jasnego, przystepnego jezyka.`;
```

### Pattern 3: Streaming Chat Route Handler

**What:** API route z streamText i tool calling
**When to use:** Dla mentor chatbot endpoint
**Example:**
```typescript
// app/api/chat/mentor/route.ts
import { streamText, stepCountIs, UIMessage, convertToModelMessages } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { MENTOR_SYSTEM_PROMPT } from '@/lib/ai/mentor/prompts';
import { searchNotesTool } from '@/lib/ai/mentor/tools';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { messages, courseId } = await req.json();

  // Get user from session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = streamText({
    model: getModel('mentor'), // Claude Sonnet 4
    system: MENTOR_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      searchNotes: {
        ...searchNotesTool,
        execute: async (args) => {
          return searchNotesTool.execute(args, {
            userId: user.id,
            courseId
          });
        },
      },
    },
    stopWhen: stepCountIs(3), // Max 3 tool calls per turn
  });

  return result.toUIMessageStreamResponse();
}

export const runtime = 'edge';
```

### Pattern 4: Chat UI Component

**What:** Client component z useChat hook
**When to use:** Dla UI chatbota
**Example:**
```typescript
// components/mentor-chat.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useMemo, useRef, useEffect } from 'react';

interface MentorChatProps {
  courseId: string;
  courseTitle: string;
}

export function MentorChat({ courseId, courseTitle }: MentorChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: '/api/chat/mentor',
      body: { courseId },
    }),
    [courseId]
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
    initialMessages: [{
      id: 'welcome',
      role: 'assistant',
      parts: [{ type: 'text', text: `Cześć! Jestem Twoim mentorem dla kursu "${courseTitle}". O czym chcesz porozmawiać?` }],
    }],
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ... render UI
}
```

### Anti-Patterns to Avoid

- **Context injection zamiast tools:** Nie laduj wszystkich notatek do system prompt. Uzyj tool-based retrieval - AI decyduje kiedy potrzebuje kontekstu.
- **Gotowe odpowiedzi w system prompt:** System prompt musi byc bardzo jasny o metodzie sokratycznej. Bez tego AI wroci do dawania odpowiedzi.
- **Brak limitu tool calls:** Bez `stopWhen` AI moze wpasc w nieskonczona petle tool calling.
- **Synchroniczne pobieranie historii:** Nie blokuj pierwszego renderu czekaniem na historie. Zaladuj asynchronicznie lub pominc dla v1.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming chat | Manual WebSocket/SSE | `useChat` + `streamText` | Juz przetestowane w projekcie |
| RAG retrieval | Manual prompt injection | AI SDK tools | AI decyduje kiedy potrzebuje kontekstu |
| Message parsing | Manual JSON extraction | `UIMessage.parts` | Standard format w AI SDK |
| Error handling | Custom retry logic | `useChat` error state | Built-in reconnection |

**Key insight:** Projekt ma juz dzialajacy chat w clarifying-chat.tsx. Mentor chat to rozszerzenie tego wzorca o tools i nowy system prompt.

## Common Pitfalls

### Pitfall 1: AI ignoruje metode sokratyczna

**What goes wrong:** AI daje gotowe odpowiedzi zamiast naprowadzac pytaniami
**Why it happens:** System prompt jest zbyt ogolny lub AI "zapomina" o instrukcjach
**How to avoid:**
1. System prompt musi byc bardzo specyficzny z przykladami
2. Dodaj "DO NOT" sekcje: "NIGDY nie dawaj gotowej odpowiedzi"
3. Uzyj few-shot examples w prompcie
4. Testuj regularnie z roznymi pytaniami
**Warning signs:** Odpowiedzi zaczynaja sie od "Odpowiedz to...", "Musisz uzyc..."

### Pitfall 2: Tool calling nie dziala

**What goes wrong:** AI nie uzywa searchNotes tool lub uzywa go nieprawidlowo
**Why it happens:** Opis tool jest niejasny, brak kontekstu courseId/userId
**How to avoid:**
1. Jasny `description` w tool z przykladami kiedy uzywac
2. Przekaz kontekst (userId, courseId) przez closure w execute
3. Testuj z pytaniami typu "Co zapisalem o X?"
**Warning signs:** AI odpowiada "nie mam dostepu do notatek" lub nie wywoluje tool

### Pitfall 3: Streaming timeouty

**What goes wrong:** Dlugie odpowiedzi powoduja timeout
**Why it happens:** Vercel serverless ma limit 10s (free), 60s (pro)
**How to avoid:**
1. `export const runtime = 'edge'` - inny model billingowy
2. `export const maxDuration = 30` dla Node.js runtime
3. Rozważ `consumeStream()` dla persystencji mimo disconnect
**Warning signs:** 504 Gateway Timeout, przerwane odpowiedzi

### Pitfall 4: Context window overflow

**What goes wrong:** Dlugie konwersacje przekraczaja limit tokenow modelu
**Why it happens:** Historia rosnie bez limitu, notatki dodaja tokeny
**How to avoid:**
1. Limituj historie do ostatnich N wiadomosci (np. 20)
2. Ogranicz wyniki z searchNotes (max 5, truncate content)
3. Claude Sonnet 4 ma 200k context - duzo, ale monitoruj
**Warning signs:** Odpowiedzi staja sie niekoherentne, bledy "context length exceeded"

### Pitfall 5: Brak persystencji chatu

**What goes wrong:** Uzytkownik traci historie po refreshu
**Why it happens:** useChat trzyma state w pamieci
**How to avoid:**
1. v1: Akceptuj brak persystencji (chat per-session)
2. v2: Dodaj tabele `chat_messages` z RLS
3. Uzyj `initialMessages` do ladowania historii
**Warning signs:** User frustration po utracie rozmowy

## Code Examples

### Complete Tool Definition

```typescript
// lib/ai/mentor/tools.ts
import { tool } from 'ai';
import { z } from 'zod';
import { searchNotesSemantic } from '@/lib/dal/notes';

interface ToolContext {
  userId: string;
  courseId: string;
}

export function createSearchNotesTool(context: ToolContext) {
  return tool({
    description: `Wyszukaj w notatkach uzytkownika informacje zwiazane z pytaniem.
Uzyj tego narzedzia gdy:
- Uzytkownik pyta o cos co mogl zapisac w notatkach
- Potrzebujesz kontekstu z wczesniejszej nauki uzytkownika
- Chcesz odwolac sie do tego co uzytkownik juz wie

Przyklad zapytan:
- "co zapisalem o funkcjach" -> query: "funkcje"
- "moje notatki o CSS" -> query: "CSS style"`,
    inputSchema: z.object({
      query: z.string().describe('Fraza do wyszukania semantycznego w notatkach'),
    }),
    execute: async ({ query }) => {
      const results = await searchNotesSemantic(
        context.userId,
        context.courseId,
        query,
        0.5, // Lower threshold for better recall
        5
      );

      if (results.length === 0) {
        return {
          found: false,
          message: 'Uzytkownik nie ma notatek na ten temat.',
        };
      }

      return {
        found: true,
        notes: results.map((r) => ({
          content: r.content.slice(0, 500), // Truncate for context window
          relevance: Math.round(r.similarity * 100),
        })),
      };
    },
  });
}
```

### Complete System Prompt

```typescript
// lib/ai/mentor/prompts.ts
export const MENTOR_SYSTEM_PROMPT = `Jestes Wirtualnym Mentorem - przyjaznym, cierpliwym nauczycielem AI.

## KLUCZOWA ZASADA: Metoda sokratyczna
NIGDY nie dawaj gotowych odpowiedzi. ZAWSZE naprowadzaj pytaniami.

### Co robic:
- Zadawaj pytania otwarte: "Co myslisz ze sie stanie jesli...?"
- Rozbijaj problemy: "Zacznijmy od podstaw - co juz wiesz o...?"
- Pomagaj dostrzec bledy: "Hmm, a co jesli spojrzymy na to z innej strony...?"
- Doceniaj postepy: "Swietne spostrzezenie! A co dalej...?"

### Czego NIE robic:
- Nie dawaj gotowego kodu
- Nie podawaj bezposrednich odpowiedzi
- Nie rozwiazuj zadan za uzytkownika
- Nie mow "odpowiedz to X"

### Przyklady transformacji:
Uzytkownik: "Jak posortowac liste w Pythonie?"
ZLE: "Uzyj sorted() lub list.sort()"
DOBRZE: "Ciekawe pytanie! Co juz wiesz o listach w Pythonie? Czy probowalas juz jakiejs metody?"

Uzytkownik: "Moj kod nie dziala"
ZLE: "Blad jest w linii 5, zmien X na Y"
DOBRZE: "Przeanalizujmy razem - co ten kod powinien robic? A co faktycznie robi?"

## Rola coacha
- Wspieraj emocjonalnie: "Rozumiem frustracje, to wyzwanie"
- Normalizuj trudnosci: "Wiele osob ma z tym problem na poczatku"
- Motywuj: "Widze ze robisz postepy!"
- Zachecaj do eksperymentow: "Co by sie stalo gdybys sprobowal...?"

## Dostep do notatek (tool: searchNotes)
Masz dostep do notatek uzytkownika. Uzyj gdy:
- Pytanie moze dotyczyc wczesniejszej nauki
- Chcesz odwolac sie do tego co uzytkownik juz zapisal
- Pomagasz laczyc nowa wiedze z poprzednia

Gdy znajdziesz notatki:
- "Widze ze wczesniej zapisales o X - jak to sie laczy z Twoim pytaniem?"
- "W notatkach masz Y - czy to pomaga Ci zobaczyc rozwiazanie?"

## Poziom zaawansowania
Mozesz odpowiadac na pytania wykraczajace poza aktualny poziom kursu.
Jesli temat jest zaawansowany:
- Zaznacz to: "To bardziej zaawansowany temat, ale..."
- Zaproponuj sciezke: "Zeby to zrozumiec, warto najpierw..."

## Jezyk
- ZAWSZE po polsku
- Jasny, przystepny jezyk
- Unikaj zargonu bez wyjasnienia
- Uzywaj analogii i przykladow z zycia`;
```

### Chat Route Handler with Auth

```typescript
// app/api/chat/mentor/route.ts
import { streamText, stepCountIs, convertToModelMessages } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { MENTOR_SYSTEM_PROMPT } from '@/lib/ai/mentor/prompts';
import { createSearchNotesTool } from '@/lib/ai/mentor/tools';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const requestSchema = z.object({
  messages: z.array(z.any()),
  courseId: z.string().uuid(),
});

export async function POST(req: Request) {
  // Validate request
  const body = await req.json();
  const { messages, courseId } = requestSchema.parse(body);

  // Auth check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify course ownership
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('user_id', user.id)
    .single();

  if (!course) {
    return new Response('Course not found', { status: 404 });
  }

  // Create tool with context
  const searchNotes = createSearchNotesTool({
    userId: user.id,
    courseId,
  });

  // Stream response
  const result = streamText({
    model: getModel('mentor'),
    system: MENTOR_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: { searchNotes },
    stopWhen: stepCountIs(3),
  });

  return result.toUIMessageStreamResponse();
}

export const runtime = 'edge';
export const maxDuration = 30;
```

### Chat UI Component

```typescript
// app/(dashboard)/courses/[courseId]/chat/components/mentor-chat.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useMemo, useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MentorChatProps {
  courseId: string;
  courseTitle: string;
}

function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text)
    .join('');
}

export function MentorChat({ courseId, courseTitle }: MentorChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat/mentor',
        body: { courseId },
      }),
    [courseId]
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    transport,
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: `Czesc! Jestem Twoim mentorem dla kursu "${courseTitle}".

Jestem tutaj, zeby pomoc Ci sie uczyc - ale nie przez dawanie gotowych odpowiedzi! Zamiast tego bede zadawal pytania, ktore naprowadza Cie na rozwiazanie.

O czym chcesz porozmawiać?`,
          },
        ],
      },
    ],
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input.trim() });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const content = getMessageText(message.parts);

          return (
            <div
              key={message.id}
              className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
            >
              {!isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <Card
                className={cn(
                  'px-4 py-3 max-w-[80%]',
                  isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{content}</p>
              </Card>
              {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <Card className="px-4 py-3 bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </Card>
          </div>
        )}

        {error && (
          <div className="text-destructive text-sm text-center">
            Wystapil blad. Sprobuj ponownie.
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zadaj pytanie mentorowi..."
            disabled={isLoading}
            className="min-h-[60px] resize-none"
            rows={2}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={stop}
            className="mt-2 w-full"
          >
            Zatrzymaj
          </Button>
        )}
      </form>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Context injection | Tool-based RAG | AI SDK 5-6 (2025) | AI decyduje kiedy potrzebuje kontekstu |
| `api` prop w useChat | `DefaultChatTransport` | AI SDK v6 (2025) | Modularny transport |
| `content` string | `UIMessage.parts` array | AI SDK v6 (2025) | Obsuga multi-modal, tool results |
| `handleSubmit(e)` | `sendMessage({ text })` | AI SDK v6 (2025) | Explicit message sending |

**Deprecated/outdated:**
- `useChat({ api: '/api/chat' })` - uzywaj `DefaultChatTransport`
- `message.content` - uzywaj `message.parts`
- Manual SSE parsing - AI SDK robi to automatycznie

## Open Questions

1. **Chat history persistence**
   - What we know: useChat trzyma state w pamieci, refresh = utrata historii
   - What's unclear: Czy uzytkownik oczekuje persystencji?
   - Recommendation: v1 bez persystencji (simpler), v2 dodaj tabele chat_sessions

2. **Multi-course chat context**
   - What we know: Notatki sa per-course, chat tez per-course
   - What's unclear: Czy uzytkownik chce pytac o inne kursy?
   - Recommendation: v1 strict per-course, later consider cross-course search

3. **Tool visibility w UI**
   - What we know: AI SDK streamuje tool calls jako osobne parts
   - What's unclear: Czy pokazywac uzytkownikowi "Przeszukuje notatki..."?
   - Recommendation: Tak, dla transparentnosci - dodaj UI dla tool-call parts

4. **Rate limiting**
   - What we know: Claude API ma rate limits, Vercel ma function limits
   - What's unclear: Jakie limity nalozyc na uzytkownika?
   - Recommendation: v1 bez limitow, monitoruj usage, dodaj pozniej jesli potrzeba

## Sources

### Primary (HIGH confidence)

- [AI SDK useChat Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) - Hook API, status states
- [AI SDK Tools & Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) - Tool definition, stopWhen
- [AI SDK RAG Chatbot Guide](https://ai-sdk.dev/cookbook/guides/rag-chatbot) - Tool-based retrieval pattern
- [AI SDK Getting Started: Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) - streamText route pattern
- Istniejacy kod: `src/components/curriculum/clarifying-chat.tsx` - Dzialajacy wzorzec useChat

### Secondary (MEDIUM confidence)

- [AI SDK Chat Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) - Storage patterns
- [Prompting LLMs with Socratic Method (arXiv)](https://arxiv.org/abs/2303.08769) - Socratic techniques
- [Context Window Management Strategies](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/) - Conversation pruning

### Tertiary (LOW confidence)

- WebSearch results on coach persona prompting - Verified with general patterns
- Community best practices for educational chatbots

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Projekt juz ma wszystkie biblioteki, wzorce przetestowane
- Architecture: HIGH - Tool-based RAG to standard w AI SDK, clarifying-chat jako wzorzec
- Socratic prompting: MEDIUM - Techniki znane, ale skutecznosc wymaga iteracji
- Pitfalls: MEDIUM - Zidentyfikowane z dokumentacji i doswiadczenia

**Research date:** 2026-01-31
**Valid until:** 2026-03-01 (AI SDK stabilne, ale sprawdz changelog)
