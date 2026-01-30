# Phase 1: Auth & Basic UI - Research

**Researched:** 2026-01-30
**Domain:** Supabase Auth + shadcn/ui + Next.js 16 App Router + Dark Mode
**Confidence:** HIGH

## Summary

Faza 1 implementuje system autentykacji uzytkownikow (rejestracja, logowanie, reset hasla, profil) oraz podstawowy interfejs uzytkownika z dark mode. Badanie potwierdza, ze Supabase Auth z pakietem `@supabase/ssr` jest standardowym rozwiazaniem dla Next.js App Router w 2026, oferujac cookie-based authentication z pelnym wsparciem dla Server Components.

Kluczowe odkrycia:
1. **Supabase UI Blocks**: Supabase oferuje gotowe bloki autentykacji zbudowane na shadcn/ui, ktore mozna zainstalowac jednym poleceniem. Zawieraja kompletne strony: login, sign-up, forgot-password, confirm, update-password.
2. **Tailwind CSS v4**: Projekt uzywa Tailwind v4 z nowa skladnia (brak tailwind.config.js). Dark mode wymaga konfiguracji w globals.css zamiast w pliku konfiguracyjnym.
3. **Middleware ograniczenia**: CVE-2025-29927 pokazalo, ze middleware NIE powinno byc jedynym miejscem weryfikacji sesji. Rekomendowany jest Data Access Layer (DAL) pattern z weryfikacja sesji blisko danych.
4. **Next.js 16**: Projekt uzywa Next.js 16.1.6 (nowszy niz w dokumentacji), co jest w pelni kompatybilne z @supabase/ssr.

**Primary recommendation:** Uzyj Supabase password-based-auth block jako bazy, zintegruj z shadcn/ui, dodaj next-themes dla dark mode z manual toggle.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **@supabase/supabase-js** | 2.x | Supabase client | Oficjalny SDK, TypeScript-first, realtime support |
| **@supabase/ssr** | latest | SSR auth helpers | Oficjalny pakiet dla Next.js App Router, cookie-based auth |
| **shadcn/ui** | latest | UI components | Standard 2026, Tailwind-based, copy-paste ownership |
| **next-themes** | 0.4.x | Theme switching | De facto standard dla dark mode w Next.js |
| **react-hook-form** | 7.x | Form management | Standard z shadcn/ui, minimal re-renders |
| **zod** | 4.x | Schema validation | Juz zainstalowany (z Phase 0), TypeScript-first |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **lucide-react** | latest | Icons | Ikony dla UI, standard z shadcn/ui |
| **@radix-ui/react-avatar** | latest | Avatar component | Dla profilowego zdjecia uzytkownika |
| **sharp** | latest | Image processing | Resizing avatarow przed uploadem do Storage |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Auth | NextAuth.js/Auth.js | NextAuth wymaga wiecej konfiguracji, Supabase Auth zintegrowany z RLS |
| Supabase Auth | Clerk | Clerk drogi na skale, Supabase darmowy do 50k MAU |
| react-hook-form | TanStack Form | TanStack nowszy ale mniej dokumentacji, react-hook-form standard z shadcn |
| next-themes | Manual CSS | next-themes rozwiazuje FOUC, persistence, system preference |

**Installation:**
```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# shadcn/ui (init jesli nie zainicjalizowane)
npx shadcn@latest init

# Required shadcn components
npx shadcn@latest add button card input label form

# Auth blocks from Supabase UI
npx shadcn@latest add "https://supabase.com/ui/r/password-based-auth.json"

# Dark mode
npm install next-themes

# Icons and avatar
npm install lucide-react
npx shadcn@latest add avatar

# Image processing for avatar upload
npm install sharp
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout z ThemeProvider
│   ├── page.tsx                # Landing/home page
│   ├── (auth)/                 # Auth route group (bez nawigow)
│   │   ├── login/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── confirm/route.ts    # Email confirmation handler
│   │   └── update-password/page.tsx
│   ├── (dashboard)/            # Protected route group
│   │   ├── layout.tsx          # Dashboard layout z sidebar
│   │   ├── page.tsx            # Dashboard home
│   │   └── profile/page.tsx    # Edit profile page
│   └── api/
│       └── auth/
│           └── callback/route.ts  # OAuth callback (jesli potrzebne)
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── auth/                   # Auth-specific components
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   ├── forgot-password-form.tsx
│   │   ├── update-password-form.tsx
│   │   └── logout-button.tsx
│   ├── layout/                 # Layout components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── theme-toggle.tsx
│   └── profile/
│       ├── profile-form.tsx
│       └── avatar-upload.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts       # Middleware client (session refresh only)
│   └── dal/                    # Data Access Layer
│       ├── auth.ts             # Auth verification functions
│       └── user.ts             # User data access
├── providers/
│   └── theme-provider.tsx      # next-themes provider
└── middleware.ts               # Session refresh (NIE auth blocking)
```

