# Aurora OS — Master Architecture & Engineering Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify five fragmented Aurora repositories into a cohesive, production-grade monorepo that gives a school founder real-time intelligence about every dimension of school operations — financials, enrollment, compliance, curriculum, and student welfare — while remaining maintainable by a single engineer with ~1–2 hours/month of ops time.

**Architecture:** Turborepo monorepo with shared packages (`@aurora/ui`, `@aurora/types`, `@aurora/supabase`, `@aurora/config`), a unified Supabase backend with RBAC across all apps, and a live Simption sync pipeline that runs on a schedule and pushes fresh data to all dashboards.

**Tech Stack:** React 19 + Vite + TypeScript + Tailwind CSS · Supabase (PostgreSQL + Auth + Edge Functions) · Bun (runtime + package manager) · Playwright (scraping + E2E) · Turborepo (monorepo orchestration) · GitHub Actions (CI/CD) · Vercel (hosting, zero-ops)

---

## Multi-Perspective Framing

### CEO View — Business Outcomes

The five repos are fragmented product surface area. The consolidation must deliver:
- **One URL for the founder**: a single dashboard URL that surfaces everything that matters
- **Trust through accuracy**: data that matches Simption exactly, or clearly says "last synced X minutes ago"
- **Expansion readiness**: when enrollment grows from 300 to 600 students, the system scales without rewrites
- **Parent confidence**: Phase 2 parent portal is a retention and marketing tool — parents who can see attendance and dues in real time call less and complain less

### CTO View — Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo tool | Turborepo | Zero-config caching, Vercel-native, works with Bun |
| Auth | Supabase Auth + RLS | Already in aurora-curriculum; consolidate rather than duplicate |
| State | React Query + Supabase realtime | No Redux needed; server state is the single source of truth |
| Scraping | Playwright in aurora-scraper (Bun) | Already working; wrap in a cron-triggered Edge Function |
| Styling | Tailwind CSS + `@aurora/ui` tokens | Shared design system prevents drift across apps |
| Hosting | Vercel monorepo (per-app deployments) | Single `vercel.json` at root, each app gets its own domain |
| CI | GitHub Actions | Free for public repos; matrix builds per app |
| Secrets | Vercel env + GitHub Actions secrets | Never in code |

### CFO View — Financial Infrastructure

The financial dashboard (aurora-expenses) is not just a view — it is the founder's **CFO substitute**. It must:
- Flag salary-to-revenue ratio crossing 65% threshold automatically
- Show fee collection rate vs. 92% target every month
- Surface aging defaulters with contact info (WhatsApp deep-link per student)
- Project surplus/deficit 3 months forward based on historical run rate
- Export a monthly P&L PDF to a pre-configured email (or Google Drive) on the 1st of each month

### Founder / School Thinker View — Usability & Mission

The system fails if the founder has to context-switch between 5 URLs. Success looks like:
- **One login** — same Google/email works across all apps
- **Mobile-first Founder Pulse** — 10 KPIs visible on a phone without scrolling
- **Zero training required** — any new hire (accountant, admin) understands their section in 5 minutes
- **Calm over noise** — only actionable alerts surface; no dashboards that just display numbers without telling you what to do
- **Mission alignment** — student welfare scores (attendance, homework completion, teacher quality) are first-class citizens alongside financials

---

## Current State Audit

### Repos & Their Status

| Repo | Status | Stack | Primary Gap |
|---|---|---|---|
| `aurora-thread-school` | Live (Lovable-hosted) | React + Vite | No internal tooling; marketing-only |
| `aurora-dashboard` | Scaffolded | React + Vite + TS + Tailwind | Empty — no pages built yet |
| `aurora-scraper` | Working | Bun + Playwright + TS | No scheduling; manual trigger only |
| `aurora-curriculum` | Production | React + Vite + TS + Tailwind + Supabase | Siloed auth; no data sharing |
| `aurora-expenses` | Phase 1 built | React + Vite + TS + Recharts | Mock data only; no live Supabase |

### Shared Pain Points

