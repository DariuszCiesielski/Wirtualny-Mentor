# Phase 8: Business Onboarding - Research

**Researched:** 2026-03-08
**Domain:** User onboarding flow, business profile persistence, AI chat integration, curriculum prompt injection
**Confidence:** HIGH

## Summary

Faza 8 dodaje profil biznesowy użytkownika (formularz + opcjonalny chat AI) i integruje go z generowaniem kursów. Cały stos technologiczny już istnieje w projekcie — nie potrzeba żadnych nowych bibliotek. Wzorce DAL (server actions), chat AI (useChat + streamText), schema Zod, migracje SQL z RLS są dobrze ustalone i należy je powtórzyć.

Kluczowe odkrycia: (1) shadcn/ui NIE ma komponentu Combobox — trzeba go zbudować z Popover + Command, ale w projekcie brakuje obu komponentów (trzeba je dodać przez `npx shadcn@latest add`), (2) ClarifyingChat to idealny wzorzec dla onboarding chatu — ten sam pattern useChat + streamText + structured output, (3) curriculum injection jest prosty — wystarczy dodać kontekst biznesowy do promptu w `/api/curriculum/clarify` i `/api/curriculum/generate`.

**Primary recommendation:** Zbudować moduł `src/lib/onboarding/` według wzorca focus/gamification, użyć istniejącego patternu ClarifyingChat dla chatu AI onboardingu, dodać komponent Combobox (Popover+Command z shadcn/ui).

## Standard Stack

### Core (już w projekcie — zero nowych dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase (PostgREST + RLS) | existing | Tabela `user_business_profiles` | Wszystkie dane użytkownika są w Supabase |
| Vercel AI SDK v6 (`ai`, `@ai-sdk/react`) | existing | Chat AI onboardingu (useChat + streamText) | Ten sam pattern co ClarifyingChat |
| Zod 4 (`zod/v4`) | existing | Walidacja formularza + schema structured output | Standard projektu |
| shadcn/ui | existing | Formularz (Input, Textarea, Select, Label, Button, Card) | Standard UI |
| Server Actions (`"use server"`) | existing | DAL dla CRUD profilu biznesowego | Wzorzec z focus-dal.ts, gamification-dal.ts |

### Supporting (wymaga dodania komponentów shadcn/ui)
| Component | Purpose | How to Add |
|-----------|---------|------------|
| Popover | Dropdown dla Combobox | `npx shadcn@latest add popover` |
| Command | Searchable list dla Combobox | `npx shadcn@latest add command` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Combobox (Popover+Command) | Zwykły Select | Select nie pozwala na free-text "Inne" — wymaganie CONTEXT.md |
| Nowy `/api/onboarding/chat` | Reuse `/api/curriculum/clarify` | Osobny endpoint jest czystszy — inny system prompt, inny schema |
| Tabela DB `user_business_profiles` | user_metadata w Supabase Auth | user_metadata jest ograniczona (brak query, brak RLS) |

**Installation:**
```bash
npx shadcn@latest add popover command
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/onboarding/
│   ├── onboarding-dal.ts        # Server actions: CRUD profilu biznesowego
│   ├── schemas.ts               # Zod schemas: formularz + AI chat response
│   └── prompts.ts               # System prompt dla onboarding chatu
├── components/onboarding/
│   ├── business-profile-form.tsx # Formularz 4 pól (client component)
│   ├── onboarding-chat.tsx       # Chat AI doprecyzowujący (client component)
│   ├── onboarding-banner.tsx     # Banner na dashboardzie (client component — useState dismiss)
│   └── combobox.tsx              # Reusable Combobox (Popover + Command)
├── app/(dashboard)/
│   ├── onboarding/page.tsx       # Dedykowana strona onboardingu
│   └── profile/page.tsx          # Rozszerzony o sekcję "Profil biznesowy"
├── app/api/onboarding/
│   └── chat/route.ts             # API endpoint dla onboarding chatu
└── types/
    └── onboarding.ts             # Typy TypeScript
```

