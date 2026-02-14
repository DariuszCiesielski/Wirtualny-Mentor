# HANDOFF: pdfjs-dist worker nie działa w Vercel serverless

## Problem

`pdfjs-dist` v5.4.296 (zależność `pdf-parse`) wymaga Web Worker do parsowania PDF.
W Vercel serverless (Node.js runtime) nie da się go uruchomić:

| Próba | Błąd |
|-------|------|
| `serverExternalPackages: ['pdfjs-dist']` | `Cannot find module pdf.worker.mjs` (plik nie trafia do deploymentu) |
| `workerSrc = ''` | `No "GlobalWorkerOptions.workerSrc" specified` |
| `workerSrc = 'blob:disabled'` | `Only URLs with scheme file, data, node supported` |
| Bundlowanie przez Turbopack (bez external) | Też nie rozwiązuje — fake worker i tak próbuje załadować moduł workera |

## Rozwiązanie: zamienić na `unpdf`

`unpdf` to biblioteka zaprojektowana specjalnie dla serverless. Wewnętrznie używa
pdfjs-dist ale prawidłowo konfiguruje worker (lub go wyłącza) dla każdego środowiska.

### Kroki

1. **Zainstaluj unpdf:**
   ```bash
   npm install unpdf
   ```

2. **Zamień `extractTextFromPDF` w `src/lib/documents/extract.ts`:**
   ```typescript
   async function extractTextFromPDF(buffer: Buffer): Promise<ExtractedText> {
     const { extractText: unpdfExtract } = await import('unpdf');

     const { text, totalPages } = await unpdfExtract(new Uint8Array(buffer));

     return {
       text: text.trim(),
       pageCount: totalPages,
       wordCount: countWords(text.trim()),
     };
   }
   ```

3. **Usuń polyfill DOMMatrix** z góry pliku (unpdf sam to obsługuje)

4. **Wyczyść next.config.ts:**
   ```typescript
   serverExternalPackages: ['mammoth'],  // tylko mammoth
   ```
   (bez pdfjs-dist, bez pdf-parse)

5. **Opcjonalnie odinstaluj pdf-parse** (nie jest już potrzebny):
   ```bash
   npm uninstall pdf-parse
   ```

6. **Build + deploy:**
   ```bash
   npm run build && npx vercel --prod
   ```

### Alternatywa: `pdf2json`

Jeśli `unpdf` też ma problemy, `pdf2json` to czysta implementacja Node.js (nie używa pdfjs-dist):
```bash
npm install pdf2json
```
```typescript
import PDFParser from 'pdf2json';

async function extractTextFromPDF(buffer: Buffer): Promise<ExtractedText> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on('pdfParser_dataReady', (data) => {
      const text = data.Pages
        .map(page => page.Texts.map(t => decodeURIComponent(t.R[0].T)).join(' '))
        .join('\n\n')
        .trim();
      resolve({ text, pageCount: data.Pages.length, wordCount: countWords(text) });
    });
    parser.on('pdfParser_dataError', (err) => reject(err));
    parser.parseBuffer(buffer);
  });
}
```

## Aktualny stan plików

- `src/lib/documents/extract.ts` — bezpośredni import `pdfjs-dist` z DOMMatrix polyfill (NIE DZIAŁA na Vercel)
- `next.config.ts` — `serverExternalPackages: ['mammoth']` (pdfjs-dist bundlowany)
- `src/lib/documents/process.ts` — granularne logi `[Document] Step 1..7`
- `src/hooks/useFileUpload.ts` — wyświetla `processingError` z backendu
- `src/types/source-documents.ts` — pole `processingError` w `UploadedSourceFile`

## Co działa

- Upload do Supabase Storage ✓
- Ekstrakcja DOCX (mammoth) ✓
- Ekstrakcja TXT ✓
- Chunking ✓
- Embeddingi (OpenAI) ✓
- Insert chunks do Supabase ✓
- Error reporting frontend ↔ backend ✓

## Co NIE działa

- **Ekstrakcja PDF** — pdfjs-dist worker w Vercel serverless

## Ważne

- `pdf-parse` v2.4.5 jest zainstalowany ale NIE UŻYWANY (kod używa pdfjs-dist bezpośrednio)
- Ostatni działający commit (bez PDF extraction): `c338bef`
- Tag: `v0.14.0-materials` (na najnowszym commicie z błędem)