1. **5 separate auth systems** — curriculum has Supabase auth; expenses has none; dashboard is empty
2. **No shared types** — `ERPStudent` in scraper, `Student` in curriculum, and KPI types in expenses are all independent
3. **No shared UI** — `Card`, `SectionTitle` components duplicated across expenses and curriculum
4. **Scraper has no scheduler** — must be triggered manually via webhook
5. **No CI** — any push can break production
6. **Mock data in production** — aurora-expenses shows hardcoded March 2026 figures

---

## Target Architecture

```
aurora-os/ (Turborepo monorepo)
├── apps/
│   ├── dashboard/          ← aurora-dashboard (unified founder + staff app)
│   ├── curriculum/         ← aurora-curriculum
│   ├── expenses/           ← aurora-expenses (migrated in)
│   └── site/               ← aurora-thread-school (optional, stays on Lovable)
├── packages/
│   ├── ui/                 ← @aurora/ui — shared components + design tokens
│   ├── types/              ← @aurora/types — shared TypeScript interfaces
│   ├── supabase/           ← @aurora/supabase — client, auth helpers, hooks
│   └── config/             ← @aurora/config — Vite, Tailwind, ESLint base configs
├── services/
│   └── scraper/            ← aurora-scraper (migrated in)
├── supabase/               ← single Supabase project: migrations + Edge Functions
│   ├── migrations/
│   └── functions/
│       ├── sync-simption/  ← triggered by cron; runs scraper; writes to DB
│       └── monthly-report/ ← generates PDF P&L and emails it
├── .github/workflows/      ← CI/CD pipelines
├── turbo.json
├── package.json            ← workspace root (Bun workspaces)
└── vercel.json             ← monorepo deployment config
```

### Data Flow

```
Simption ERP (PHP SaaS)
        │
        ▼  [every 6 hours via cron]
supabase/functions/sync-simption
        │  triggers
        ▼
services/scraper  [Playwright headless]
        │  writes
        ▼
Supabase PostgreSQL
  ├── students (live roster)
  ├── fee_records (dues + payments)
  ├── attendance_records
  └── sync_logs (last_sync_at, rows_updated, errors)
        │
        ▼  [Supabase Realtime + React Query]
apps/dashboard  →  Founder Pulse, Financial Health, Enrollment, Compliance
apps/curriculum →  Lesson planner, Student profiles, Progress tracker
```

---

## Unified Supabase Schema

All apps share one Supabase project. The schema extends what's already in aurora-curriculum.

### Core Tables (additions/changes)

```sql
-- Extend existing schools table
ALTER TABLE schools ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}';

-- Unified user roles (extends teacher_profiles)
-- roles: 'founder' | 'teacher' | 'operator' | 'parent'
-- (parent role added for Phase 2)

-- Students — single source of truth (synced from Simption)
CREATE TABLE students (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     uuid REFERENCES schools(id) ON DELETE CASCADE,
  erp_id        text NOT NULL,          -- Simption ERP internal ID
  name          text NOT NULL,
  class         text NOT NULL,          -- e.g. 'VI-A'
  section       text,
  dob           date,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(school_id, erp_id)
);

-- Fee records — synced from Simption
CREATE TABLE fee_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     uuid REFERENCES schools(id) ON DELETE CASCADE,
  student_id    uuid REFERENCES students(id) ON DELETE CASCADE,
  amount_due    numeric(10,2) NOT NULL,
  amount_paid   numeric(10,2) DEFAULT 0,
  due_date      date NOT NULL,
  paid_at       timestamptz,
  fee_type      text DEFAULT 'tuition', -- tuition | transport | misc
  created_at    timestamptz DEFAULT now()
);

-- Attendance — synced from Simption
CREATE TABLE attendance_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     uuid REFERENCES schools(id) ON DELETE CASCADE,
  student_id    uuid REFERENCES students(id) ON DELETE CASCADE,
  date          date NOT NULL,
  status        text NOT NULL CHECK (status IN ('present','absent','late','holiday')),
  marked_by     uuid REFERENCES teacher_profiles(id),
  UNIQUE(school_id, student_id, date)
);

-- Monthly financial snapshots (computed from fee_records, stored for speed)
CREATE TABLE monthly_financials (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       uuid REFERENCES schools(id) ON DELETE CASCADE,
  month           text NOT NULL,     -- 'YYYY-MM'
  revenue         numeric(12,2),
  expenses        numeric(12,2),
  surplus         numeric(12,2),
  collection_rate numeric(5,2),      -- percentage
  created_at      timestamptz DEFAULT now(),
  UNIQUE(school_id, month)
);

-- Sync audit log
CREATE TABLE sync_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     uuid REFERENCES schools(id) ON DELETE CASCADE,
  synced_at     timestamptz DEFAULT now(),
  students_updated int,
  fees_updated    int,
  attendance_updated int,
  errors        jsonb DEFAULT '[]',
  duration_ms   int
);
```

