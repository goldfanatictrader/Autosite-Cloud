# AutoSite Cloud — API Specification

## Overview

RESTful API for AutoSite Cloud — a mobile-first website builder.

- **Base URL:** `https://api.autosite.cloud/v1`
- **Authentication:** JWT Bearer tokens (include `Authorization: Bearer <token>` header)
- **Content-Type:** `application/json`
- **Versioning:** URL-based (`/v1/`)

---

## Authentication Endpoints

### POST /auth/signup

Create a new user account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepass",
  "name": "John"
}
```

**Response 201 — Created:**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John",
    "created_at": "2026-09-12T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 409 — Conflict:**

```json
{
  "error": "Email already registered",
  "code": "EMAIL_EXISTS"
}
```

---

### POST /auth/login

Authenticate an existing user.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepass"
}
```

**Response 200 — OK:**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 401 — Unauthorized:**

```json
{
  "error": "Invalid credentials",
  "code": "INVALID_CREDENTIALS"
}
```

---

### POST /auth/social

Authenticate via social provider (Google, Apple, GitHub).

**Request:**

```json
{
  "provider": "google",
  "access_token": "ya29.a0AfH6SMB..."
}
```

**Response 200 — OK:**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John",
    "provider": "google"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### POST /auth/forgot-password

Request a password reset email.

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response 200 — OK:**

```json
{
  "message": "Reset email sent"
}
```

---

### POST /auth/reset-password

Reset password using the token from email.

**Request:**

```json
{
  "token": "reset_token_from_email",
  "new_password": "newsecurepass"
}
```

**Response 200 — OK:**

```json
{
  "message": "Password updated"
}
```

**Response 400 — Bad Request:**

```json
{
  "error": "Invalid or expired reset token",
  "code": "INVALID_TOKEN"
}
```

---

## Sites Endpoints

All sites endpoints require authentication.

### GET /api/sites

List all sites in the authenticated user's workspace.

**Query Parameters:**

| Parameter | Type    | Required | Description                              |
|-----------|---------|----------|------------------------------------------|
| `status`  | string  | No       | Filter by status: `draft`, `building`, `live`, `error` |
| `page`    | integer | No       | Page number (default: `1`)               |
| `limit`   | integer | No       | Results per page (default: `20`, max: `100`) |
| `search`  | string  | No       | Search by site name                      |

**Response 200 — OK:**

```json
{
  "sites": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "My Restaurant",
      "status": "live",
      "template_id": "tmpl_abc123",
      "custom_domain": "myrestaurant.com",
      "created_at": "2026-09-01T10:00:00Z",
      "updated_at": "2026-09-10T15:30:00Z",
      "published_at": "2026-09-05T12:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "pages": 1
}
```

---

### POST /api/sites

Create a new site in the workspace.

**Request:**

```json
{
  "name": "My Restaurant",
  "template_id": "tmpl_abc123"
}
```

**Response 201 — Created:**

```json
{
  "site": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Restaurant",
    "status": "draft",
    "template_id": "tmpl_abc123",
    "pages": ["home", "about", "services", "contact"],
    "created_at": "2026-09-12T10:00:00Z",
    "updated_at": "2026-09-12T10:00:00Z"
  }
}
```

---

### GET /api/sites/:id

Get detailed information about a specific site.

**Path Parameters:**

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `id`      | string | Yes      | Site UUID   |

**Response 200 — OK:**

```json
{
  "site": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Restaurant",
    "status": "live",
    "template_id": "tmpl_abc123",
    "custom_domain": "myrestaurant.com",
    "subdomain": "my-restaurant.autosite.cloud",
    "pages": ["home", "about", "menu", "contact"],
    "settings": {
      "favicon_url": "https://cdn.autosite.cloud/sites/xxx/favicon.ico",
      "meta_title": "My Restaurant - Best Pizza in Town",
      "meta_description": "Family-friendly Italian restaurant..."
    },
    "created_at": "2026-09-01T10:00:00Z",
    "updated_at": "2026-09-10T15:30:00Z",
    "published_at": "2026-09-05T12:00:00Z"
  }
}
```

