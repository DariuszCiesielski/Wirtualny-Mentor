# Phase 7: Polish & Optimization - Research

**Researched:** 2026-01-31
**Domain:** Responsive Design, Scheduled Jobs, Cost Monitoring, Performance Optimization
**Confidence:** HIGH (verified with official docs and multiple sources)

## Summary

Faza 7 obejmuje cztery kluczowe obszary: (1) audyt i naprawa responsywnego designu dla mobilnych, (2) mechanizm odswiezania bazy wiedzy przez scheduled jobs, (3) dashboard monitorowania kosztow AI, oraz (4) ogolna optymalizacja wydajnosci.

Projekt obecnie uzywa Tailwind CSS v4 z shadcn/ui, ale sidebar i layout mają staly padding `pl-60` bez responsywnych breakpointow - wymaga to naprawy dla mobile-first design. Dla scheduled jobs mamy dwie opcje: Vercel Cron Jobs lub Supabase pg_cron. Dla cost monitoring najlepszym rozwiazaniem jest Helicone (otwartoźrodłowy, darmowy tier 10k req/mies, natywna integracja z Vercel AI SDK). Performance optimization obejmuje lazy loading, bundle analysis, i Next.js Image optimization.

**Primary recommendation:** Implementuj mobile-first responsive design z collapsible sidebar, uzyj Vercel Cron Jobs dla daily knowledge refresh, zintegruj Helicone dla cost monitoring, i uzyj @next/bundle-analyzer dla identyfikacji optimizacji.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4 | Responsive breakpoints (sm, md, lg, xl, 2xl) | Juz w projekcie, natywne breakpoints bez konfiguracji |
| shadcn/ui | latest | Responsive components (Drawer + Dialog pattern) | Juz w projekcie, gotowe wzorce mobile/desktop |
| @next/bundle-analyzer | ^0.27 | Analiza bundle size | Oficjalny Vercel plugin, integracja z Next.js |
| Helicone | SaaS | LLM cost/latency tracking | Open-source, darmowy tier, 1-line integration |
| Vercel Cron Jobs | platform | Scheduled HTTP requests | Natywna integracja z Next.js, per-minute na Pro |
| next/dynamic | built-in | Lazy loading Client Components | Wbudowane w Next.js, automatic code splitting |
| next/image | built-in | Responsive image optimization | Wbudowane, automatic lazy loading i format optimization |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SWR | ^2.2 | Client-side data caching | Dashboard z real-time updates, deduplication |
| pg_cron | 1.6.4+ | Database-level scheduled jobs | Alternatywa do Vercel Cron jesli potrzeba SQL jobs |
| Lighthouse CI | latest | Automated performance testing | CI/CD pipeline dla regression testing |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Helicone | Langfuse | Langfuse bardziej rozbudowany ale wymaga self-host lub planu platnego |
| Helicone | LiteLLM | Wymaga proxy setup, bardziej skomplikowany |
| Vercel Cron | Supabase pg_cron | pg_cron lepszy dla SQL-heavy jobs, Vercel lepszy dla API calls |
| @next/bundle-analyzer | webpack-bundle-analyzer | @next/bundle-analyzer ma natywna integracje, mniej konfiguracji |

**Installation:**
```bash
npm install @next/bundle-analyzer swr
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/
│   │   └── cron/
│   │       └── refresh-knowledge/
│   │           └── route.ts       # Cron endpoint dla knowledge refresh
│   ├── (dashboard)/
│   │   └── admin/
│   │       └── costs/
│   │           └── page.tsx       # Cost monitoring dashboard
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx            # Responsive sidebar (collapsible)
│   │   ├── mobile-nav.tsx         # Mobile navigation drawer
│   │   └── responsive-container.tsx # Wrapper component
│   └── ui/
│       └── responsive-dialog.tsx  # Dialog na desktop, Drawer na mobile
├── lib/
│   └── monitoring/
│       └── helicone.ts            # Helicone configuration
└── vercel.json                    # Cron jobs configuration
```

### Pattern 1: Responsive Dialog/Drawer
**What:** Komponent ktory renderuje Dialog na desktop i Drawer na mobile
**When to use:** Modals, forms, detail views
**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/drawer
'use client';

import { useMediaQuery } from '@/hooks/use-media-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

