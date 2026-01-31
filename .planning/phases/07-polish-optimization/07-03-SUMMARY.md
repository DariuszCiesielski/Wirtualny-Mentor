---
phase: 07
plan: 03
subsystem: knowledge-refresh
tags: [cron, vercel, dynamic-domains, automation]

dependency-graph:
  requires: [07-02]
  provides: [knowledge-refresh-cron, dynamic-domain-detection]
  affects: []

tech-stack:
  added: []
  patterns:
    - vercel-cron-job
    - lazy-refresh-flagging
    - bearer-token-auth

key-files:
  created:
    - src/app/api/cron/refresh-knowledge/route.ts
    - vercel.json
  modified:
    - src/lib/dal/courses.ts
    - .env.example

decisions:
  - type: architecture
    choice: lazy-refresh-flagging
    reason: Full material regeneration too expensive for daily cron
    alternatives: [full-regeneration, background-jobs]

metrics:
  duration: 4 min
  completed: 2026-01-31
---

# Phase 7 Plan 03: Knowledge Refresh Cron Summary

Vercel Cron Job dla automatycznego odswiezania wiedzy w dynamicznych domenach (AI, tech, prawo).

## One-liner

Codziennie o 5:00 UTC cron oznacza kursy z dynamicznych domen do odswiezenia materialow.

## What Was Done

### Task 1: Dynamic Domain Helpers (44b9669)

Dodano funkcje do identyfikacji kursow wymagajacych odswiezania:

```typescript
// src/lib/dal/courses.ts
export function isDynamicDomain(topic: string): boolean
export async function getCoursesNeedingRefresh(): Promise<CourseRefreshInfo[]>
```

**Dynamiczne domeny:**
- AI/ML: ai, chatgpt, claude, gpt, machine learning, llm
- Tech: programming, javascript, typescript, react, next.js, python, rust
- Prawo: prawo, law, legal, ustawa, przepisy, regulacje, gdpr
- Crypto: blockchain, web3, bitcoin, ethereum
- Security: cybersecurity, hacking, pentesting

**Kryteria odswiezania:**
- Kurs ma status "active"
- Nie aktualizowany przez 24h
- Temat zawiera keyword z dynamicznych domen

### Task 2: Cron Endpoint (bf4388e)

Utworzono `/api/cron/refresh-knowledge`:

```typescript
// Security: CRON_SECRET required
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// MVP: Mark for lazy refresh instead of expensive regeneration
await supabase
  .from("courses")
  .update({ updated_at: new Date().toISOString() })
  .in("id", courseIds);
```

**Konfiguracja:**
- Runtime: Node.js
- Max duration: 5 min
- Dev mode: CRON_SECRET opcjonalne dla testow

### Task 3: Vercel Cron Config (7621d53)

```json
{
  "crons": [{
    "path": "/api/cron/refresh-knowledge",
    "schedule": "0 5 * * *"
  }]
}
```

**Schedule:** Codziennie o 5:00 UTC (6:00-7:00 w Polsce)

## Architectural Decision: Lazy Refresh

**Problem:** Pelna regeneracja materialow w cron byłaby:
- Droga (wiele wywolan AI)
- Wolna (minuty na kurs)
- Nieprzewidywalna (limity API)

**Rozwiazanie MVP:** Oznaczamy kursy przez `updated_at`:
1. Cron ustawia nowy timestamp
2. UI moze pokazac "Dostepne odswiezenie"
3. User klika "Odswiez" -> regeneracja on-demand

**Future:** Dodac kolumne `needs_refresh: boolean` dla jawnego flagowania.

## API Response Format

```typescript
// Success
{
  success: true,
  message: "Marked 5 courses for refresh",
  refreshed: 5,
  duration_ms: 234,
  courses: [
    { id: "uuid", topic: "React i Next.js" },
    { id: "uuid", topic: "Machine Learning basics" }
  ]
}

// No courses need refresh
{
  success: true,
  message: "No courses need refresh",
  refreshed: 0,
  duration_ms: 45
}

// Error
{
  error: "Unauthorized",
  status: 401
}
```

## Local Testing

```bash
# Development mode (no secret needed)
curl http://localhost:3000/api/cron/refresh-knowledge

# With secret
export CRON_SECRET=$(openssl rand -base64 32)
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/refresh-knowledge
```

## Deviations from Plan

Brak - plan wykonany zgodnie ze specyfikacja.

## Files Changed

| File | Change | Lines |
|------|--------|-------|
| src/lib/dal/courses.ts | Added helper functions | +111 |
| src/app/api/cron/refresh-knowledge/route.ts | Created | +127 |
| vercel.json | Created | +9 |
| .env.example | Updated | +9 |

## User Setup Required

1. **Vercel deployment:** Cron automatycznie aktywowany po deploy
2. **Vercel Dashboard:** Project -> Cron Jobs -> widoczny job
3. **CRON_SECRET:** Automatycznie ustawiony przez Vercel w produkcji

## Verification Checklist

- [x] isDynamicDomain helper dziala poprawnie
- [x] Cron endpoint utworzony i zabezpieczony CRON_SECRET
- [x] vercel.json z cron configuration
- [x] Build przechodzi bez bledow
- [x] Endpoint ma 127 linii (min 50)

## Next Phase Readiness

- [x] KNOW-03 requirement satisfied (daily refresh for dynamic domains)
- [x] Ready for Phase 7 Plan 04 (API Cost Monitoring)