---

### PUT /api/sites/:id

Update site settings.

**Request:**

```json
{
  "name": "Updated Restaurant Name",
  "settings": {
    "meta_title": "New Title",
    "meta_description": "Updated description"
  }
}
```

**Response 200 — OK:**

```json
{
  "site": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Restaurant Name",
    "status": "live",
    "updated_at": "2026-09-12T10:05:00Z"
  }
}
```

---

### DELETE /api/sites/:id

Soft delete a site. The site is moved to trash and can be restored within 30 days.

**Response 200 — OK:**

```json
{
  "message": "Site moved to trash",
  "deleted_at": "2026-09-12T10:00:00Z",
  "restore_before": "2026-10-12T10:00:00Z"
}
```

---

### POST /api/sites/:id/publish

Trigger a site build and publish.

**Response 200 — OK:**

```json
{
  "status": "building",
  "build_id": "build_789xyz",
  "estimated_duration": 45
}
```

---

### POST /api/sites/:id/preview

Generate a temporary preview URL for the current draft.

**Response 200 — OK:**

```json
{
  "preview_url": "https://preview.autosite.cloud/abc123def456",
  "expires_at": "2026-09-12T22:00:00Z"
}
```

---

### POST /api/sites/:id/restore

Restore a site to a previous version.

**Request:**

```json
{
  "version_id": "ver_456abc"
}
```

**Response 200 — OK:**

```json
{
  "site": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "draft",
    "restored_from": "ver_456abc",
    "updated_at": "2026-09-12T10:00:00Z"
  }
}
```

---

### GET /api/sites/:id/versions

List all content versions for a site.

**Response 200 — OK:**

```json
{
  "versions": [
    {
      "id": "ver_789xyz",
      "version": 5,
      "label": "Published version",
      "created_at": "2026-09-10T15:30:00Z",
      "published": true
    },
    {
      "id": "ver_456abc",
      "version": 4,
      "label": null,
      "created_at": "2026-09-08T12:00:00Z",
      "published": false
    }
  ]
}
```

---

### POST /api/sites/:id/apply-template

Apply a new template to the site (replaces existing content).

**Request:**

```json
{
  "template_id": "tmpl_xyz789"
}
```

**Response 200 — OK:**

```json
{
  "site": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "template_id": "tmpl_xyz789",
    "status": "draft",
    "updated_at": "2026-09-12T10:00:00Z"
  }
}
```

---

## Site Content Endpoints

### GET /api/sites/:id/content

Get all page content for a site.

**Response 200 — OK:**

```json
{
  "pages": [
    {
      "page_slug": "home",
      "content_json": {
        "sections": [
          {
            "type": "hero",
            "heading": "Welcome to My Restaurant",
            "subheading": "Best pizza in town",
            "cta_text": "View Menu",
            "background_image": "https://cdn.autosite.cloud/sites/xxx/hero.jpg"
          },
          {
            "type": "features",
            "items": [
              { "title": "Fresh Ingredients", "description": "Locally sourced..." },
              { "title": "Family Friendly", "description": "Kids menu available..." }
            ]
          }
        ]
      },
      "version": 3
    },
    {
      "page_slug": "about",
      "content_json": {
        "sections": [
          {
            "type": "hero",
            "heading": "Our Story",
            "subheading": "Serving the community since 2010"
          }
        ]
      },
      "version": 2
    }
  ]
}
```

---

### GET /api/sites/:id/content/:page

Get content for a specific page.

**Path Parameters:**

| Parameter | Type   | Required | Description     |
|-----------|--------|----------|-----------------|
| `id`      | string | Yes      | Site UUID       |
| `page`    | string | Yes      | Page slug (e.g., `home`, `about`, `contact`) |

**Response 200 — OK:**

```json
{
  "page_slug": "home",
  "content_json": {
    "sections": [
      {
        "type": "hero",
        "heading": "Welcome to My Restaurant",
        "subheading": "Best pizza in town",
        "cta_text": "View Menu"
      }
    ]
  },
  "version": 3,
  "updated_at": "2026-09-10T15:30:00Z"
}
```

