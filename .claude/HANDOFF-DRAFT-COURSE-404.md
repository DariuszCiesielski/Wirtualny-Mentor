# Handoff: Problem z 404 dla szkiców kursów

## Problem
Po kliknieciu w szkic kursu (status: "draft") na stronie `/courses/783b81ff-51d7-4cea-85a7-c87f059f3da1` wyswietla sie blad 404, mimo ze:
- Kurs istnieje w bazie (potwierdzenie w logach)
- Status kursu to "draft" (potwierdzenie w logach)
- Strona zwraca HTTP 200 w logach serwera

## Co zostalo zrobione

### 1. Naprawiono wielokrotne tworzenie szkicow
Pliki:
- `src/app/(dashboard)/courses/new/page.tsx` - dodano `courseCreationStarted` ref i `useCallback`
- `src/components/curriculum/clarifying-chat.tsx` - dodano `completionCalled` ref i `onCompleteRef`

### 2. Dodano obsluge szkicow w stronie kursu
Plik: `src/app/(dashboard)/courses/[courseId]/page.tsx`
- Dodano warunek `if (course.status === "draft")` ktory powinien zwracac UI z przyciskami "Utworz nowy kurs" i "Usun szkic"
- Dodano logowanie: `console.log("[CoursePage] courseId:", courseId, "course:", course?.id, "status:", course?.status);`

### 3. Logi serwera pokazuja
```
[CoursePage] courseId: 783b81ff-51d7-4cea-85a7-c87f059f3da1 course: 783b81ff-51d7-4cea-85a7-c87f059f3da1 status: draft
GET /courses/783b81ff-51d7-4cea-85a7-c87f059f3da1 200 in 376ms
```
Serwer zwraca 200 i kurs ma status draft, ale uzytkownik widzi 404.

## Hipotezy do sprawdzenia

1. **Next.js Full Route Cache** - moze byc cache'owana stara wersja strony z 404
   - Sprawdz `.next/cache/`
   - Dodaj `export const dynamic = 'force-dynamic'` do strony

2. **Client-side routing** - React moze renderowac stara wersje komponentu
   - Sprawdz czy nie ma client-side cache w przegladarce
   - Sprawdz Network tab w DevTools

3. **not-found.tsx boundary** - moze byc przechwytywany przez rodzica
   - Sprawdz czy nie ma `not-found.tsx` w `src/app/(dashboard)/courses/[courseId]/`

4. **Streaming/Suspense** - SSR moze byc przerywany
   - Sprawdz czy nie ma bledow w renderowaniu

## Kluczowe pliki

- `src/app/(dashboard)/courses/[courseId]/page.tsx` - strona kursu (zmodyfikowana)
- `src/app/(dashboard)/courses/new/page.tsx` - tworzenie kursu (zmodyfikowana)
- `src/components/curriculum/clarifying-chat.tsx` - chat doprecyzowujacy (zmodyfikowany)
- `src/lib/dal/courses.ts` - DAL dla kursow
- `middleware.ts` - middleware Supabase (sprawdzony, OK)

## Serwer deweloperski
Dziala na `http://localhost:3001` (port 3000 byl zajety)

## Nastepne kroki
1. Dodaj `export const dynamic = 'force-dynamic'` do `src/app/(dashboard)/courses/[courseId]/page.tsx`
2. Sprawdz Network tab w przegladarce - czy odpowiedz HTTP zawiera poprawny HTML
3. Sprawdz czy nie ma not-found.tsx w podfolderach
4. Rozważ dodanie `export const revalidate = 0` do wylaczenia cache