export function ResponsiveModal({ open, onOpenChange, children }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>{children}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>{children}</DrawerContent>
    </Drawer>
  );
}
```

### Pattern 2: Collapsible Mobile Sidebar
**What:** Sidebar ukryty na mobile, toggle przez hamburger menu
**When to use:** Dashboard layouts
**Example:**
```typescript
// Tailwind v4 breakpoints: sm=640px, md=768px, lg=1024px
export function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - hidden on mobile, visible on lg+ */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r bg-background hidden lg:block">
        <Sidebar />
      </aside>

      {/* Mobile nav - visible only on mobile */}
      <div className="lg:hidden">
        <MobileNav />
      </div>

      {/* Main content - full width on mobile, offset on desktop */}
      <div className="lg:pl-60">
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
```

### Pattern 3: Vercel Cron Job dla Knowledge Refresh
**What:** Scheduled HTTP request triggering knowledge refresh
**When to use:** Daily/weekly batch jobs
**Example:**
```typescript
// src/app/api/cron/refresh-knowledge/route.ts
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Refresh knowledge for dynamic domains
  const supabase = createAdminClient();
  // ... implementation

  return Response.json({ success: true, refreshed: count });
}

export const runtime = 'nodejs'; // or 'edge'
export const maxDuration = 300; // 5 minutes max for Pro
```

### Pattern 4: Helicone Integration
**What:** One-line LLM observability setup
**When to use:** All AI API calls
**Example:**
```typescript
// Source: https://github.com/Helicone/helicone
import { anthropic } from '@ai-sdk/anthropic';

