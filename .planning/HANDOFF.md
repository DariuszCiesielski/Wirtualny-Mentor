# Handoff - Wirtualny Mentor

## Status projektu

**Projekt dziala** - wszystkie glowne funkcje zostaly naprawione i przetestowane.

## Naprawione problemy (2026-01-31)

### 1. AI nie odpowiadala w chacie doprecyzowujacym

**Problem:** Zadanie HTTP nie wychodzilo z przegladarki, pozniej bledy schematu.

**Przyczyny i rozwiazania:**

1. **Format wiadomosci UIMessage vs CoreMessage**
   - `useChat` wysylal wiadomosci w formacie UIMessage (`parts: [{ type: 'text', text: '...' }]`)
   - `streamText` oczekiwal CoreMessage (`content: '...'`)
   - **Fix:** Dodano funkcje `convertToCoreMessages()` w `src/app/api/curriculum/clarify/route.ts`

2. **Schemat Zod niekompatybilny z OpenAI Structured Output**
   - `z.string().url()` - OpenAI nie obsluguje formatu `uri`
   - `.partial()` - OpenAI wymaga wszystkich pol jako required
   - **Fix:** Przepisano `clarificationSchema` w `src/lib/ai/curriculum/schemas.ts`

### 2. Strona glowna bez przyciskow logowania
- **Fix:** Dodane przyciski w `src/app/page.tsx`

### 3. Wiele linkow zrodlowych
- **Fix:** Mozliwosc dodawania wielu zrodel w `src/components/curriculum/topic-input.tsx`

## Konfiguracja (GOTOWE)

- **Supabase**: `https://tzcokufngbmzzspvoogf.supabase.co`
- **OpenAI**: Klucz w `.env.local`
- **Tavily**: `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`
- **Model curriculum**: `gpt-5.2` w `src/lib/ai/providers.ts`

## Zmienne srodowiskowe (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://tzcokufngbmzzspvoogf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...
TAVILY_API_KEY=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
```

## Architektura AI SDK v6

### Wazne wzorce:

1. **UIMessage vs CoreMessage**
   - Frontend (`useChat`) uzywa UIMessage z `parts`
   - Backend (`streamText`) wymaga CoreMessage z `content`
   - Zawsze konwertuj w API route

2. **OpenAI Structured Output wymaga:**
   - Wszystkie pola jako required (bez `.optional()`, `.partial()`)
   - Brak formatow typu `uri`, `email` w schemacie
   - Uzyj describe() do opisania pustych wartosci domyslnych

## Pliki kluczowe

- `src/app/api/curriculum/clarify/route.ts` - API z konwersja wiadomosci
- `src/lib/ai/curriculum/schemas.ts` - Schematy Zod kompatybilne z OpenAI
- `src/components/curriculum/clarifying-chat.tsx` - Komponent chatu
- `src/lib/ai/providers.ts` - Konfiguracja modeli AI

## Do przetestowania

- [x] Logowanie/Rejestracja
- [x] Pytania doprecyzowujace AI
- [ ] Generowanie curriculum
- [ ] Materialy rozdzialow
- [ ] Quizy
- [ ] Notatki
- [ ] Chatbot mentor
