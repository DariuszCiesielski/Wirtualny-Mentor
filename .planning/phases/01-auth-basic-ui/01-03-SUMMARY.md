---
phase: 01-auth-basic-ui
plan: 03
subsystem: ui
tags: [dashboard, profile, avatar, sidebar, supabase-storage, tailwind]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Supabase auth, shadcn/ui, dark mode"
  - phase: 01-02
    provides: "Login/register/password-reset flows, auth pages"
provides:
  - "Protected dashboard layout z sidebar i header"
  - "Edycja profilu (imie, avatar)"
  - "Logout functionality"
  - "Route protection via requireAuth"
affects: ["02-curriculum-generation", "03-learning-materials"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route group (dashboard) z shared layout"
    - "Server Component layout z requireAuth protection"
    - "Client-side logout z Supabase signOut"
    - "Avatar upload do Supabase Storage"
    - "Server Actions dla profile updates"

key-files:
  created:
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/dashboard/page.tsx
    - src/app/(dashboard)/profile/page.tsx
    - src/app/(dashboard)/profile/actions.ts
    - src/components/layout/sidebar.tsx
    - src/components/layout/header.tsx
    - src/components/layout/logout-button.tsx
    - src/components/profile/profile-form.tsx
    - src/components/profile/avatar-upload.tsx
    - src/lib/auth/mock-auth.ts
    - src/app/(auth)/logout/actions.ts
  modified:
    - src/app/(auth)/login/actions.ts
    - src/app/(auth)/sign-up/actions.ts
    - src/lib/dal/auth.ts
    - src/app/globals.css

key-decisions:
  - "Mock auth support dla local development bez Supabase"
  - "Avatar przechowywany w user_metadata (nie osobna tabela)"
  - "Sidebar nawigacja z placeholder items (Moje kursy, Notatki)"

patterns-established:
  - "Route protection: requireAuth() w layout.tsx chroni wszystkie podstrony"
  - "Profile updates via Server Actions z Zod validation"
  - "Mock auth toggle via USE_MOCK_AUTH w .env.local"

# Metrics
duration: 25min
completed: 2025-01-30
---

# Phase 1 Plan 3: Dashboard Profile Summary

**Protected dashboard z sidebar/header layout, edycja profilu (imie, avatar), mock auth support dla local development**

## Performance

- **Duration:** 25 min
- **Started:** 2025-01-30T16:30:00Z
- **Completed:** 2025-01-30T16:55:00Z
- **Tasks:** 3 (including checkpoint)
- **Files modified:** 17

## Accomplishments

- Dashboard layout z sidebar (240px) i header (64px)
- Sidebar z nawigacja i active state (usePathname)
- Header z user info, theme toggle, logout
- Strona glowna dashboardu z powitaniem
- Edycja profilu (imie z walidacja Zod)
- Avatar upload z preview i Supabase Storage integration
- Mock auth system dla local development bez Supabase
- Route protection przez requireAuth() w layout

## Task Commits

Each task was committed atomically:

1. **Task 1: Dashboard layout z sidebar i header** - `33d1cb7` (feat)
2. **Task 2: Edycja profilu (imie i avatar)** - `bf9ad11` (feat)
3. **Mock auth support (dodatkowe)** - `fdfcaee` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

### Created
- `src/app/(dashboard)/layout.tsx` - Dashboard layout z sidebar/header i requireAuth protection
- `src/app/(dashboard)/dashboard/page.tsx` - Dashboard home page z powitaniem
- `src/app/(dashboard)/profile/page.tsx` - Profile edit page
- `src/app/(dashboard)/profile/actions.ts` - Server Actions dla updateProfile i uploadAvatar
- `src/components/layout/sidebar.tsx` - Sidebar nawigacji z active states
- `src/components/layout/header.tsx` - Header z user info i logout
- `src/components/layout/logout-button.tsx` - Przycisk wylogowania (client-side)
- `src/components/profile/profile-form.tsx` - Formularz edycji imienia
- `src/components/profile/avatar-upload.tsx` - Upload avatara z preview
- `src/lib/auth/mock-auth.ts` - Mock auth system dla local development
- `src/app/(auth)/logout/actions.ts` - Server Action dla logout

### Modified
- `src/app/(auth)/login/actions.ts` - Mock auth integration
- `src/app/(auth)/sign-up/actions.ts` - Mock auth integration
- `src/lib/dal/auth.ts` - Mock auth support w DAL
- `src/app/globals.css` - Poprawki CSS

## Decisions Made

1. **Mock auth system** - Dodano mock auth dla local development gdy Supabase jest niedostepny. Toggle via USE_MOCK_AUTH=true w .env.local
2. **Avatar w user_metadata** - Avatar URL przechowywany w Supabase user_metadata zamiast osobnej tabeli
3. **Sidebar placeholder items** - "Moje kursy" i "Notatki" jako disabled items (gotowe na Phase 2+)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Mock auth system dla local development**
- **Found during:** Task 1 (Dashboard layout)
- **Issue:** Supabase client wymaga prawidlowej konfiguracji, local development bez Supabase nieuzyteczny
- **Fix:** Dodano mock auth system z toggle USE_MOCK_AUTH, mock user z id/email/name
- **Files created:** src/lib/auth/mock-auth.ts
- **Files modified:** src/lib/dal/auth.ts, src/app/(auth)/login/actions.ts, src/app/(auth)/sign-up/actions.ts
- **Verification:** npm run build passes, app dziala z mock auth
- **Committed in:** fdfcaee

**2. [Rule 3 - Blocking] Logout server action**
- **Found during:** Task 1 (Logout button)
- **Issue:** Client-side logout z supabase.auth.signOut() wymagal dodatkowej logiki
- **Fix:** Dodano src/app/(auth)/logout/actions.ts z Server Action
- **Files created:** src/app/(auth)/logout/actions.ts
- **Verification:** Logout dziala poprawnie
- **Committed in:** fdfcaee

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Blocking issues rozwiazane dla lepszego DX. Mock auth umozliwia development bez Supabase.

## Issues Encountered

None - plan executed successfully po rozwiazaniu blocking issues.

## User Setup Required

**External services require manual configuration.** See [01-USER-SETUP.md](./01-USER-SETUP.md) for:
- Supabase Storage bucket 'avatars' setup
- RLS policy dla authenticated uploads

## Next Phase Readiness

- Phase 1 complete - pelny system auth z dashboard
- Gotowe na Phase 2: Curriculum Generation
- Dashboard skeleton przygotowany na integracje kursow i notatek
- Wymagany user setup: Supabase Storage bucket dla avatarow

---
*Phase: 01-auth-basic-ui*
*Completed: 2025-01-30*