// Option 1: Change base URL (recommended)
const client = anthropic({
  baseURL: 'https://anthropic.helicone.ai',
  headers: {
    'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

// Option 2: Add header to existing client
// Just add Helicone-Auth header to requests
```

### Pattern 5: Lazy Loading Heavy Components
**What:** Dynamic import dla ciezkich komponentow
**When to use:** Charts, maps, heavy editors
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/guides/lazy-loading
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load chart component - only loaded when needed
const CostChart = dynamic(
  () => import('@/components/admin/cost-chart'),
  {
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false, // Charts don't need SSR
  }
);

export function CostDashboard({ data }) {
  return (
    <div>
      <h1>Cost Monitoring</h1>
      <CostChart data={data} />
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Fixed widths without breakpoints:** Unikaj `w-60` bez `lg:w-60`, dodawaj `w-full lg:w-60`
- **Missing touch targets:** Przyciski na mobile min 44x44px (`min-h-11 min-w-11`)
- **Horizontal scroll na mobile:** Unikaj `overflow-x-auto` bez max-width
- **Node-cron w serverless:** Nie dziala na Vercel/Netlify - uzyj Vercel Cron Jobs
- **Eager loading wszystkiego:** Uzyj `next/dynamic` dla heavy components
- **Custom cost tracking:** Nie buduj wlasnego - Helicone robi to lepiej

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cost tracking | Custom token counter | Helicone | Automatic tracking, dashboards, alerts |
| Responsive detection | `window.innerWidth` | Tailwind breakpoints + useMediaQuery | SSR-safe, consistent |
| Scheduled jobs | `setInterval` / node-cron | Vercel Cron Jobs | Works in serverless, managed |
| Bundle analysis | Manual inspection | @next/bundle-analyzer | Visual, accurate, maintained |
| Image optimization | Manual resize | next/image | Automatic optimization, lazy loading |
| Data caching | Manual cache | SWR / React Query | Deduplication, revalidation, stale-while-revalidate |

**Key insight:** Serverless architecture wymaga platform-native scheduling (Vercel Cron), a observability wymaga dedicated tools (Helicone) - custom solutions nie dzialaja lub sa nieoptymalne.

## Common Pitfalls

### Pitfall 1: Sidebar nie znika na mobile
**What goes wrong:** Layout ma staly `pl-60` ktory pcha content na mobile
**Why it happens:** Zaprojektowane desktop-first bez mobile breakpoints
**How to avoid:** Uzyj `lg:pl-60` zamiast `pl-60`, dodaj mobile navigation
**Warning signs:** Content uciety na prawej stronie na mobile, horizontal scroll

### Pitfall 2: Vercel Cron nie dziala na Hobby
**What goes wrong:** Cron jobs nie triggeruja lub sa opoznione o godziny
**Why it happens:** Hobby plan ma limit once per day i +/-59 min precision
**How to avoid:** Upewnij sie ze projekt jest na Pro plan dla minute-level cron
**Warning signs:** Deploy fails z "Hobby accounts are limited to daily cron jobs"

### Pitfall 3: Helicone nie trackuje kosztow
**What goes wrong:** Dashboard pokazuje 0 kosztow mimo requestow
**Why it happens:** Trzeba zmienic baseURL na helicone gateway, nie tylko dodac header
**How to avoid:** Uzyj pattern `baseURL: 'https://[provider].helicone.ai'`
**Warning signs:** Requests widoczne ale Cost = $0.00

### Pitfall 4: Bundle size nie maleje po lazy loading
**What goes wrong:** Dynamic import nie zmniejsza initial bundle
**Why it happens:** Shared dependencies (React, lodash) zostaja w main chunk
**How to avoid:** Analizuj bundle, lazy-loaduj tylko unique dependencies
**Warning signs:** Bundle analyzer pokazuje te same libraries w multiple chunks

### Pitfall 5: Mobile tap targets za male
**What goes wrong:** Uzytkownik nie moze kliknac przyciskow na mobile
**Why it happens:** Ikony 16x16 lub 24x24 bez padding
**How to avoid:** Min 44x44px touch targets (Tailwind: `min-h-11 min-w-11`)
**Warning signs:** Lighthouse accessibility warning "Tap targets are too small"

### Pitfall 6: Image CLS (Cumulative Layout Shift)
**What goes wrong:** Strona "skacze" podczas ladowania obrazow
**Why it happens:** Brak width/height lub aspect-ratio
**How to avoid:** Zawsze podawaj width/height dla next/image lub uzyj fill z aspect-ratio
**Warning signs:** Lighthouse CLS > 0.1, widoczne "jumps" podczas ladowania

## Code Examples

Verified patterns from official sources:

### Tailwind v4 Responsive Breakpoints
```css
/* Source: https://tailwindcss.com/docs/responsive-design */
/* Default breakpoints in Tailwind v4 */
@theme {
  --breakpoint-sm: 40rem;  /* 640px */
  --breakpoint-md: 48rem;  /* 768px */
  --breakpoint-lg: 64rem;  /* 1024px */
  --breakpoint-xl: 80rem;  /* 1280px */
  --breakpoint-2xl: 96rem; /* 1536px */
}

/* Mobile-first: unprefixed = all sizes, prefixed = breakpoint and up */
.example {
  @apply w-full lg:w-60; /* Full width mobile, 60 units on lg+ */
  @apply p-4 lg:p-6;     /* Smaller padding mobile */
  @apply hidden lg:block; /* Hidden mobile, visible lg+ */
}
```

### vercel.json Cron Configuration
```json
// Source: https://vercel.com/docs/cron-jobs
{
  "crons": [
    {
      "path": "/api/cron/refresh-knowledge",
      "schedule": "0 5 * * *"
    }
  ]
}
```
*Schedule: 0 5 * * * = every day at 5:00 AM UTC*

### useMediaQuery Hook
```typescript
// Source: https://ui.shadcn.com/docs/components/drawer
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
```

### Next.js Bundle Analyzer Setup
```typescript
// next.config.ts
// Source: https://nextjs.org/docs/14/pages/building-your-application/optimizing/bundle-analyzer
import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

const nextConfig: NextConfig = {
  // ... existing config
};

export default withBundleAnalyzer(nextConfig);
```

### SWR dla Cost Dashboard
```typescript
// Source: https://swr.vercel.app/docs/with-nextjs
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useCostMetrics(startDate: string, endDate: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/costs?start=${startDate}&end=${endDate}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
      dedupingInterval: 5000, // Dedupe requests within 5s
    }
  );

  return {
    metrics: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
```

### Supabase pg_cron Alternative
```sql
-- Source: https://supabase.com/docs/guides/cron
-- Enable pg_cron extension (via Dashboard or SQL)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily knowledge refresh at 5 AM UTC
SELECT cron.schedule(
  'refresh-knowledge-daily',
  '0 5 * * *',
  $$
    -- Call Edge Function via pg_net
    SELECT net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/refresh-knowledge',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| node-cron w serverless | Vercel Cron Jobs / pg_cron | 2023+ | Node-cron nie dziala w serverless, platform cron obowiązkowy |
| Manual cost tracking | Helicone / Langfuse | 2024+ | Automatic tracking, dashboards, alerts out of box |
| CSS Grid media queries | Tailwind responsive prefixes | 2020+ | Utility-first, less CSS, consistent |
| webpack-bundle-analyzer | @next/bundle-analyzer | 2023+ | Native integration, less config |
| Tailwind screens config (JS) | Tailwind v4 @theme (CSS) | 2025 | CSS-first config, --breakpoint-* variables |

**Deprecated/outdated:**
- `node-cron` w serverless: Nie dziala - process umiera po request
- Manual `window.innerWidth`: SSR issues, uzyj Tailwind breakpoints
- Custom token counting: Nieprecyzyjne, Helicone robi to automatycznie

## Open Questions

Things that couldn't be fully resolved:

1. **Helicone on Vercel Edge Runtime**
   - What we know: Helicone dziala z Node.js runtime
   - What's unclear: Czy Helicone gateway dziala z Edge Runtime (`export const runtime = 'edge'`)
   - Recommendation: Testuj z Edge, fallback na nodejs jesli problemy

2. **Cost data storage dla historical analysis**
   - What we know: Helicone przechowuje dane, API dostepne
   - What's unclear: Jak dlugo Helicone przechowuje dane na free tier
   - Recommendation: Opcjonalnie zapisuj koszty do Supabase dla long-term analysis

3. **pg_cron vs Vercel Cron dla knowledge refresh**
   - What we know: Oba dzialaja, rozne tradeoffs
   - What's unclear: Ktory lepszy dla HTTP calls do external APIs (Tavily)
   - Recommendation: Vercel Cron (HTTP-native), pg_cron tylko jesli potrzeba SQL

## Sources

### Primary (HIGH confidence)
- [Vercel Cron Jobs Docs](https://vercel.com/docs/cron-jobs) - Configuration, limitations, pricing
- [Vercel Cron Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) - Plan limits
- [Tailwind CSS v4 Responsive Design](https://tailwindcss.com/docs/responsive-design) - Breakpoints
- [Tailwind CSS v4 Breakpoint Config](https://bordermedia.org/blog/tailwind-css-4-breakpoint-override) - CSS-first config
- [Next.js Lazy Loading Guide](https://nextjs.org/docs/app/guides/lazy-loading) - Dynamic imports
- [Next.js Bundle Analyzer](https://nextjs.org/docs/14/pages/building-your-application/optimizing/bundle-analyzer) - Setup
- [Supabase Cron Docs](https://supabase.com/docs/guides/cron) - pg_cron usage
- [shadcn/ui Drawer](https://ui.shadcn.com/docs/components/drawer) - Responsive dialog pattern

### Secondary (MEDIUM confidence)
- [Helicone GitHub](https://github.com/Helicone/helicone) - Integration patterns
- [Langfuse Token Tracking](https://langfuse.com/docs/observability/features/token-and-cost-tracking) - Cost tracking features
- [SWR with Next.js](https://swr.vercel.app/docs/with-nextjs) - Client-side caching

### Tertiary (LOW confidence)
- [Medium: Next.js Lazy Loading](https://medium.com/@sureshdotariya/mastering-lazy-loading-in-next-js-15-advanced-patterns-for-peak-performance-75e0bd574c76) - Advanced patterns
- [CloudIDR LLM Pricing](https://www.cloudidr.com/llm-pricing) - Cost comparison (verify current prices)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs, existing project patterns
- Architecture: HIGH - Based on Next.js/Tailwind/shadcn official patterns
- Pitfalls: MEDIUM - Based on common issues and community discussions
- Cost monitoring: MEDIUM - Helicone verified, but Edge Runtime unclear

**Research date:** 2026-01-31
**Valid until:** 2026-02-28 (30 days - stable domain)

---

## Appendix: Current Project State Analysis

### Identified Responsive Issues (from code review)

1. **Dashboard Layout** (`src/app/(dashboard)/layout.tsx`):
   - `pl-60` bez responsive prefix - content offset na wszystkich viewportach
   - Sidebar zawsze widoczny (`w-60 fixed`) - brak mobile handling

2. **Sidebar** (`src/components/layout/sidebar.tsx`):
   - `w-60 fixed` bez breakpoints - nie ukrywa sie na mobile
   - Brak hamburger menu toggle

3. **Header** (`src/components/layout/header.tsx`):
   - `hidden sm:inline-block` dla username - OK
   - Brak mobile menu button

4. **Chat Component** (`mentor-chat.tsx`):
   - `max-w-[80%]` - OK dla responsywnosci
   - Brak dedicated mobile optimizations

### Recommended Priority

1. **P0 (Must Have):** Responsive sidebar z collapsible na mobile
2. **P0 (Must Have):** Vercel Cron Job dla knowledge refresh
3. **P1 (Should Have):** Helicone integration dla cost monitoring
4. **P1 (Should Have):** Bundle analyzer setup i initial optimization
5. **P2 (Nice to Have):** Cost dashboard UI
6. **P2 (Nice to Have):** Comprehensive lazy loading audit
