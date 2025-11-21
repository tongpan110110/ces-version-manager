# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
npm install       # Install dependencies
npm run dev       # Start dev server (auto-initializes DB on first run)
npm run db:studio # View database with Prisma Studio
```

The database is automatically initialized on first `npm run dev` via the `postinstall` hook.

## Core Architecture

### Multi-Version Line System

This application manages **parallel version lines** (e.g., 25.8.x and 25.10.x) simultaneously. Each version line has:
- Independent release cadence
- Own baseline version (recommended stable version)
- Separate alignment tracking across regions

**Key Concept**: Version lines are extracted from versions. For example:
- `25.8.1` → version line `25.8`
- `25.10.0.1` → version line `25.10`

This extraction happens in:
- `src/app/api/plans/route.ts` (lines 83-84) when creating plans
- `prisma/seed.ts` via `getVersionLine()` helper

### Data Model Relationships

```
Plan (version, versionLine, status, type)
  ├─→ Manifest (frontend + backend component versions)
  │     └─→ ManifestComponent[] (22 backend components)
  └─→ RegionVersion[] (which regions run this version)

Region (name, area, isGray)
  └─→ RegionVersion (current plan + readiness flags)

SystemConfig (key-value store)
  ├─→ baseline_25.8: "25.8.2"
  ├─→ baseline_25.10: "25.10.0"
  └─→ active_version_lines: ["25.8", "25.10"]
```

**Critical**: The system uses `SystemConfig` to store per-version-line baselines dynamically. Always use keys like `baseline_{versionLine}` when reading/writing baselines.

### Status Flow

Plans follow a strict status progression:
```
draft → testing → ready → released → (deprecated)
```

Status transitions are handled by `PATCH /api/plans/:id/status` which validates the progression and creates audit logs.

### Version Alignment Logic

Located in `src/app/api/dashboard/route.ts`:
1. For each active version line, fetch its baseline from `SystemConfig`
2. Count regions on that version line at baseline vs. behind baseline
3. Calculate alignment rate: `(atBaseline / totalRegions) * 100`

**Important**: There is NO "ahead of baseline" state - only "aligned" or "behind".

## API Architecture

All API routes return standardized responses:
```typescript
{ success: true, data: {...} }  // Success
{ success: false, error: "..." } // Failure
```

Key endpoints:
- `GET /api/dashboard` - Multi-version-line stats (alignment, coverage)
- `GET /api/plans` - Filterable plan list (status, type, search)
- `POST /api/plans` - Create plan (auto-extracts versionLine)
- `PATCH /api/plans/:id/status` - Status transitions with validation
- `GET /api/manifests/:planId` - Full delivery manifest
- `POST /api/manifests/:planId/copy` - Clone manifest to new version
- `GET /api/manifests/:planId/diff` - Compare two versions
- `PATCH /api/regions/:regionId/version` - Update region deployment
- `GET /api/config` - System configuration (baselines, version lines)

## Database

Using Prisma + SQLite. Database location: `prisma/dev.db`

**Auto-initialization**: The `postinstall` script runs `prisma generate && prisma db push` automatically.

To seed sample data:
```bash
npm run db:seed
```

This creates:
- 28 production regions across 4 areas (domestic, apac, africa, latam)
- 2 version lines (25.8.x and 25.10.x)
- Multiple plans with manifests and 22 backend components each
- Region deployments distributed across versions

## UI Structure

The app uses Next.js App Router with a dashboard layout:

```
src/app/
  ├── (dashboard)/          # Pages with sidebar layout
  │   ├── layout.tsx        # Sidebar + header wrapper
  │   ├── page.tsx          # Dashboard with version line tabs
  │   ├── plans/            # Plan list and detail pages
  │   ├── regions/          # Region version map view
  │   ├── diff/             # Version comparison tool
  │   └── settings/         # System configuration
  └── api/                  # API routes
```

**Dashboard Tab Pattern**: The dashboard (src/app/(dashboard)/page.tsx) uses Radix UI Tabs to switch between version lines. When a version line is selected, the "Recent Plans" section filters to show only that version line's plans.

## Key UI Components

Located in `src/components/ui/`:
- All components use Radix UI primitives
- Styled with Tailwind CSS
- Dark theme with cyan/purple accent colors

**Badge Variants**: Custom badge variants in `src/components/ui/badge.tsx` include:
- Status: `draft`, `testing`, `ready`, `released`, `deprecated`
- Semantic: `success`, `warning`, `secondary`

## Common Tasks

### Adding a New Version Line

1. Create plans with the new version line (e.g., `25.12.x`)
2. Add baseline to SystemConfig: `baseline_25.12: "25.12.0"`
3. Update `active_version_lines` array in SystemConfig
4. The dashboard will automatically detect and display the new version line

### Modifying Version Comparison Logic

Version comparison logic is in `src/app/api/manifests/[planId]/diff/route.ts`. It compares:
- Frontend versions
- Each of the 22 backend component versions
- Returns differences with change types (upgrade, downgrade, unchanged)

### Working with Regions

Regions are grouped by area for display. The 4 areas are:
- `domestic` - 国内 (14 regions)
- `apac` - 亚太/中东 (7 regions)
- `africa` - 非洲 (1 region)
- `latam` - 拉美 (6 regions)

Region version status is calculated in `src/app/(dashboard)/regions/page.tsx` by comparing current version to baseline version for its version line.

## Important Patterns

### Audit Logging

All significant data changes should create audit logs:
```typescript
await prisma.auditLog.create({
  data: {
    entityType: 'plan',
    entityId: plan.id,
    action: 'update',
    field: 'status',
    oldValue: 'draft',
    newValue: 'testing',
    operator: 'system',
  },
})
```

### JSON Fields

Several fields store JSON as strings:
- `Plan.relatedRequirements` - array of requirement IDs
- `Plan.relatedBugs` - array of bug IDs
- `SystemConfig.value` - varies (string, array, object)

Always `JSON.stringify()` when writing, `JSON.parse()` when reading.

### Version Line Extraction

When creating or working with versions, always extract the version line:
```typescript
const versionParts = version.split('.')
const versionLine = `${versionParts[0]}.${versionParts[1]}`
```

This is critical for multi-version-line features to work correctly.
