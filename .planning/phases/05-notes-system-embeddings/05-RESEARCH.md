# Phase 5: Notes System & Embeddings - Research

**Researched:** 2026-01-31
**Domain:** User notes with vector embeddings for RAG chatbot
**Confidence:** HIGH

## Summary

Faza 5 implementuje system notatek użytkownika z dwoma typami wyszukiwania: full-text search (PostgreSQL tsvector) dla szybkiego przeszukiwania tekstowego oraz embeddingi wektorowe (pgvector) dla RAG chatbota. Projekt już ma skonfigurowany model embeddingowy (`text-embedding-3-small` w `providers.ts`) i używa Supabase z pgvector.

Kluczowe decyzje architektoniczne:
- **Dual search**: Full-text search (tsvector + GIN) dla UI + vector search (pgvector + HNSW) dla RAG
- **Embedding model**: OpenAI `text-embedding-3-small` (1536 wymiarów, $0.02/1M tokens)
- **Storage type**: `halfvec(1536)` zamiast `vector(1536)` - 50% oszczednosci storage przy podobnej jakości
- **Sync vs async**: Synchroniczne generowanie embeddingów przy zapisie (niski wolumen notatek)
- **UI**: Prosty textarea z shadcn/ui (już w projekcie) - brak potrzeby rich text editora

**Primary recommendation:** Uzyj `halfvec(1536)` dla embeddingów, `tsvector` dla full-text search, i generuj embeddingi synchronicznie w Server Action przy zapisie notatki.

## Standard Stack

### Core (już w projekcie)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@ai-sdk/openai` | ^3.0.23 | Embedding generation | Już skonfigurowany, unified API |
| `ai` | ^6.0.62 | `embed`/`embedMany` functions | Vercel AI SDK z batch processing |
| `@supabase/supabase-js` | ^2.93.3 | Database access | pgvector + tsvector w jednej bazie |

### Extensions (do włączenia w Supabase)

| Extension | Purpose | How to Enable |
|-----------|---------|---------------|
| `vector` | pgvector dla embeddingów | Dashboard > Database > Extensions |
| (built-in) | tsvector/tsquery | Wbudowane w PostgreSQL |

### Supporting (brak nowych zależności)

Projekt już ma wszystkie potrzebne komponenty:
- `Textarea` z shadcn/ui
- Supabase client (server/client)
- AI SDK providers

**Installation:**
```bash
# Brak nowych instalacji - wszystko juz jest w projekcie
# Tylko wlaczenie extension w Supabase Dashboard
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── types/
│   └── notes.ts                    # Note, NoteWithEmbedding types
├── lib/
│   ├── dal/
│   │   └── notes.ts                # CRUD + search functions
│   └── ai/
│       └── embeddings.ts           # embed/embedMany wrappers
├── app/
│   ├── api/
│   │   ├── notes/
│   │   │   └── search/route.ts     # Vector similarity search endpoint
│   │   └── embeddings/
│   │       └── generate/route.ts   # Batch re-embedding endpoint (admin)
│   └── (dashboard)/
│       └── courses/[courseId]/
│           └── notes/
│               ├── page.tsx        # Notes list page
│               └── actions.ts      # Server Actions: create/update/delete
└── components/
    └── notes/
        ├── note-editor.tsx         # Textarea-based editor
        ├── note-card.tsx           # Note display card
        └── notes-sidebar.tsx       # Collapsible sidebar for chapter
```

### Pattern 1: Synchronous Embedding Generation

**What:** Generuj embedding przy zapisie notatki w Server Action
**When to use:** Niski wolumen notatek (user-generated content, nie bulk import)
**Example:**
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/embeddings
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

async function createNoteWithEmbedding(note: CreateNoteInput) {
  // Generate embedding
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: note.content,
  });

  // Insert with embedding
  const { data, error } = await supabase
    .from('notes')
    .insert({
      ...note,
      embedding: JSON.stringify(embedding),
    })
    .select()
    .single();

  return data;
}
```

### Pattern 2: Dual Search (Full-text + Vector)

**What:** Full-text search dla UI, vector search dla RAG
**When to use:** Kiedy potrzebujesz zarówno dokladnego wyszukiwania slow jak i semantycznego
**Example:**
```sql
-- Full-text search (UI)
CREATE OR REPLACE FUNCTION search_notes_fulltext(
  p_user_id UUID,
  p_query TEXT,
  p_limit INT DEFAULT 10
)
RETURNS SETOF notes AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM notes
  WHERE user_id = p_user_id
    AND fts @@ plainto_tsquery('simple', p_query)
  ORDER BY ts_rank(fts, plainto_tsquery('simple', p_query)) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Vector similarity search (RAG)