### RLS Policies

```sql
-- Founders see all data for their school
-- Teachers see only their class's student data
-- Operators see financial data only
-- Parents see only their child's data (Phase 2)

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_access" ON students
  USING (school_id IN (
    SELECT school_id FROM teacher_profiles WHERE id = auth.uid()
  ));

-- Founder-only tables
ALTER TABLE monthly_financials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "founder_only" ON monthly_financials
  USING (
    school_id IN (
      SELECT school_id FROM teacher_profiles
      WHERE id = auth.uid() AND role IN ('founder', 'operator')
    )
  );
```

---

## @aurora/ui — Shared Design System

### Tokens (single source of truth)

```typescript
// packages/ui/src/tokens.ts
export const colors = {
  bg:       '#F7F4EF',
  ink:      '#1A1714',
  muted:    '#8B8175',
  accent:   '#4338CA',
  accentLight: '#C7D2FE',
  gold:     '#D4A853',
  surface:  '#FFFFFF',
  border:   'rgba(26,23,20,0.08)',
  green:    '#059669',
  amber:    '#D97706',
  red:      '#DC2626',
  orange:   '#F97316',
} as const

export const fonts = {
  serif: 'Fraunces, serif',
  sans:  'DM Sans, sans-serif',
} as const

export const radii = { sm: 4, md: 8, lg: 12, xl: 16 } as const
export const shadows = { card: '0 1px 4px rgba(0,0,0,0.04)' } as const
```

### Shared Components

```
packages/ui/src/
├── Card.tsx          ← white card with border + shadow (currently duplicated in 3 apps)
├── SectionTitle.tsx  ← Fraunces heading + muted subtitle
├── KPICard.tsx       ← status-colored KPI tile with accent bar
├── StatusBadge.tsx   ← VALID / URGENT / EXPIRED / DUE SOON pill
├── Sidebar.tsx       ← collapsible dark nav (shared between dashboard + curriculum)
├── DataTable.tsx     ← sortable table with zebra rows
├── ProgressBar.tsx   ← colored horizontal bar (for expense breakdown, enrollment)
└── tokens.ts         ← design tokens (above)
```

---

## @aurora/types — Shared TypeScript Interfaces

```typescript
// packages/types/src/index.ts

export type Role = 'founder' | 'teacher' | 'operator' | 'parent'
export type Status = 'green' | 'amber' | 'red'
export type SyncStatus = 'idle' | 'syncing' | 'error'

export interface School {
  id: string
  name: string
  cbseCode: string
  settings: Record<string, unknown>
}

export interface Student {
  id: string
  schoolId: string
  erpId: string
  name: string
  class: string
  section?: string
  guardianName?: string
  guardianPhone?: string
  isActive: boolean
}

export interface FeeRecord {
  id: string
  studentId: string
  amountDue: number
  amountPaid: number
  dueDate: string
  paidAt?: string
  feeType: 'tuition' | 'transport' | 'misc'
}

export interface MonthlyFinancial {
  month: string         // 'YYYY-MM'
  revenue: number
  expenses: number
  surplus: number
  collectionRate: number
}

export interface SyncLog {
  syncedAt: string
  studentsUpdated: number
  feesUpdated: number
  errors: string[]
  durationMs: number
}

export interface KPI {
  id: string
  label: string
  value: string
  subtext: string
  status: Status
  trend?: string
}
```

---

## Simption Sync Pipeline

### Architecture

```
GitHub Actions cron (every 6h)
  → POST /functions/v1/sync-simption (Supabase Edge Function)
      → spawns aurora-scraper (Playwright headless Chromium)
          → scrapes Simption: students, fees, attendance
          → upserts to Supabase via service_role key
          → writes sync_log row
      → returns { studentsUpdated, feesUpdated, durationMs }
```

