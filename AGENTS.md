# AGENTS.md

## Current state: runnable Phase 1 MVP monorepo

Merged on `main` (PR #1). This is no longer docs-only: the repo is a working Turborepo monorepo — `apps/api` (Fastify, TypeScript), `apps/web` (Next.js 14 App Router, Tailwind + shadcn/ui-style components), `packages/shared`, `packages/ui`, `infra/`. The planning docs now live in `docs/` (all Draft, v1.0, Sept 2026).

**Run / verify (root):**

```bash
npm install        # npm workspaces (apps/*, packages/*)
npm run dev        # web :3000, api :3001 (turbo)
npm run lint       # eslint (per-workspace)
npm run typecheck  # tsc --noEmit (per-workspace)
npm run test       # vitest (api + web)
npm run build      # next build + tsc build
```

- **No external services needed for MVP.** Persistence is in-memory — accounts, sites, and generated content reset when the API restarts. PostgreSQL/Redis/MinIO in `infra/docker-compose.yml` are planned for later phases and are NOT wired up.
- Demo account: `demo@autosite.cloud` / `DemoPass123!` (login form is prefilled).
- CI: `.github/workflows/ci.yml` runs lint → typecheck → test (per ARCHITECTURE §8 shape). Don't invent a different CI shape.

## Docs (single source of truth for product/architecture decisions)

| Doc | Purpose |
|-----|---------|
| `docs/PRD.md` | Product requirements, feature priorities, phases, persona flows |
| `docs/ARCHITECTURE.md` | Tech stack, service decomposition, monorepo target layout, CI/CD plan, env vars, docker-compose |
| `docs/DATABASE-SCHEMA.md` | PostgreSQL schema: tables, columns, enums, indexes, relationships |
| `docs/API-SPEC.md` | REST endpoints, request/response examples, error envelope |
| `docs/DESIGN-SYSTEM.md` | Design tokens (colors, type scale, spacing, radii, shadows), component specs |
| `docs/USER-STORIES.md` | Phased user stories |

## Conventions (what was actually implemented)

- **Monorepo layout** per ARCHITECTURE §7: `apps/api`, `apps/web`, `apps/mobile` (not yet created), `packages/shared`, `packages/ui`, `infra/`, Turborepo at root.
- **API routes follow `docs/API-SPEC.md`** names, e.g. `/auth/*`, `/api/sites*`, `/api/ai/generate-content`; error envelope `{"error","code","details"}`; `X-RateLimit-*` headers; single JWT bearer `token` (not access+refresh pair — declared deviation from ARCHITECTURE).
- **UI tokens are authoritative in `docs/DESIGN-SYSTEM.md`** (Primary `#2563EB`, Inter + JetBrains Mono, 4px spacing base). Preserve token names (`display-lg`, `label-md`, `shadow-md`, etc.) and existing shadcn-style components in `packages/ui` rather than restyling inline.
- **DB (future phases)**: PostgreSQL 16, UUID PKs (`gen_random_uuid()`), `TIMESTAMPTZ` UTC, JSONB payloads. Enum values pinned in DATABASE-SCHEMA §Enums Summary.

## Known doc inconsistencies (docs are drafts — reconcile against the implemented code)

- **Site status**: PRD/README include `archived`; DATABASE-SCHEMA and API-SPEC use `draft/building/live/error` only (implemented).
- **Auth**: DATABASE-SCHEMA defines `email/google/apple/github` providers; API-SPEC shows a single `token` while ARCHITECTURE specifies access + refresh token pairs (implemented: single token).
- **Workspace ownership**: DATABASE-SCHEMA/ARCHITECTURE put sites under `workspaces.owner_id`; PRD shows owner directly on the site.
- **API paths**: API-SPEC prefixes `/api/` (e.g. `/api/sites/:id/publish`) and uses `/api/ai/*`; ARCHITECTURE uses un-prefixed paths and different `/ai/*` endpoint names (implemented: API-SPEC names).
- When changing code, update the implementation to remain consistent with the implemented routing/auth decisions above, and update `docs/` only if the product decision actually changes.