import type {
  GenerateContentRequest,
  RewriteRequest,
  SuggestRequest,
} from '@autosite/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate } from '../../shared/authenticate.js';
import { HttpError } from '../../shared/errors.js';
import { validate } from '../../shared/validation.js';
import type { InMemoryStore } from '../../store/memory-store.js';
import { createAiProvider, type AiProvider } from './provider.js';

const PAGE_SLUGS = ['home', 'about', 'services', 'contact'] as const;
const TONES = [
  'professional',
  'friendly',
  'luxury',
  'casual',
  'bold',
  'formal',
  'playful',
  'minimal',
] as const;
const LANGUAGES = [
  'en',
  'es',
  'fr',
  'de',
  'pt',
  'it',
  'ja',
  'ko',
  'zh',
  'nl',
] as const;

const generateContentSchema = z
  .object({
    site_id: z.string().uuid(),
    brief: z
      .string()
      .trim()
      .min(10, 'Brief must be at least 10 characters')
      .max(300, 'Brief must be at most 300 characters'),
    tone: z.enum(TONES).default('professional'),
    language: z.enum(LANGUAGES).default('en'),
    pages: z
      .array(z.enum(PAGE_SLUGS))
      .min(1, 'Select at least one page')
      .max(4)
      .refine((pages) => new Set(pages).size === pages.length, {
        message: 'Page names must be unique',
      })
      .default([...PAGE_SLUGS]),
  })
  .strict();

const rewriteSchema = z
  .object({
    text: z.string().trim().min(1, 'Text is required').max(5_000),
    instruction: z
      .string()
      .trim()
      .min(3, 'Instruction must be at least 3 characters')
      .max(500),
    tone: z.enum(TONES),
  })
  .strict();

const suggestSchema = z
  .object({
    context: z
      .string()
      .trim()
      .min(3, 'Context must be at least 3 characters')
      .max(500),
    section_type: z.enum(['hero', 'features', 'services', 'contact']),
  })
  .strict();

export const registerAiRoutes = (
  app: FastifyInstance,
  store: InMemoryStore,
  provider: AiProvider = createAiProvider(),
): void => {
  app.post(
    '/api/ai/generate-content',
    { preHandler: authenticate },
    async (request, reply) => {
      const body: GenerateContentRequest = validate(
        generateContentSchema,
        request.body,
      );
      if (store.getSite(request.user.workspace_id, body.site_id) === undefined) {
        throw new HttpError(404, 'Site does not exist', 'SITE_NOT_FOUND', {
          site_id: body.site_id,
        });
      }

      const generated = await provider.generateContent(body);
      const updatedSite = store.updateSite(
        request.user.workspace_id,
        body.site_id,
        {
          brief: body.brief,
          tone: body.tone,
          language: body.language,
        },
      );
      if (updatedSite === undefined) {
        throw new HttpError(404, 'Site does not exist', 'SITE_NOT_FOUND', {
          site_id: body.site_id,
        });
      }

      const savedContent = store.saveGeneratedContent(
        request.user.workspace_id,
        body.site_id,
        generated.pages,
      );
      if (savedContent === undefined) {
        throw new HttpError(404, 'Site does not exist', 'SITE_NOT_FOUND', {
          site_id: body.site_id,
        });
      }
      return reply.send(generated);
    },
  );

  app.post(
    '/api/ai/rewrite',
    { preHandler: authenticate },
    async (request, reply) => {
      const body: RewriteRequest = validate(rewriteSchema, request.body);
      return reply.send(await provider.rewrite(body));
    },
  );

  app.post(
    '/api/ai/suggest',
    { preHandler: authenticate },
    async (request, reply) => {
      const body: SuggestRequest = validate(suggestSchema, request.body);
      return reply.send(await provider.suggest(body));
    },
  );
};
