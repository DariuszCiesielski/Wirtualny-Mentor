# Phase 3: Learning Materials - Research

**Researched:** 2026-01-31
**Domain:** AI-generated educational content, web search integration, citation/grounding, markdown rendering
**Confidence:** HIGH

## Summary

Phase 3 implementuje generowanie materialow edukacyjnych w stylu podrecznika dla kazdej sekcji curriculum. Kluczowe wyzwania to: (1) generowanie dlugich, strukturyzowanych tresci z AI z cytatami zrodel, (2) integracja Tavily dla aktualnych linkow i zasobow, (3) fact-checking/grounding aby zapobiec halucynacjom, (4) tlumaczenie materialow anglojezycznych na polski, oraz (5) renderowanie markdown z syntax highlighting dla kodu.

Istniejaca infrastruktura (Tavily client, AI orchestrator, streamObject) stanowi solidna baze. Glowne rozszerzenia to: nowa tabela `section_content` dla przechowywania wygenerowanych materialow, schemat Zod dla structured content z cytatami, komponent markdown renderer, oraz prompty specjalizowane dla generowania tresci edukacyjnych.

**Primary recommendation:** Uzyj streamText z Tavily web search jako tool dla grounded generation. Kazda sekcja generowana osobno on-demand (lazy generation). Content przechowywany jako markdown w JSONB z metadanymi o zrodlach. react-markdown + rehype-highlight dla renderowania.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai (Vercel AI SDK) | ^6.0.62 | Streaming text generation, tool calling | Juz zainstalowane, unified API |
| @tavily/core | ^0.7.1 | Web search dla linkow i grounding | Juz zainstalowane, RAG-optimized |
| react-markdown | ^9.x | Renderowanie markdown w React | Standard dla markdown w React, 12M+ weekly downloads |
| remark-gfm | ^4.x | GitHub Flavored Markdown (tabele, checkboxy) | Rozszerzenie react-markdown dla tabel i list |
| rehype-highlight | ^7.x | Syntax highlighting dla code blocks | Lekki, highlight.js based, 37 jezykow |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| rehype-raw | ^7.x | Raw HTML w markdown | Gdy content zawiera HTML elementy |
| rehype-sanitize | ^6.x | Sanityzacja HTML dla bezpieczenstwa | Zawsze z rehype-raw dla XSS protection |
| highlight.js | ^11.x | Theme CSS dla syntax highlighting | Wymagane dla rehype-highlight styling |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-markdown | @mdx-js/react | MDX jest overkill dla read-only content |
| rehype-highlight | react-syntax-highlighter | react-syntax-highlighter jest ciezszy (Prism full bundle) |
| Tavily search | OpenAI web_search tool | Tavily daje wiecej kontroli, RAG-optimized results |
| GPT dla tlumaczen | DeepL API | GPT wystarczajaco dobry dla edukacyjnego contentu, mniej API keys |

**Installation:**
```bash
npm install react-markdown remark-gfm rehype-highlight rehype-raw rehype-sanitize
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   └── courses/
│   │       └── [courseId]/
│   │           └── [levelId]/
│   │               └── [chapterId]/
│   │                   └── page.tsx           # Chapter content view
│   └── api/
│       └── materials/
│           ├── generate/route.ts              # Streaming content generation
│           └── translate/route.ts             # EN->PL translation endpoint
├── lib/
│   ├── ai/
│   │   └── materials/
│   │       ├── prompts.ts                     # Textbook-style prompts
│   │       ├── schemas.ts                     # Content + citation schemas
│   │       └── tools.ts                       # Web search tools for grounding
│   └── dal/
│       └── materials.ts                       # Section content CRUD
├── components/
│   └── materials/
│       ├── content-renderer.tsx               # Markdown + code highlighting
│       ├── source-list.tsx                    # Citations/sources display
│       ├── tool-card.tsx                      # Tool recommendation with link
│       └── installation-steps.tsx             # Step-by-step instructions
└── types/
    └── materials.ts                           # Section content types
```

