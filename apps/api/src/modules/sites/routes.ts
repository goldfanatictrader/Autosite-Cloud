import type {
  CreateSiteResponse,
  DeleteSiteResponse,
  PageContent,
  Site,
  SiteContentPage,
  SiteContentResponse,
  SiteResponse,
  SitesResponse,
  UpdateSiteContentResponse,
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

const updateSiteSchema = z
  .object({
    name: z.string().trim().min(1, 'Site name is required').max(255).optional(),
    brief: z
      .string()
      .trim()
      .min(10, 'Brief must be at least 10 characters')
      .max(300, 'Brief must be at most 300 characters')
      .nullable()
      .optional(),
    tone: z
      .enum([
        'professional',
        'friendly',
        'luxury',
        'casual',
        'bold',
        'formal',
        'playful',
        'minimal',
      ])
      .optional(),
    language: z
      .enum(['en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh', 'nl'])
      .optional(),
    status: z.enum(SITE_STATUSES).optional(),
    settings: z
      .object({
        favicon_url: z.string().trim().url().max(2048).optional(),
        meta_title: z.string().trim().min(1).max(255).optional(),
        meta_description: z.string().trim().min(1).max(500).optional(),
      })
      .strict()
      .refine((settings) => Object.keys(settings).length > 0, {
        message: 'Provide at least one setting',
      })
      .optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'Provide at least one site field to update',
  });

const contentParamsSchema = z
  .object({
    id: z.string().uuid(),
    page: z.enum(DEFAULT_PAGES),
  })
  .strict();

const contentItemSchema = z
  .object({
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().min(1).max(5000),
  })
  .strict();

const heroSectionSchema = z
  .object({
    type: z.literal('hero'),
    heading: z.string().trim().min(1).max(255),
    subheading: z.string().trim().min(1).max(5000),
    cta_text: z.string().trim().min(1).max(255).optional(),
    background_image: z.string().trim().url().max(2048).optional(),
  })
  .strict();

const itemSectionFields = {
  heading: z.string().trim().min(1).max(255).optional(),
  items: z.array(contentItemSchema).min(1).max(20),
};

const featuresSectionSchema = z
  .object({ type: z.literal('features'), ...itemSectionFields })
  .strict();

const servicesSectionSchema = z
  .object({ type: z.literal('services'), ...itemSectionFields })
  .strict();

const contactSectionSchema = z
  .object({
    type: z.literal('contact'),
    heading: z.string().trim().min(1).max(255),
    subheading: z.string().trim().min(1).max(5000).optional(),
    address: z.string().trim().min(1).max(1000),
    phone: z.string().trim().min(1).max(100),
    hours: z.string().trim().min(1).max(1000),
    cta_text: z.string().trim().min(1).max(255).optional(),
  })
  .strict();

const updateContentSchema = z
  .object({
    content_json: z
      .object({
        sections: z
          .array(
            z.discriminatedUnion('type', [
              heroSectionSchema,
              featuresSectionSchema,
              servicesSectionSchema,
              contactSectionSchema,
            ]),
          )
          .min(1, 'Content must include at least one section')
          .max(20),
      })
      .strict(),
  })
  .strict();

const toSite = (record: SiteRecord, detailed = false): Site => ({
  id: record.id,
  name: record.name,
  brief: record.brief,
  tone: record.tone,
  language: record.language,
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

  app.put(
    '/api/sites/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      const params = validate(siteParamsSchema, request.params);
      const body = validate(updateSiteSchema, request.body);
      const site = store.updateSite(
        request.user.workspace_id,
        params.id,
        {
          ...(body.name === undefined ? {} : { name: body.name }),
          ...(body.brief === undefined ? {} : { brief: body.brief }),
          ...(body.tone === undefined ? {} : { tone: body.tone }),
          ...(body.language === undefined ? {} : { language: body.language }),
          ...(body.status === undefined ? {} : { status: body.status }),
          ...(body.settings === undefined
            ? {}
            : {
                settings: {
                  ...(body.settings.favicon_url === undefined
                    ? {}
                    : { favicon_url: body.settings.favicon_url }),
                  ...(body.settings.meta_title === undefined
                    ? {}
                    : { meta_title: body.settings.meta_title }),
                  ...(body.settings.meta_description === undefined
                    ? {}
                    : { meta_description: body.settings.meta_description }),
                },
              }),
        },
      );
      if (site === undefined) {
        throw new HttpError(404, 'Site does not exist', 'SITE_NOT_FOUND', {
          site_id: params.id,
        });
      }

      const response: SiteResponse = { site: toSite(site, true) };
      return reply.send(response);
    },
  );

  app.delete(
    '/api/sites/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      const params = validate(siteParamsSchema, request.params);
      const deleted = store.deleteSite(request.user.workspace_id, params.id);
      if (deleted === undefined) {
        throw new HttpError(404, 'Site does not exist', 'SITE_NOT_FOUND', {
          site_id: params.id,
        });
      }

      const response: DeleteSiteResponse = {
        message: 'Site moved to trash',
        deleted_at: deleted.deletedAt,
        restore_before: deleted.restoreBefore,
      };
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

  app.get(
    '/api/sites/:id/content/:page',
    { preHandler: authenticate },
    async (request, reply) => {
      const params = validate(contentParamsSchema, request.params);
      requireSite(store, request.user.workspace_id, params.id);
      const content = store.getContent(
        request.user.workspace_id,
        params.id,
        params.page,
      );
      if (content === undefined) {
        throw new HttpError(
          404,
          'Page content does not exist',
          'CONTENT_NOT_FOUND',
          { site_id: params.id, page: params.page },
        );
      }

      const response: SiteContentPage = toContentPage(content);
      return reply.send(response);
    },
  );

  app.put(
    '/api/sites/:id/content/:page',
    { preHandler: authenticate },
    async (request, reply) => {
      const params = validate(contentParamsSchema, request.params);
      const body = validate(updateContentSchema, request.body);
      requireSite(store, request.user.workspace_id, params.id);
      const content = store.saveContent(
        request.user.workspace_id,
        params.id,
        params.page,
        body.content_json as PageContent,
      );
      if (content === undefined) {
        throw new HttpError(404, 'Site does not exist', 'SITE_NOT_FOUND', {
          site_id: params.id,
        });
      }

      const response: UpdateSiteContentResponse = {
        page_slug: content.pageSlug,
        version: content.version,
        updated_at: content.updatedAt,
      };
      return reply.send(response);
    },
  );
};
