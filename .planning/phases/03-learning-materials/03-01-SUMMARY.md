---
completed: 2026-01-31
duration: 6 min
subsystem: learning-materials
tags: [database, typescript, zod, migration]
dependency-graph:
  requires: [02-curriculum-generation]
  provides: [section_content-table, materials-types, materials-schemas]
  affects: [03-02, 03-03, 03-04]
tech-stack:
  added: []
  patterns: [JSONB-for-structured-data, RLS-via-join, versioning]
key-files:
  created:
    - supabase/migrations/20260131000001_section_content.sql
    - src/types/materials.ts
    - src/lib/ai/materials/schemas.ts
  modified: []
decisions:
  - id: materials-versioning
    choice: "version INT column z UNIQUE(chapter_id, version)"
    rationale: "Umozliwia regeneracje bez utraty starej wersji"
  - id: jsonb-structured-data
    choice: "JSONB dla key_concepts, practical_steps, tools, external_resources, sources"
    rationale: "Elastycznosc struktury bez dodatkowych tabel"
metrics:
  tasks: 2/2
  commits: 2
---

# Phase 3 Plan 1: Database Foundation Summary

**One-liner:** Tabela section_content z JSONB polami i RLS, plus TypeScript types/Zod schemas dla materials.

## What Was Built

### Task 1: Database Migration

Utworzono migracje `20260131000001_section_content.sql`:

```sql
CREATE TABLE section_content (
  id UUID PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES chapters(id),
  content TEXT NOT NULL,
  key_concepts JSONB DEFAULT '[]',
  practical_steps JSONB DEFAULT '[]',
  tools JSONB DEFAULT '[]',
  external_resources JSONB DEFAULT '[]',
  sources JSONB NOT NULL DEFAULT '[]',
  word_count INT,
  estimated_reading_minutes INT,
  language TEXT DEFAULT 'pl',
  generated_at TIMESTAMPTZ,
  generation_model TEXT,
  generation_cost_tokens INT,
  version INT DEFAULT 1,
  UNIQUE(chapter_id, version)
);
```

Kluczowe cechy:
- **RLS policies** via course_id join (ten sam pattern co chapters)
- **GIN index** na sources dla szybkiego wyszukiwania
- **Versioning** - UNIQUE constraint pozwala na multiple versions per chapter
- **JSONB** dla elastycznosci struktury danych

### Task 2: TypeScript Types i Zod Schemas

**src/types/materials.ts:**
- `Source` - zrodlo z anti-hallucination tracking
- `KeyConcept` - termin z definicja
- `PracticalStep` - krok instrukcji
- `Tool` - narzedzie do nauki
- `ExternalResource` - zewnetrzny zasob
- `SectionContent` - glowny typ (camelCase)
- `SectionContentRow` - database row (snake_case)

**src/lib/ai/materials/schemas.ts:**
- `sourceSchema` - walidacja zrodel
- `keyConceptSchema` - walidacja pojec
- `practicalStepSchema` - walidacja krokow
- `toolSchema` - walidacja narzedzi
- `externalResourceSchema` - walidacja zasobow
- `sectionContentSchema` - pelna walidacja dla AI generation

Schemas maja `.describe()` dla AI generation guidance.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Versioning | UNIQUE(chapter_id, version) | Regeneracja bez utraty starej wersji |
| Structured data | JSONB zamiast osobnych tabel | Elastycznosc, mniej joins |
| RLS pattern | Via course_id join | Konsystencja z chapters, level_outcomes |

## Deviations from Plan

### Auto-added (Rule 2 - Missing Critical)

1. **Dodano UPDATE i DELETE RLS policies** - plan mial tylko SELECT i INSERT, ale dla kompletnosci dodano tez UPDATE i DELETE policies.

2. **Dodano idx_section_content_version index** - dla szybszego wyszukiwania po version.

3. **Dodano PartialSectionContent i GenerateContentInput** w materials.ts - utility types dla streaming i generation input.

## Verification Results

- [x] Migration file istnieje w supabase/migrations/
- [x] `npx tsc --noEmit` przechodzi bez bledow
- [x] Typy mozna importowac z @/types/materials
- [x] Schemas mozna importowac z @/lib/ai/materials/schemas

## Commits

| Hash | Message |
|------|---------|
| 334ce71 | feat(03-01): database migration dla section_content |
| d508a9e | feat(03-01): TypeScript types i Zod schemas dla materials |

## Next Phase Readiness

Plan 03-02 moze:
- Uzywac typow z `@/types/materials`
- Uzywac schemas z `@/lib/ai/materials/schemas`
- Zapisywac dane do tabeli `section_content` (po uruchomieniu migration)

**User action required:** Uruchom migration w Supabase SQL Editor przed generowaniem content.
