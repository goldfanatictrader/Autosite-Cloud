# AGENTS.md

## Current state: documentation only

This repository currently contains **no application code**. It holds planning/spec docs (all Draft, v1.0, Sept 2026) for AutoSite Cloud, a mobile-first website builder. There is no `package.json`, no build/test/lint tooling, no CI workflows, and no code to run. Do not assume an app exists or that `npm install`/`npm test` will work.

The docs are the single source of truth for any future implementation:

| Doc | Purpose |
|-----|---------|
| `prd/PRD.md` | Product requirements, feature priorities, phases, persona flows |
| `architecture/ARCHITECTURE.md` | Tech stack, service decomposition, monorepo target layout, CI/CD plan, env vars, docker-compose |
| `database/DATABASE-SCHEMA.md` | PostgreSQL schema: tables, columns, enums, indexes, relationships |
| `api/API-SPEC.md` | REST endpoints, request/response examples, error envelope |
| `design-system/DESIGN-SYSTEM.md` | Design tokens (colors, type scale, spacing, radii, shadows), component specs |
| `user-stories/USER-STORIES.md` | Phased user stories |

## Conventions to follow when scaffolding code

- **Target monorepo layout** (from ARCHITECTURE §7): `apps/api` (Fastify, Node 20+), `apps/web` (Next.js 14 App Router, Tailwind + shadcn/ui), `apps/mobile` (React Native/Expo), `packages/shared`, `packages/ui`, `infra/` (docker-compose, k8s, terraform), Turborepo at root. Migrate planning docs into `docs/` when enforcement of the planned tree starts.
- **Database**: PostgreSQL 16, UUID primary keys (`gen_random_uuid()`), all timestamps `TIMESTAMPTZ` UTC, JSONB for content/analytics payloads. Enum values are pinned in DATABASE-SCHEMA §Enums Summary.
- **API**: JWT Bearer auth; consistent error envelope `{"error", "code", "details"}`; rate-limit headers (`X-RateLimit-*`); URL-versioned base `https://api.autosite.cloud/v1`.
- **UI**: Design tokens and hex values are authoritative in `design-system/DESIGN-SYSTEM.md` (Primary `#2563EB`, Inter + JetBrains Mono, 4px spacing base). Preserve token names (`display-lg`, `label-md`, `shadow-md`, etc.).

## Known doc inconsistencies (docs are drafts — don't treat one as gospel)

- **Site status**: PRD/README include `archived`; DATABASE-SCHEMA and API-SPEC use `draft/building/live/error` only.
- **Auth**: DATABASE-SCHEMA defines `email/google/apple/github` providers; API-SPEC examples show a single `token` field while ARCHITECTURE specifies access + refresh token pairs.
- **Workspace ownership**: DATABASE-SCHEMA and ARCHITECTURE put sites under `workspaces.owner_id`; PRD shows owner directly on the site.
- **API paths**: API-SPEC prefixes endpoints with `/api/` (e.g. `/api/sites/:id/publish`) and uses `/api/ai/*`; ARCHITECTURE uses un-prefixed paths and different `/ai/*` endpoint names.
- When implementing, reconcile these against ARCHITECTURE + DATABASE-SCHEMA first, and flag the resolution rather than silently picking one.

## Verification

There are no tests or lint commands yet. If you add code, the plan (ARCHITECTURE §8) expects GitHub Actions: `lint → typecheck → test → docker build → deploy-staging → deploy-production (manual)`. Don't invent a different CI shape without checking.