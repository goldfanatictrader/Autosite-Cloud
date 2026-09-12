import type { Pool, PoolClient, QueryResultRow } from 'pg';

import {
  createDatabasePool,
  DEFAULT_DATABASE_URL,
} from '../src/db/client.js';
import { hashPassword } from '../src/shared/password.js';
import {
  DEFAULT_PAGE_SLUGS,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  DEMO_USER_CREATED_AT,
  DEMO_USER_ID,
  DEMO_WORKSPACE_ID,
  SAMPLE_SITE_DEFINITIONS,
  seedContent,
  slugify,
} from '../src/store/seed-data.js';

interface IdRow extends QueryResultRow {
  id: string;
}

const rollback = async (client: PoolClient): Promise<void> => {
  try {
    await client.query('ROLLBACK');
  } catch {
    // Preserve the seed failure that caused the rollback.
  }
};

const seedTemplates = async (
  client: PoolClient,
): Promise<Map<string, string>> => {
  const templateIds = new Map<string, string>();

  for (const definition of SAMPLE_SITE_DEFINITIONS) {
    const category = definition.templateId.replace(/^tmpl-/, '');
    const result = await client.query<IdRow>(
      `
        INSERT INTO templates (
          id,
          name,
          slug,
          category,
          content_structure,
          created_at
        )
        VALUES ($1, $2, $3, $4, '{}'::jsonb, $5)
        ON CONFLICT (slug) DO UPDATE
        SET slug = EXCLUDED.slug
        RETURNING id
      `,
      [
        definition.templateUuid,
        `${definition.name} Template`,
        definition.templateId,
        category,
        DEMO_USER_CREATED_AT,
      ],
    );
    const template = result.rows[0];
    if (template === undefined) {
      throw new Error(`Could not seed template ${definition.templateId}`);
    }
    templateIds.set(definition.templateId, template.id);
  }

  return templateIds;
};

export const seedDatabase = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('autosite_demo_seed'))",
    );
    const templateIds = await seedTemplates(client);
    const passwordHash = hashPassword(DEMO_PASSWORD);

    await client.query(
      `
        INSERT INTO users (
          id,
          email,
          name,
          auth_provider,
          password_hash,
          email_verified,
          plan,
          created_at,
          updated_at
        )
        VALUES ($1, $2, 'Demo User', 'email', $3, true, 'free', $4, $4)
        ON CONFLICT (id) DO NOTHING
      `,
      [DEMO_USER_ID, DEMO_EMAIL, passwordHash, DEMO_USER_CREATED_AT],
    );

    await client.query(
      `
        INSERT INTO workspaces (id, owner_id, name, slug, plan, created_at)
        VALUES ($1, $2, 'Demo Workspace', 'demo-workspace', 'free', $3)
        ON CONFLICT (id) DO NOTHING
      `,
      [DEMO_WORKSPACE_ID, DEMO_USER_ID, DEMO_USER_CREATED_AT],
    );

    for (const definition of SAMPLE_SITE_DEFINITIONS) {
      const templateId = templateIds.get(definition.templateId);
      if (templateId === undefined) {
        throw new Error(`Missing template ${definition.templateId}`);
      }
      const settings = {
        meta_title: `${definition.name} — Official Site`,
        meta_description: `Discover ${definition.name}, services, story, and contact details.`,
      };
      await client.query(
        `
          INSERT INTO sites (
            id,
            workspace_id,
            name,
            slug,
            description,
            status,
            template_id,
            custom_domain,
            published_at,
            tone,
            language,
            settings,
            deleted_at,
            restore_before,
            created_at,
            updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, 'professional', 'en',
            $10::jsonb, NULL, NULL, $11, $12
          )
          ON CONFLICT (id) DO NOTHING
        `,
        [
          definition.id,
          DEMO_WORKSPACE_ID,
          definition.name,
          slugify(definition.name),
          `${definition.name} sample site`,
          definition.status,
          templateId,
          definition.customDomain,
          definition.publishedAt,
          JSON.stringify(settings),
          definition.createdAt,
          definition.updatedAt,
        ],
      );

      const pages = seedContent(definition.name);
      for (const pageSlug of DEFAULT_PAGE_SLUGS) {
        await client.query(
          `
            INSERT INTO site_content (
              site_id,
              page_slug,
              content_json,
              ai_generated,
              version,
              created_at,
              updated_at
            )
            VALUES ($1, $2, $3::jsonb, false, 1, $4, $4)
            ON CONFLICT (site_id, page_slug) DO NOTHING
          `,
          [
            definition.id,
            pageSlug,
            JSON.stringify(pages[pageSlug]),
            definition.updatedAt,
          ],
        );
      }

      await client.query(
        `
          INSERT INTO site_versions (
            site_id,
            content_snapshot,
            version_number,
            created_at
          )
          VALUES ($1, $2::jsonb, 1, $3)
          ON CONFLICT (site_id, version_number) DO NOTHING
        `,
        [definition.id, JSON.stringify(pages), definition.updatedAt],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await rollback(client);
    throw error;
  } finally {
    client.release();
  }
};

const databaseUrl = process.env['DATABASE_URL'] ?? DEFAULT_DATABASE_URL;
const pool = createDatabasePool(databaseUrl, { connectionTimeoutMillis: 5_000 });

try {
  await seedDatabase(pool);
  console.log('Seeded the demo account and three sample sites.');
} finally {
  await pool.end();
}