---

### PUT /api/sites/:id/content/:page

Update content for a specific page. This creates a new version.

**Request:**

```json
{
  "content_json": {
    "sections": [
      {
        "type": "hero",
        "heading": "Updated Heading",
        "subheading": "New subheading",
        "cta_text": "Order Now",
        "background_image": "https://cdn.autosite.cloud/sites/xxx/new-hero.jpg"
      },
      {
        "type": "testimonials",
        "items": [
          {
            "quote": "Best pizza I've ever had!",
            "author": "Jane D.",
            "rating": 5
          }
        ]
      }
    ]
  }
}
```

**Response 200 — OK:**

```json
{
  "page_slug": "home",
  "version": 4,
  "updated_at": "2026-09-12T10:00:00Z"
}
```

---

## AI Writer Endpoints

### POST /api/ai/generate-content

Generate full page content from a brief using AI.

**Request:**

```json
{
  "site_id": "550e8400-e29b-41d4-a716-446655440000",
  "brief": "Italian restaurant in downtown, family-friendly, pizza specialist, cozy atmosphere",
  "tone": "friendly",
  "language": "en",
  "pages": ["home", "about", "services", "contact"]
}
```

**Response 200 — OK:**

```json
{
  "pages": {
    "home": {
      "sections": [
        {
          "type": "hero",
          "heading": "Welcome to Downtown Pizza Co.",
          "subheading": "Where families come together over authentic Italian flavors",
          "cta_text": "Explore Our Menu"
        },
        {
          "type": "features",
          "items": [
            { "title": "Handmade Dough", "description": "Fresh daily, just like nonna makes it" },
            { "title": "Family Friendly", "description": "Kids eat free every Tuesday" },
            { "title": "Cozy Atmosphere", "description": "Warm lighting and rustic decor" }
          ]
        }
      ]
    },
    "about": {
      "sections": [
        {
          "type": "hero",
          "heading": "Our Story",
          "subheading": "A family recipe passed down through generations"
        }
      ]
    },
    "services": {
      "sections": [
        {
          "type": "services",
          "items": [
            { "title": "Dine-In", "description": "Enjoy our cozy dining room" },
            { "title": "Takeout", "description": "Quick pickup, hot and fresh" },
            { "title": "Catering", "description": "Events large and small" }
          ]
        }
      ]
    },
    "contact": {
      "sections": [
        {
          "type": "contact",
          "heading": "Visit Us",
          "address": "123 Main St, Downtown",
          "phone": "(555) 123-4567",
          "hours": "Mon-Sun 11am-10pm"
        }
      ]
    }
  },
  "tokens_used": 1500
}
```

---

### POST /api/ai/rewrite

Rewrite existing text with a specific instruction and tone.

**Request:**

```json
{
  "text": "We make really good pizza and our restaurant is nice. You should come eat here because the food is great and the people are friendly.",
  "instruction": "make it shorter and more professional",
  "tone": "professional"
}
```

**Response 200 — OK:**

```json
{
  "rewritten": "Crafting authentic Italian pizza in a welcoming atmosphere. Visit us for exceptional flavors and attentive service.",
  "tokens_used": 200
}
```

---

### POST /api/ai/suggest

Get AI-powered suggestions for a specific section type.

**Request:**

```json
{
  "context": "restaurant homepage",
  "section_type": "hero"
}
```

**Response 200 — OK:**

```json
{
  "suggestions": [
    {
      "heading": "Taste the Difference",
      "subheading": "Authentic Italian cuisine crafted with passion",
      "cta_text": "Reserve a Table"
    },
    {
      "heading": "Where Every Meal Becomes a Memory",
      "subheading": "Family-owned since 2010",
      "cta_text": "See Our Menu"
    },
    {
      "heading": "Downtown's Favorite Pizzeria",
      "subheading": "Wood-fired perfection in every slice",
      "cta_text": "Order Online"
    }
  ]
}
```

---

## Domains Endpoints

### POST /api/domains/search

Search for available domain names.

**Request:**

```json
{
  "query": "myrestaurant"
}
```

**Response 200 — OK:**