### Pattern 1: DAL Server Actions (wzorzec z gamification-dal.ts)
**What:** Każda operacja na danych jest server action z `"use server"`, tworzącą klienta Supabase i weryfikującą auth.
**When to use:** Każdy CRUD na `user_business_profiles`.
**Example:**
```typescript
// src/lib/onboarding/onboarding-dal.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import type { BusinessProfile, BusinessProfileInput } from "@/types/onboarding";

export async function getBusinessProfile(): Promise<BusinessProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_business_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

export async function saveBusinessProfile(
  input: BusinessProfileInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Upsert: insert or update
  const { error } = await supabase
    .from("user_business_profiles")
    .upsert({
      user_id: user.id,
      industry: input.industry,
      role: input.role,
      business_goal: input.business_goal,
      company_size: input.company_size || null,
      experience_summary: input.experience_summary || null,
      onboarding_completed: true,
    }, { onConflict: "user_id" });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
```

### Pattern 2: Onboarding Chat (wzorzec z ClarifyingChat)
**What:** useChat z DefaultChatTransport, structured output (streamText + Output.object), parsowanie JSON z message parts.
**When to use:** Opcjonalny chat AI po wypełnieniu formularza.
**Example:**
```typescript
// src/app/api/onboarding/chat/route.ts
import { streamText, Output } from "ai";
import { getModel } from "@/lib/ai/providers";
import { onboardingChatSchema } from "@/lib/onboarding/schemas";
import { ONBOARDING_CHAT_SYSTEM_PROMPT } from "@/lib/onboarding/prompts";

export async function POST(req: Request) {
  const { messages, profileData } = await req.json();

  const systemPrompt = ONBOARDING_CHAT_SYSTEM_PROMPT
    .replace("{industry}", profileData.industry)
    .replace("{role}", profileData.role)
    .replace("{goal}", profileData.business_goal);

  const result = streamText({
    model: getModel("curriculum"), // GPT-5.2
    system: systemPrompt,
    messages,
    experimental_output: Output.object({ schema: onboardingChatSchema }),
  });

  return result.toUIMessageStreamResponse();
}
```

### Pattern 3: Curriculum Prompt Injection
**What:** Dodanie kontekstu biznesowego do system promptu i user promptu w generowaniu kursów.
**When to use:** W `/api/curriculum/clarify` i `/api/curriculum/generate`.
**Example:**
```typescript
// W /api/curriculum/clarify/route.ts — rozszerzenie systemPrompt
let systemPrompt = CLARIFYING_SYSTEM_PROMPT;

// Inject business profile context (if exists)
if (businessProfile) {
  systemPrompt += `\n\nKONTEKST BIZNESOWY UŻYTKOWNIKA:
- Branża: ${businessProfile.industry}
- Rola: ${businessProfile.role}
- Cel biznesowy: ${businessProfile.business_goal}
${businessProfile.experience_summary ? `- Podsumowanie: ${businessProfile.experience_summary}` : ""}

DODATKOWE ZASADY:
- Zadaj 1-2 pytania doprecyzowujące w kontekście biznesowym użytkownika
- Proponuj praktyczne przykłady z branży ${businessProfile.industry}`;
}

// W /api/curriculum/generate/route.ts — rozszerzenie user prompt
const businessContext = businessProfile
  ? `\n## Kontekst biznesowy użytkownika:\n- Branża: ${businessProfile.industry}\n- Rola: ${businessProfile.role}\n- Cel: ${businessProfile.business_goal}\n${businessProfile.experience_summary || ""}\n\nDostosuj przykłady i case studies do branży użytkownika.`
  : "";