### Edge Function skeleton

```typescript
// supabase/functions/sync-simption/index.ts
import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('SYNC_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Call scraper microservice (deployed separately on Railway/Fly.io)
  const res = await fetch(Deno.env.get('SCRAPER_URL')!, {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('SCRAPER_SECRET')}` },
  })

  const data = await res.json()

  // Write sync log
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  await supabase.from('sync_logs').insert({
    students_updated: data.studentsUpdated,
    fees_updated: data.feesUpdated,
    duration_ms: data.durationMs,
    errors: data.errors ?? [],
  })

  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
})
```

### Cron trigger (GitHub Actions)

```yaml
# .github/workflows/sync-simption.yml
name: Simption Sync
on:
  schedule:
    - cron: '0 */6 * * *'   # every 6 hours
  workflow_dispatch:          # manual trigger from GitHub UI
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger sync
        run: |
          curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/sync-simption" \
            -H "Authorization: Bearer ${{ secrets.SYNC_SECRET }}"
```

---

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [dashboard, curriculum, expenses]
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun turbo build --filter=@aurora/${{ matrix.app }}
      - run: bun turbo lint  --filter=@aurora/${{ matrix.app }}

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun turbo typecheck
```

### Vercel Monorepo Config

```json
// vercel.json (at repo root)
{
  "projects": [
    { "framework": "vite", "rootDirectory": "apps/dashboard",   "outputDirectory": "dist" },
    { "framework": "vite", "rootDirectory": "apps/curriculum",  "outputDirectory": "dist" },
    { "framework": "vite", "rootDirectory": "apps/expenses",    "outputDirectory": "dist" }
  ]
}
```

---

## Phased Implementation Plan

---

## Chunk 1: Foundation — Monorepo + Shared Packages

### Task 1: Bootstrap Turborepo Monorepo

**Files:**
- Create: `turbo.json`
- Create: `package.json` (workspace root)
- Modify: each `apps/*/package.json` (add workspace names)

- [ ] **Step 1: Initialise workspace root**

```bash
cd /Users/mist/aurora-os
cat > package.json << 'EOF'
{
  "name": "aurora-os",
  "private": true,
  "workspaces": ["apps/*", "packages/*", "services/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
EOF
```