CREATE OR REPLACE FUNCTION search_notes_semantic(
  p_user_id UUID,
  p_embedding halfvec(1536),
  p_match_threshold FLOAT DEFAULT 0.7,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE(id UUID, content TEXT, similarity FLOAT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    notes.id,
    notes.content,
    1 - (notes.embedding <=> p_embedding) as similarity
  FROM notes
  WHERE notes.user_id = p_user_id
    AND 1 - (notes.embedding <=> p_embedding) > p_match_threshold
  ORDER BY notes.embedding <=> p_embedding
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql;
```

### Pattern 3: Context Linking via Foreign Keys

**What:** Notatki powiązane z chapter_id/level_id dla kontekstu
**When to use:** Zawsze - chatbot potrzebuje wiedziec skad notatka pochodzi
**Example:**
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  level_id UUID REFERENCES course_levels(id) ON DELETE SET NULL,

  content TEXT NOT NULL,
  embedding halfvec(1536),
  fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Notatka musi byc powiazana z kursem, opcjonalnie z rozdzialem lub poziomem
  CHECK (course_id IS NOT NULL)
);
```

### Anti-Patterns to Avoid

- **Async embedding queue for notes:** Overengineering dla niskiego wolumenu. Queue (pgmq) ma sens dla bulk import, nie dla user notes.
- **Rich text editor:** Nadmierna złożoność. Prosty textarea + markdown rendering wystarcza dla notatek.
- **Separate vector DB:** Projekt używa pgvector w Supabase - brak potrzeby Pinecone/Weaviate.
- **Embedding przy odczycie:** Kosztowne i wolne. Embeduj przy zapisie, przechowuj w DB.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Embedding generation | Custom fetch to OpenAI | `embed()` from AI SDK | Retry logic, token tracking, provider abstraction |
| Cosine similarity | Manual calculation | `cosineSimilarity()` from AI SDK | Edge cases, numerical precision |
| Full-text search | LIKE queries | PostgreSQL tsvector + GIN | Stemming, ranking, performance |
| Vector indexing | Linear scan | HNSW index | O(log n) vs O(n) for large datasets |
| RLS policies | Manual auth checks | Supabase RLS | Consistent, DB-level security |

**Key insight:** pgvector i tsvector są wbudowane w PostgreSQL - nie potrzebujesz zewnętrznych uslug ani bibliotek do wyszukiwania.

## Common Pitfalls

### Pitfall 1: Uzywanie `vector` zamiast `halfvec`

**What goes wrong:** 2x więcej storage i wolniejsze I/O bez znaczacej poprawy jakości
**Why it happens:** Domyslny przykład w dokumentacji używa `vector`
**How to avoid:** Zawsze uzywaj `halfvec(1536)` dla OpenAI embeddings
**Warning signs:** Duży rozmiar tabeli notes, wolne zapytania

```sql
-- ZLE
embedding vector(1536)

-- DOBRZE
embedding halfvec(1536)
```

### Pitfall 2: Brak indeksu HNSW

**What goes wrong:** Zapytania similarity trwaja sekundy zamiast milisekund
**Why it happens:** Zapominanie o indeksie lub uzywanie IVFFlat
**How to avoid:** Zawsze twórz HNSW index po utworzeniu tabeli
**Warning signs:** Czas zapytania rosnie liniowo z liczba notatek

```sql
-- Wymagane po CREATE TABLE
CREATE INDEX notes_embedding_idx ON notes
  USING hnsw (embedding halfvec_cosine_ops);
```

### Pitfall 3: Embedding model version drift

**What goes wrong:** Stare notatki maja embeddingi z innego modelu niz nowe
**Why it happens:** Upgrade modelu bez re-embeddingu starych danych
**How to avoid:** Zapisuj `embedding_model` w tabeli, re-embedduj przy zmianie
**Warning signs:** Niespojne wyniki wyszukiwania semantycznego

```sql
-- Dodaj kolumne do sledzenia wersji
embedding_model TEXT DEFAULT 'text-embedding-3-small'
```

### Pitfall 4: Full-text search bez konfiguracji języka

**What goes wrong:** Polskie slowa nie są poprawnie stemmowane
**Why it happens:** Domyslna konfiguracja 'english'
**How to avoid:** Uzyj 'simple' dla polskiego lub custom dictionary
**Warning signs:** Wyszukiwanie "programowanie" nie znajduje "programowac"

```sql
-- Dla polskiego - simple nie stemmuje, ale dziala
fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED
```

### Pitfall 5: RLS bez course ownership check

**What goes wrong:** Użytkownik widzi notatki innych
**Why it happens:** Sprawdzanie tylko user_id bez weryfikacji course ownership
**How to avoid:** Wzorzec EXISTS join jak w section_content
**Warning signs:** Security audit failure

```sql
-- Wzorzec z istniejacych migracji
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = notes.course_id
      AND courses.user_id = auth.uid()
    )
  );
```

## Code Examples

### Embedding Generation (AI SDK)

```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/embeddings
import { embed, embedMany, cosineSimilarity } from 'ai';
import { openai } from '@ai-sdk/openai';

// Single embedding
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding, usage } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });

  console.log(`Tokens used: ${usage.tokens}`);
  return embedding;
}

// Batch embedding (for re-indexing)
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const { embeddings, usage } = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: texts,
  });

  console.log(`Total tokens: ${usage.tokens}`);
  return embeddings;
}

// Similarity check
export function checkSimilarity(a: number[], b: number[]): number {
  return cosineSimilarity(a, b);
}
```

### Vector Search RPC

```typescript
// Source: https://supabase.com/docs/guides/database/extensions/pgvector
import { createServerClient } from '@/lib/supabase/server';

export async function searchNotesSemantic(
  query: string,
  courseId: string,
  threshold = 0.7,
  limit = 5
): Promise<Note[]> {
  const supabase = await createServerClient();

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Call RPC function
  const { data, error } = await supabase.rpc('search_notes_semantic', {
    p_user_id: (await supabase.auth.getUser()).data.user?.id,
    p_embedding: JSON.stringify(queryEmbedding),
    p_match_threshold: threshold,
    p_match_count: limit,
  });

  if (error) throw error;
  return data;
}
```

### Full-text Search (Supabase Client)

```typescript
// Source: https://supabase.com/docs/guides/database/full-text-search
export async function searchNotesFulltext(
  query: string,
  courseId: string
): Promise<Note[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('course_id', courseId)
    .textSearch('fts', query, {
      type: 'plain',
      config: 'simple',
    })
    .limit(10);

  if (error) throw error;
  return data;
}
```

### Note CRUD Server Action

```typescript
// Source: Project patterns from existing actions.ts files
'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/embeddings';

export async function createNote(formData: FormData) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const content = formData.get('content') as string;
  const courseId = formData.get('courseId') as string;
  const chapterId = formData.get('chapterId') as string | null;

  // Generate embedding synchronously
  const embedding = await generateEmbedding(content);

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      course_id: courseId,
      chapter_id: chapterId,
      content,
      embedding: JSON.stringify(embedding),
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/courses/${courseId}`);
  return { data };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `vector` type | `halfvec` type | pgvector 0.7.0 (2024) | 50% storage savings |
| IVFFlat index | HNSW index | pgvector 0.5.0 (2023) | Better recall, no rebalancing |
| Separate vector DB | pgvector in Postgres | 2024-2025 | Simplified architecture |
| text-embedding-ada-002 | text-embedding-3-small | OpenAI Jan 2024 | 5x cheaper, better multilingual |

**Deprecated/outdated:**
- `text-embedding-ada-002`: Zastapiony przez `text-embedding-3-small/large`
- IVFFlat without rebuild: HNSW jest preferowany dla dynamicznych danych
- Pinecone/Weaviate for small scale: pgvector wystarcza dla <1M wektorow

## Open Questions

1. **Chunk size for long notes**
   - What we know: Embedding model ma limit 8191 tokens
   - What's unclear: Czy notatki użytkownika będą przekraczac limit?
   - Recommendation: Monitoruj długość notatek, chunking tylko jeśli potrzebny

2. **Re-embedding strategy**
   - What we know: Trzeba re-embedowac przy edycji notatki
   - What's unclear: Czy użytkownik czesto edytuje notatki?
   - Recommendation: Re-embed przy każdym update, optymalizuj później jeśli problem

3. **Hybrid search ranking**
   - What we know: Można łączyć full-text i vector search
   - What's unclear: Jakie wagi dla każdego typu w UI?
   - Recommendation: Zacznij od full-text dla UI, vector dla RAG, iteruj

## Sources

### Primary (HIGH confidence)

- [Supabase pgvector Docs](https://supabase.com/docs/guides/database/extensions/pgvector) - Extension setup, indexing, queries
- [AI SDK Embeddings](https://ai-sdk.dev/docs/ai-sdk-core/embeddings) - embed/embedMany API
- [Supabase Full-text Search](https://supabase.com/docs/guides/database/full-text-search) - tsvector setup
- [OpenAI text-embedding-3](https://platform.openai.com/docs/models/text-embedding-3-small) - Model specs

### Secondary (MEDIUM confidence)

- [Supabase Automatic Embeddings](https://supabase.com/docs/guides/ai/automatic-embeddings) - Queue-based pattern (not recommended for notes)
- [Neon halfvec Blog](https://neon.com/blog/dont-use-vector-use-halvec-instead-and-save-50-of-your-storage-cost) - halfvec benchmarks
- [AI SDK RAG Guide](https://ai-sdk.dev/cookbook/guides/rag-chatbot) - RAG architecture

### Tertiary (LOW confidence)

- WebSearch results on pgvector pitfalls - Verified with official docs
- Rich text editor comparison - Not needed for this phase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Projekt już ma wszystkie biblioteki
- Architecture: HIGH - Sprawdzone wzorce z Supabase docs
- Embeddings: HIGH - AI SDK oficjalna dokumentacja
- Pitfalls: MEDIUM - Mix oficjalnych docs i community experience

**Research date:** 2026-01-31
**Valid until:** 2026-03-01 (pgvector 0.9.0 może wprowadzic zmiany)