```

### Anti-Patterns to Avoid
- **NIE używaj user_metadata do profilu biznesowego:** user_metadata jest do prostych danych (name, avatar). Profil biznesowy to structured data — używaj osobnej tabeli z RLS.
- **NIE twórz wizarda wielokrokowego:** Decyzja z CONTEXT.md — jeden ekran z 4 polami, nie wizard.
- **NIE persystuj dismiss bannera w DB:** useState wystarczy (CONTEXT.md).
- **NIE używaj upsert z partial index:** PostgREST problem znany z lesson-images. Tutaj upsert z `onConflict: "user_id"` jest bezpieczny bo UNIQUE jest na całej kolumnie.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Combobox (select + free-text) | Custom dropdown | shadcn/ui Popover + Command | Accessible, keyboard navigation, search built-in |
| Chat AI z structured output | Custom fetch + SSE parsing | useChat + streamText + Output.object | Wzorzec z ClarifyingChat, przetestowany w projekcie |
| Formularz z walidacją | Custom validation | Zod 4 schema + useActionState | Wzorzec z profile-form.tsx |
| RLS policies | Application-level auth checks | Supabase RLS (auth.uid() = user_id) | Defense in depth, wzorzec z focus_sessions |

**Key insight:** Cały stos jest już w projekcie. Każdy pattern (DAL, chat, formularz, migracja) ma działający precedens do skopiowania.

## Common Pitfalls

### Pitfall 1: Brak Popover i Command w projekcie
**What goes wrong:** Projekt NIE MA jeszcze komponentów Popover i Command (sprawdzone w `src/components/ui/`). Combobox wymaga obu.
**Why it happens:** shadcn/ui nie ma gotowego "Combobox" — trzeba złożyć z części.
**How to avoid:** Dodaj `npx shadcn@latest add popover command` PRZED implementacją formularza.
**Warning signs:** Import error na `@/components/ui/popover`.

### Pitfall 2: Zod v4 import path
**What goes wrong:** Używanie `import { z } from "zod"` zamiast `import { z } from "zod/v4"`.
**Why it happens:** Stare nawyki, AI asystent może zasugerować zły import.
**How to avoid:** Sprawdź istniejące pliki — `profile/actions.ts` używa `zod/v4`. Trzymaj się tego.
**Warning signs:** Brak metod specyficznych dla Zod 4 (np. inne flatten API).

### Pitfall 3: Revalidation paths po zapisie profilu
**What goes wrong:** Dashboard banner nie znika po zapisie profilu jeśli brakuje revalidatePath.
**Why it happens:** Next.js cache — server component dashboardu nie odświeży się bez rewalidacji.
**How to avoid:** W `saveBusinessProfile` dodaj `revalidatePath("/dashboard")` i `revalidatePath("/onboarding")` i `revalidatePath("/profile")`.
**Warning signs:** Banner nadal się wyświetla mimo ukończonego onboardingu.

### Pitfall 4: Chat completion detection
**What goes wrong:** Chat nie kończy się prawidłowo, użytkownik musi ręcznie zakończyć.
**Why it happens:** AI nie ustawia `isComplete: true` w structured output.
**How to avoid:** Dodaj max turns limit (3-5) i przycisk "Przejdź dalej" po N turach (wzorzec z ClarifyingChat, linia 263).
**Warning signs:** Nieskończony loop pytanie-odpowiedź.

### Pitfall 5: Onboarding page wymaga auth
**What goes wrong:** Strona /onboarding dostępna bez logowania.
**Why it happens:** Strona jest w `(dashboard)` layout który wymaga auth, ale trzeba pamiętać o tym.
**How to avoid:** Umieść /onboarding w `app/(dashboard)/onboarding/` — layout automatycznie wymaga requireAllowedUser().
**Warning signs:** N/A — layout to zapewnia.

## Code Examples

### Database Migration
```sql
-- user_business_profiles: profil biznesowy dla personalizacji kursów
CREATE TABLE user_business_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  industry        TEXT NOT NULL,
  role            TEXT NOT NULL,
  business_goal   TEXT NOT NULL,
  company_size    TEXT,
  experience_summary TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_business_profiles IS 'User business context for course personalization';

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_business_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_profile_updated
  BEFORE UPDATE ON user_business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_business_profile_timestamp();

-- Index
CREATE INDEX idx_business_profiles_user
  ON user_business_profiles(user_id);

-- RLS
ALTER TABLE user_business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business profile"
  ON user_business_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business profile"
  ON user_business_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business profile"
  ON user_business_profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

### Onboarding Chat Schema (Zod 4)
```typescript
// src/lib/onboarding/schemas.ts
import { z } from "zod/v4";

export const businessProfileSchema = z.object({
  industry: z.string().min(1, "Branża jest wymagana"),
  role: z.string().min(1, "Rola jest wymagana"),
  business_goal: z.string().min(1, "Cel biznesowy jest wymagany").max(200),
  company_size: z.string().optional(),
});

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

// Schema dla structured output z onboarding chatu
export const onboardingChatSchema = z.object({
  question: z.string().describe("Pytanie do użytkownika o kontekst biznesowy"),
  isComplete: z.boolean().describe("Czy zebrano wystarczająco informacji"),
  experience_summary: z.string().describe("Podsumowanie profilu biznesowego (2-3 zdania, puste jeśli nie gotowe)"),
});

export type OnboardingChatResponse = z.infer<typeof onboardingChatSchema>;
```