### Pattern 1: Supabase Client Factory

**What:** Osobne klienty dla browser i server z prawidlowym cookie management
**When to use:** Kazda interakcja z Supabase
**Example:**

```typescript
// lib/supabase/client.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// lib/supabase/server.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component - ignore
          }
        },
      },
    }
  )
}
```

### Pattern 2: Data Access Layer (DAL) for Auth

**What:** Centralizacja logiki weryfikacji sesji blisko danych
**When to use:** Kazda chroniona strona/akcja zamiast middleware-only
**Example:**

```typescript
// lib/dal/auth.ts
// Source: https://nextjs.org/docs/app/guides/authentication

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'

// Cached per-request - nie wywoluje DB wielokrotnie
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
})

// Use in protected pages/components
export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

// Use in Server Actions
export async function verifySession() {
  const user = await getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}
```

### Pattern 3: Middleware for Session Refresh Only

**What:** Middleware odswiezajace sesje, NIE blokujace dostepu
**When to use:** Globalnie, ale autoryzacja w DAL
**Example:**

```typescript
// middleware.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT use getSession() - it doesn't revalidate tokens
  // getUser() will refresh the session if expired
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes that don't need auth
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 4: Dark Mode with next-themes (Tailwind v4)

**What:** Theme switching z persistencja i system preference
**When to use:** Dla dark mode support (UX-05)
**Example:**

```typescript
// providers/theme-provider.tsx
// Source: https://ui.shadcn.com/docs/dark-mode/next

"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

```typescript
// app/layout.tsx (updated)

import { ThemeProvider } from "@/providers/theme-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

```css
/* globals.css - Tailwind v4 dark mode */
/* Source: https://www.sujalvanjare.com/blog/dark-mode-nextjs15-tailwind-v4 */

@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  /* ... rest of shadcn/ui CSS variables */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  /* ... rest of dark mode variables */
}
```

### Pattern 5: Protected Page with DAL

**What:** Strona chroniona z weryfikacja sesji w komponencie
**When to use:** Kazda strona wymagajaca logowania
**Example:**

```typescript
// app/(dashboard)/page.tsx

import { requireAuth } from '@/lib/dal/auth'

