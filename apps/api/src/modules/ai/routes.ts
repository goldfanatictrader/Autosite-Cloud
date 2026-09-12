import type { GenerateContentRequest } from '@autosite/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate } from '../../shared/authenticate.js';
import { HttpError } from '../../shared/errors.js';
import { validate } from '../../shared/validation.js';
import type { InMemoryStore } from '../../store/memory-store.js';
import { generateContent } from './generator.js';

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

export const registerAiRoutes = (
  app: FastifyInstance,
  store: InMemoryStore,
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

      const generated = generateContent(body);
      store.saveGeneratedContent(
        request.user.workspace_id,
        body.site_id,
        generated.pages,
      );
      return reply.send(generated);
    },
  );
};
