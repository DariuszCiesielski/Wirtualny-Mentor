# Phase 10: Business Ideas & Lead Generation - Research

**Researched:** 2026-03-08
**Domain:** Next.js App Router page + DAL queries + UI components (no new deps)
**Confidence:** HIGH

## Summary

Faza 10 to czysto frontendowo-bazodanowa implementacja bez nowych zależności npm. Wszystkie elementy bazują na istniejących wzorcach w projekcie: server page z `requireAuth()` + `ContentContainer`, DAL z `createClient()`, shadcn/ui `Card`/`Alert`/`Select`, sidebar z tablicą `navItems`.

Dane kontaktowe z ENV (`CONTACT_EMAIL`, `CONTACT_PHONE`, `CONTACT_FORM_URL`) muszą być dostępne tylko server-side (bez prefiksu `NEXT_PUBLIC_`), przekazywane jako props do client component.

**Primary recommendation:** Strona `/business-ideas` jako server component (dane z DAL + ENV), z client component `BusinessIdeasClient` do filtrowania/expand/collapse.

## Standard Stack

### Core (already installed, zero new deps)
| Library | Purpose | Why |
|---------|---------|-----|
| Next.js 16 App Router | Server page + layout | Istniejacy stack |
| shadcn/ui Card | Karty pomyslow | Spójność z InlineSuggestion |
| shadcn/ui Alert | Disclaimer | Neutralny alert z ikona Info |
| shadcn/ui Select | Filtr po kursie + sortowanie | Używany w onboarding, quiz |
| shadcn/ui Badge | Zlozonosc, licznik | Istniejacy wzorzec |
| lucide-react | Lightbulb, Info, Mail, Phone, ExternalLink, Bookmark, Trash2 | Istniejace ikony |

### No new packages needed
Wszystko jest juz w projekcie. Nie instalujemy niczego nowego (zgodnie z decyzja "v2.0: Zero new npm dependencies").

## Architecture Patterns

### Recommended Structure
```
src/
├── app/(dashboard)/business-ideas/
│   └── page.tsx                      # Server component (auth + data + ENV)
├── components/business-ideas/
│   ├── InlineSuggestion.tsx          # [EXISTING] inline card in lesson
│   ├── GenerateSuggestionButton.tsx  # [EXISTING] generate button
│   ├── BusinessIdeasClient.tsx       # [NEW] client wrapper (filter/sort/expand)
│   ├── IdeaCard.tsx                  # [NEW] expand/collapse card
│   └── ContactCTA.tsx               # [NEW] contact CTA box
├── lib/business-ideas/
│   └── ideas-dal.ts                  # [EXTEND] add 2 new functions
└── components/layout/
    ├── sidebar.tsx                    # [MODIFY] add nav item
    └── mobile-nav.tsx                 # [MODIFY] add nav item (separate navItems array!)
```

### Pattern 1: Server Page + Client Wrapper (hybrid)
**What:** Server component fetches data + reads ENV, passes to client component for interactivity
**When to use:** Page needs both server-side data (auth, DB, ENV) and client-side state (filter, expand)

```typescript
// page.tsx (server)
export default async function BusinessIdeasPage() {
  const user = await requireAuth();
  const [suggestions, courses] = await Promise.all([
    getBookmarkedSuggestions(user.id),
    getCoursesWithBookmarks(user.id),
  ]);

  // ENV - server only, no NEXT_PUBLIC_ prefix
  const contactInfo = {
    email: process.env.CONTACT_EMAIL || null,
    phone: process.env.CONTACT_PHONE || null,
    formUrl: process.env.CONTACT_FORM_URL || null,
  };
  const hasContact = !!(contactInfo.email || contactInfo.phone || contactInfo.formUrl);

  return (
    <ContentContainer className="py-8">
      <BusinessIdeasClient
        suggestions={suggestions}
        courses={courses}
        contactInfo={hasContact ? contactInfo : null}
      />
    </ContentContainer>
  );
}
```

### Pattern 2: Expand/Collapse with First-N-Expanded
**What:** Local state tracking which cards are expanded, initialized with first 3
**When to use:** List of items where some start expanded

```typescript
// Initial state: first 3 IDs expanded
const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
  const initial = new Set<string>();
  suggestions.slice(0, 3).forEach(s => initial.add(s.id));
  return initial;
});

const toggleExpand = (id: string) => {
  setExpandedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};
```