### Pattern 1: Grounded Content Generation with Citations

**What:** Generowanie tresci edukacyjnej z inline citations i source tracking.

**When to use:** Dla kazdej sekcji gdzie wymagana jest weryfikowalnosc (MAT-07, KNOW-04).

**Example:**
```typescript
// src/lib/ai/materials/schemas.ts
import { z } from 'zod';

export const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  type: z.enum(['documentation', 'article', 'video', 'course', 'official']),
  accessedAt: z.string().datetime(),
  snippet: z.string().optional(), // Original text fragment
});

export const sectionContentSchema = z.object({
  chapterId: z.string().uuid(),

  // Main textbook-like content in markdown
  content: z.string().describe('Tresc w formacie markdown z inline citations [1], [2]'),

  // Structured sections
  introduction: z.string().describe('Wprowadzenie do tematu'),
  keyConceptsn: z.array(z.object({
    term: z.string(),
    definition: z.string(),
    example: z.string().optional(),
  })),

  // Practical elements (MAT-04, MAT-05, MAT-06)
  practicalSteps: z.array(z.object({
    stepNumber: z.number(),
    title: z.string(),
    instruction: z.string(),
    command: z.string().optional(),
    expectedOutput: z.string().optional(),
    explanation: z.string().optional(),
  })).optional(),

  // Tools and resources (MAT-02, MAT-03)
  tools: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    description: z.string(),
    installCommand: z.string().optional(),
    isFree: z.boolean(),
  })).optional(),

  // External resources
  externalResources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    type: z.enum(['docs', 'tutorial', 'video', 'article', 'course']),
    language: z.enum(['pl', 'en']),
    description: z.string(),
  })).optional(),

  // Citation sources (MAT-07, KNOW-04)
  sources: z.array(sourceSchema),

  // Metadata
  generatedAt: z.string().datetime(),
  wordCount: z.number(),
  estimatedReadingMinutes: z.number(),
});

export type SectionContent = z.infer<typeof sectionContentSchema>;
export type Source = z.infer<typeof sourceSchema>;
```

### Pattern 2: Web Search Tool for Grounding

**What:** Tavily jako tool dla AI aby wyszukiwac aktualne informacje podczas generowania.

**When to use:** Podczas generowania kazdej sekcji - AI decyduje kiedy potrzebuje zewnetrznych danych.

**Example:**
```typescript
// src/lib/ai/materials/tools.ts
import { tool } from 'ai';
import { z } from 'zod';
import { searchWeb, extractUrls } from '@/lib/tavily/client';

export const searchResourcesTool = tool({
  description: `Wyszukaj aktualne zasoby edukacyjne, dokumentacje i tutoriale na dany temat.
Uzyj tego narzedzia aby znalezc:
- Oficjalna dokumentacje
- Tutoriale i kursy
- Artykuly z przykladami
- Narzedzia i ich linki`,
  inputSchema: z.object({
    query: z.string().describe('Zapytanie do wyszukiwarki (preferuj angielskie frazy dla lepszych wynikow)'),
    type: z.enum(['documentation', 'tutorial', 'tool', 'article']).optional(),
  }),
  execute: async ({ query, type }) => {
    // Append type hint to query for better results
    const enhancedQuery = type
      ? `${query} ${type === 'documentation' ? 'official docs' : type}`
      : query;

    const results = await searchWeb(enhancedQuery, {
      searchDepth: 'advanced',
      maxResults: 5,
    });

    return {
      answer: results.answer,
      sources: results.results.map((r, i) => ({
        id: `src-${i + 1}`,
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
      })),
    };
  },
});

export const extractContentTool = tool({
  description: 'Wyciagnij szczegolowa tresc z podanego URL (np. dokumentacji, tutoriala)',
  inputSchema: z.object({
    url: z.string().url().describe('URL do wyciagniecia tresci'),
    intent: z.string().describe('Co chcesz znalezc w tej stronie'),
  }),
  execute: async ({ url, intent }) => {
    const extracted = await extractUrls([url]);
    if (!extracted[0]?.content) {
      return { error: 'Nie udalo sie wyciagnac tresci', url };
    }
    return {
      url,
      content: extracted[0].content.slice(0, 8000), // Limit for context window
      extractedFor: intent,
    };
  },
});

export const materialGenerationTools = {
  searchResources: searchResourcesTool,
  extractContent: extractContentTool,
};
```