- [ ] **Step 2: Write turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build":     { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev":       { "cache": false, "persistent": true },
    "lint":      { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

- [ ] **Step 3: Move aurora-expenses into apps/**

```bash
mkdir -p apps
cp -r aurora-expenses apps/expenses
# Update package.json name to "@aurora/expenses"
```

- [ ] **Step 4: Move aurora-curriculum into apps/**

```bash
cp -r aurora-curriculum apps/curriculum
# Update package.json name to "@aurora/curriculum"
```

- [ ] **Step 5: Install and verify**

```bash
bun install
bun turbo build --dry-run
```
Expected: plan shows all apps in build graph with no errors.

- [ ] **Step 6: Commit**

```bash
git add turbo.json package.json apps/
git commit -m "feat: bootstrap Turborepo monorepo with apps workspace"
```

---

### Task 2: Create @aurora/types Package

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/tsconfig.json`

- [ ] **Step 1: Scaffold package**

```bash
mkdir -p packages/types/src
```

```json
// packages/types/package.json
{
  "name": "@aurora/types",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "typecheck": "tsc --noEmit" }
}
```

- [ ] **Step 2: Write types** (copy the unified interfaces from the schema section above into `packages/types/src/index.ts`)

- [ ] **Step 3: Add as dependency to each app**

In each `apps/*/package.json`:
```json
"dependencies": {
  "@aurora/types": "workspace:*"
}
```

- [ ] **Step 4: Verify**

```bash
bun install && bun turbo typecheck
```

- [ ] **Step 5: Commit**

```bash
git add packages/types/
git commit -m "feat: add @aurora/types shared package"
```

---

### Task 3: Create @aurora/ui Package

**Files:**
- Create: `packages/ui/src/tokens.ts`
- Create: `packages/ui/src/Card.tsx`
- Create: `packages/ui/src/KPICard.tsx`
- Create: `packages/ui/src/SectionTitle.tsx`
- Create: `packages/ui/src/StatusBadge.tsx`
- Create: `packages/ui/src/index.ts`

- [ ] **Step 1: Scaffold package structure**

```bash
mkdir -p packages/ui/src
```

- [ ] **Step 2: Copy tokens** (from the design system section above into `packages/ui/src/tokens.ts`)

- [ ] **Step 3: Extract Card from aurora-expenses**

Move `apps/expenses/src/components/Card.tsx` → `packages/ui/src/Card.tsx`, update import paths.

- [ ] **Step 4: Extract KPICard similarly**

- [ ] **Step 5: Export from index**

```typescript
// packages/ui/src/index.ts
export * from './tokens'
export { Card } from './Card'
export { KPICard } from './KPICard'
export { SectionTitle } from './SectionTitle'
export { StatusBadge } from './StatusBadge'
```

- [ ] **Step 6: Update imports in apps/expenses to use @aurora/ui**

Replace all local component imports in `apps/expenses/src/pages/*.tsx`.

- [ ] **Step 7: Build and verify**

```bash
bun turbo build --filter=@aurora/expenses
```

- [ ] **Step 8: Commit**

```bash
git add packages/ui/ apps/expenses/
git commit -m "feat: extract @aurora/ui shared component package"
```

---

## Chunk 2: Supabase — Live Data Layer

### Task 4: Apply Schema Migrations

**Files:**
- Create: `supabase/migrations/008_students.sql`
- Create: `supabase/migrations/009_fee_records.sql`
- Create: `supabase/migrations/010_attendance.sql`
- Create: `supabase/migrations/011_monthly_financials.sql`
- Create: `supabase/migrations/012_sync_logs.sql`
- Create: `supabase/migrations/013_rls_policies.sql`

- [ ] **Step 1: Write student migration** (from unified schema section above)

- [ ] **Step 2: Write fee_records migration**

- [ ] **Step 3: Write attendance_records migration**

- [ ] **Step 4: Write monthly_financials migration**

- [ ] **Step 5: Write sync_logs migration**

- [ ] **Step 6: Write RLS policies migration**

- [ ] **Step 7: Apply to Supabase**

```bash
npx supabase db push
```

- [ ] **Step 8: Generate TypeScript types**

```bash
npx supabase gen types typescript --local > packages/types/src/database.ts
```

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/ packages/types/src/database.ts
git commit -m "feat: unified Supabase schema — students, fees, attendance, sync_logs"
```

---

### Task 5: Create @aurora/supabase Package

**Files:**
- Create: `packages/supabase/src/client.ts`
- Create: `packages/supabase/src/hooks/useStudents.ts`
- Create: `packages/supabase/src/hooks/useFeeRecords.ts`
- Create: `packages/supabase/src/hooks/useMonthlyFinancials.ts`
- Create: `packages/supabase/src/hooks/useSyncStatus.ts`

- [ ] **Step 1: Create Supabase client (shared)**

```typescript
// packages/supabase/src/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@aurora/types/database'

const url  = import.meta.env.VITE_SUPABASE_URL
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(url, key)
```

- [ ] **Step 2: Write useStudents hook**

```typescript
// packages/supabase/src/hooks/useStudents.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../client'

export function useStudents(schoolId: string) {
  return useQuery({
    queryKey: ['students', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('class')
      if (error) throw error
      return data
    },
  })
}
```

- [ ] **Step 3: Write useFeeRecords hook similarly**

- [ ] **Step 4: Write useMonthlyFinancials hook**

- [ ] **Step 5: Write useSyncStatus hook** — polls `sync_logs` most recent row, exposes `lastSync`, `isSyncing`, `syncError`

- [ ] **Step 6: Wire into apps/expenses** — replace mock data imports with real hooks

- [ ] **Step 7: Add `SyncStatusBar` component** — a narrow bar at the top of each page showing "Last synced: 2h ago · Sync now" — sourced from useSyncStatus

- [ ] **Step 8: Build and verify**

```bash
bun turbo build --filter=@aurora/expenses
```

- [ ] **Step 9: Commit**

```bash
git add packages/supabase/ apps/expenses/src/
git commit -m "feat: @aurora/supabase package with live data hooks — replace mock data in expenses"
```

---

## Chunk 3: Simption Sync Pipeline

### Task 6: Deploy Scraper as a Persistent Service

**Files:**
- Modify: `services/scraper/src/server.ts` (add `/scrape` endpoint that writes to Supabase)
- Create: `services/scraper/Dockerfile`
- Create: `services/scraper/fly.toml` (or Railway config)

- [ ] **Step 1: Move aurora-scraper into services/**

```bash
cp -r aurora-scraper services/scraper
# Update package.json name to "@aurora/scraper"
```

- [ ] **Step 2: Add Supabase write to scraper output**

In `services/scraper/src/server.ts`, after scrape completes:
```typescript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Upsert students
await supabase.from('students').upsert(
  students.map(s => ({
    school_id: process.env.SCHOOL_ID,
    erp_id:    s.id,
    name:      s.name,
    class:     s.class,
    // ...map all fields
  })),
  { onConflict: 'school_id,erp_id' }
)
```

- [ ] **Step 3: Write Dockerfile**

```dockerfile
FROM oven/bun:1-slim
WORKDIR /app
RUN apt-get update && apt-get install -y \
  chromium chromium-driver && rm -rf /var/lib/apt/lists/*
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY src ./src
EXPOSE 3000
CMD ["bun", "src/server.ts"]
```

- [ ] **Step 4: Deploy to Fly.io (free tier)**

```bash
flyctl launch --name aurora-scraper --no-deploy
flyctl secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SCRAPER_SECRET=...
flyctl deploy
```

- [ ] **Step 5: Test end-to-end**

```bash
curl -X POST https://aurora-scraper.fly.dev/scrape \
  -H "Authorization: Bearer $SCRAPER_SECRET"
```
Verify rows appear in Supabase `students` table.

- [ ] **Step 6: Commit**

```bash
git add services/scraper/
git commit -m "feat: scraper writes directly to Supabase students + fee_records"
```

---

### Task 7: Supabase Edge Function — Sync Orchestrator

**Files:**
- Create: `supabase/functions/sync-simption/index.ts`

- [ ] **Step 1: Write Edge Function** (from the sync pipeline skeleton above)

- [ ] **Step 2: Deploy**

```bash
npx supabase functions deploy sync-simption \
  --project-ref $SUPABASE_PROJECT_REF
```

- [ ] **Step 3: Set secrets**

```bash
npx supabase secrets set \
  SCRAPER_URL=https://aurora-scraper.fly.dev \
  SCRAPER_SECRET=$SCRAPER_SECRET \
  SYNC_SECRET=$SYNC_SECRET
```

- [ ] **Step 4: Verify with manual call**

```bash
curl -X POST "$SUPABASE_URL/functions/v1/sync-simption" \
  -H "Authorization: Bearer $SYNC_SECRET"
```
Check sync_logs table for a new row.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/sync-simption/
git commit -m "feat: Supabase Edge Function sync-simption orchestrator"
```

---

### Task 8: GitHub Actions Cron for Sync

**Files:**
- Create: `.github/workflows/sync-simption.yml`

- [ ] **Step 1: Write workflow** (from the CI/CD section above)

- [ ] **Step 2: Add GitHub secrets**

In repo Settings → Secrets:
- `SUPABASE_URL`
- `SYNC_SECRET`

- [ ] **Step 3: Trigger manually and verify**

In GitHub Actions tab → sync-simption → Run workflow

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/sync-simption.yml
git commit -m "ci: scheduled Simption sync every 6 hours via GitHub Actions"
```

---

## Chunk 4: Unified Auth & Dashboard Shell

### Task 9: Unified Auth with RBAC

**Files:**
- Create: `packages/supabase/src/auth.ts`
- Create: `packages/supabase/src/hooks/useCurrentUser.ts`
- Modify: `apps/expenses/src/main.tsx` (add auth guard)
- Modify: `apps/dashboard/src/main.tsx` (add auth guard)

- [ ] **Step 1: Write useCurrentUser hook**

```typescript
// packages/supabase/src/hooks/useCurrentUser.ts
import { useEffect, useState } from 'react'
import { supabase } from '../client'
import type { Role } from '@aurora/types'

export interface CurrentUser {
  id: string
  email: string
  role: Role
  schoolId: string
  displayName: string
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return }
      const { data } = await supabase
        .from('teacher_profiles')
        .select('id, display_name, role, school_id')
        .eq('id', session.user.id)
        .single()
      if (data) {
        setUser({ id: data.id, email: session.user.email!, role: data.role, schoolId: data.school_id, displayName: data.display_name })
      }
      setLoading(false)
    })
  }, [])

  return { user, loading }
}
```

- [ ] **Step 2: Create AuthGuard component in @aurora/ui**

Redirects unauthenticated users to `/login`. Shows loading spinner during session check.

- [ ] **Step 3: Wrap each app's router with AuthGuard**

- [ ] **Step 4: Add role checks to financial pages** (founder + operator only)

- [ ] **Step 5: Test with each role** — verify teacher cannot access Financial page

- [ ] **Step 6: Commit**

```bash
git add packages/supabase/src/hooks/useCurrentUser.ts packages/ui/src/AuthGuard.tsx
git commit -m "feat: unified RBAC auth guard across all Aurora apps"
```

---

### Task 10: Unified Dashboard Shell (apps/dashboard)

**Files:**
- Create: `apps/dashboard/src/App.tsx`
- Create: `apps/dashboard/src/pages/FounderPulse.tsx` (live version)
- Create: `apps/dashboard/src/pages/Financial.tsx` (from aurora-expenses, with live data)
- Create: `apps/dashboard/src/pages/Enrollment.tsx`
- Create: `apps/dashboard/src/pages/Compliance.tsx`
- Create: `apps/dashboard/src/pages/Students.tsx`

- [ ] **Step 1: Port pages from aurora-expenses into apps/dashboard**

Update imports to use `@aurora/ui` and `@aurora/supabase` hooks instead of local mocks.

- [ ] **Step 2: Add SyncStatusBar to every page** — shows "Last synced: Xh ago" with color coding

- [ ] **Step 3: Add live KPIs to Founder Pulse**

Replace hardcoded values with computed queries:
- Collection rate: `COUNT(paid) / COUNT(total) * 100` from fee_records
- Active students: `COUNT(*)` from students WHERE is_active
- Absent today: from attendance_records WHERE date = today AND status = 'absent'

- [ ] **Step 4: Mobile-first audit**

Check every page at 375px width. KPI cards should stack 2×2 at mobile.

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/src/
git commit -m "feat: unified dashboard shell with live Supabase data + SyncStatusBar"
```

---

## Chunk 5: Alerts, Reports & Polish

### Task 11: WhatsApp Alert Deep-Links for Defaulters

**Files:**
- Modify: `apps/dashboard/src/pages/Financial.tsx`

- [ ] **Step 1: Add WhatsApp link to each defaulter row**

```typescript
const waLink = (phone: string, name: string, amount: number) =>
  `https://wa.me/91${phone}?text=${encodeURIComponent(
    `Dear Parent of ${name}, ₹${amount.toLocaleString('en-IN')} is overdue. Please clear at the earliest. — Aurora Thread School`
  )}`
```

Add a "Send Reminder" button in the defaulters table that opens `waLink(...)` in a new tab.

- [ ] **Step 2: Verify link format on mobile**

Click button on mobile browser — should open WhatsApp with pre-filled message.

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/src/pages/Financial.tsx
git commit -m "feat: WhatsApp reminder deep-links in fee defaulters table"
```

---

### Task 12: Monthly P&L Report — Edge Function

**Files:**
- Create: `supabase/functions/monthly-report/index.ts`

- [ ] **Step 1: Write Edge Function**

Triggered by cron on 1st of each month. Queries monthly_financials for previous month. Generates a plain-text email summary. Sends via Supabase's SMTP (or Resend API).

```typescript
// Pseudocode:
// 1. Query monthly_financials WHERE month = last month
// 2. Compute surplus %, salary %, collection rate
// 3. Build email body with INR formatting
// 4. POST to Resend API (free tier: 3000 emails/month)
```

- [ ] **Step 2: Add cron trigger in GitHub Actions**

```yaml
- cron: '0 8 1 * *'   # 8am on the 1st of every month
```

- [ ] **Step 3: Test by triggering manually**

Check that email arrives at founder's address with correct figures.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/monthly-report/ .github/workflows/
git commit -m "feat: monthly P&L report emailed to founder on 1st of each month"
```

---

### Task 13: CI Pipeline

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/sync-simption.yml`

- [ ] **Step 1: Write CI workflow** (from the CI/CD section above)

- [ ] **Step 2: Add Vercel preview deployment** per PR

In Vercel dashboard: connect GitHub repo, enable Preview Deployments. Each PR gets a unique URL for review.

- [ ] **Step 3: Verify CI passes on main**

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: GitHub Actions — build, lint, typecheck on every push to main"
```

---

## Chunk 6: Phase 2 — Parent Portal (Future)

> **Do not implement now.** Document here for reference. Build only when enrollment exceeds 200 students and parent demand is confirmed.

### Parent Portal Features (Phase 2)

- [ ] Auth: OTP-based login via parent's phone number (no password)
- [ ] View: child's attendance (last 30 days, calendar view)
- [ ] View: fee dues and payment history
- [ ] View: monthly report card (when uploaded by teacher)
- [ ] Notifications: push notification via WhatsApp when fee is due (7 days before)

### Technical additions needed for Phase 2

- Add `parent` role to `teacher_profiles` (or separate `parent_profiles` table)
- Add `student_parents` join table
- Deploy `apps/parent` as a separate Vite app (mobile-optimised, PWA)
- Add `guardian_phone` to students table (already in schema above — it's there)

---

## Operational Runbook

### How to trigger a manual sync

```bash
# From GitHub Actions UI:
# → Actions → Simption Sync → Run workflow

# Or via curl:
curl -X POST "$SUPABASE_URL/functions/v1/sync-simption" \
  -H "Authorization: Bearer $SYNC_SECRET"
```

### How to check sync health

```sql
-- In Supabase SQL editor:
SELECT synced_at, students_updated, fees_updated, duration_ms, errors
FROM sync_logs
ORDER BY synced_at DESC
LIMIT 10;
```

### How to add a new dashboard page

1. Create `apps/dashboard/src/pages/NewPage.tsx`
2. Import shared components from `@aurora/ui`
3. Import data hooks from `@aurora/supabase`
4. Add entry to `apps/dashboard/src/App.tsx` page map
5. Add nav item to `packages/ui/src/Sidebar.tsx`

### Monthly maintenance checklist (~30 minutes on 1st)

- [ ] Check email received P&L report — verify figures match Simption
- [ ] Review sync_logs for errors in last 30 days
- [ ] Check Compliance page — any certificates expiring in 30 days?
- [ ] Review fee defaulters — send WhatsApp reminders to overdue >30 days
- [ ] Check Vercel dashboard — are all apps showing green?

---

## Milestones & Sequencing

| Milestone | Tasks | Outcome |
|---|---|---|
| M1: Foundation | 1–3 | Monorepo builds; shared packages exist |
| M2: Live Data | 4–5 | Expenses dashboard shows real Supabase data |
| M3: Live Sync | 6–8 | Simption data flows to DB every 6 hours automatically |
| M4: Unified Auth | 9–10 | One login, all apps, correct role-based access |
| M5: Alerts | 11–12 | WhatsApp reminders + monthly P&L email |
| M6: CI/CD | 13 | Every push verified; previews on every PR |
| M7 (future): Parent Portal | Phase 2 tasks | Parents self-serve without calling school |

**Recommended order:** M1 → M2 → M6 (get CI early) → M3 → M4 → M5 → M7

---

## Success Criteria

- [ ] `bun turbo build` passes from monorepo root with zero errors
- [ ] Financial page shows data from Supabase (not mock), with "Last synced X ago"
- [ ] Simption sync runs automatically every 6 hours via cron
- [ ] Founder can log in once and access all pages appropriate to their role
- [ ] A teacher with `teacher` role cannot see the Financial page
- [ ] Fee defaulters table has working WhatsApp reminder links
- [ ] P&L email arrives on the 1st of the month with correct figures
- [ ] GitHub Actions CI passes on every push to `main`
- [ ] Each PR generates a Vercel preview URL

---

*Plan authored: 2026-03-16*
*Aurora Thread School, Varanasi — "Tech is the tool. Nature education is the calling."*
