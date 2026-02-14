# HANDOFF: Upload PDF processing timeout na Vercel

## Problem

Przetwarzanie uploadowanych dokumentów (PDF/DOCX/TXT) nie kończy się na Vercel serverless.
Pipeline: extract text → chunk → embed (OpenAI) → insert chunks (Supabase) — zajmuje >60s dla typowego PDF (17475 słów, ~87 chunków).

### Co wypróbowano i NIE DZIAŁA

| Podejście | Rezultat |
|-----------|----------|
| Synchroniczne bez `maxDuration` | 504 timeout (domyślne 10s) |
| Synchroniczne z `maxDuration=60` | 504 timeout (60s nie wystarcza lub Hobby plan nie respektuje) |
| `after()` (Next.js 16) + `maxDuration=60` | Response 200, ale `waitUntil` limitowane do 30s na Hobby → chunki nigdy nie trafiają do DB |
| `after()` + przekazanie Supabase client przez closure | j.w. — client działa ale czas za krótki |

### Kluczowe ustalenia z logów Vercel (MCP get_runtime_logs)

- `unpdf` ekstrakcja **DZIAŁA** — Step 2 OK: 17475 words
- Embeddingi **zaczynają się** — "[Embedding Batch] Texts: 50..." widoczne w logach
- Pipeline **nie dobiega do końca** — brak Step 6 (insert chunks) i Step 7 (completed)
- Dokumenty w DB mają status `processing` bez żadnych chunków
- Vercel Hobby: `waitUntil` (after) = max 30s, function = max 60s

## Aktualny stan kodu (po tej sesji)

### Pliki zmienione

1. **`src/lib/documents/extract.ts`** — `pdfjs-dist` zamieniony na `unpdf` (serverless-friendly, działa!)
2. **`src/app/api/curriculum/upload/route.ts`** — synchroniczne przetwarzanie + `maxDuration=60` (nie wystarczające)
3. **`src/lib/documents/process.ts`** — przyjmuje opcjonalny `supabase?: SupabaseClient` (5ty parametr)
4. **`src/lib/dal/source-documents.ts`** — `updateDocumentStatus`, `updateDocumentText`, `insertChunks` mają opcjonalny `client?: SupabaseClient`
5. **`src/hooks/useFileUpload.ts`** — dodany polling co 2s dla statusu `processing` (Supabase browser client)
6. **`next.config.ts`** — usunięte komentarze o pdfjs-dist
7. **`package.json`** — `unpdf` dodany, `pdf-parse` i `pdfjs-dist` usunięte

### Co działa
- Upload do Supabase Storage ✓
- Tworzenie rekordu dokumentu w DB ✓
- Ekstrakcja tekstu z PDF (unpdf) ✓ (potwierdzone w logach: 17475 words)
- Ekstrakcja DOCX (mammoth) ✓
- Ekstrakcja TXT ✓
- Chunking ✓
- Generowanie embeddingów (OpenAI) ✓ (zaczyna się, ale nie kończy z powodu timeout)
- Frontend polling ✓
- Error reporting ✓

### Co NIE działa
- **Pełny pipeline na Vercel** — timeout zanim embeddingi + insert chunków się zakończą

## Proponowane rozwiązania (do implementacji)

### Opcja A: Dwuetapowe przetwarzanie (REKOMENDOWANE)
Rozdziel pipeline na 2 requesty:
1. **Upload route** (≤30s): upload → extract text → chunk → zapisz tekst + chunki BEZ embeddingów → zwróć odpowiedź
2. **Nowy endpoint `/api/curriculum/embed-chunks`** (≤60s): pobierz chunki bez embeddingów → embed batch → update chunki → zwróć
3. Frontend: po udanym upload wywołuje embed-chunks, pokazuje progress

Zalety: każdy krok mieści się w limicie, nie wymaga infrastruktury poza Vercel.

### Opcja B: QStash (Vercel background jobs)
1. `npm install @upstash/qstash`
2. Upload route: upload + create record → publish message do QStash
3. QStash wywołuje `/api/curriculum/process-webhook` z retry
4. Webhook endpoint przetwarza dokument (300s timeout na Pro, lub dzieli na etapy)

### Opcja C: Supabase Edge Function
1. Upload route: upload + create record → trigger Supabase Edge Function
2. Edge Function: extract + chunk + embed + insert (400s limit)
3. Frontend: polling (już gotowy)

### Opcja D: Zewnętrzny serwis
Użytkownik wspomniał o możliwości użycia zewnętrznego serwisu do skanowania dokumentów.

### Opcja E: Upgrade do Vercel Pro
- `maxDuration = 300` (5 min)
- Najprostsze ale kosztowne

## Wąskie gardło: embeddingi

Dla 87 chunków (2 batche po 50):
- OpenAI `text-embedding-3-small` batch = ~3-5s per batch
- Insert 87 rows z halfvec(1536) = kilka sekund
- **Łącznie: ~15-30s TYLKO na embeddingi + insert** (po ekstrakcji i chunkingu)

Ekstrakcja + chunking = szybkie (~2-5s). Embeddingi + DB insert = wąskie gardło.

## Cleanup potrzebny w DB

Wiele dokumentów utknęło w statusie `processing` bez chunków:

```sql
DELETE FROM course_source_documents
WHERE processing_status IN ('processing', 'pending')
AND id NOT IN (SELECT DISTINCT document_id FROM course_source_chunks);
```

## Kluczowe pliki

- `src/app/api/curriculum/upload/route.ts` — endpoint uploadu (sync, maxDuration=60)
- `src/lib/documents/process.ts` — pipeline orchestrator
- `src/lib/documents/extract.ts` — ekstrakcja (unpdf/mammoth/txt)
- `src/lib/documents/chunk.ts` — chunking tekstu
- `src/lib/ai/embeddings.ts` — OpenAI embeddings (text-embedding-3-small)
- `src/lib/dal/source-documents.ts` — DAL (CRUD + semantic search, opcjonalny client)
- `src/hooks/useFileUpload.ts` — hook z pollingiem
- `src/types/source-documents.ts` — typy
