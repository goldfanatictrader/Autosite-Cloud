import type {
  AiProviderName,
  ApiError,
  AuthResponse,
  GenerateContentResponse,
  RewriteResponse,
  SiteResponse,
  SuggestResponse,
} from '@autosite/shared';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import {
  type AiFetcher,
  type AiProvider,
  createAiProvider,
} from '../src/modules/ai/provider.js';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../src/store/memory-store.js';

const EXISTING_SITE_ID = '30000000-0000-4000-8000-000000000001';
const MISSING_SITE_ID = '40000000-0000-4000-8000-000000000099';

describe('Phase 1 AI routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({
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

  it.each([
    {
      path: '/api/ai/generate-content',
      payload: {
        site_id: EXISTING_SITE_ID,
        brief: 'Neighborhood bakery with fresh bread every morning',
        tone: 'friendly',
        language: 'en',
        pages: ['home'],
      },
    },
    {
      path: '/api/ai/rewrite',
      payload: {
        text: 'We bake bread every morning.',
        instruction: 'make it warmer',
        tone: 'friendly',
      },
    },
    {
      path: '/api/ai/suggest',
      payload: { context: 'neighborhood bakery', section_type: 'hero' },
    },
  ])('requires authentication for $path', async ({ path, payload }) => {
    const response = await app.inject({ method: 'POST', url: path, payload });

    expect(response.statusCode).toBe(401);
    expect(response.json<ApiError>().code).toBe('INVALID_TOKEN');
  });

  it('rewrites copy with the deterministic provider when no key is configured', async () => {
    const token = await login();
    const response = await app.inject({
      method: 'POST',
      url: '/api/ai/rewrite',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        text: 'We make thoughtful websites for independent neighborhood shops.',
        instruction: 'make it shorter and more professional',
        tone: 'professional',
      },
    });
    const body = response.json<RewriteResponse>();

    expect(response.statusCode).toBe(200);
    expect(Object.keys(body).sort()).toEqual(['rewritten', 'tokens_used']);
    expect(body.rewritten).toContain('With clarity and confidence');
    expect(body.tokens_used).toBeGreaterThan(0);
  });

  it('generates content and records the brief, tone, and language on the site', async () => {
    const token = await login();
    const authorization = { authorization: `Bearer ${token}` };
    const response = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-content',
      headers: authorization,
      payload: {
        site_id: EXISTING_SITE_ID,
        brief: 'Neighborhood bakery with fresh bread every morning',
        tone: 'friendly',
        language: 'fr',
        pages: ['home'],
      },
    });
    const body = response.json<GenerateContentResponse>();

    expect(response.statusCode).toBe(200);
    expect(body.pages.home?.sections).toHaveLength(2);

    const siteResponse = await app.inject({
      method: 'GET',
      url: `/api/sites/${EXISTING_SITE_ID}`,
      headers: authorization,
    });
    expect(siteResponse.json<SiteResponse>().site).toMatchObject({
      brief: 'Neighborhood bakery with fresh bread every morning',
      tone: 'friendly',
      language: 'fr',
    });
  });

  it('returns three API-SPEC suggestions with the deterministic provider', async () => {
    const token = await login();
    const response = await app.inject({
      method: 'POST',
      url: '/api/ai/suggest',
      headers: { authorization: `Bearer ${token}` },
      payload: { context: 'restaurant homepage', section_type: 'hero' },
    });
    const body = response.json<SuggestResponse>();

    expect(response.statusCode).toBe(200);
    expect(Object.keys(body)).toEqual(['suggestions']);
    expect(body.suggestions).toHaveLength(3);
    expect(body.suggestions[0]).toEqual({
      heading: expect.any(String),
      subheading: expect.any(String),
      cta_text: expect.any(String),
    });
  });

  it.each([
    {
      path: '/api/ai/generate-content',
      payload: {
        site_id: EXISTING_SITE_ID,
        brief: 'short',
        tone: 'friendly',
        language: 'en',
        pages: ['home'],
      },
      field: 'brief',
    },
    {
      path: '/api/ai/rewrite',
      payload: { text: '', instruction: 'shorten it', tone: 'professional' },
      field: 'text',
    },
    {
      path: '/api/ai/suggest',
      payload: { context: 'restaurant', section_type: 'unknown' },
      field: 'section_type',
    },
  ])('validates $path requests', async ({ path, payload, field }) => {
    const token = await login();
    const response = await app.inject({
      method: 'POST',
      url: path,
      headers: { authorization: `Bearer ${token}` },
      payload,
    });
    const body = response.json<ApiError>();

    expect(response.statusCode).toBe(422);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details).toHaveProperty(field);
  });

  it('returns 404 before generating content for an unknown site', async () => {
    const token = await login();
    const response = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-content',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        site_id: MISSING_SITE_ID,
        brief: 'Neighborhood bakery with fresh bread every morning',
        tone: 'friendly',
        language: 'en',
        pages: ['home'],
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json<ApiError>()).toEqual({
      error: 'Site does not exist',
      code: 'SITE_NOT_FOUND',
      details: { site_id: MISSING_SITE_ID },
    });
  });

  it('returns 404 when a site is deleted while upstream generation is pending', async () => {
    let signalProviderEntered: () => void = () => undefined;
    const providerEntered = new Promise<void>((resolve) => {
      signalProviderEntered = resolve;
    });
    let releaseProvider: () => void = () => undefined;
    const providerReleased = new Promise<void>((resolve) => {
      releaseProvider = resolve;
    });
    const fallback = createAiProvider();
    const provider: AiProvider = {
      async generateContent(request) {
        signalProviderEntered();
        await providerReleased;
        return fallback.generateContent(request);
      },
      rewrite: (request) => fallback.rewrite(request),
      suggest: (request) => fallback.suggest(request),
    };
    await app.close();
    app = await buildApp({
      jwtSecret: 'test-secret-that-is-long-enough-for-the-test-suite',
      aiProvider: provider,
    });
    const token = await login();
    const authorization = { authorization: `Bearer ${token}` };

    const generating = app.inject({
      method: 'POST',
      url: '/api/ai/generate-content',
      headers: authorization,
      payload: {
        site_id: EXISTING_SITE_ID,
        brief: 'Neighborhood bakery with fresh bread every morning',
        tone: 'friendly',
        language: 'en',
        pages: ['home'],
      },
    });
    await providerEntered;
    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/sites/${EXISTING_SITE_ID}`,
      headers: authorization,
    });
    releaseProvider();
    const response = await generating;

    expect(deleted.statusCode).toBe(200);
    expect(response.statusCode).toBe(404);
    expect(response.json<ApiError>().code).toBe('SITE_NOT_FOUND');
  });

  it('returns an error envelope for a non-200 upstream response', async () => {
    const fetcher: AiFetcher = async () => new Response('', { status: 429 });
    await app.close();
    app = await buildApp({
      jwtSecret: 'test-secret-that-is-long-enough-for-the-test-suite',
      aiProviderOptions: { openAiApiKey: 'test-key', fetcher },
    });
    const token = await login();
    const response = await app.inject({
      method: 'POST',
      url: '/api/ai/rewrite',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        text: 'Original website copy.',
        instruction: 'make it warmer',
        tone: 'friendly',
      },
    });
    const body = response.json<ApiError>();

    expect(response.statusCode).toBe(502);
    expect(body).toEqual({
      error: 'AI provider request failed',
      code: 'AI_PROVIDER_ERROR',
      details: { provider: 'openai' satisfies AiProviderName, upstream_status: 429 },
    });
  });

  it('falls back with details when a successful upstream response is malformed', async () => {
    const fetcher: AiFetcher = async () =>
      new Response(JSON.stringify({ choices: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    await app.close();
    app = await buildApp({
      jwtSecret: 'test-secret-that-is-long-enough-for-the-test-suite',
      aiProviderOptions: { openAiApiKey: 'test-key', fetcher },
    });
    const token = await login();
    const response = await app.inject({
      method: 'POST',
      url: '/api/ai/generate-content',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        site_id: EXISTING_SITE_ID,
        brief: 'Neighborhood bakery with fresh bread every morning',
        tone: 'friendly',
        language: 'en',
        pages: ['home'],
      },
    });
    const body = response.json<GenerateContentResponse & { details?: unknown }>();

    expect(response.statusCode).toBe(200);
    expect(body.pages.home?.sections[0]).toMatchObject({
      type: 'hero',
      heading: 'Welcome to Neighborhood Bakery',
    });
    expect(body.details).toEqual({
      provider: 'openai',
      fallback: 'deterministic-mock',
      note: expect.stringContaining('malformed response'),
    });
  });
});
