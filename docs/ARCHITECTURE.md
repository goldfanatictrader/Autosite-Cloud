# AutoSite Cloud — Technical Architecture

> **Version:** 1.0  
> **Last Updated:** 2026-09-12  
> **Status:** Draft  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Service Decomposition](#3-service-decomposition)
4. [Data Flow](#4-data-flow)
5. [Security Considerations](#5-security-considerations)
6. [Scalability Plan](#6-scalability-plan)
7. [Development Environment](#7-development-environment)
8. [CI/CD Pipeline](#8-cicd-pipeline)

---

## 1. System Overview

AutoSite Cloud is a mobile-first website builder that enables users to create, customize, and publish websites entirely from their mobile devices or web dashboard. The system follows a microservices architecture with clear separation of concerns, enabling independent scaling and deployment of each component.

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTS                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ iOS App  │  │ Android  │  │ Web App  │                  │
│  │ (RN/Flut)│  │ (RN/Flut)│  │ (Next.js)│                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       └──────────────┼──────────────┘                        │
└──────────────────────┼──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────┼──────────────────────────────────────┐
│                 API GATEWAY (Cloudflare)                      │
│                 Rate Limiting, SSL, CDN                       │
└──────────────────────┼──────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────┐
│                  BACKEND SERVICES                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │   Site   │  │ AI Writer│  │ Analytics│   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └──────────────┼──────────────┼──────────────┘         │
│                      │              │                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Domain   │  │ Publish  │  │ Notif.   │                  │
│  │ Service  │  │ Service  │  │ Service  │                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
└───────┼──────────────┼──────────────┼────────────────────────┘
        │              │              │
┌───────┼──────────────┼──────────────┼────────────────────────┐
│       │         DATA LAYER          │                         │
│  ┌────┴─────┐  ┌──────────┐  ┌────┴─────┐                  │
│  │PostgreSQL│  │  Redis   │  │ S3/MinIO │                  │
│  │ (primary)│  │ (cache)  │  │ (assets) │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└──────────────────────────────────────────────────────────────┘
```

### Architecture Principles

| Principle | Description |
|-----------|-------------|
| **Mobile-First** | All features designed for mobile UX before web adaptation |
| **Offline-Resilient** | Local-first data with sync when connectivity resumes |
| **Real-Time Feedback** | WebSocket connections for live build progress and collaboration |
| **Security by Default** | Zero-trust networking, encrypted at rest and in transit |
| **Horizontal Scalability** | Stateless services, sharded data, CDN-accelerated assets |

---

## 2. Tech Stack

### Mobile (iOS + Android)

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Framework** | React Native (Expo) or Flutter | Cross-platform with native performance; Expo simplifies builds |
| **State Management** | Zustand (RN) / Riverpod (Flutter) | Lightweight, testable, predictable state |
| **Navigation** | React Navigation / GoRouter | Deep linking, stack/tab/drawer patterns |
| **HTTP Client** | Dio + Retrofit | Type-safe API calls, interceptors for auth tokens |
| **Local Storage** | AsyncStorage / SecureStore | Persist drafts, user preferences, cached data |
| **Forms** | React Hook Form / Flutter Form | Validated input with minimal re-renders |
| **Image Handling** | Expo Image / cached_network_image | Lazy loading, caching, progressive rendering |

### Web Dashboard

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Framework** | Next.js 14+ (App Router) | Server components, ISR, edge runtime support |
| **UI Library** | Tailwind CSS + shadcn/ui | Accessible, composable components with utility CSS |
| **State** | Zustand + React Query | Client state (UI) + server state (cache/sync) |
| **Auth** | NextAuth.js | OAuth2 providers, session management, CSRF protection |
| **Forms** | Zod + React Hook Form | Schema validation, type inference |
| **Rich Text** | Tiptap / Plate | Collaborative editing, block-based content |
| **Deployment** | Vercel / Cloudflare Pages | Edge functions, automatic preview deployments |

### Backend

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Runtime** | Node.js 20+ / Go (perf-critical) | Node for rapid development; Go for CPU-intensive builds |
| **Framework** | Fastify (Node) / Gin (Go) | High throughput, schema-based validation, plugin system |
| **API Protocol** | REST + WebSocket | REST for CRUD; WS for real-time build progress |
| **Auth** | JWT + refresh tokens, OAuth2 | Stateless auth with secure token rotation |
| **Validation** | Zod (Node) / validator (Go) | Runtime type safety, shared schemas with client |
| **Queue** | Bull (Redis) / Asynq (Go) | Reliable job processing with retries and delays |
| **Email** | SendGrid / Resend | Transactional emails, template management |
| **File Upload** | Multipart + presigned URLs | Direct-to-S3 uploads to reduce server load |

### Database

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Primary DB** | PostgreSQL 16 | ACID compliance, JSON support, FTS, extensions |
| **Cache** | Redis 7 | Session storage, rate limiting, pub/sub, queues |
| **Search** | PostgreSQL FTS / Meilisearch | Site search, template discovery, user search |
| **Object Storage** | S3-compatible (R2 / AWS S3) | Media assets, site builds, backups |
| **Time-Series** | TimescaleDB (extension) | Analytics data, metrics aggregation |

### Infrastructure

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Hosting** | Cloudflare (Workers, R2, D1) / AWS | Global edge network, DDoS protection, managed services |
| **CI/CD** | GitHub Actions | Native GitHub integration, matrix builds, secrets |
| **Containers** | Docker + Docker Compose (dev) | Consistent environments across dev/staging/prod |
| **Orchestration** | Kubernetes (prod) | Auto-scaling, self-healing, rolling updates |
| **Monitoring** | Grafana + Prometheus | Metrics dashboards, alerting, log aggregation |
| **Error Tracking** | Sentry | Real-time error reporting, source maps, breadcrumbs |
| **CDN** | Cloudflare | Global cache, image optimization, edge compute |

### AI/LLM

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Primary LLM** | OpenAI GPT-4o / Claude 3.5 | State-of-the-art content generation, code generation |
| **Fallback** | Multi-provider failover | Redundancy when primary provider is unavailable |
| **Caching** | Redis (prompt → completion) | Cost reduction, latency improvement for repeated queries |
| **Rate Limiting** | Per-user token quotas | Prevent abuse, manage costs per subscription tier |
| **Embeddings** | OpenAI ada-002 / Voyage | Semantic search for templates and content |

### Domain Management

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Registrar API** | Namecheap / Cloudflare Registrar | Domain registration, transfer, renewal |
| **DNS Management** | Cloudflare DNS API | Programmatic DNS record management |
| **SSL Certificates** | Let's Encrypt / Cloudflare | Auto-provisioned, auto-renewed certificates |
| **Verification** | DNS TXT + HTTP challenge | Domain ownership verification |

### Publishing

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Static Hosting** | Cloudflare Pages / Vercel | Global edge deployment, automatic builds |
| **Build Pipeline** | Bull queue (Redis) → Build worker | Async processing, retry logic, progress tracking |
| **Preview** | Temporary Pages deployments | Shareable preview links before publish |
| **Rollback** | Version snapshots in R2 | One-click rollback to any previous version |

---

## 3. Service Decomposition

### Auth Service

**Responsibility:** User authentication, authorization, and session management.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /auth/signup` | POST | Create account with email/password |
| `POST /auth/login` | POST | Authenticate and return JWT pair |
| `POST /auth/logout` | POST | Invalidate refresh token |
| `POST /auth/refresh` | POST | Rotate access token |
| `POST /auth/forgot-password` | POST | Send password reset email |
| `POST /auth/reset-password` | POST | Set new password with token |
| `GET /auth/verify-email/:token` | GET | Confirm email address |
| `POST /auth/social/:provider` | POST | OAuth2 login (Google, Apple, GitHub) |

**Token Management:**
- **Access Token:** RS256-signed JWT, 15-minute expiry, contains user ID + role
- **Refresh Token:** Opaque token, 7-day expiry, stored in Redis with user binding
- **Rotation:** Refresh tokens are single-use; each refresh issues a new pair
- **Revocation:** Logout invalidates all refresh tokens for the user

**Session Storage (Redis):**
```
session:{user_id}:{token_id} → { ip, user_agent, created_at, expires_at }
```

### Site Management Service

**Responsibility:** CRUD operations for websites, content versioning, and workspace management.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /sites` | GET | List user's sites with pagination |
| `POST /sites` | POST | Create new site from template or blank |
| `GET /sites/:id` | GET | Retrieve site with content |
| `PUT /sites/:id` | POST | Update site settings/metadata |
| `DELETE /sites/:id` | DELETE | Soft-delete site (30-day recovery) |
| `POST /sites/:id/content` | POST | Update site content (JSON) |
| `GET /sites/:id/versions` | GET | List content versions |
| `POST /sites/:id/rollback/:version` | POST | Restore previous version |

**Content Model:**
```json
{
  "siteId": "uuid",
  "version": 42,
  "content": {
    "pages": [
      {
        "id": "page-1",
        "type": "hero",
        "blocks": [
          { "type": "heading", "text": "Welcome", "level": 1 },
          { "type": "paragraph", "text": "..." },
          { "type": "image", "url": "r2://...", "alt": "..." }
        ]
      }
    ],
    "theme": { "primary": "#...", "font": "Inter" },
    "settings": { "title": "My Site", "description": "..." }
  },
  "createdAt": "2026-09-12T00:00:00Z"
}
```

**Versioning Strategy:**
- Each content save creates an immutable snapshot
- Snapshots stored as compressed JSON in PostgreSQL (jsonb column)
- Rolling 50-version window; older versions archived to R2
- Rollback reconstructs content from snapshot and re-triggers publish

### AI Content Service

**Responsibility:** LLM orchestration for content generation, image suggestions, and layout optimization.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /ai/generate` | POST | Generate content from prompt + context |
| `POST /ai/suggest-layout` | POST | Suggest page layout from description |
| `POST /ai/rewrite` | POST | Rewrite existing content (tone change) |
| `POST /ai/seo-optimize` | POST | Optimize content for search engines |
| `GET /ai/tokens` | GET | Check remaining token balance |

**Provider Orchestration:**
```
Request → Token Check → Provider Selection → Cache Check → LLM Call → Response
                ↓                                          ↓
          Rate Limit Exceeded                    Cache Store (Redis)
                ↓
          429 + Retry-After Header
```

**Provider Priority:**
1. OpenAI GPT-4o (primary — best quality)
2. Claude 3.5 Sonnet (fallback — alternative perspective)
3. Gemini 1.5 Pro (fallback — cost-effective)

**Token Tracking:**
```sql
-- Token usage per user per day
CREATE TABLE token_usage (
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    provider TEXT NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    cached_tokens INT DEFAULT 0,
    PRIMARY KEY (user_id, date, provider)
);
```

### Domain Service

**Responsibility:** Domain search, registration, DNS management, and SSL provisioning.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /domains/search?q=` | GET | Check domain availability |
| `POST /domains/connect` | POST | Connect existing domain |
| `POST /domains/register` | POST | Register new domain |
| `GET /domains/:id/records` | GET | List DNS records |
| `POST /domains/:id/records` | POST | Add DNS record |
| `DELETE /domains/:id/records/:rec` | DELETE | Remove DNS record |
| `GET /domains/:id/ssl-status` | GET | Check SSL certificate status |

**Domain Verification Flow:**
1. User enters domain
2. System provides DNS records to add (TXT for verification, CNAME for pointing)
3. Poller checks DNS propagation every 30 seconds
4. Once verified, provision SSL certificate via Let's Encrypt
5. Activate domain and update site routing

**DNS Record Template:**
```
Type    Name    Value                           TTL
TXT     @       autosite-verify=abc123...       300
CNAME   www     <site-id>.autosite.pages.dev    300
A       @       192.0.2.1                       300
```

### Publishing Service

**Responsibility:** Build pipeline orchestration, static site generation, and deployment.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /sites/:id/publish` | POST | Trigger publish pipeline |
| `GET /sites/:id/builds` | GET | List build history |
| `GET /sites/:id/builds/:bid` | GET | Get build status/logs |
| `POST /sites/:id/rollback` | POST | Rollback to previous build |
| `GET /sites/:id/preview` | GET | Generate temporary preview URL |

**Build Pipeline:**
```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Queue   │────▶│  Worker  │────▶│ Compiler │────▶│ Deployer │
│ (Redis)  │     │ (Node/Go)│     │ (HTML/   │     │ (CF      │
│          │     │          │     │  CSS/JS) │     │  Pages)  │
└─────────┘     └──────────┘     └──────────┘     └──────────┘
     │                                    │              │
     │         ┌──────────┐              │              │
     └────────▶│ WebSocket│◀─────────────┴──────────────┘
               │  Server  │  (progress events)
               └──────────┘
```

**Build Steps:**
1. **Fetch:** Load site content JSON from PostgreSQL
2. **Template:** Select and apply template engine (MJML for email, HTML/CSS for web)
3. **Optimize:** Minify HTML/CSS/JS, optimize images, generate favicons
4. **Assets:** Upload optimized assets to R2, update references
5. **Preview:** Deploy to temporary Pages URL for review
6. **Deploy:** Push to production domain, update DNS if needed
7. **Notify:** WebSocket event + push notification to user

**Build Status Machine:**
```
queued → building → optimizing → deploying → live
                   ↓                         ↓
              failed                    failed
                   ↓
              retrying (max 3 attempts)
```

### Analytics Service

**Responsibility:** Event ingestion, aggregation, and reporting for site traffic.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /analytics/events` | POST | Ingest tracking events |
| `GET /analytics/sites/:id/overview` | GET | Dashboard summary (7d/30d/90d) |
| `GET /analytics/sites/:id/pages` | GET | Page-level analytics |
| `GET /analytics/sites/:id/referrers` | GET | Referrer breakdown |
| `GET /analytics/sites/:id/geo` | GET | Geographic distribution |

**Event Schema:**
```json
{
  "siteId": "uuid",
  "visitorId": "anonymous-uuid",
  "event": "pageview",
  "path": "/",
  "referrer": "https://google.com",
  "userAgent": "Mozilla/5.0...",
  "geo": { "country": "US", "city": "San Francisco" },
  "timestamp": "2026-09-12T10:00:00Z"
}
```

**Aggregation Pipeline:**
```
Raw Events → Buffer (Redis Stream) → Batch Writer (every 60s)
                                          ↓
                                    PostgreSQL (events table)
                                          ↓
                                    Daily Aggregation Job
                                          ↓
                                    Materialized Views (fast reads)
```

### Notification Service

**Responsibility:** Multi-channel notifications with user preference management.

| Channel | Provider | Use Cases |
|---------|----------|-----------|
| **Push (iOS)** | APNs via Firebase | Build complete, domain verified, trial expiry |
| **Push (Android)** | FCM | Same as iOS |
| **Email** | SendGrid / Resend | Welcome, password reset, billing, weekly digest |
| **In-App** | WebSocket + DB | Real-time alerts, activity feed |

**User Preferences:**
```json
{
  "push": { "enabled": true, "quietHoursStart": "22:00", "quietHoursEnd": "07:00" },
  "email": { "marketing": false, "transactional": true, "weeklyDigest": true },
  "inApp": { "buildUpdates": true, "mentions": true }
}
```

---

## 4. Data Flow

### Site Creation Flow

```
┌────────┐    ┌─────┐    ┌─────────┐    ┌────────────┐    ┌────────────┐
│  User  │───▶│ App │───▶│ Gateway │───▶│ Site Svc   │───▶│ PostgreSQL │
│        │    │     │    │         │    │            │    │            │
│ Select │    │     │    │         │    │ Create     │    │ INSERT     │
│ Template│    │     │    │         │    │ site record│    │ site       │
│        │    │     │    │         │    │            │    │            │
│        │    │     │    │         │    │───┐        │    │            │
│        │    │     │    │         │    │   ▼        │    │            │
│        │    │     │    │         │    │ AI Writer  │    │            │
│        │    │     │    │         │    │ Generate   │    │            │
│        │    │     │    │         │    │ content    │    │            │
│        │    │     │    │         │    │   │        │    │            │
│        │    │     │    │         │    │   ▼        │    │            │
│        │    │     │    │         │    │ Content    │───▶│ INSERT     │
│        │    │     │    │         │    │ Service    │    │ content    │
│        │    │     │    │         │    │            │    │            │
│◀───────│◀───│     │◀───│         │◀───│ Return     │◀───│ SELECT     │
│ View   │    │     │    │         │    │ site+content│   │ joined     │
└────────┘    └─────┘    └─────────┘    └────────────┘    └────────────┘
```

### Publish Flow

```
┌────────┐    ┌─────┐    ┌─────────┐    ┌────────────┐
│  User  │───▶│ App │───▶│ Gateway │───▶│ Publish Svc│
│ Tap    │    │     │    │         │    │            │
│ Publish│    │     │    │         │    │ Validate   │
│        │    │     │    │         │    │ content    │
│        │    │     │    │         │    │            │
│        │    │     │    │         │    │────┐       │
│        │    │     │    │         │    │    ▼       │
│        │    │     │    │         │    │ Redis Queue│
│        │    │     │    │         │    │ (Bull job) │
└────────┘    └─────┘    └─────────┘    └────────────┘
                                        ┌────────────┐
                                        │ Build      │
                                        │ Worker     │
                                        │            │
                                        │ 1. Fetch   │
                                        │    content  │
                                        │ 2. Compile │
                                        │    HTML/   │
                                        │    CSS/JS  │
                                        │ 3. Optimize│
                                        │ 4. Upload  │
                                        │    assets  │
                                        └────────────┘
                                               │
                          ┌─────────────────────┼────────────────────┐
                          ▼                     ▼                    ▼
                    ┌──────────┐         ┌──────────┐         ┌──────────┐
                    │ Cloudflare│         │ WebSocket│         │ PostgreSQL│
                    │ Pages    │         │ Server   │         │          │
                    │ Deploy   │         │          │         │ UPDATE   │
                    │          │         │ Broadcast│         │ status   │
                    │ site     │         │ progress │         │ = "live" │
                    │ goes live│         │ events   │         │          │
                    └──────────┘         └──────────┘         └──────────┘
```

### Domain Connect Flow

```
┌────────┐    ┌─────┐    ┌─────────┐    ┌────────────┐
│  User  │───▶│ App │───▶│ Gateway │───▶│ Domain Svc │
│ Enter  │    │     │    │         │    │            │
│ domain │    │     │    │         │    │ Validate   │
│        │    │     │    │         │    │ format     │
└────────┘    └─────┘    └─────────┘    └────────────┘
                                        ┌────────────┐
                                        │ Check      │
                                        │ Cloudflare │
                                        │ DNS API    │
                                        │            │
                                        │ Return     │
                                        │ required   │
                                        │ records    │
                                        └────────────┘
                                               │
                          ┌─────────────────────┼────────────────────┐
                          ▼                     ▼                    ▼
                    ┌──────────┐         ┌──────────┐         ┌──────────┐
                    │ App      │         │ User adds│         │ Verification│
                    │ Display  │         │ DNS      │         │ Poller   │
                    │ records  │         │ records  │         │ (30s)    │
                    │ to user  │         │ at host  │         │          │
                    └──────────┘         └──────────┘         │ Poll DNS │
                                                              │ until    │
                                                              │ verified │
                                                              └────────────┘
                                                                   │
                                                                   ▼
                                                            ┌────────────┐
                                                            │ Let's      │
                                                            │ Encrypt    │
                                                            │            │
                                                            │ Provision  │
                                                            │ SSL cert   │
                                                            └────────────┘
                                                                   │
                                                                   ▼
                                                            ┌────────────┐
                                                            │ PostgreSQL │
                                                            │            │
                                                            │ UPDATE     │
                                                            │ status =   │
                                                            │ "active"   │
                                                            │ ssl = true │
                                                            └────────────┘
```

---

## 5. Security Considerations

### Transport Security

| Layer | Standard | Implementation |
|-------|----------|----------------|
| **Client ↔ Gateway** | TLS 1.3 | Cloudflare terminates TLS; HSTS enabled |
| **Gateway ↔ Services** | mTLS | Internal service mesh with certificate rotation |
| **Service ↔ Database** | TLS 1.2+ | Encrypted connection strings, cert pinning |

### Data Encryption

| State | Method | Details |
|-------|--------|---------|
| **At Rest** | AES-256-GCM | PostgreSQL transparent encryption, S3 server-side encryption |
| **Backups** | AES-256 | Encrypted before upload to offsite storage |
| **Secrets** | Vault / Env Vars | Never in code; rotated quarterly |

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTH SECURITY STACK                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Layer 1: API Gateway                                     │    │
│  │  • Rate limiting (100 req/min general, 5 req/min auth)  │    │
│  │  • IP-based blocking for suspicious activity            │    │
│  │  • SSL termination                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Layer 2: JWT Validation                                  │    │
│  │  • RS256 signature verification                          │    │
│  │  • Token expiry check (15min access)                     │    │
│  │  • Audience and issuer validation                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Layer 3: RBAC Authorization                              │    │
│  │  • Role-based access (owner, editor, viewer)            │    │
│  │  • Resource-level permissions                            │    │
│  │  • Workspace isolation                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Layer 4: Audit Logging                                   │    │
│  │  • All write operations logged                           │    │
│  │  • IP, user agent, timestamp recorded                    │    │
│  │  • Tamper-proof log storage                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Input Validation

All API endpoints enforce schema validation using Zod (Node) or validator (Go):

```typescript
// Example: Site creation validation
const CreateSiteSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  templateId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  workspaceId: z.string().uuid().optional(),
});

// Applied at route level
fastify.post('/sites', { schema: { body: CreateSiteSchema } }, handler);
```

### CORS & CSP Configuration

```typescript
// CORS — strict origin whitelist
fastify.register(cors, {
  origin: [
    'https://autosite.cloud',
    'https://app.autosite.cloud',
    'http://localhost:3000', // dev only
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  maxAge: 86400,
});

// Content Security Policy
res.setHeader('Content-Security-Policy', [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.autosite.cloud",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https://*.r2.cloudflarestorage.com",
  "connect-src 'self' https://api.autosite.cloud wss://ws.autosite.cloud",
  "font-src 'self' https://fonts.gstatic.com",
  "frame-ancestors 'none'",
].join('; '));
```

### Security Checklist

- [ ] All data in transit: TLS 1.3
- [ ] All data at rest: AES-256 encryption
- [ ] JWT tokens: RS256 signing, 15min access / 7d refresh
- [ ] Rate limiting: 100 req/min general, 5 req/min auth endpoints
- [ ] Input validation: Zod schemas on all endpoints
- [ ] SQL injection: Parameterized queries only (Prisma ORM)
- [ ] CORS: Strict origin whitelist, no wildcards
- [ ] CSP: Strict Content-Security-Policy headers
- [ ] Secrets: Environment variables, never committed to code
- [ ] Audit logging: All write operations logged with actor context
- [ ] Dependency scanning: Automated via GitHub Actions (Snyk/Dependabot)
- [ ] Penetration testing: Quarterly third-party assessment

---

## 6. Scalability Plan

### Phase 1: Startup (0–10K Users)

```
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 1 ARCHITECTURE                      │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Monolith │───▶│PostgreSQL│    │  Redis   │              │
│  │ Backend  │    │ (single) │    │ (single) │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                                              │
│  • Single PostgreSQL instance (4 vCPU, 16GB RAM)            │
│  • Single Redis instance (2 vCPU, 4GB RAM)                  │
│  • Monolithic backend (horizontal scale via replicas)       │
│  • Manual scaling with monitoring alerts                    │
│  • Estimated cost: $200–400/month                           │
└─────────────────────────────────────────────────────────────┘
```

**Key Decisions:**
- Start with monolith for rapid iteration; extract services later
- Use connection pooling (PgBouncer) to handle concurrent connections
- Implement pagination and cursor-based queries from day one
- Cache aggressive read patterns in Redis

### Phase 2: Growth (10K–100K Users)

```
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 2 ARCHITECTURE                      │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Services │───▶│PostgreSQL│    │  Redis   │              │
│  │ (split)  │    │ Primary  │    │ Cluster  │              │
│  └──────────┘    │   + 1    │    │ (3 nodes)│              │
│                  │ Replica  │    └──────────┘              │
│                  └──────────┘                               │
│                                                              │
│  • Read replicas for PostgreSQL (1 primary + 2 replicas)    │
│  • Redis Cluster for cache and session distribution         │
│  • Service decomposition begins (Auth, Site, Publish)       │
│  • Auto-scaling containers (Kubernetes HPA)                 │
│  • Estimated cost: $800–1,500/month                         │
└─────────────────────────────────────────────────────────────┘
```

**Key Decisions:**
- Extract Auth Service first (highest traffic, clearest boundaries)
- Implement CQRS for analytics (separate read/write models)
- Add CDN caching for static site responses
- Introduce circuit breakers for external API calls

### Phase 3: Scale (100K+ Users)

```
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 3 ARCHITECTURE                      │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Services │───▶│PostgreSQL│    │  Redis   │              │
│  │ (full    │    │ Sharded  │    │ Cluster  │              │
│  │ micro)   │    │ by WS    │    │ (6+ nodes)              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                                              │
│  ┌──────────┐    ┌──────────┐                               │
│  │  Kafka/  │───▶│ Event    │                               │
│  │  NATS    │    │ Handlers │                               │
│  └──────────┘    └──────────┘                               │
│                                                              │
│  • Database sharding by workspace (hash-based)              │
│  • Event-driven architecture (Kafka/NATS message broker)    │
│  • Multi-region deployment (US-East, EU-West, APAC)         │
│  • CDN edge caching for all public site responses           │
│  • Estimated cost: $3,000–8,000/month                       │
└─────────────────────────────────────────────────────────────┘
```

**Key Decisions:**
- Introduce message broker for async workflows (publish, analytics)
- Implement event sourcing for critical state changes
- Deploy read-heavy services to edge locations
- Use database sharding for workspace isolation at scale

---

## 7. Development Environment

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/autosite/cloud.git
cd cloud

# 2. Backend setup
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev

# 3. Mobile app setup (separate terminal)
cd mobile
npx expo start

# 4. Web dashboard setup (separate terminal)
cd web
npm install
npm run dev  # Next.js on http://localhost:3000

```

The Phase 1 API uses PostgreSQL when it can connect to `DATABASE_URL` and falls
back to its in-memory store when PostgreSQL is unavailable. Redis and MinIO are
not wired into the Phase 1 API. Export non-default environment overrides in the
shell before running the API; `.env.example` documents the available values.

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: autosite
      POSTGRES_USER: autosite
      POSTGRES_PASSWORD: autosite
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U autosite -d autosite"]
      interval: 5s
      timeout: 5s
      retries: 10
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass devpassword

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

### Environment Variables

```bash
# .env.example

# ─── Database ───
DATABASE_URL=postgres://autosite:autosite@localhost:5432/autosite

# ─── Redis ───
REDIS_URL=redis://:devpassword@localhost:6379

# ─── Authentication ───
JWT_SECRET=your-rs256-private-key-here
JWT_PUBLIC_KEY=your-rs256-public-key-here
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# ─── OAuth2 ───
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APPLE_CLIENT_ID=...
APPLE_TEAM_ID=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# ─── AI/LLM ───
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# ─── Cloudflare ───
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_ZONE_ID=...

# ─── Object Storage ───
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=autosite-dev
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# ─── Email ───
SENDGRID_API_KEY=SG...
EMAIL_FROM=noreply@autosite.cloud

# ─── App URLs ───
APP_URL=http://localhost:3000
API_URL=http://localhost:3001
WS_URL=ws://localhost:3002
```

### Project Structure

```
autosite-cloud/
├── apps/
│   ├── api/                    # Backend services (monorepo)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Auth service
│   │   │   │   ├── sites/      # Site management
│   │   │   │   ├── ai/         # AI content service
│   │   │   │   ├── domains/    # Domain management
│   │   │   │   ├── publish/    # Publishing pipeline
│   │   │   │   ├── analytics/  # Analytics service
│   │   │   │   └── notify/     # Notification service
│   │   │   ├── middleware/     # Auth, rate limit, validation
│   │   │   ├── shared/         # Shared utilities
│   │   │   └── main.ts
│   │   ├── prisma/             # Database schema & migrations
│   │   ├── tests/
│   │   └── Dockerfile
│   │
│   ├── web/                    # Next.js web dashboard
│   │   ├── app/                # App Router pages
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── public/
│   │
│   └── mobile/                 # React Native / Flutter app
│       ├── src/
│       │   ├── screens/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   └── store/
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared types, utils (tsconfig paths)
│   │   ├── types/
│   │   ├── validators/
│   │   └── constants/
│   └── ui/                     # Shared UI components (if applicable)
│
├── infra/
│   ├── docker-compose.yml
│   ├── kubernetes/             # K8s manifests
│   └── terraform/              # Infrastructure as code
│
├── docs/
│   └── architecture/
│       └── ARCHITECTURE.md     # This document
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── turbo.json                  # Turborepo config
├── package.json
└── README.md
```

---

## 8. CI/CD Pipeline

### Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CI/CD PIPELINE                               │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  Push to  │───▶│  Lint &  │───▶│  Test    │───▶│  Build   │ │
│  │  main/PR  │    │  Format  │    │  Suite   │    │  Docker  │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│       │               │               │               │         │
│       │               ▼               ▼               ▼         │
│       │          ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│       │          │ ESLint   │    │ Unit     │    │ Multi-   │ │
│       │          │ Prettier │    │ Tests    │    │ stage    │ │
│       │          │ TypeScript│   │ Integr.  │    │ build    │ │
│       │          │          │    │ E2E      │    │          │ │
│       │          └──────────┘    └──────────┘    └──────────┘ │
│       │               │               │               │         │
│       ▼               ▼               ▼               ▼         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  Deploy  │◀───│  Push to │◀───│  Manual  │    │  Deploy  │ │
│  │ Staging  │    │ Registry │    │ Approval │    │Production│ │
│  │ (auto)   │    │ (GHCR)   │    │ (prod)   │    │ (manual) │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: autosite_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/autosite_test
          REDIS_URL: redis://localhost:6379

  build:
    needs: [lint-and-typecheck, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: [build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - run: |
          # Deploy to staging environment
          kubectl set image deployment/api \
            api=ghcr.io/${{ github.repository }}:${{ github.sha }} \
            --namespace=staging
      - run: |
          # Run smoke tests against staging
          npm run test:smoke -- --base-url=https://staging.autosite.cloud

  deploy-production:
    needs: [deploy-staging]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production  # Requires manual approval
    steps:
      - uses: actions/checkout@v4
      - run: |
          # Canary deploy (10% traffic)
          kubectl set image deployment/api-canary \
            api=ghcr.io/${{ github.repository }}:${{ github.sha }} \
            --namespace=production
      - run: |
          # Wait for canary health check
          sleep 300
          # Full rollout if canary is healthy
          kubectl set image deployment/api \
            api=ghcr.io/${{ github.repository }}:${{ github.sha }} \
            --namespace=production
```

### Deployment Strategy

| Environment | Trigger | Strategy | Approval |
|-------------|---------|----------|----------|
| **Development** | Push to `develop` | Auto-deploy | None |
| **Staging** | Push to `main` | Auto-deploy | None |
| **Production** | Push to `main` (after staging) | Canary → Full | Manual |

### Monitoring & Rollback

```
┌─────────────────────────────────────────────────────────────────┐
│                    POST-DEPLOY MONITORING                        │
│                                                                  │
│  1. Health Check     → /health endpoint (every 30s)             │
│  2. Error Rate       → Sentry alerts if > 1% error rate        │
│  3. Latency          → Grafana alerts if p99 > 500ms           │
│  4. Build Success    → Cloudflare Pages build completion rate   │
│  5. User Impact      → Support ticket volume spike detection   │
│                                                                  │
│  ROLLBACK TRIGGER: Any of the above thresholds breached         │
│  ROLLBACK ACTION: kubectl rollout undo deployment/api           │
│  ROLLBACK TIME: < 60 seconds                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appendix A: API Error Response Format

```json
{
  "error": {
    "code": "SITE_NOT_FOUND",
    "message": "The requested site does not exist or you lack access.",
    "details": {
      "siteId": "uuid-here"
    },
    "requestId": "req_uuid",
    "timestamp": "2026-09-12T10:00:00Z"
  }
}
```

## Appendix B: WebSocket Event Types

| Event | Direction | Payload |
|-------|-----------|---------|
| `build:started` | Server → Client | `{ siteId, buildId, startedAt }` |
| `build:progress` | Server → Client | `{ siteId, buildId, step, percent }` |
| `build:completed` | Server → Client | `{ siteId, buildId, url, completedAt }` |
| `build:failed` | Server → Client | `{ siteId, buildId, error, failedAt }` |
| `domain:verified` | Server → Client | `{ domainId, domain, verifiedAt }` |
| `domain:ssl_ready` | Server → Client | `{ domainId, expiresAt }` |
| `content:updated` | Server → Client | `{ siteId, version, updatedAt }` |

## Appendix C: Database Schema (Core Tables)

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    template_id TEXT,
    status TEXT DEFAULT 'draft', -- draft, building, live, archived
    published_url TEXT,
    custom_domain TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, slug)
);

-- Site Content (versioned)
CREATE TABLE site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    version INT NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, version)
);

-- Builds
CREATE TABLE builds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    version INT NOT NULL,
    status TEXT DEFAULT 'queued', -- queued, building, deploying, live, failed
    error TEXT,
    deploy_url TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Domains
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    domain TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, verifying, active, expired
    ssl_status TEXT DEFAULT 'none', -- none, provisioning, active
    verification_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Events
CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    event TEXT NOT NULL,
    path TEXT,
    referrer TEXT,
    user_agent TEXT,
    geo JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sites_workspace ON sites(workspace_id);
CREATE INDEX idx_site_content_site ON site_content(site_id, version DESC);
CREATE INDEX idx_builds_site ON builds(site_id, created_at DESC);
CREATE INDEX idx_analytics_site_date ON analytics_events(site_id, created_at);
CREATE INDEX idx_analytics_visitor ON analytics_events(visitor_id, created_at);
```

---

*This document is maintained by the AutoSite Cloud engineering team. For questions or proposed changes, open a PR or reach out in #architecture on Slack.*