### Pattern 3: Streaming Content Generation with Multi-Step Tool Calling

**What:** Generowanie tresci sekcji z mozliwoscia wielokrotnego wywolania narzedzi.

**When to use:** Endpoint generowania materialow - AI moze wyszukac, ekstrakcja, nastepnie generowac.

**Example:**
```typescript
// src/app/api/materials/generate/route.ts
import { streamText, generateObject } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { sectionContentSchema } from '@/lib/ai/materials/schemas';
import { materialGenerationTools } from '@/lib/ai/materials/tools';
import { MATERIAL_GENERATION_PROMPT } from '@/lib/ai/materials/prompts';

export async function POST(req: Request) {
  const { chapterId, chapterTitle, chapterDescription, topics, courseContext } = await req.json();

  // Step 1: Research phase - AI gathers information with tools
  const researchResult = await streamText({
    model: getModel('curriculum'),
    system: `Jestes ekspertem tworzacym materialy edukacyjne.
Twoim zadaniem jest zebrac informacje potrzebne do stworzenia tresci dla rozdzialu.

ZASADY WYSZUKIWANIA:
- Szukaj oficjalnej dokumentacji i sprawdzonych zrodel
- Preferuj anglojezyczne zapytania dla lepszych wynikow
- Zapisuj DOKLADNE URL-e znalezionych zrodel
- Wyciagaj kluczowe informacje z dokumentacji`,
    prompt: `Zbierz informacje do rozdzialu: "${chapterTitle}"
Opis: ${chapterDescription}
Tematy do pokrycia: ${topics.join(', ')}
Kontekst kursu: ${courseContext}

Wyszukaj:
1. Oficjalna dokumentacje
2. Praktyczne tutoriale
3. Narzedzia i ich linki instalacyjne
4. Przyklady kodu/komend`,
    tools: materialGenerationTools,
    maxSteps: 5, // Allow multiple tool calls
  });

  // Collect tool results
  let collectedSources: Array<{ title: string; url: string; content: string }> = [];
  for await (const event of researchResult.fullStream) {
    if (event.type === 'tool-result') {
      if (event.result.sources) {
        collectedSources.push(...event.result.sources);
      }
    }
  }

  // Step 2: Generate structured content using gathered information
  const contentResult = await generateObject({
    model: getModel('curriculum'),
    schema: sectionContentSchema,
    system: MATERIAL_GENERATION_PROMPT,
    prompt: `Stworz tresc edukacyjna dla rozdzialu: "${chapterTitle}"

ZEBRANE ZRODLA:
${collectedSources.map((s, i) => `[${i + 1}] ${s.title} - ${s.url}\n${s.content?.slice(0, 1000)}`).join('\n\n')}

WYMAGANIA:
- Tresc w stylu podrecznika, jasna i przystepna
- Inline citations w formacie [1], [2] odwolujace do zrodel
- Praktyczne przyklady z komendami
- Oczekiwane wyniki i jak je interpretowac
- Wszystko po polsku (tlumacz anglojezyczne zrodla)
- Zachowaj oryginalne URL-e do zrodel`,
  });

  return Response.json(contentResult.object);
}
```

### Pattern 4: Markdown Content Renderer with Syntax Highlighting

**What:** Komponent do renderowania wygenerowanego markdown z code highlighting i custom styling.

**When to use:** Wyswietlanie materialow w UI.

