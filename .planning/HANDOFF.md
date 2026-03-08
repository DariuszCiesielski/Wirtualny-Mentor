# Handoff - Wirtualny Mentor

## Status projektu

**Projekt działa** - wszystkie główne funkcje zostały naprawione i przetestowane.

## Naprawione problemy (2026-01-31)

### 1. AI nie odpowiadała w chacie doprecyzowującym

**Problem:** Żądanie HTTP nie wychodziło z przeglądarki, później błędy schematu.

**Przyczyny i rozwiązania:**

1. **Format wiadomości UIMessage vs CoreMessage**
   - `useChat` wysyłał wiadomości w formacie UIMessage (`parts: [{ type: 'text', text: '...' }]`)
   - `streamText` oczekiwał CoreMessage (`content: '...'`)
   - **Fix:** Dodano funkcję `convertToCoreMessages()` w `src/app/api/curriculum/clarify/route.ts`

2. **Schemat Zod niekompatybilny z OpenAI Structured Output**
   - `z.string().url()` - OpenAI nie obsługuje formatu `uri`
   - `.partial()` - OpenAI wymaga wszystkich pól jako required
   - **Fix:** Przepisano `clarificationSchema` w `src/lib/ai/curriculum/schemas.ts`

### 2. Strona główna bez przycisków logowania
- **Fix:** Dodane przyciski w `src/app/page.tsx`

### 3. Wiele linków źródłowych
- **Fix:** Możliwość dodawania wielu źródeł w `src/components/curriculum/topic-input.tsx`

## Konfiguracja (GOTOWE)

- **Supabase**: `https://tzcokufngbmzzspvoogf.supabase.co`
- **OpenAI**: Klucz w `.env.local`
- **Tavily**: `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`
- **Model curriculum**: `gpt-5.2` w `src/lib/ai/providers.ts`

## Zmienne środowiskowe (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://tzcokufngbmzzspvoogf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...
TAVILY_API_KEY=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
```

## Architektura AI SDK v6

### Ważne wzorce:

1. **UIMessage vs CoreMessage**
   - Frontend (`useChat`) używa UIMessage z `parts`
   - Backend (`streamText`) wymaga CoreMessage z `content`
   - Zawsze konwertuj w API route

2. **OpenAI Structured Output wymaga:**
   - Wszystkie pola jako required (bez `.optional()`, `.partial()`)
   - Brak formatów typu `uri`, `email` w schemacie
   - Użyj describe() do opisania pustych wartości domyślnych

## Pliki kluczowe

- `src/app/api/curriculum/clarify/route.ts` - API z konwersją wiadomości
- `src/lib/ai/curriculum/schemas.ts` - Schematy Zod kompatybilne z OpenAI
- `src/components/curriculum/clarifying-chat.tsx` - Komponent chatu
- `src/lib/ai/providers.ts` - Konfiguracja modeli AI

## Do przetestowania

- [x] Logowanie/Rejestracja
- [x] Pytania doprecyzowujące AI
- [ ] Generowanie curriculum
- [ ] Materiały rozdziałów
- [ ] Quizy
- [ ] Notatki
- [ ] Chatbot mentor