```json
{
  "results": [
    { "domain": "myrestaurant.com", "available": true, "price": 12.99, "tld": "com" },
    { "domain": "myrestaurant.net", "available": true, "price": 14.99, "tld": "net" },
    { "domain": "myrestaurant.io", "available": true, "price": 39.99, "tld": "io" },
    { "domain": "myrestaurant.co", "available": false, "price": null, "tld": "co" }
  ]
}
```

---

### POST /api/domains/connect

Connect an existing domain to a site.

**Request:**

```json
{
  "site_id": "550e8400-e29b-41d4-a716-446655440000",
  "domain": "myrestaurant.com"
}
```

**Response 200 — OK:**

```json
{
  "domain_id": "dom_abc123",
  "domain": "myrestaurant.com",
  "status": "pending_verification",
  "dns_records": [
    {
      "type": "CNAME",
      "name": "@",
      "value": "xxx.autosite.cloud",
      "ttl": 3600
    },
    {
      "type": "TXT",
      "name": "_autosite-verification",
      "value": "verify_abc123xyz",
      "ttl": 3600
    }
  ]
}
```

---

### POST /api/domains/buy

Purchase and connect a new domain.

**Request:**

```json
{
  "site_id": "550e8400-e29b-41d4-a716-446655440000",
  "domain": "myrestaurant.com",
  "payment_method": "card_xxx"
}
```

**Response 201 — Created:**

```json
{
  "domain_id": "dom_abc123",
  "domain": "myrestaurant.com",
  "status": "active",
  "price": 12.99,
  "expires_at": "2027-09-12T00:00:00Z",
  "auto_renew": true
}
```

---

### GET /api/domains/:id/status

Check domain verification and SSL status.

**Response 200 — OK:**

```json
{
  "domain_id": "dom_abc123",
  "domain": "myrestaurant.com",
  "status": "active",
  "ssl_status": "active",
  "verified_at": "2026-09-12T10:30:00Z",
  "ssl_issued_at": "2026-09-12T10:31:00Z",
  "ssl_expires_at": "2026-12-12T10:31:00Z"
}
```

**Response 200 — Pending:**

```json
{
  "domain_id": "dom_abc123",
  "domain": "myrestaurant.com",
  "status": "pending_verification",
  "ssl_status": "pending",
  "dns_records": [
    { "type": "CNAME", "name": "@", "value": "xxx.autosite.cloud", "verified": false }
  ]
}
```

---

### DELETE /api/domains/:id

Disconnect a domain from a site.

**Response 200 — OK:**

```json
{
  "message": "Domain disconnected",
  "domain": "myrestaurant.com"
}
```

---

## Analytics Endpoints

### GET /api/analytics/sites/:id/overview

Get analytics overview for a site.

**Query Parameters:**

| Parameter | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| `period`  | string | No       | Time period: `7d`, `30d`, `90d` (default: `30d`) |

**Response 200 — OK:**

```json
{
  "total_views": 12500,
  "unique_visitors": 8200,
  "bounce_rate": 42.5,
  "avg_duration": 180,
  "top_country": "United States",
  "views_trend": [
    { "date": "2026-09-01", "views": 450 },
    { "date": "2026-09-02", "views": 520 },
    { "date": "2026-09-03", "views": 480 },
    { "date": "2026-09-04", "views": 610 },
    { "date": "2026-09-05", "views": 550 }
  ]
}
```

---

### GET /api/analytics/sites/:id/pages

Get top performing pages.

**Response 200 — OK:**

```json
{
  "pages": [
    { "path": "/", "title": "Home", "views": 5200, "unique_visitors": 3800, "avg_time": 120 },
    { "path": "/menu", "title": "Menu", "views": 3100, "unique_visitors": 2400, "avg_time": 95 },
    { "path": "/about", "title": "About Us", "views": 1800, "unique_visitors": 1500, "avg_time": 65 },
    { "path": "/contact", "title": "Contact", "views": 950, "unique_visitors": 800, "avg_time": 45 }
  ]
}
```

---

### GET /api/analytics/sites/:id/referrers