**Example:**
```typescript
// src/components/materials/content-renderer.tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import 'highlight.js/styles/github-dark.css'; // Or github.css for light mode
import type { Source } from '@/types/materials';

interface ContentRendererProps {
  content: string;
  sources?: Source[];
  className?: string;
}

export function ContentRenderer({ content, sources = [], className }: ContentRendererProps) {
  // Replace citation markers [1] with actual source links
  const contentWithLinks = content.replace(
    /\[(\d+)\]/g,
    (match, num) => {
      const source = sources[parseInt(num) - 1];
      if (source) {
        return `[${num}](${source.url} "${source.title}")`;
      }
      return match;
    }
  );

  return (
    <div className={cn('prose prose-zinc dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          rehypeSanitize,
          [rehypeHighlight, { detect: true }],
        ]}
        components={{
          // Custom code block with copy button
          pre({ children, ...props }) {
            return (
              <div className="relative group">
                <pre {...props} className="rounded-lg overflow-x-auto">
                  {children}
                </pre>
                <CopyButton code={extractCode(children)} />
              </div>
            );
          },
          // Custom blockquote for tips/warnings
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary bg-muted/50 p-4 my-4">
                {children}
              </blockquote>
            );
          },
          // External links open in new tab
          a({ href, children, ...props }) {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-primary hover:underline"
                {...props}
              >
                {children}
                {isExternal && <ExternalLinkIcon className="inline ml-1 h-3 w-3" />}
              </a>
            );
          },
        }}
      >
        {contentWithLinks}
      </ReactMarkdown>
    </div>
  );
}
```

### Pattern 5: Database Schema for Section Content

**What:** Rozszerzenie schematu DB o przechowywanie wygenerowanych materialow.

**When to use:** Persystencja wygenerowanych tresci dla kazdego rozdzialu.

**Example:**
```sql
-- Migration: Section content storage
-- Extends Phase 2 schema with generated learning materials

-- Section content table - stores generated textbook-like materials
CREATE TABLE section_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,

  -- Main content (markdown with inline citations)
  content TEXT NOT NULL,

  -- Structured data (JSONB for flexibility)
  key_concepts JSONB DEFAULT '[]',
  practical_steps JSONB DEFAULT '[]',
  tools JSONB DEFAULT '[]',
  external_resources JSONB DEFAULT '[]',

  -- Source tracking for anti-hallucination
  sources JSONB NOT NULL DEFAULT '[]',

  -- Metadata
  word_count INT,
  estimated_reading_minutes INT,
  language TEXT DEFAULT 'pl' CHECK (language IN ('pl', 'en')),

  -- Generation tracking
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generation_model TEXT,
  generation_cost_tokens INT,

  -- Versioning (for regeneration)
  version INT DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(chapter_id, version)
);

-- RLS policies
ALTER TABLE section_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content of own courses" ON section_content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chapters ch
      JOIN course_levels cl ON cl.id = ch.level_id
      JOIN courses c ON c.id = cl.course_id
      WHERE ch.id = section_content.chapter_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert content to own courses" ON section_content
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapters ch
      JOIN course_levels cl ON cl.id = ch.level_id
      JOIN courses c ON c.id = cl.course_id
      WHERE ch.id = section_content.chapter_id
      AND c.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_section_content_chapter ON section_content(chapter_id);
CREATE INDEX idx_section_content_sources ON section_content USING GIN (sources);

-- Trigger for updated_at
CREATE TRIGGER update_section_content_updated_at
  BEFORE UPDATE ON section_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Pattern 6: Lazy Content Generation

**What:** Generowanie materialow on-demand gdy uzytkownik otwiera rozdzial.

**When to use:** Zamiast generowac wszystkie materialy z gory - oszczedza koszty i czas.

**Example:**
```typescript
// src/lib/dal/materials.ts
import { createClient } from '@/lib/supabase/server';
import type { SectionContent } from '@/types/materials';