### Banner Component (wzorzec)
```typescript
// src/components/onboarding/onboarding-banner.tsx
"use client";

import { useState } from "react";
import { X, Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative rounded-lg border bg-primary/5 p-4 mb-6">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
      <div className="flex items-start gap-3 pr-8">
        <Briefcase className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-sm">Uzupełnij profil biznesowy</p>
          <p className="text-sm text-muted-foreground mt-1">
            Pomóż AI lepiej dopasować kursy do Twojej branży i celów.
          </p>
          <Button asChild variant="link" size="sm" className="px-0 mt-1">
            <Link href="/onboarding">
              Uzupełnij profil
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Combobox Component (Popover + Command)
```typescript
// src/components/onboarding/combobox.tsx
"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface ComboboxProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allowCustom?: boolean; // Umożliwia wpisanie własnej wartości
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Wybierz...",
  searchPlaceholder = "Szukaj...",
  emptyMessage = "Nie znaleziono.",
  allowCustom = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? selectedLabel : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {allowCustom && search ? (
                <button
                  className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent"
                  onClick={() => {
                    onChange(search);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  Użyj: &quot;{search}&quot;
                </button>
              ) : (
                emptyMessage
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useChat z `api` string | useChat z `DefaultChatTransport` | AI SDK v6 | ClarifyingChat już używa nowego patternu |
| `z` from `"zod"` | `z` from `"zod/v4"` | Zod 4 | profile/actions.ts używa v4, trzymaj konsekwentnie |
| `getSession()` | `getUser()` | CVE-2025-29927 | Wszystkie DAL pliki używają getUser(), nigdy getSession() |

## Open Questions

1. **Model AI dla onboarding chatu**
   - What we know: GPT-5.2 jest używany dla curriculum i mentora, GPT-4o-mini dla quizów
   - What's unclear: Czy onboarding chat potrzebuje GPT-5.2 czy wystarczy GPT-4o-mini?
   - Recommendation: Użyj GPT-4o-mini (tani, szybki, wystarczający do 3-5 pytań profilowych). Dodaj nowy klucz w MODEL_CONFIG: `onboarding: openaiProvider('gpt-4o-mini')`.

2. **Czy /onboarding i /profile powinny współdzielić komponent formularza?**
   - What we know: CONTEXT.md mówi "ta sama treść dostępna z /profile"
   - What's unclear: Czy to dosłownie ten sam komponent czy osobne instancje
   - Recommendation: Jeden komponent `BusinessProfileForm` używany w obu miejscach. Props `initialData` do edycji vs tworzenia.

3. **Jak przekazać profil biznesowy do API clarify/generate?**
   - What we know: Oba endpointy nie przyjmują teraz profilu biznesowego
   - What's unclear: Czy przekazywać z frontendu (body request) czy ładować server-side po auth?
   - Recommendation: Ładować server-side w API route (getBusinessProfile z DAL, na podstawie zalogowanego usera). Zero zmian w interfejsie frontendu — API same dodają kontekst.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/lib/dal/` (auth.ts, notes.ts pattern), `src/lib/gamification/gamification-dal.ts`, `src/lib/focus/focus-dal.ts`
- Codebase analysis: `src/components/curriculum/clarifying-chat.tsx` (useChat pattern)
- Codebase analysis: `src/app/api/curriculum/clarify/route.ts`, `src/app/api/curriculum/generate/route.ts` (prompt injection points)
- Codebase analysis: `src/app/(dashboard)/profile/` (actions.ts, page.tsx — existing profile pattern)
- Codebase analysis: `src/components/ui/` (lista komponentów — brak Popover, Command)
- Codebase analysis: `supabase/migrations/` (wzorzec migracji z RLS)
- CONTEXT.md: Locked decisions (formularz 4 pola, chat AI, banner useState, combobox)

### Secondary (MEDIUM confidence)
- shadcn/ui Combobox pattern (Popover + Command) — well-known pattern, verified against component list

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project
- Architecture: HIGH — all patterns have existing precedents in codebase
- Pitfalls: HIGH — identified from direct codebase analysis
- Database schema: HIGH — follows focus_sessions/gamification migration pattern exactly
- Curriculum injection: HIGH — identified exact injection points in clarify + generate routes

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable — no external dependencies, all internal patterns)
