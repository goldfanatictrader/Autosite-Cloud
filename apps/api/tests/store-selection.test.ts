import { describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import { selectStore } from '../src/store/create-store.js';
import { DEMO_EMAIL } from '../src/store/memory-store.js';

describe('persistence store selection', () => {
  it('falls back to the seeded in-memory store when PostgreSQL is unreachable', async () => {
    const selection = await selectStore({
      databaseUrl: 'postgres://autosite:autosite@127.0.0.1:1/autosite',
    });

    try {
      expect(selection.backend).toBe('memory');
      expect(await selection.store.findUserByEmail(DEMO_EMAIL)).toBeDefined();
    } finally {
      await selection.store.close();
    }
  });

  it('keeps duplicate signup atomic in the in-memory fallback', async () => {
    const app = await buildApp({
      jwtSecret: 'test-secret-that-is-long-enough-for-the-test-suite',
    });
    const payload = {
      email: 'concurrent-owner@example.com',
      name: 'Concurrent Owner',
      password: 'SafePassword123!',
    };

    try {
      const responses = await Promise.all([
        app.inject({ method: 'POST', url: '/auth/signup', payload }),
        app.inject({ method: 'POST', url: '/auth/signup', payload }),
      ]);
      expect(responses.map((response) => response.statusCode).sort()).toEqual([
        201, 409,
      ]);
      const conflict = responses.find((response) => response.statusCode === 409);
      expect(conflict?.json()).toMatchObject({ code: 'EMAIL_EXISTS' });
    } finally {
      await app.close();
    }
  });
});
