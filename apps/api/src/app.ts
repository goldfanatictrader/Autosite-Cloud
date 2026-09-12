import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';

import type { HealthResponse } from '@autosite/shared';

import {
  createAiProvider,
  type AiProvider,
  type AiProviderOptions,
} from './modules/ai/provider.js';
import { registerAiRoutes } from './modules/ai/routes.js';
import { registerAuthRoutes } from './modules/auth/routes.js';
import { registerSiteRoutes } from './modules/sites/routes.js';
import { InMemoryRateLimiter } from './middleware/rate-limit.js';
import { apiError, HttpError } from './shared/errors.js';
import { selectStore } from './store/create-store.js';
import { InMemoryStore } from './store/memory-store.js';
import type { Store } from './store/store.js';

export interface BuildAppOptions {
  databaseUrl?: string;
  jwtSecret?: string;
  logger?: FastifyServerOptions['logger'];
  store?: Store;
  webOrigin?: string;
  clock?: () => Date;
  aiProvider?: AiProvider;
  aiProviderOptions?: AiProviderOptions;
}

const hasErrorCode = (error: unknown, code: string): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === code;

export const buildApp = async (
  options: BuildAppOptions = {},
): Promise<FastifyInstance> => {
  const clock = options.clock ?? (() => new Date());
  const app = Fastify({ logger: options.logger ?? false });
  const selection =
    options.store === undefined && options.databaseUrl !== undefined
      ? await selectStore({
          databaseUrl: options.databaseUrl,
          clock,
          onPoolError: (code) => {
            app.log.error({ code }, 'PostgreSQL pool reported an idle error');
          },
        })
      : undefined;
  const store = options.store ?? selection?.store ?? new InMemoryStore(clock);
  const aiProvider =
    options.aiProvider ?? createAiProvider(options.aiProviderOptions);

  if (selection?.backend === 'postgres') {
    app.log.info('Using PostgreSQL persistence');
  } else if (selection?.backend === 'memory') {
    app.log.warn(
      { code: selection.fallbackCode },
      'PostgreSQL is unavailable; using in-memory persistence',
    );
  }

  app.addHook('onClose', async () => {
    await store.close();
  });

  new InMemoryRateLimiter(() => clock().getTime()).register(app);

  await app.register(cors, {
    origin: options.webOrigin ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 86_400,
  });
  await app.register(jwt, {
    secret:
      options.jwtSecret ??
      'autosite-local-development-secret-change-before-production',
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send(error.toResponse());
    }

    if (hasErrorCode(error, 'FST_ERR_CTP_INVALID_JSON_BODY')) {
      return reply
        .status(400)
        .send(apiError('Malformed JSON request body', 'MALFORMED_JSON'));
    }

    if (hasErrorCode(error, 'FST_ERR_CTP_BODY_TOO_LARGE')) {
      return reply
        .status(413)
        .send(apiError('Request body is too large', 'PAYLOAD_TOO_LARGE'));
    }

    request.log.error({ err: error }, 'Unhandled request error');
    return reply
      .status(500)
      .send(apiError('An unexpected error occurred', 'INTERNAL_ERROR'));
  });

  app.setNotFoundHandler((_request, reply) =>
    reply.status(404).send(apiError('Route does not exist', 'NOT_FOUND')),
  );

  app.get('/health', async (): Promise<HealthResponse> => ({
    status: 'ok',
    service: 'autosite-api',
    timestamp: clock().toISOString(),
  }));

  registerAuthRoutes(app, store);
  registerSiteRoutes(app, store);
  registerAiRoutes(app, store, aiProvider);

  return app;
};