### Pattern 3: DAL with JOIN (Supabase PostgREST embedded resources)
**What:** Fetch bookmarked suggestions with course/chapter titles via PostgREST joins
**When to use:** Need related table data in a single query

```typescript
// Supabase PostgREST join syntax
const { data } = await supabase
  .from("business_suggestions")
  .select(`
    *,
    courses!inner ( id, title ),
    chapters!inner ( id, title, level_id )
  `)
  .eq("user_id", userId)
  .eq("is_bookmarked", true)
  .eq("is_dismissed", false)
  .order("created_at", { ascending: false });
```

**UWAGA:** `business_suggestions` MA bezposrednie FK na `course_id` i `chapter_id`, wiec JOINy sa bezposrednie. `level_id` jest kolumna w `chapters` (FK do `course_levels`) — potrzebny do budowania URL lekcji.

### Anti-Patterns to Avoid
- **Nie uzywaj `NEXT_PUBLIC_` dla danych kontaktowych** — to server-only data, nie powinno trafiac do bundla klienta
- **Nie rob osobnych fetchow per karta** — jeden query z JOINem w DAL
- **Nie hardcoduj tekstu CTA w kliencie** — przekazuj z serwera jako props (latwiejsze zmiany)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Filtrowanie listy | Custom filter logic | `useMemo` + `Array.filter` | Prosta lista, < 100 items |
| Select dropdown | Custom dropdown | shadcn `Select` | Juz uzywany w onboarding |
| Alert/disclaimer | Custom banner | shadcn `Alert` + `AlertTitle` + `AlertDescription` | Komponent istnieje |
| Expand/collapse | Custom accordion | Lokalne state `Set<string>` | Prostsze niz Accordion (potrzebujemy multi-expand) |
| Empty states | Custom layout | Wzorzec z `notes/page.tsx` i `courses/page.tsx` | Card + icon + tekst + button |

**Key insight:** shadcn Accordion nie obsluguje "pierwsze 3 otwarte" out of the box — prostsza jest reczna implementacja z `Set<string>` i warunkowym renderowaniem.

## Common Pitfalls

### Pitfall 1: ENV Variables Not Available Client-Side
**What goes wrong:** Uzywanie `process.env.CONTACT_EMAIL` w client component — zwraca undefined
**Why it happens:** Bez prefiksu `NEXT_PUBLIC_` zmienne ENV sa dostepne tylko server-side
**How to avoid:** Czytaj ENV w server component (`page.tsx`), przekazuj jako props do client component
**Warning signs:** `contactInfo` jest null mimo ustawionych ENV

### Pitfall 2: Supabase PostgREST JOIN syntax
**What goes wrong:** Proba JOINa na tabeli bez FK daje blad lub puste dane
**Why it happens:** PostgREST wymaga FK relationships miedzy tabelami
**How to avoid:** `business_suggestions` ma FK na `course_id` i `chapter_id` — JOIN jest bezposredni. Uzyj `select("*, courses(title), chapters(title, level_id)")`.
**Warning signs:** Puste `courses` lub `chapters` w response

### Pitfall 3: Expand State Reset on Filter Change
**What goes wrong:** Po zmianie filtra karty zachowuja stary stan expand
**Why it happens:** `expandedIds` nie jest resetowane przy zmianie `filteredSuggestions`
**How to avoid:** Reset `expandedIds` w useEffect na zmiane filtra, zachowujac regule "pierwsze 3 otwarte"

### Pitfall 4: Sidebar navItems Position
**What goes wrong:** Nowy item dodany na koncu zamiast po "Notatki"
**Why it happens:** `navItems` to tablica — dodanie `.push()` doda na koniec
**How to avoid:** Wstaw element na indeks 3 (po Notatki, przed Profil) w tablicy `navItems`

### Pitfall 5: Un-bookmark Refreshes Entire Page
**What goes wrong:** Po usunieciu bookmarki strona sie przeladowuje (server action + revalidate)
**Why it happens:** Domyslny pattern server actions z `revalidatePath`
**How to avoid:** Uzyj optimistic update — usun karte z lokalnego state, wywolaj `bookmarkSuggestion` w tle. Jesli fail — przywroc.

