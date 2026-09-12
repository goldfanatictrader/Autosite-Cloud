# AutoSite Cloud

AutoSite Cloud is a runnable Phase 1 website-builder MVP with a site dashboard,
JWT authentication, and a deterministic AI Content Writer. It is organized as a
Turborepo monorepo with a Next.js web app and a Fastify API.

## Run locally

Prerequisites: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

The dashboard runs at <http://localhost:3000> and the API runs at
<http://localhost:3001>. Local defaults require no API keys, database, Redis, or
Docker services. The API uses in-memory persistence for this MVP, so accounts,
sites, and generated content reset when the API restarts.

The login form is prefilled with the demo account:
`demo@autosite.cloud` / `DemoPass123!`.

Optional environment overrides are documented in [.env.example](.env.example).
The services in [infra/docker-compose.yml](infra/docker-compose.yml) mirror the
planned PostgreSQL, Redis, and MinIO stack for later phases, but the MVP does not
connect to them.

## Workspace

```text
apps/
  api/       Fastify API (port 3001)
  web/       Next.js App Router dashboard (port 3000)
packages/
  shared/    Shared TypeScript API and domain types
  ui/        Shared shadcn/ui-style components
infra/       Optional local infrastructure
docs/        Product and engineering plans
```

Useful root commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Phase 1 features

- Email/password signup and login with bearer-token authentication
- Site dashboard with seeded sample sites and status badges
- Site creation and detail views
- Deterministic AI-generated home, about, services, and contact copy
- Light and dark themes based on the documented design tokens

## Documentation

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Product Requirements Document |
| [Architecture](docs/ARCHITECTURE.md) | Technical architecture, tech stack, and deployment plan |
| [Database Schema](docs/DATABASE-SCHEMA.md) | PostgreSQL schema with tables and relationships |
| [API Specification](docs/API-SPEC.md) | REST API endpoints with request and response examples |
| [Design System](docs/DESIGN-SYSTEM.md) | UI/UX design tokens and component specifications |
| [User Stories](docs/USER-STORIES.md) | User stories across all four planned phases |