export default async function DashboardPage() {
  // This redirects to /login if not authenticated
  const user = await requireAuth()

  return (
    <div>
      <h1>Witaj, {user.email}!</h1>
      {/* Dashboard content */}
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Auth w middleware jako jedyne zabezpieczenie:** CVE-2025-29927 pokazalo ze middleware mozna ominac. Zawsze weryfikuj sesje w DAL.
- **getSession() zamiast getUser():** getSession() nie rewaliduje tokenow. Zawsze uzywaj getUser() po stronie serwera.
- **Przechowywanie sesji w localStorage:** Vulnerable na XSS. Uzywaj cookie-based auth z @supabase/ssr.
- **Hardcoded redirect URLs:** Uzywaj zmiennych srodowiskowych dla site URL i redirect URLs.
- **Brak email verification:** Zawsze weryfikuj email przed pelnym dostepem do aplikacji.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth forms | Custom login/signup forms | Supabase password-based-auth block | Kompletne, przetestowane, obsluguje edge cases |
| Session management | Manual JWT handling | @supabase/ssr | Cookie rotation, refresh tokens, PKCE flow |
| Theme switching | CSS-only dark mode | next-themes | FOUC prevention, localStorage persistence, system preference |
| Form validation | Manual validation | react-hook-form + zod | Declarative, type-safe, integrated z shadcn/ui |
| Avatar upload | Manual file handling | Supabase Storage + signed URLs | Automatic resizing, CDN, permissions |
| Password hashing | bcrypt/argon2 | Supabase Auth | Server-side, secure by default |

**Key insight:** Supabase Auth + shadcn/ui blocks daja 90% funkcjonalnosci auth out-of-box. Pisanie custom rozwiazania to strata czasu i zrodlo bledow bezpieczenstwa.

## Common Pitfalls

### Pitfall 1: Middleware-Only Auth (CVE-2025-29927)

**What goes wrong:** Atakujacy omija middleware wysylajac specjalny header `x-middleware-subrequest`, uzyskujac dostep do chronionych stron.
**Why it happens:** Next.js middleware moze byc pominiete w self-hosted deployments (przed patchem).
**How to avoid:**
1. Upgrade do Next.js >= 15.2.3 (projekt uzywa 16.1.6 - OK)
2. Zawsze weryfikuj sesje w DAL blisko danych, nie tylko w middleware
3. Middleware powinno tylko odswiazac sesje, nie blokowac dostepu
**Warning signs:** Auth check tylko w middleware.ts, brak weryfikacji w page components.

### Pitfall 2: getSession() vs getUser() Confusion

**What goes wrong:** getSession() zwraca stale dane z localStorage, nie weryfikuje tokena z serwerem.
**Why it happens:** getSession() jest szybkie (lokalne), getUser() robi request do serwera.
**How to avoid:**
1. Zawsze uzywaj `supabase.auth.getUser()` po stronie serwera
2. `getSession()` OK tylko do szybkiego sprawdzenia client-side (np. warunkowe renderowanie)
3. Dla krytycznych operacji zawsze getUser()
**Warning signs:** "User authenticated but data fetch returns 401", stale session data.

### Pitfall 3: Email Rate Limiting in Development

**What goes wrong:** Supabase default SMTP ma limit 2 emaili/godzine. Sign-up i password reset przestaja dzialac.
**Why it happens:** Domyslny Supabase email service jest rate-limited.
**How to avoid:**
1. Development: Uzyj Inbucket (lokalne testowanie emaili) lub Resend free tier
2. Production: Skonfiguruj custom SMTP (Resend, SendGrid, Mailgun)
3. Wlacz "Confirm Email" wylaczone w dev dla szybszego testowania
**Warning signs:** Signup emaile nie przychodza, "Too many requests" errors.

### Pitfall 4: Missing Redirect URL Configuration

**What goes wrong:** Password reset link prowadzi do bledu lub nieskonczonej petli.
**Why it happens:** Supabase wymaga whitelist redirect URLs w dashboard.
**How to avoid:**
1. Dodaj wszystkie redirect URLs w Supabase Dashboard > Auth > URL Configuration
2. Ustaw Site URL poprawnie (localhost dla dev, production domain dla prod)
3. Uzywaj ABSOLUTE URLs w redirectTo parameter (nie relative)
**Warning signs:** "Invalid redirect URL" error, redirect do innej strony.

### Pitfall 5: Tailwind v4 Dark Mode Configuration

**What goes wrong:** Dark mode nie dziala mimo uzycia next-themes.
**Why it happens:** Tailwind v4 nie ma tailwind.config.js z darkMode option. Wymaga konfiguracji w CSS.
**How to avoid:**
1. Dodaj `@custom-variant dark (&:where(.dark, .dark *));` w globals.css
2. Zdefiniuj CSS variables dla :root i .dark
3. Uzywaj `attribute="class"` w ThemeProvider
**Warning signs:** Theme toggle zmienia localStorage ale nie zmienia stylow.

### Pitfall 6: Avatar Upload Storage Trigger Bug

**What goes wrong:** Pierwsza zmiana avatara dziala, kolejne nie aktualizuja URL lub tworza duplikaty.
**Why it happens:** Znany bug w Supabase storage trigger - delete_old_avatar nie dziala poprawnie.
**How to avoid:**
1. Generuj unique filename przy kazdym uplaodzie (np. z timestamp)
2. Manualnie usun stary plik przed uploadem nowego
3. Uzywaj user_metadata zamiast osobnej tabeli profiles dla avatar URL (prostsze)
**Warning signs:** Stary avatar nadal widoczny, rosnaca liczba plikow w storage.

## Code Examples

### Sign Up Server Action

```typescript
// app/(auth)/sign-up/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const signUpSchema = z.object({
  email: z.email('Niepoprawny adres email'),
  password: z.string().min(8, 'Haslo musi miec minimum 8 znakow'),
})

export async function signUp(formData: FormData) {
  const validatedFields = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const { email, password } = validatedFields.data
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/sign-up/check-email')
}
```

### Password Reset Flow

```typescript
// app/(auth)/forgot-password/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
```

```typescript
// app/(auth)/confirm/route.ts
// Source: https://supabase.com/ui/docs/nextjs/password-based-auth

import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as 'recovery' | 'email',
      token_hash,
    })

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Return to error page on verification failure
  return NextResponse.redirect(new URL('/error', request.url))
}
```

### Profile Update with Avatar

```typescript
// app/(dashboard)/profile/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { verifySession } from '@/lib/dal/auth'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(1, 'Imie jest wymagane').max(100),
})

export async function updateProfile(formData: FormData) {
  const user = await verifySession()
  const supabase = await createClient()

  const validatedFields = profileSchema.safeParse({
    name: formData.get('name'),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: validatedFields.data.name,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function uploadAvatar(formData: FormData) {
  const user = await verifySession()
  const supabase = await createClient()

  const file = formData.get('avatar') as File
  if (!file) return { error: 'Brak pliku' }

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    return { error: uploadError.message }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Update user metadata
  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  })

  if (updateError) {
    return { error: updateError.message }
  }

  return { success: true, url: publicUrl }
}
```

### Theme Toggle Component

```typescript
// components/layout/theme-toggle.tsx
// Source: https://ui.shadcn.com/docs/dark-mode/next

"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Zmien motyw</span>
    </Button>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @supabase/auth-helpers-nextjs | @supabase/ssr | 2024 | Unified SSR package, deprecated helpers |
| Middleware-only auth | DAL + Middleware refresh | 2025 (CVE) | Defense in depth required |
| tailwind.config.js darkMode | @custom-variant in CSS | Tailwind v4 (2025) | Config-less approach |
| Manual auth forms | Supabase UI blocks | 2025 | Pre-built, shadcn-based components |
| JWT in localStorage | Cookie-based sessions | Standard 2024+ | Better security, SSR support |

**Deprecated/outdated:**
- **@supabase/auth-helpers-nextjs**: Zastapiony przez @supabase/ssr - nie uzywac
- **getSession() dla auth checks**: Uzywaj getUser() - rewaliduje token
- **Middleware jako jedyne zabezpieczenie**: CVE-2025-29927 - dodaj weryfikacje w DAL

## Open Questions

1. **Supabase Publishable Key vs Anon Key**
   - What we know: Supabase zmienia nazewnictwo kluczy na "publishable key"
   - What's unclear: Czy trzeba zmienic istniejace klucze? Czy stare anon key nadal dzialaja?
   - Recommendation: Uzywaj NEXT_PUBLIC_SUPABASE_ANON_KEY (kompatybilne wstecz), sprawdz dokumentacje Supabase przy konfiguracji.

2. **Email Templates w Supabase**
   - What we know: Trzeba skonfigurowac custom email templates dla confirm i recovery
   - What's unclear: Czy Supabase UI block automatycznie konfiguruje templates?
   - Recommendation: Manualnie skonfiguruj templates w Supabase Dashboard > Auth > Email Templates.

3. **Sharp na Vercel Edge**
   - What we know: Sharp wymaga native binaries
   - What's unclear: Czy dziala na Vercel Serverless? Edge Runtime na pewno nie.
   - Recommendation: Uzyj Node.js runtime dla route z avatar upload, nie Edge. Alternatywnie: client-side resize z canvas API.

## Sources

### Primary (HIGH confidence)
- [Supabase Server-Side Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - oficjalny setup guide
- [Supabase Password-Based Auth Block](https://supabase.com/ui/docs/nextjs/password-based-auth) - gotowe komponenty
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication) - DAL pattern, best practices
- [shadcn/ui Dark Mode for Next.js](https://ui.shadcn.com/docs/dark-mode/next) - next-themes setup
- [shadcn/ui Authentication Blocks](https://ui.shadcn.com/blocks/authentication) - login/signup layouts

### Secondary (MEDIUM confidence)
- [CVE-2025-29927 Middleware Bypass](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router) - security vulnerability details
- [Tailwind v4 Dark Mode](https://www.sujalvanjare.com/blog/dark-mode-nextjs15-tailwind-v4) - @custom-variant syntax
- [NotebookLM Design](https://jasonspielman.com/notebooklm) - UI inspiration, three-panel layout

### Tertiary (LOW confidence)
- Avatar upload storage trigger bug - wymaga walidacji z wlasnym kodem
- Sharp na Vercel - wymaga testow

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - oficjalna dokumentacja Supabase i shadcn/ui
- Architecture (DAL pattern): HIGH - oficjalny Next.js guide, potwierdzone przez CVE
- Dark mode (Tailwind v4): MEDIUM - nowa skladnia, mniej przykladow
- Pitfalls: HIGH - potwierdzone przez wiele zrodel, CVE

**Research date:** 2026-01-30
**Valid until:** 60 dni (auth patterns stabilne, ale sprawdz Supabase changelog)