### Pitfall 6: MobileNav has SEPARATE navItems array
**What goes wrong:** Pomysly biznesowe widoczne w sidebar desktop, ale brakuje ich w mobile
**Why it happens:** `mobile-nav.tsx` ma WLASNA tablice `navItems` (nie importuje z `sidebar.tsx`)
**How to avoid:** Zaktualizuj navItems w OBU plikach: `sidebar.tsx` ORAZ `mobile-nav.tsx`. Dodaj import `Lightbulb` w obu.
**Warning signs:** Element widoczny na desktop, niewidoczny na mobile

## Code Examples

### DAL: getBookmarkedSuggestions
```typescript
// ideas-dal.ts (extend existing file)
export async function getBookmarkedSuggestions(
  userId: string,
  courseId?: string
): Promise<BookmarkedSuggestionWithContext[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return [];

  let query = supabase
    .from("business_suggestions")
    .select(`
      id, title, description, business_potential, estimated_complexity,
      relevant_section, course_id, chapter_id, created_at,
      courses ( title ),
      chapters ( title, level_id )
    `)
    .eq("user_id", userId)
    .eq("is_bookmarked", true)
    .eq("is_dismissed", false)
    .order("created_at", { ascending: false });

  if (courseId) {
    query = query.eq("course_id", courseId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[ideas-dal] getBookmarkedSuggestions error:", error);
    return [];
  }

  return (data ?? []).map(row => ({
    ...row,
    course_title: (row.courses as { title: string })?.title ?? "Kurs bez nazwy",
    chapter_title: (row.chapters as { title: string; level_id: string })?.title ?? "Rozdział bez nazwy",
    level_id: (row.chapters as { title: string; level_id: string })?.level_id ?? "",
  }));
}
```

### DAL: getCoursesWithBookmarks
```typescript
export async function getCoursesWithBookmarks(
  userId: string
): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return [];

  // Get distinct course_ids from bookmarked suggestions
  const { data, error } = await supabase
    .from("business_suggestions")
    .select("course_id, courses ( id, title )")
    .eq("user_id", userId)
    .eq("is_bookmarked", true)
    .eq("is_dismissed", false);

  if (error || !data) return [];

  // Deduplicate courses
  const seen = new Set<string>();
  const courses: { id: string; title: string }[] = [];
  for (const row of data) {
    if (!seen.has(row.course_id)) {
      seen.add(row.course_id);
      courses.push({
        id: row.course_id,
        title: (row.courses as { id: string; title: string })?.title ?? "Kurs bez nazwy",
      });
    }
  }

  return courses;
}
```

### Sidebar Modification (BOTH files!)
```typescript
// sidebar.tsx AND mobile-nav.tsx — insert after "Notatki" (index 2), before "Profil" (index 3)
// Add Lightbulb to import from lucide-react
import { Home, BookOpen, FileText, Lightbulb, User, ShieldCheck } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home, disabled: false },
  { label: "Moje kursy", href: "/courses", icon: BookOpen, disabled: false },
  { label: "Notatki", href: "/notes", icon: FileText, disabled: false },
  { label: "Pomysły biznesowe", href: "/business-ideas", icon: Lightbulb, disabled: false },
  { label: "Profil", href: "/profile", icon: User, disabled: false },
];
```

### ContactCTA Component
```typescript
// ContactCTA.tsx
interface ContactInfo {
  email: string | null;
  phone: string | null;
  formUrl: string | null;
}

function ContactCTA({ contactInfo }: { contactInfo: ContactInfo }) {
  // Don't render if no contact info at all
  if (!contactInfo.email && !contactInfo.phone && !contactInfo.formUrl) {
    return null;
  }

  const primaryAction = contactInfo.formUrl
    ? { href: contactInfo.formUrl, label: "Napisz wiadomość", icon: ExternalLink }
    : contactInfo.email
    ? { href: `mailto:${contactInfo.email}`, label: "Napisz wiadomość", icon: Mail }
    : null;

  return (
    <div className="mt-4 rounded-lg border bg-muted/50 p-4 space-y-3">
      <h4 className="font-medium text-sm">
        Chcesz sprawdzić, czy ten pomysł ma sens w Twoim przypadku?
      </h4>
      <p className="text-sm text-muted-foreground">
        Możemy omówić zakres, wykonalność i prostą wersję startową.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        {primaryAction && (
          <Button asChild size="sm">
            <a href={primaryAction.href} target={contactInfo.formUrl ? "_blank" : undefined}>
              <primaryAction.icon className="h-4 w-4 mr-2" />
              {primaryAction.label}
            </a>
          </Button>
        )}
        {contactInfo.phone && (
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:${contactInfo.phone}`}>
              <Phone className="h-4 w-4 mr-2" />
              {contactInfo.phone}
            </a>
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground italic">
        To inspiracja, nie gotowa rekomendacja biznesowa.
      </p>
    </div>
  );
}
```

### Disclaimer (Alert)
```typescript
<Alert className="mb-6">
  <Info className="h-4 w-4" />
  <AlertTitle>Informacja</AlertTitle>
  <AlertDescription>
    Pomysły na tej stronie mają charakter inspiracyjny i edukacyjny.
    Przed wdrożeniem oceń ich wykonalność, koszty i dopasowanie do swojej firmy.
  </AlertDescription>
