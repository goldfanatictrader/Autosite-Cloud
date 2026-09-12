import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it } from 'vitest';

import { createDatabasePool } from '../src/db/client.js';
import { verifyPassword } from '../src/shared/password.js';
import { selectStore } from '../src/store/create-store.js';
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
} from '../src/store/memory-store.js';
import { PostgresStore } from '../src/store/pg-store.js';

const configuredDatabaseUrl = process.env['DATABASE_URL'];
const describeWithPostgres =
  configuredDatabaseUrl === undefined ? describe.skip : describe;
const testEmail = `pg-store-${randomUUID()}@example.com`;
const maxLengthName = 'N'.repeat(255);
let testUserId: string | undefined;
let testWorkspaceId: string | undefined;

const databaseUrl = (): string => {
  if (configuredDatabaseUrl === undefined) {
    throw new Error('DATABASE_URL is required for PostgreSQL integration tests');
  }
  return configuredDatabaseUrl;
};

describeWithPostgres('PostgresStore integration', () => {
  afterAll(async () => {
    if (testUserId === undefined || testWorkspaceId === undefined) {
      return;
    }
    const pool = createDatabasePool(databaseUrl());
    try {
      await pool.query(
        `
          DELETE FROM site_versions
          WHERE site_id IN (SELECT id FROM sites WHERE workspace_id = $1)
        `,
        [testWorkspaceId],
      );
      await pool.query(
        `
          DELETE FROM site_content
          WHERE site_id IN (SELECT id FROM sites WHERE workspace_id = $1)
        `,
        [testWorkspaceId],
      );
      await pool.query('DELETE FROM sites WHERE workspace_id = $1', [
        testWorkspaceId,
      ]);
      await pool.query('DELETE FROM workspaces WHERE id = $1', [
        testWorkspaceId,
      ]);
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    } finally {
      await pool.end();
    }
  });

  it('selects PostgreSQL when DATABASE_URL is connectable', async () => {
    const selection = await selectStore({ databaseUrl: databaseUrl() });
    try {
      expect(selection.backend).toBe('postgres');
      expect(await selection.store.findUserByEmail(DEMO_EMAIL)).toBeDefined();
    } finally {
      await selection.store.close();
    }
  });

  it('loads the seeded demo account and sample sites', async () => {
    const store = new PostgresStore(createDatabasePool(databaseUrl()));
    try {
      const user = await store.findUserByEmail(DEMO_EMAIL.toUpperCase());
      expect(user).toMatchObject({
        id: '10000000-0000-4000-8000-000000000001',
        workspaceId: '20000000-0000-4000-8000-000000000001',
        email: DEMO_EMAIL,
        name: 'Demo User',
      });
      expect(
        user === undefined
          ? false
          : verifyPassword(DEMO_PASSWORD, user.passwordHash),
      ).toBe(true);

      const sites = await store.listSites(
        '20000000-0000-4000-8000-000000000001',
      );
      expect(sites.map((site) => [site.name, site.status])).toEqual([
        ['Greenway Wellness', 'building'],
        ['Northstar Studio', 'draft'],
        ['Harbor & Hearth', 'live'],
      ]);
      expect(sites[2]?.templateId).toBe('tmpl-hospitality');
      const content = await store.listContent(
        '20000000-0000-4000-8000-000000000001',
        '30000000-0000-4000-8000-000000000001',
      );
      expect(content?.map((page) => page.pageSlug)).toEqual([
        'home',
        'about',
        'services',
        'contact',
      ]);
    } finally {
      await store.close();
    }
  });

  it('persists site and content mutations across store restarts', async () => {
    const firstPool = createDatabasePool(databaseUrl());
    const firstStore = new PostgresStore(
      firstPool,
      () => new Date('2026-09-12T12:00:00.000Z'),
    );
    const { user, site } = await (async () => {
      try {
        const createdUser = await firstStore.createUser({
          email: testEmail,
          name: maxLengthName,
          password: 'SafePassword123!',
          seedSites: false,
        });
        testUserId = createdUser.id;
        testWorkspaceId = createdUser.workspaceId;
        const createdSite = await firstStore.createSite({
          workspaceId: createdUser.workspaceId,
          name: 'Persistent Café',
          templateId: 'default',
        });
        const firstVersion = await firstStore.saveContent(
          createdUser.workspaceId,
          createdSite.id,
          'home',
          {
            sections: [
              {
                type: 'hero',
                heading: 'Persistent Café',
                subheading: 'Saved in PostgreSQL.',
              },
            ],
          },
        );
        expect(firstVersion?.version).toBe(1);
        return { user: createdUser, site: createdSite };
      } finally {
        await firstStore.close();
      }
    })();

    const secondPool = createDatabasePool(databaseUrl());
    const secondStore = new PostgresStore(
      secondPool,
      () => new Date('2026-09-12T13:00:00.000Z'),
    );
    try {
      const reloadedUser = await secondStore.findUserByEmail(testEmail);
      const reloadedSite = await secondStore.getSite(user.workspaceId, site.id);
      const reloadedContent = await secondStore.getContent(
        user.workspaceId,
        site.id,
        'home',
      );
      expect(reloadedUser?.id).toBe(user.id);
      expect(reloadedUser?.name).toBe(maxLengthName);
      expect(reloadedSite).toMatchObject({
        id: site.id,
        name: 'Persistent Café',
        slug: 'persistent-cafe',
        templateId: 'default',
      });
      expect(reloadedContent).toMatchObject({
        version: 1,
        aiGenerated: false,
        content: {
          sections: [{ type: 'hero', heading: 'Persistent Café' }],
        },
      });

      const generated = await secondStore.saveGeneratedContent(
        user.workspaceId,
        site.id,
        {
          home: {
            sections: [
              {
                type: 'hero',
                heading: 'Generated Persistent Café',
                subheading: 'Still saved in PostgreSQL.',
              },
            ],
          },
          contact: {
            sections: [
              {
                type: 'contact',
                heading: 'Visit us',
                address: '1 Database Lane',
                phone: '+1 555 0100',
                hours: 'Daily',
              },
            ],
          },
        },
      );
      expect(generated?.map((page) => [page.pageSlug, page.version])).toEqual([
        ['home', 2],
        ['contact', 1],
      ]);

      const snapshotCount = await secondPool.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM site_versions WHERE site_id = $1',
        [site.id],
      );
      expect(snapshotCount.rows[0]?.count).toBe('2');

      const deleted = await secondStore.deleteSite(user.workspaceId, site.id);
      expect(deleted).toEqual({
        deletedAt: '2026-09-12T13:00:00.000Z',
        restoreBefore: '2026-10-12T13:00:00.000Z',
      });
      expect(await secondStore.getSite(user.workspaceId, site.id)).toBeUndefined();
    } finally {
      await secondStore.close();
    }
  });
});