export async function getOrGenerateContent(
  chapterId: string,
  chapterData: { title: string; description: string; topics: string[] },
  courseContext: string
): Promise<SectionContent> {
  const supabase = await createClient();

  // Check if content already exists
  const { data: existing } = await supabase
    .from('section_content')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    return existing as SectionContent;
  }

  // Generate new content
  const response = await fetch('/api/materials/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chapterId,
      chapterTitle: chapterData.title,
      chapterDescription: chapterData.description,
      topics: chapterData.topics,
      courseContext,
    }),
  });

  const content = await response.json();

  // Save to database
  const { data: saved, error } = await supabase
    .from('section_content')
    .insert({
      chapter_id: chapterId,
      content: content.content,
      key_concepts: content.keyConcepts,
      practical_steps: content.practicalSteps,
      tools: content.tools,
      external_resources: content.externalResources,
      sources: content.sources,
      word_count: content.wordCount,
      estimated_reading_minutes: content.estimatedReadingMinutes,
      generation_model: 'gpt-4.1',
    })
    .select()
    .single();

  if (error) throw error;
  return saved as SectionContent;
}
```

### Anti-Patterns to Avoid

- **Pre-generating all content:** Nie generuj wszystkich materialow przy tworzeniu kursu - kosztowne i wolne. Uzyj lazy generation.
- **No source tracking:** Nie generuj tresci bez sledzenia zrodel - uniemozliwia weryfikacje (MAT-07 failure).
- **Raw HTML without sanitization:** Nigdy nie uzyj `rehype-raw` bez `rehype-sanitize` - XSS vulnerability.
- **Single-step generation:** Nie probuj generowac contentu w jednym kroku bez web search - prowadzi do halucynacji.
- **Storing rendered HTML:** Przechowuj markdown, nie HTML - latwiej edytowac i regenerowac.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown rendering | Custom parser | react-markdown + rehype | Battle-tested, security, plugins |
| Syntax highlighting | Regex-based highlighter | rehype-highlight | 190 languages, themes, accurate |
| Web content extraction | Custom scraper | Tavily extract API | Handles JS rendering, rate limits |
| Citation formatting | String manipulation | Structured schema + post-processing | Type-safe, consistent |
| Content sanitization | Allowlist regex | rehype-sanitize | OWASP-compliant, updated |
| Polish translation | Custom ML model | AI model prompt | Quality, context-aware |

**Key insight:** Generowanie tresci edukacyjnej wymaga grounding w zewnetrznych zrodlach. Tavily + multi-step tool calling daje AI mozliwosc weryfikacji informacji przed generowaniem. Bez tego halucynacje sa nieuniknione (17-33% rate nawet w RAG systemach wg Stanford).

## Common Pitfalls

### Pitfall 1: Halucynacje URL-i i Cytatow

**What goes wrong:** AI generuje fikcyjne URL-e lub cytuje nieistniejace zrodla.

**Why it happens:** AI "pamięta" stare URL-e z treningu lub wymysla plausible-looking links.

**How to avoid:**
1. Wymagaj web search PRZED generowaniem contentu (multi-step)
2. Przechowuj tylko URL-e z tool results, nie z generacji AI
3. Waliduj URL-e przed zapisaniem (HEAD request lub Tavily extract)
4. Jasne instrukcje w prompcie: "Uzyj TYLKO url-i ze znalezionych zrodel"

**Warning signs:** URL-e 404, domeny ktore nie istnieja, URL-e do stron z 2020 roku.

### Pitfall 2: Niespojne Tlumaczenie Terminologii

**What goes wrong:** Ten sam termin techniczny tlumaczony roznie w roznych sekcjach.

**Why it happens:** Brak glossary, AI wybiera rozne tlumaczenia.

**How to avoid:**
1. Zdefiniuj glossary terminow technicznych w system prompcie
2. "key terms" pozostaw po angielsku z polskim wyjasnieniem w nawiasie
3. Konsekwentne formatowanie: "dependency injection (wstrzykiwanie zaleznosci)"

**Warning signs:** "callback" raz jako "wywolanie zwrotne", raz jako "funkcja callback".

### Pitfall 3: Nieaktualne Informacje Mimo Web Search

**What goes wrong:** Content zawiera przestarzale wersje, deprecated APIs.

**Why it happens:** Web search zwraca stare artykuly, AI nie weryfikuje dat.

**How to avoid:**
1. Dodaj rok do search query: "{topic} documentation 2026"
2. Preferuj oficjalna dokumentacje nad blogposty
3. Instrukcja w prompcie: "Weryfikuj wersje oprogramowania"
4. Extractuj z official docs, nie z random tutoriali

**Warning signs:** "npm install [email protected]" gdy aktualna to 19.x

### Pitfall 4: Za Dlugi Content Przekraczajacy Token Limit

**What goes wrong:** Generowanie sie urywa, brak podsumowania lub zakonczenia.

**Why it happens:** Chapter ma za duzo topics, output przekracza maxOutputTokens.

**How to avoid:**
1. Limit 3-5 topics per chapter (wymus w curriculum generation)
2. Ustaw maxOutputTokens: 8192 dla content generation
3. Jesli chapter duzy - dziel na sub-sections i generuj osobno
4. Monitoruj token usage, alert jesli blisko limitu

**Warning signs:** Content konczy sie w polowie zdania, brak sekcji "Podsumowanie".

### Pitfall 5: Duplikaty Zrodel i Circular References

**What goes wrong:** Te same zrodla cytowane wielokrotnie z roznymi ID, zrodla prowadza do siebie.

**Why it happens:** Multiple tool calls zwracaja te same results, brak deduplication.

**How to avoid:**
1. Deduplikuj zrodla po URL przed zapisaniem
2. Normalizuj URL-e (usun query params, trailing slash)
3. Limit zrodel na sekcje (max 10)
4. Waliduj ze zrodla nie sa circular (A cytuje B, B cytuje A)

**Warning signs:** 15 zrodel z ktorych 10 to duplikaty, zrodlo "Oficjalna dokumentacja" bez URL.

## Code Examples

### Material Generation Prompt

```typescript
// src/lib/ai/materials/prompts.ts
export const MATERIAL_GENERATION_PROMPT = `Jestes ekspertem tworzacym wysokiej jakosci materialy edukacyjne w stylu podrecznika.

TWOJA ROLA:
Tworzysz jasne, przystepne tresci ktore pomagaja uczniom zrozumiec nowe koncepty.
Lacisz teorie z praktyka, podajac konkretne przyklady i komendy do wyprobowania.

FORMAT TRESCI:
1. WPROWADZENIE - krotki opis czego dotyczy rozdzial, po co to sie ucz
2. KLUCZOWE POJECIA - definicje z przykladami
3. SZCZEGOLOWE WYJASNIENIE - glowna tresc z inline citations [1], [2]
4. PRAKTYCZNE PRZYKLADY - komendy, kod, oczekiwane wyniki
5. NARZEDZIA - linki do narzedzi z instrukcja instalacji
6. ZASOBY DODATKOWE - linki do dokumentacji, kursow, artykulow
7. PODSUMOWANIE - 3-5 bullet points kluczowych wnioskow

ZASADY CYTOWAN:
- KAZDY fakt musi byc poparty zrodlem [n]
- Uzywaj TYLKO url-i ze znalezionych zrodel, NIGDY nie wymyslaj url-i
- Format: "React uzywa Virtual DOM dla optymalizacji [1]"
- Zrodla numeruj kolejno od [1]

ZASADY PRAKTYCZNE:
- Komendy z pelnym wyjasnieniem co robia
- Oczekiwany output z interpretacja ("Powinienes zobaczyc: ...")
- Instalacja krok po kroku (1. ... 2. ... 3. ...)
- Narzedzia z PRAWDZIWYMI linkami URL

JEZYK:
- Pisz po polsku
- Terminy techniczne: angielski (polskie wyjasnienie), np. "callback (funkcja zwrotna)"
- Kod i komendy bez tlumaczenia
- Przyjazny ton, bezposredni zwrot do ucznia ("zainstaluj", "uruchom")

FORMATOWANIE MARKDOWN:
- Naglowki: ## dla sekcji, ### dla podsekcji
- Kod: \`inline\` i \`\`\`language dla blokow
- Listy: - dla nieuporządkowanych, 1. dla kroków
- Tabele dla porównań
- > dla waznych uwag

ZAKAZY:
- NIE wymyslaj URL-i - uzyj tylko te ze zrodel
- NIE pomijaj zrodel przy faktach
- NIE pisz ogolnikow bez konkretow
- NIE przekraczaj 3000 slow na sekcje`;

