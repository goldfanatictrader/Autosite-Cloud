# AutoSite Cloud — Database Schema

## Overview

PostgreSQL database with the following tables. Use UUIDs for all primary keys. All timestamps in UTC.

---

## Tables

### users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | User ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| name | VARCHAR(255) | NOT NULL | Display name |
| avatar_url | TEXT | | Profile picture URL |
| auth_provider | ENUM('email','google','apple','github') | NOT NULL | Auth method |
| auth_provider_id | VARCHAR(255) | | Provider-specific ID |
| password_hash | VARCHAR(255) | | bcrypt hash (email auth only) |
| email_verified | BOOLEAN | DEFAULT false | Email verification status |
| plan | ENUM('free','pro','business') | DEFAULT 'free' | Subscription plan |
| created_at | TIMESTAMPTZ | DEFAULT now() | Account creation |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last profile update |

---

### workspaces

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Workspace ID |
| owner_id | UUID | FK → users.id, NOT NULL | Workspace owner |
| name | VARCHAR(255) | NOT NULL | Workspace name |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-safe identifier |
| plan | ENUM('free','pro','business') | DEFAULT 'free' | Workspace plan |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation date |

---

### sites

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Site ID |
| workspace_id | UUID | FK → workspaces.id, NOT NULL | Parent workspace |
| name | VARCHAR(255) | NOT NULL | Site name |
| slug | VARCHAR(255) | NOT NULL | URL slug |
| description | TEXT | | Brief site description |
| status | ENUM('draft','building','live','error') | DEFAULT 'draft' | Current status |
| template_id | UUID | FK → templates.id | Applied template |
| custom_domain | VARCHAR(255) | | Custom domain if set |
| published_at | TIMESTAMPTZ | | Last publish time |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation date |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

**Constraints:**
- `UNIQUE(workspace_id, slug)` — Each slug must be unique within a workspace

---

### site_content

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Content ID |
| site_id | UUID | FK → sites.id, NOT NULL | Parent site |
| page_slug | VARCHAR(255) | NOT NULL | Page identifier (home, about, services, contact) |
| content_json | JSONB | NOT NULL | Page content structure |
| ai_generated | BOOLEAN | DEFAULT false | Created by AI |
| version | INTEGER | DEFAULT 1 | Content version |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Constraints:**
- `UNIQUE(site_id, page_slug)` — Each page slug must be unique within a site

---

### site_versions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Version ID |
| site_id | UUID | FK → sites.id, NOT NULL | Parent site |
| content_snapshot | JSONB | NOT NULL | Full content snapshot |
| version_number | INTEGER | NOT NULL | Version sequence |
| created_at | TIMESTAMPTZ | DEFAULT now() | Snapshot time |

---

### domains

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Domain ID |
| site_id | UUID | FK → sites.id, NOT NULL | Associated site |
| domain | VARCHAR(255) | UNIQUE, NOT NULL | Domain name |
| status | ENUM('pending','verifying','active','failed','expired') | DEFAULT 'pending' | DNS status |
| ssl_status | ENUM('pending','active','failed') | DEFAULT 'pending' | SSL certificate status |
| verification_token | VARCHAR(255) | | DNS verification token |
| verified_at | TIMESTAMPTZ | | When domain was verified |
| expires_at | TIMESTAMPTZ | | Domain expiration |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

---

### analytics

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Record ID |
| site_id | UUID | FK → sites.id, NOT NULL | Parent site |
| date | DATE | NOT NULL | Analytics date |
| page_views | INTEGER | DEFAULT 0 | Total page views |
| unique_visitors | INTEGER | DEFAULT 0 | Unique visitors |
| top_pages | JSONB | DEFAULT '[]' | `[{path, views}]` |
| top_referrers | JSONB | DEFAULT '[]' | `[{source, visits}]` |
| top_countries | JSONB | DEFAULT '[]' | `[{country, visitors}]` |
| bounce_rate | DECIMAL(5,2) | | Bounce rate percentage |
| avg_duration | INTEGER | | Avg session seconds |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Constraints:**
- `UNIQUE(site_id, date)` — One analytics record per site per day

---

### templates

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Template ID |
| name | VARCHAR(255) | NOT NULL | Template name |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-safe identifier |
| category | VARCHAR(100) | NOT NULL | business, portfolio, blog, restaurant, etc |
| description | TEXT | | Template description |
| preview_url | TEXT | | Preview image URL |
| content_structure | JSONB | NOT NULL | Default page structure |
| is_premium | BOOLEAN | DEFAULT false | Requires paid plan |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

---

### notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Notification ID |
| user_id | UUID | FK → users.id, NOT NULL | Recipient |
| type | ENUM('publish_complete','domain_reminder','domain_expiring','system') | NOT NULL | Notification type |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification body |
| link | TEXT | | Deep link to relevant screen |
| read | BOOLEAN | DEFAULT false | Read status |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

---

### user_preferences

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Preference ID |
| user_id | UUID | FK → users.id, UNIQUE | Owner |
| quiet_hours_start | TIME | | Start of quiet hours |
| quiet_hours_end | TIME | | End of quiet hours |
| push_enabled | BOOLEAN | DEFAULT true | Push notifications |
| email_notifications | BOOLEAN | DEFAULT true | Email notifications |
| theme | ENUM('light','dark','system') | DEFAULT 'system' | App theme |
| language | VARCHAR(10) | DEFAULT 'en' | UI language |

---

## Indexes

| Table | Column(s) | Index Type |
|-------|-----------|------------|
| users | email | UNIQUE |
| workspaces | owner_id | INDEX |
| sites | workspace_id, status | INDEX |
| site_content | site_id | INDEX |
| domains | site_id, domain | UNIQUE |
| analytics | site_id, date | INDEX |
| notifications | user_id, read, created_at | INDEX |
| templates | category | INDEX |

---

## Enums Summary

| Enum Name | Values |
|-----------|--------|
| auth_provider | email, google, apple, github |
| plan | free, pro, business |
| site_status | draft, building, live, error |
| domain_status | pending, verifying, active, failed, expired |
| ssl_status | pending, active, failed |
| notification_type | publish_complete, domain_reminder, domain_expiring, system |
| theme | light, dark, system |

---

## Relationships

```
users 1──N workspaces
workspaces 1──N sites
sites 1──N site_content
sites 1──N site_versions
sites 1──N domains
sites 1──N analytics
sites N──1 templates
users 1──N notifications
users 1──1 user_preferences
```