</Alert>
```

### Empty State Pattern (reuse from notes/courses)
```typescript
// Empty state — Card centered with icon, heading, description, action button
<Card className="py-12">
  <CardContent className="flex flex-col items-center justify-center text-center px-4 py-0">
    <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-4">{description}</p>
    <Button asChild variant="outline">
      <Link href={actionHref}>{actionLabel}</Link>
    </Button>
  </CardContent>
</Card>
```

### Link to Lesson (chapter URL pattern)
```typescript
// URL pattern: /courses/[courseId]/[levelId]/[chapterId]
// chapters table has level_id FK — include in JOIN select
.select(`
  ...,
  chapters ( title, level_id )
`)

// Then construct URL:
const lessonUrl = `/courses/${suggestion.course_id}/${suggestion.level_id}/${suggestion.chapter_id}`;
```

**IMPORTANT:** URL lekcji wymaga `levelId`. Trzeba pobrac `level_id` z tabeli `chapters` w JOIN.

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Accordion from shadcn | Manual expand with Set\<string\> | Multi-expand + first-3-open control |
| ENV in client | Server component reads ENV, passes as props | Security + simplicity |
| revalidatePath on bookmark toggle | Optimistic update in client state | Faster UX |

## New Types Needed

```typescript
// types/business-ideas.ts (extend)
export interface BookmarkedSuggestionWithContext {
  id: string;
  title: string;
  description: string;
  business_potential: string;
  estimated_complexity: "prosty" | "sredni" | "zlozony";
  relevant_section: string | null;
  course_id: string;
  chapter_id: string;
  created_at: string;
  course_title: string;
  chapter_title: string;
  level_id: string; // needed for lesson link URL
}

export interface ContactInfo {
  email: string | null;
  phone: string | null;
  formUrl: string | null;
}
```

## Open Questions

1. **level_id for lesson links**
   - What we know: URL pattern is `/courses/[courseId]/[levelId]/[chapterId]`. Chapters have `level_id` FK.
   - What's unclear: Whether PostgREST JOIN `chapters(title, level_id)` returns `level_id` cleanly in all cases.
   - Recommendation: Include `level_id` in SELECT, test the JOIN. Should work since it's a direct column on `chapters`.

## Sources

### Primary (HIGH confidence)
- `src/lib/business-ideas/ideas-dal.ts` — existing DAL patterns
- `src/components/business-ideas/InlineSuggestion.tsx` — visual design reference (complexityConfig, amber accent, Lightbulb icon)
- `src/components/layout/sidebar.tsx` — nav items array structure (line 16-41)
- `src/components/layout/mobile-nav.tsx` — SEPARATE nav items array (line 25-50, must update both!)
- `src/app/(dashboard)/notes/page.tsx` — empty state + ContentContainer pattern
- `src/app/(dashboard)/courses/page.tsx` — empty state pattern
- `supabase/migrations/20260309000001_business_suggestions.sql` — DB schema (FK to courses, chapters)
- `supabase/migrations/20260130000001_courses_schema.sql` — courses/chapters/course_levels schema
- `src/components/ui/alert.tsx` — Alert component API (default + destructive variants)
- `src/components/ui/select.tsx` — Select component exists
- `src/lib/dal/auth.ts` — requireAuth() pattern (redirect to /login)

### Secondary (MEDIUM confidence)
- Next.js ENV variable behavior (server-only without NEXT_PUBLIC_) — well-documented standard

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components already exist in project
- Architecture: HIGH — follows established patterns (notes page, courses page)
- DAL queries: HIGH — PostgREST JOIN is standard, FK relationships confirmed in schema
- Pitfalls: HIGH — based on direct code review of both sidebar.tsx and mobile-nav.tsx
- ENV pattern: HIGH — standard Next.js behavior

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable, no external deps)