export const TRANSLATION_PROMPT = `Przetlumacz ponizszy tekst z angielskiego na polski.

ZASADY TLUMACZENIA:
1. Terminy techniczne pozostaw po angielsku z polskim wyjasnieniem w nawiasie przy pierwszym uzyciu
   Przyklad: "callback (funkcja zwrotna)"
2. Kod i komendy NIE tlumacz - pozostaw oryginalne
3. URL-e pozostaw bez zmian
4. Zachowaj formatowanie markdown
5. Nazwy narzedzi i bibliotek pozostaw po angielsku
6. Zachowaj ton oryginalnego tekstu

TEKST DO TLUMACZENIA:
{text}`;
```

### Chapter Content View Component

```typescript
// src/app/(dashboard)/courses/[courseId]/[levelId]/[chapterId]/page.tsx
import { Suspense } from 'react';
import { getChapter } from '@/lib/dal/courses';
import { getOrGenerateContent } from '@/lib/dal/materials';
import { ContentRenderer } from '@/components/materials/content-renderer';
import { SourceList } from '@/components/materials/source-list';
import { ChapterNavigation } from '@/components/curriculum/chapter-navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface ChapterPageProps {
  params: { courseId: string; levelId: string; chapterId: string };
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const chapter = await getChapter(params.chapterId);

  return (
    <div className="container max-w-4xl py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{chapter.title}</h1>
        <p className="text-muted-foreground mt-2">{chapter.description}</p>
        <div className="flex gap-2 mt-4">
          <Badge>{chapter.estimatedMinutes} min</Badge>
          {chapter.topics.map(topic => (
            <Badge key={topic} variant="outline">{topic}</Badge>
          ))}
        </div>
      </header>

      <Suspense fallback={<ContentSkeleton />}>
        <ChapterContent chapterId={params.chapterId} chapter={chapter} />
      </Suspense>

      <ChapterNavigation
        courseId={params.courseId}
        levelId={params.levelId}
        currentChapterId={params.chapterId}
      />
    </div>
  );
}