Get traffic sources and referrers.

**Response 200 — OK:**

```json
{
  "referrers": [
    { "source": "google", "visits": 4200, "percentage": 33.6 },
    { "source": "direct", "visits": 3100, "percentage": 24.8 },
    { "source": "facebook", "visits": 2100, "percentage": 16.8 },
    { "source": "instagram", "visits": 1500, "percentage": 12.0 },
    { "source": "other", "visits": 1600, "percentage": 12.8 }
  ]
}
```

---

### GET /api/analytics/compare

Compare analytics across multiple sites.

**Query Parameters:**

| Parameter  | Type   | Required | Description                       |
|------------|--------|----------|-----------------------------------|
| `site_ids` | string | Yes      | Comma-separated site UUIDs        |
| `period`   | string | No       | Time period: `7d`, `30d`, `90d`   |

**Response 200 — OK:**

```json
{
  "comparison": [
    {
      "site_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "My Restaurant",
      "total_views": 12500,
      "unique_visitors": 8200,
      "bounce_rate": 42.5
    },
    {
      "site_id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Coffee Shop",
      "total_views": 8300,
      "unique_visitors": 5100,
      "bounce_rate": 38.2
    }
  ]
}
```

---

## Templates Endpoints

### GET /api/templates

List available site templates.

**Query Parameters:**

| Parameter | Type    | Required | Description                                      |
|-----------|---------|----------|--------------------------------------------------|
| `category`| string  | No       | Filter: `business`, `portfolio`, `restaurant`, `blog`, `ecommerce`, `landing` |
| `premium` | boolean | No       | Filter by premium status                         |

**Response 200 — OK:**

```json
{
  "templates": [
    {
      "id": "tmpl_abc123",
      "name": "Modern Restaurant",
      "category": "restaurant",
      "premium": false,
      "thumbnail": "https://cdn.autosite.cloud/templates/restaurant-modern/thumb.jpg",
      "pages": ["home", "menu", "about", "contact"],
      "description": "Clean, modern design for restaurants with online menu support"
    },
    {
      "id": "tmpl_def456",
      "name": "Corporate Business",
      "category": "business",
      "premium": true,
      "thumbnail": "https://cdn.autosite.cloud/templates/business-corporate/thumb.jpg",
      "pages": ["home", "services", "about", "team", "contact"],
      "description": "Professional template for businesses and agencies"
    }
  ]
}
```

---

### GET /api/templates/:id

Get detailed information about a specific template.

**Response 200 — OK:**

```json
{
  "template": {
    "id": "tmpl_abc123",
    "name": "Modern Restaurant",
    "category": "restaurant",
    "premium": false,
    "description": "Clean, modern design for restaurants with online menu support",
    "thumbnail": "https://cdn.autosite.cloud/templates/restaurant-modern/thumb.jpg",
    "preview_url": "https://preview.autosite.cloud/templates/restaurant-modern",
    "pages": ["home", "menu", "about", "contact"],
    "colors": {
      "primary": "#D4380D",
      "secondary": "#1A1A1A",
      "accent": "#FAFAFA"
    },
    "fonts": {
      "heading": "Playfair Display",
      "body": "Inter"
    }
  }
}
```

---

## Notifications Endpoints

### GET /api/notifications

List user notifications.

**Query Parameters:**

| Parameter | Type    | Required | Description                    |
|-----------|---------|----------|--------------------------------|
| `unread`  | boolean | No       | Filter by unread status        |
| `page`    | integer | No       | Page number (default: `1`)     |
| `limit`   | integer | No       | Results per page (default: `20`) |

**Response 200 — OK:**

```json
{
  "notifications": [
    {
      "id": "notif_abc123",
      "type": "build_complete",
      "title": "Your site has been published",
      "message": "My Restaurant is now live at myrestaurant.com",
      "read": false,
      "created_at": "2026-09-12T10:00:00Z",
      "action_url": "/sites/550e8400-e29b-41d4-a716-446655440000"
    },
    {
      "id": "notif_def456",
      "type": "domain_ready",
      "title": "Domain verified",
      "message": "myrestaurant.com is now active with SSL",
      "read": true,
      "created_at": "2026-09-11T15:00:00Z",
      "action_url": "/domains/dom_abc123"
    }
  ],
  "total": 25,
  "unread_count": 8,
  "page": 1,
  "pages": 2
}
```

