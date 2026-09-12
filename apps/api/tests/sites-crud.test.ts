import type {
  ApiError,
  AuthResponse,
  CreateSiteResponse,
  DeleteSiteResponse,
  SiteContentPage,
  SiteResponse,
  SitesResponse,
  UpdateSiteContentResponse,
} from '@autosite/shared';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../src/store/memory-store.js';

const FIXED_NOW = new Date('2026-09-12T12:00:00.000Z');
const SITE_ID = '30000000-0000-4000-8000-000000000002';
const MISSING_SITE_ID = '40000000-0000-4000-8000-000000000099';

describe('site and page content CRUD', () => {
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

  it.each([
    { method: 'PUT' as const, url: `/api/sites/${SITE_ID}`, payload: { name: 'Updated' } },
    { method: 'DELETE' as const, url: `/api/sites/${SITE_ID}` },
    { method: 'GET' as const, url: `/api/sites/${SITE_ID}/content/home` },
    {
      method: 'PUT' as const,
      url: `/api/sites/${SITE_ID}/content/home`,
      payload: {
        content_json: {
          sections: [
            {
              type: 'hero',
              heading: 'Updated heading',
              subheading: 'Updated subheading',
            },
          ],
        },
      },
    },
  ])('requires authentication for $method $url', async ({ method, url, payload }) => {
    const response =
      payload === undefined
        ? await app.inject({ method, url })
        : await app.inject({ method, url, payload });

    expect(response.statusCode).toBe(401);
    expect(response.json<ApiError>().code).toBe('INVALID_TOKEN');
  });

  it('updates requested site fields and persists the result', async () => {
    const token = await login();
    const authorization = { authorization: `Bearer ${token}` };
    const response = await app.inject({
      method: 'PUT',
      url: `/api/sites/${SITE_ID}`,
      headers: authorization,
      payload: {
        name: '  Nouvelle Étoile Studio  ',
        brief: 'A multilingual studio for thoughtful neighborhood brands.',
        tone: 'luxury',
        language: 'fr',
        status: 'live',
        settings: {
          meta_title: 'Nouvelle Étoile — Studio créatif',
          meta_description: 'Identités de marque claires et mémorables.',
        },
      },
    });
    const body = response.json<SiteResponse>();

    expect(response.statusCode).toBe(200);
    expect(body.site).toMatchObject({
      id: SITE_ID,
      name: 'Nouvelle Étoile Studio',
      brief: 'A multilingual studio for thoughtful neighborhood brands.',
      tone: 'luxury',
      language: 'fr',
      status: 'live',
      published_at: FIXED_NOW.toISOString(),
      updated_at: FIXED_NOW.toISOString(),
      settings: {
        meta_title: 'Nouvelle Étoile — Studio créatif',
        meta_description: 'Identités de marque claires et mémorables.',
      },
    });

    const persisted = await app.inject({
      method: 'GET',
      url: `/api/sites/${SITE_ID}`,
      headers: authorization,
    });
    expect(persisted.json<SiteResponse>().site).toEqual(body.site);
  });

  it('rejects invalid and empty site updates', async () => {
    const token = await login();
    const authorization = { authorization: `Bearer ${token}` };
    const invalidStatus = await app.inject({
      method: 'PUT',
      url: `/api/sites/${SITE_ID}`,
      headers: authorization,
      payload: { status: 'archived' },
    });
    const empty = await app.inject({
      method: 'PUT',
      url: `/api/sites/${SITE_ID}`,
      headers: authorization,
      payload: {},
    });

    expect(invalidStatus.statusCode).toBe(422);
    expect(invalidStatus.json<ApiError>()).toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { status: expect.any(String) },
    });
    expect(empty.statusCode).toBe(422);
    expect(empty.json<ApiError>().code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when updating an inaccessible site', async () => {
    const token = await login();
    const response = await app.inject({
      method: 'PUT',
      url: `/api/sites/${MISSING_SITE_ID}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Missing Site' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json<ApiError>()).toEqual({
      error: 'Site does not exist',
      code: 'SITE_NOT_FOUND',
      details: { site_id: MISSING_SITE_ID },
    });
  });

  it('soft-deletes a site and makes its retained records inaccessible', async () => {
    const token = await login();
    const authorization = { authorization: `Bearer ${token}` };
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/sites/${SITE_ID}`,
      headers: authorization,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<DeleteSiteResponse>()).toEqual({
      message: 'Site moved to trash',
      deleted_at: '2026-09-12T12:00:00.000Z',
      restore_before: '2026-10-12T12:00:00.000Z',
    });

    const [site, content, sites] = await Promise.all([
      app.inject({
        method: 'GET',
        url: `/api/sites/${SITE_ID}`,
        headers: authorization,
      }),
      app.inject({
        method: 'GET',
        url: `/api/sites/${SITE_ID}/content/home`,
        headers: authorization,
      }),
      app.inject({ method: 'GET', url: '/api/sites', headers: authorization }),
    ]);
    expect(site.statusCode).toBe(404);
    expect(content.statusCode).toBe(404);
    expect(sites.json<SitesResponse>().sites).not.toContainEqual(
      expect.objectContaining({ id: SITE_ID }),
    );
  });

  it('validates delete path parameters and returns 404 for a missing site', async () => {
    const token = await login();
    const authorization = { authorization: `Bearer ${token}` };
    const invalid = await app.inject({
      method: 'DELETE',
      url: '/api/sites/not-a-uuid',
      headers: authorization,
    });
    const missing = await app.inject({
      method: 'DELETE',
      url: `/api/sites/${MISSING_SITE_ID}`,
      headers: authorization,
    });

    expect(invalid.statusCode).toBe(422);
    expect(invalid.json<ApiError>().code).toBe('VALIDATION_ERROR');
    expect(missing.statusCode).toBe(404);
    expect(missing.json<ApiError>().code).toBe('SITE_NOT_FOUND');
  });

  it('gets one page and reports validation and not-found errors', async () => {
    const token = await login();
    const authorization = { authorization: `Bearer ${token}` };
    const response = await app.inject({
      method: 'GET',
      url: `/api/sites/${SITE_ID}/content/home`,
      headers: authorization,
    });
    const invalid = await app.inject({
      method: 'GET',
      url: `/api/sites/${SITE_ID}/content/blog`,
      headers: authorization,
    });
    const missing = await app.inject({
      method: 'GET',
      url: `/api/sites/${MISSING_SITE_ID}/content/home`,
      headers: authorization,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<SiteContentPage>()).toMatchObject({
      page_slug: 'home',
      version: 1,
      content_json: { sections: expect.any(Array) },
    });
    expect(invalid.statusCode).toBe(422);
    expect(invalid.json<ApiError>().code).toBe('VALIDATION_ERROR');
    expect(missing.statusCode).toBe(404);
    expect(missing.json<ApiError>().code).toBe('SITE_NOT_FOUND');
  });

  it('returns 404 when a valid site has no saved page content', async () => {
    const token = await login();
    const authorization = { authorization: `Bearer ${token}` };
    const created = await app.inject({
      method: 'POST',
      url: '/api/sites',
      headers: authorization,
      payload: { name: 'Blank Project' },
    });
    const siteId = created.json<CreateSiteResponse>().site.id;
    const response = await app.inject({
      method: 'GET',
      url: `/api/sites/${siteId}/content/home`,
      headers: authorization,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json<ApiError>()).toEqual({
      error: 'Page content does not exist',
      code: 'CONTENT_NOT_FOUND',
      details: { site_id: siteId, page: 'home' },
    });
  });

  it('upserts page content, increments its version, and returns API-SPEC metadata', async () => {
    const token = await login();
    const authorization = { authorization: `Bearer ${token}` };
    const content = {
      sections: [
        {
          type: 'hero' as const,
          heading: '  Design that feels unmistakably yours  ',
          subheading: 'A clear identity for ambitious neighborhood brands.',
          cta_text: 'Start a Project',
        },
        {
          type: 'features' as const,
          heading: 'What clients value',
          items: [
            {
              title: 'Thoughtful strategy',
              description: 'Every creative decision starts with a clear purpose.',
            },
          ],
        },
      ],
    };
    const response = await app.inject({
      method: 'PUT',
      url: `/api/sites/${SITE_ID}/content/home`,
      headers: authorization,
      payload: { content_json: content },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<UpdateSiteContentResponse>()).toEqual({
      page_slug: 'home',
      version: 2,
      updated_at: FIXED_NOW.toISOString(),
    });

    const persisted = await app.inject({
      method: 'GET',
      url: `/api/sites/${SITE_ID}/content/home`,
      headers: authorization,
    });
    expect(persisted.json<SiteContentPage>()).toMatchObject({
      page_slug: 'home',
      version: 2,
      updated_at: FIXED_NOW.toISOString(),
      content_json: {
        sections: [
          { type: 'hero', heading: 'Design that feels unmistakably yours' },
          { type: 'features', heading: 'What clients value' },
        ],
      },
    });
  });

  it('creates the first version when page content does not exist', async () => {
    const token = await login();
    const authorization = { authorization: `Bearer ${token}` };
    const created = await app.inject({
      method: 'POST',
      url: '/api/sites',
      headers: authorization,
      payload: { name: 'Fresh Project' },
    });
    const siteId = created.json<CreateSiteResponse>().site.id;
    const response = await app.inject({
      method: 'PUT',
      url: `/api/sites/${siteId}/content/contact`,
      headers: authorization,
      payload: {
        content_json: {
          sections: [
            {
              type: 'contact',
              heading: 'Talk with us',
              address: '12 Market Street',
              phone: '+1 555 0100',
              hours: 'Monday–Friday, 9am–5pm',
            },
          ],
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<UpdateSiteContentResponse>().version).toBe(1);
  });

  it('rejects invalid page content and returns 404 for a missing site', async () => {
    const token = await login();
    const authorization = { authorization: `Bearer ${token}` };
    const invalid = await app.inject({
      method: 'PUT',
      url: `/api/sites/${SITE_ID}/content/home`,
      headers: authorization,
      payload: {
        content_json: {
          sections: [{ type: 'hero', heading: '', subheading: 'Copy' }],
        },
      },
    });
    const missing = await app.inject({
      method: 'PUT',
      url: `/api/sites/${MISSING_SITE_ID}/content/home`,
      headers: authorization,
      payload: {
        content_json: {
          sections: [
            { type: 'hero', heading: 'Heading', subheading: 'Subheading' },
          ],
        },
      },
    });

    expect(invalid.statusCode).toBe(422);
    expect(invalid.json<ApiError>()).toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { 'content_json.sections.0.heading': expect.any(String) },
    });
    expect(missing.statusCode).toBe(404);
    expect(missing.json<ApiError>().code).toBe('SITE_NOT_FOUND');
  });

  it('returns an error envelope when page content exceeds the request limit', async () => {
    const token = await login();
    const response = await app.inject({
      method: 'PUT',
      url: `/api/sites/${SITE_ID}/content/home`,
      headers: { authorization: `Bearer ${token}` },
      payload: {
        content_json: {
          sections: [
            {
              type: 'hero',
              heading: 'Oversized page',
              subheading: 'x'.repeat(1_100_000),
            },
          ],
        },
      },
    });

    expect(response.statusCode).toBe(413);
    expect(response.json<ApiError>()).toEqual({
      error: 'Request body is too large',
      code: 'PAYLOAD_TOO_LARGE',
      details: {},
    });
  });
});