async function ChapterContent({ chapterId, chapter }: { chapterId: string; chapter: Chapter }) {
  const content = await getOrGenerateContent(chapterId, chapter, '');

  return (
    <article>
      <ContentRenderer content={content.content} sources={content.sources} />

      {content.tools && content.tools.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Narzedzia</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {content.tools.map(tool => (
              <ToolCard key={tool.name} {...tool} />
            ))}
          </div>
        </section>
      )}

      {content.externalResources && content.externalResources.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Dodatkowe zasoby</h2>
          <ResourceList resources={content.externalResources} />
        </section>
      )}

      <footer className="mt-8 pt-4 border-t">
        <SourceList sources={content.sources} />
        <p className="text-xs text-muted-foreground mt-4">
          Wygenerowano: {new Date(content.generatedAt).toLocaleDateString('pl-PL')}
          {' | '}{content.wordCount} slow
          {' | '}{content.estimatedReadingMinutes} min czytania
        </p>
      </footer>
    </article>
  );
}
```

### Source Citation Component

```typescript
// src/components/materials/source-list.tsx
'use client';

import { ExternalLink } from 'lucide-react';
import type { Source } from '@/types/materials';

interface SourceListProps {
  sources: Source[];
}

export function SourceList({ sources }: SourceListProps) {
  if (!sources.length) return null;

  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <h3 className="font-semibold mb-3">Zrodla</h3>
      <ol className="space-y-2 text-sm">
        {sources.map((source, index) => (
          <li key={source.id} className="flex items-start gap-2">
            <span className="text-muted-foreground">[{index + 1}]</span>
            <div>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                {source.title}
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-muted-foreground ml-2 text-xs">
                ({source.type})
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-shot content generation | Multi-step with tool calling | AI SDK 6 (2026) | Grounded, verified content |
| Post-generation fact-check | Inline grounding during generation | 2025-2026 | Lower hallucination rate |
| Manual link collection | Tavily search + extract | 2025 | Automated, current links |
| HTML storage | Markdown in JSONB | Best practice | Editable, renderable |
| Server-side rendering markdown | Client-side with react-markdown | Standard | Interactive, customizable |

**Deprecated/outdated:**
- `useCompletion` dla content generation - uzyj `streamText` z tools
- Storing pre-rendered HTML - uzyj markdown source
- Manual URL scraping - uzyj Tavily extract API
- Single-language content - track language per section for future

## Open Questions

1. **Content regeneration UX**
   - What we know: Users may want to regenerate content with different sources
   - What's unclear: How to handle versioning, show diff, or allow partial regeneration
   - Recommendation: Store version history, allow regeneration but keep previous version

2. **Streaming generation to UI**
   - What we know: streamText works for text, but structured content is harder to stream
   - What's unclear: How to show partial content during generation (skeleton + progressive fill)
   - Recommendation: Generate intro first (quick), then full content. Show generating state.

3. **Source quality scoring**
   - What we know: Tavily returns score per result
   - What's unclear: How to prioritize official docs over random blogs
   - Recommendation: Add domain whitelist for official sources (github.com, *.io docs, MDN, etc.)

4. **Translation quality for Polish**
   - What we know: GPT handles PL well for general text
   - What's unclear: Technical term consistency across sections
   - Recommendation: Build term glossary, include in system prompt, validate consistency

## Sources

### Primary (HIGH confidence)
- [Vercel AI SDK: Generating Text](https://ai-sdk.dev/docs/ai-sdk-core/generating-text) - streamText, tool calling
- [Vercel AI SDK: Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) - Tool definition, multi-step
- [Tavily Search API](https://docs.tavily.com/documentation/api-reference/endpoint/search) - Search parameters
- [Tavily Extract API](https://docs.tavily.com/documentation/api-reference/endpoint/extract) - Content extraction
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) - Markdown rendering
- [rehype-highlight GitHub](https://github.com/rehypejs/rehype-highlight) - Syntax highlighting

### Secondary (MEDIUM confidence)
- [LongCite: Fine-grained Citations](https://arxiv.org/html/2409.02897v3) - Citation generation research
- [Google's Learn Your Way](https://research.google/blog/learn-your-way-reimagining-textbooks-with-generative-ai/) - AI textbook patterns
- [Stanford Legal RAG Study](https://dho.stanford.edu/wp-content/uploads/Legal_RAG_Hallucinations.pdf) - Hallucination rates in RAG

### Tertiary (LOW confidence)
- WebSearch results on AI content generation best practices
- Community patterns for educational content structure

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs, proven libraries
- Architecture patterns: HIGH - Based on existing codebase + AI SDK docs
- Content schema: MEDIUM - Custom design, needs validation with real content
- Pitfalls: HIGH - Well-documented in research papers and community
- Translation approach: MEDIUM - Based on general LLM capabilities, needs Polish-specific testing

**Research date:** 2026-01-31
**Valid until:** 2026-03-01 (AI SDK evolves, verify tool calling patterns)