---

### PUT /api/notifications/:id/read

Mark a notification as read.

**Response 200 — OK:**

```json
{
  "notification": {
    "id": "notif_abc123",
    "read": true
  }
}
```

---

### PUT /api/notifications/read-all

Mark all notifications as read.

**Response 200 — OK:**

```json
{
  "message": "All notifications marked as read",
  "updated_count": 8
}
```

---

### GET /api/notifications/preferences

Get user notification preferences.

**Response 200 — OK:**

```json
{
  "preferences": {
    "push_enabled": true,
    "email_enabled": true,
    "build_complete": true,
    "domain_expiry": true,
    "analytics_summary": false,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00",
    "timezone": "America/New_York"
  }
}
```

---

### PUT /api/notifications/preferences

Update notification preferences.

**Request:**

```json
{
  "push_enabled": true,
  "email_enabled": false,
  "build_complete": true,
  "domain_expiry": true,
  "analytics_summary": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00",
  "timezone": "America/New_York"
}
```

**Response 200 — OK:**

```json
{
  "preferences": {
    "push_enabled": true,
    "email_enabled": false,
    "build_complete": true,
    "domain_expiry": true,
    "analytics_summary": true,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00",
    "timezone": "America/New_York"
  }
}
```

---

## Error Handling

All error responses follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

| Code | Meaning              | When                                  |
|------|----------------------|---------------------------------------|
| 400  | Bad Request          | Malformed JSON or missing required fields |
| 401  | Unauthorized         | Missing or invalid JWT token          |
| 403  | Forbidden            | Insufficient permissions              |
| 404  | Not Found            | Resource does not exist               |
| 409  | Conflict             | Duplicate resource (e.g., email exists) |
| 422  | Unprocessable Entity | Validation failed on one or more fields |
| 429  | Too Many Requests    | Rate limit exceeded                   |
| 500  | Internal Server Error| Unexpected server failure             |

### Error Codes

| Code                   | Description                         |
|------------------------|-------------------------------------|
| `INVALID_CREDENTIALS`  | Email or password is incorrect      |
| `EMAIL_EXISTS`         | Email is already registered         |
| `INVALID_TOKEN`        | JWT or reset token is invalid       |
| `SITE_NOT_FOUND`       | Site does not exist                 |
| `DOMAIN_NOT_FOUND`     | Domain does not exist               |
| `DOMAIN_UNAVAILABLE`   | Domain is not available for purchase |
| `TEMPLATE_NOT_FOUND`   | Template does not exist             |
| `BUILD_FAILED`         | Site build and publish failed       |
| `RATE_LIMITED`         | Too many requests                   |
| `VALIDATION_ERROR`     | Request body failed validation      |
| `AI_QUOTA_EXCEEDED`    | AI generation quota exhausted       |
| `PAYMENT_FAILED`       | Payment processing failed           |

### Validation Error Example

**Response 422 — Unprocessable Entity:**

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": "Must be a valid email address",
    "password": "Must be at least 8 characters"
  }
}
```

### Rate Limit Error Example

**Response 429 — Too Many Requests:**

```json
{
  "error": "Rate limit exceeded. Try again in 30 seconds.",
  "code": "RATE_LIMITED",
  "details": {
    "limit": 5,
    "window": "1m",
    "retry_after": 30
  }
}
```

---

## Rate Limiting

Rate limits are enforced per API key / authenticated user.

| Endpoint Category     | Limit              | Window    |
|-----------------------|--------------------|-----------|
| Auth endpoints        | 5 requests         | per minute|
| AI endpoints (Free)   | 20 requests        | per hour  |
| AI endpoints (Pro)    | 200 requests       | per hour  |
| All other endpoints   | 100 requests       | per minute|

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1757680800
```

When rate limited, responses include a `retry_after` field indicating seconds until the limit resets.
