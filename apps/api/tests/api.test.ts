import type {
  ApiError,
  AuthResponse,
  CreateSiteResponse,
  GenerateContentRequest,
  GenerateContentResponse,
  SiteContentResponse,
  SitesResponse,
} from '@autosite/shared';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import { generateContent } from '../src/modules/ai/generator.js';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../src/store/memory-store.js';

const FIXED_NOW = new Date('2026-09-12T12:00:00.000Z');

describe('AutoSite Phase 1 API', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({
      clock: () => new Date(FIXED_NOW),
      jwtSecret: 'test-secret-that-is-long-enough-for-the-test-suite',
    });
  });

  afterEach(async () => {
    await app.close();
  });

  const login = async (): Promise<string> => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });
    expect(response.statusCode).toBe(200);
    return response.json<AuthResponse>().token;
  };

  it('reports health and API-SPEC rate-limit headers', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      service: 'autosite-api',
      timestamp: FIXED_NOW.toISOString(),
    });
    expect(response.headers['x-ratelimit-limit']).toBe('100');
    expect(response.headers['x-ratelimit-remaining']).toBe('99');
    expect(response.headers['x-ratelimit-reset']).toBeDefined();
  });

  it('authenticates the seeded demo account and lists three sample sites', async () => {
    const token = await login();
    const response = await app.inject({
      method: 'GET',
      url: '/api/sites',
      headers: { authorization: `Bearer ${token}` },
    });
    const body = response.json<SitesResponse>();

    expect(response.statusCode).toBe(200);
    expect(body.total).toBe(3);
    expect(body.sites).toHaveLength(3);
    expect(body.sites.map((site) => site.status)).toEqual([
      'building',
      'draft',
      'live',
    ]);
  });

  it('creates a site, generates content, and persists each generated page', async () => {
    const token = await login();
    const authorization = { authorization: `Bearer ${token}` };
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/sites',
      headers: authorization,
      payload: { name: 'Downtown Pizza Co.', template_id: 'default' },
    });
    const site = createResponse.json<CreateSiteResponse>().site;

    expect(createResponse.statusCode).toBe(201);
    expect(site.status).toBe('draft');
    expect(site.pages).toEqual(['home', 'about', 'services', 'contact']);

    const generateResponse = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-content',
      headers: authorization,
      payload: {
        site_id: site.id,
        brief:
          'Italian family restaurant downtown serving handmade pizza and pasta',
        tone: 'friendly',
        language: 'en',
        pages: ['home', 'about', 'services', 'contact'],
      },
    });
    const generated = generateResponse.json<GenerateContentResponse>();

    expect(generateResponse.statusCode).toBe(200);
    expect(generated.tokens_used).toBeGreaterThan(0);
    expect(generated.pages.home?.sections[0]).toMatchObject({
      type: 'hero',
      heading: 'Welcome to Italian Family Restaurant Downtown',
    });

    const contentResponse = await app.inject({
      method: 'GET',
      url: `/api/sites/${site.id}/content`,
      headers: authorization,
    });
    const persisted = contentResponse.json<SiteContentResponse>();

    expect(contentResponse.statusCode).toBe(200);
    expect(persisted.pages.map((page) => page.page_slug)).toEqual([
      'home',
      'about',
      'services',
      'contact',
    ]);
    expect(persisted.pages.every((page) => page.version === 1)).toBe(true);
    expect(persisted.pages[0]?.content_json).toEqual(generated.pages.home);
  });

  it('produces deterministic, localized output without an external API', () => {
    const request: GenerateContentRequest = {
      site_id: '30000000-0000-4000-8000-000000000001',
      brief: 'Forno artigianale nel centro storico della città',
      tone: 'luxury',
      language: 'it',
      pages: ['home', 'contact'],
    };

    const first = generateContent(request);
    const second = generateContent(request);

    expect(first).toEqual(second);
    expect(first.pages.home?.sections[0]).toMatchObject({
      type: 'hero',
      heading: expect.stringContaining('Benvenuti da'),
    });
    expect(first.pages.contact?.sections).toHaveLength(2);
  });

  it('returns the consistent error envelope for missing auth and validation', async () => {
    const unauthorized = await app.inject({
      method: 'GET',
      url: '/api/sites',
    });
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.json<ApiError>()).toEqual({
      error: 'Missing or invalid authentication token',
      code: 'INVALID_TOKEN',
      details: {},
    });

    const token = await login();
    const invalid = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-content',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        site_id: '30000000-0000-4000-8000-000000000001',
        brief: 'short',
        tone: 'friendly',
        language: 'en',
        pages: ['home'],
      },
    });
    const body = invalid.json<ApiError>();

    expect(invalid.statusCode).toBe(422);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details).toHaveProperty('brief');
  });

  it('enforces the API-SPEC auth rate limit', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: DEMO_EMAIL, password: 'wrong-password' },
      });
      expect(response.statusCode).toBe(401);
    }

    const limited = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: DEMO_EMAIL, password: 'wrong-password' },
    });
    const body = limited.json<ApiError>();

    expect(limited.statusCode).toBe(429);
    expect(limited.headers['retry-after']).toBe('60');
    expect(body.code).toBe('RATE_LIMITED');
    expect(body.details).toMatchObject({ limit: 5, window: '1m' });
  });

  it('returns rate headers without charging CORS preflight requests', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const preflight = await app.inject({
        method: 'OPTIONS',
        url: '/auth/login',
        headers: {
          origin: 'http://localhost:3000',
          'access-control-request-method': 'POST',
        },
      });
      expect(preflight.statusCode).toBe(204);
      expect(preflight.headers['x-ratelimit-remaining']).toBe('5');
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const loginAttempt = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: DEMO_EMAIL, password: 'wrong-password' },
      });
      expect(loginAttempt.statusCode).toBe(401);
    }
  });

  it('creates a user with sample sites and rejects duplicate email addresses', async () => {
    const payload = {
      email: 'owner@example.com',
      password: 'SafePassword123!',
      name: 'Site Owner',
    };
    const signup = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload,
    });
    expect(signup.statusCode).toBe(201);

    const auth = signup.json<AuthResponse>();
    const sites = await app.inject({
      method: 'GET',
      url: '/api/sites',
      headers: { authorization: `Bearer ${auth.token}` },
    });
    expect(sites.json<SitesResponse>().total).toBe(3);

    const duplicate = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: { ...payload, email: 'OWNER@example.com' },
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json<ApiError>().code).toBe('EMAIL_EXISTS');
  });
});
