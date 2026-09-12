import type { FastifyInstance, FastifyRequest } from 'fastify';

import { apiError } from '../shared/errors.js';

type RateLimitCategory = 'auth' | 'ai' | 'general';

interface RateLimitRule {
  limit: number;
  windowMs: number;
  windowLabel: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RULES: Record<RateLimitCategory, RateLimitRule> = {
  auth: { limit: 5, windowMs: 60_000, windowLabel: '1m' },
  ai: { limit: 20, windowMs: 3_600_000, windowLabel: '1h' },
  general: { limit: 100, windowMs: 60_000, windowLabel: '1m' },
};

const categoryFor = (request: FastifyRequest): RateLimitCategory => {
  const path = request.url.split('?', 1)[0] ?? request.url;
  if (path.startsWith('/auth/')) {
    return 'auth';
  }
  if (path.startsWith('/api/ai/')) {
    return 'ai';
  }
  return 'general';
};

const identityFor = (request: FastifyRequest): string => {
  const authorization = request.headers.authorization;
  if (authorization !== undefined) {
    return authorization;
  }
  return request.ip;
};

export class InMemoryRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(private readonly now: () => number = Date.now) {}

  register(app: FastifyInstance): void {
    app.addHook('onRequest', async (request, reply) => {
      const category = categoryFor(request);
      const rule = RULES[category];
      const key = `${category}:${identityFor(request)}`;
      const now = this.now();
      const current = this.entries.get(key);
      const entry =
        current === undefined || current.resetAt <= now
          ? { count: 0, resetAt: now + rule.windowMs }
          : current;

      if (request.method !== 'OPTIONS') {
        entry.count += 1;
      }
      this.entries.set(key, entry);

      const remaining = Math.max(rule.limit - entry.count, 0);
      const resetSeconds = Math.ceil(entry.resetAt / 1_000);
      reply.headers({
        'X-RateLimit-Limit': rule.limit,
        'X-RateLimit-Remaining': remaining,
        'X-RateLimit-Reset': resetSeconds,
      });

      if (entry.count > rule.limit) {
        const retryAfter = Math.max(Math.ceil((entry.resetAt - now) / 1_000), 1);
        reply.header('Retry-After', retryAfter);
        await reply.status(429).send(
          apiError(
            `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
            'RATE_LIMITED',
            {
              limit: rule.limit,
              window: rule.windowLabel,
              retry_after: retryAfter,
            },
          ),
        );
      }
    });
  }
}
