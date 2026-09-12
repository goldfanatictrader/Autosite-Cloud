import type {
  CreateSiteResponse,
  Site,
  SiteContentResponse,
  SiteResponse,
  SitesResponse,
} from '@autosite/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate } from '../../shared/authenticate.js';
import { HttpError } from '../../shared/errors.js';
import { validate } from '../../shared/validation.js';
import type {
  ContentRecord,
  InMemoryStore,
  SiteRecord,
} from '../../store/memory-store.js';

const SITE_STATUSES = ['draft', 'building', 'live', 'error'] as const;
const DEFAULT_PAGES = ['home', 'about', 'services', 'contact'] as const;

const listSitesQuerySchema = z
  .object({
    status: z.enum(SITE_STATUSES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(255).optional(),
  })
  .strict();

const createSiteSchema = z
  .object({
    name: z.string().trim().min(1, 'Site name is required').max(255),
    template_id: z.string().trim().min(1).max(255).optional(),
  })
  .strict();

const siteParamsSchema = z.object({ id: z.string().uuid() }).strict();

const toSite = (record: SiteRecord, detailed = false): Site => ({
  id: record.id,
  name: record.name,
  status: record.status,
  template_id: record.templateId,
  custom_domain: record.customDomain,
  created_at: record.createdAt,
  updated_at: record.updatedAt,
  published_at: record.publishedAt,
  ...(detailed
    ? {
        subdomain: record.subdomain,
        pages: [...DEFAULT_PAGES],
        settings: { ...record.settings },
      }
    : {}),
});

const toContentPage = (record: ContentRecord) => ({
  page_slug: record.pageSlug,
  content_json: record.content,
  version: record.version,
  updated_at: record.updatedAt,
});

const requireSite = (
  store: InMemoryStore,
  workspaceId: string,
  siteId: string,
): SiteRecord => {
  const site = store.getSite(workspaceId, siteId);
  if (site === undefined) {
    throw new HttpError(404, 'Site does not exist', 'SITE_NOT_FOUND', {
      site_id: siteId,
    });
  }
  return site;
};

export const registerSiteRoutes = (
  app: FastifyInstance,
  store: InMemoryStore,
): void => {
  app.get('/api/sites', { preHandler: authenticate }, async (request, reply) => {
    const query = validate(listSitesQuerySchema, request.query);
    const allSites = store.listSites(request.user.workspace_id, {
      ...(query.status === undefined ? {} : { status: query.status }),
      ...(query.search === undefined ? {} : { search: query.search }),
    });
    const offset = (query.page - 1) * query.limit;
    const response: SitesResponse = {
      sites: allSites.slice(offset, offset + query.limit).map((site) => toSite(site)),
      total: allSites.length,
      page: query.page,
      pages: Math.ceil(allSites.length / query.limit),
    };

    return reply.send(response);
  });

  app.post('/api/sites', { preHandler: authenticate }, async (request, reply) => {
    const body = validate(createSiteSchema, request.body);
    const site = store.createSite({
      workspaceId: request.user.workspace_id,
      name: body.name,
      templateId: body.template_id ?? null,
    });
    const response: CreateSiteResponse = {
      site: {
        ...toSite(site, true),
        pages: [...DEFAULT_PAGES],
      },
    };

    return reply.status(201).send(response);
  });

  app.get(
    '/api/sites/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      const params = validate(siteParamsSchema, request.params);
      const site = requireSite(
        store,
        request.user.workspace_id,
        params.id,
      );
      const response: SiteResponse = { site: toSite(site, true) };
      return reply.send(response);
    },
  );

  app.get(
    '/api/sites/:id/content',
    { preHandler: authenticate },
    async (request, reply) => {
      const params = validate(siteParamsSchema, request.params);
      requireSite(store, request.user.workspace_id, params.id);
      const content = store.listContent(request.user.workspace_id, params.id) ?? [];
      const response: SiteContentResponse = {
        pages: content.map(toContentPage),
      };
      return reply.send(response);
    },
  );
};
