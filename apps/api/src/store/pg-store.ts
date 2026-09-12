import type {
  Language,
  PageContent,
  PageSlug,
  SiteSettings,
  SiteStatus,
  Tone,
} from '@autosite/shared';
import type {
  Pool,
  PoolClient,
  QueryResultRow,
} from 'pg';

import { hasPostgresErrorCode } from '../db/client.js';
import { hashPassword } from '../shared/password.js';
import {
  DEFAULT_PAGE_SLUGS,
  SAMPLE_SITE_DEFINITIONS,
  seedContent,
  slugify,
} from './seed-data.js';
import {
  EmailAlreadyExistsError,
  type ContentRecord,
  type CreateSiteInput,
  type CreateUserInput,
  type DeletedSiteRecord,
  type SiteQuery,
  type SiteRecord,
  type Store,
  type UpdateSiteInput,
  type UserRecord,
} from './store.js';

interface UserRow extends QueryResultRow {
  id: string;
  workspace_id: string;
  email: string;
  name: string;
  password_hash: string | null;
  created_at: Date | string;
}

interface WorkspaceRow extends QueryResultRow {
  id: string;
}

interface TemplateRow extends QueryResultRow {
  id: string;
}

interface SiteRow extends QueryResultRow {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  tone: Tone;
  language: Language;
  status: SiteStatus;
  template_slug: string | null;
  custom_domain: string | null;
  settings: unknown;
  published_at: Date | string | null;
  deleted_at: Date | string | null;
  restore_before: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface ContentJoinRow extends QueryResultRow {
  site_id: string | null;
  page_slug: PageSlug | null;
  content_json: unknown;
  ai_generated: boolean | null;
  version: number | null;
  updated_at: Date | string | null;
}

interface ContentRow extends ContentJoinRow {
  site_id: string;
  page_slug: PageSlug;
  ai_generated: boolean;
  version: number;
  updated_at: Date | string;
}

interface SlugRow extends QueryResultRow {
  exists: number;
}

const SITE_COLUMNS = `
  s.id,
  s.workspace_id,
  s.name,
  s.slug,
  s.description,
  s.tone,
  s.language,
  s.status,
  t.slug AS template_slug,
  s.custom_domain,
  s.settings,
  s.published_at,
  s.deleted_at,
  s.restore_before,
  s.created_at,
  s.updated_at
`;

const SITE_SELECT = `
  SELECT ${SITE_COLUMNS}
  FROM sites AS s
  LEFT JOIN templates AS t ON t.id = s.template_id
`;

const toIsoString = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const toNullableIsoString = (value: Date | string | null): string | null =>
  value === null ? null : toIsoString(value);

const toSettings = (value: unknown): SiteSettings =>
  typeof value === 'object' && value !== null
    ? (value as SiteSettings)
    : {};

const toPageContent = (value: unknown): PageContent => value as PageContent;

const toUserRecord = (row: UserRow): UserRecord => ({
  id: row.id,
  workspaceId: row.workspace_id,
  email: row.email,
  name: row.name,
  passwordHash: row.password_hash ?? '',
  createdAt: toIsoString(row.created_at),
});

const toSiteRecord = (row: SiteRow): SiteRecord => ({
  id: row.id,
  workspaceId: row.workspace_id,
  name: row.name,
  slug: row.slug,
  brief: row.description,
  tone: row.tone,
  language: row.language,
  status: row.status,
  templateId: row.template_slug,
  customDomain: row.custom_domain,
  subdomain: `${row.slug}.autosite.cloud`,
  settings: toSettings(row.settings),
  publishedAt: toNullableIsoString(row.published_at),
  deletedAt: toNullableIsoString(row.deleted_at),
  restoreBefore: toNullableIsoString(row.restore_before),
  createdAt: toIsoString(row.created_at),
  updatedAt: toIsoString(row.updated_at),
});

const toContentRecord = (row: ContentRow): ContentRecord => ({
  siteId: row.site_id,
  pageSlug: row.page_slug,
  content: toPageContent(row.content_json),
  aiGenerated: row.ai_generated,
  version: row.version,
  updatedAt: toIsoString(row.updated_at),
});

const rollback = async (client: PoolClient): Promise<void> => {
  try {
    await client.query('ROLLBACK');
  } catch {
    // Preserve the original transaction error.
  }
};

const hasPostgresConstraint = (error: unknown, constraint: string): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'constraint' in error &&
  error.constraint === constraint;

export class PostgresStore implements Store {
  constructor(
    private readonly pool: Pool,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async findUserByEmail(email: string): Promise<UserRecord | undefined> {
    const result = await this.pool.query<UserRow>(
      `
        SELECT
          u.id,
          w.id AS workspace_id,
          u.email,
          u.name,
          u.password_hash,
          u.created_at
        FROM users AS u
        JOIN workspaces AS w ON w.owner_id = u.id
        WHERE u.email = $1
        ORDER BY w.created_at, w.id
        LIMIT 1
      `,
      [email.trim().toLowerCase()],
    );
    const row = result.rows[0];
    return row === undefined ? undefined : toUserRecord(row);
  }

  async findUserById(id: string): Promise<UserRecord | undefined> {
    const result = await this.pool.query<UserRow>(
      `
        SELECT
          u.id,
          w.id AS workspace_id,
          u.email,
          u.name,
          u.password_hash,
          u.created_at
        FROM users AS u
        JOIN workspaces AS w ON w.owner_id = u.id
        WHERE u.id = $1
        ORDER BY w.created_at, w.id
        LIMIT 1
      `,
      [id],
    );
    const row = result.rows[0];
    return row === undefined ? undefined : toUserRecord(row);
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const client = await this.pool.connect();
    const timestamp = this.clock().toISOString();
    const normalizedName = input.name.trim();

    try {
      await client.query('BEGIN');
      const userResult = await client.query<UserRow>(
        `
          INSERT INTO users (
            email,
            name,
            auth_provider,
            password_hash,
            created_at,
            updated_at
          )
          VALUES ($1, $2, 'email', $3, $4, $4)
          RETURNING
            id,
            ''::text AS workspace_id,
            email,
            name,
            password_hash,
            created_at
        `,
        [
          input.email.trim().toLowerCase(),
          normalizedName,
          hashPassword(input.password),
          timestamp,
        ],
      );
      const user = userResult.rows[0];
      if (user === undefined) {
        throw new Error('PostgreSQL did not return the created user');
      }

      const workspaceResult = await client.query<WorkspaceRow>(
        `
          INSERT INTO workspaces (owner_id, name, slug, created_at)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `,
        [
          user.id,
          normalizedName,
          `${slugify(normalizedName)}-${user.id}`,
          timestamp,
        ],
      );
      const workspace = workspaceResult.rows[0];
      if (workspace === undefined) {
        throw new Error('PostgreSQL did not return the created workspace');
      }

      if (input.seedSites ?? true) {
        await this.insertSampleSites(client, workspace.id);
      }

      await client.query('COMMIT');
      return toUserRecord({ ...user, workspace_id: workspace.id });
    } catch (error) {
      await rollback(client);
      if (
        hasPostgresErrorCode(error, '23505') &&
        hasPostgresConstraint(error, 'users_email_key')
      ) {
        throw new EmailAlreadyExistsError();
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async listSites(
    workspaceId: string,
    query: SiteQuery = {},
  ): Promise<SiteRecord[]> {
    const values: unknown[] = [workspaceId];
    const clauses = ['s.workspace_id = $1', 's.deleted_at IS NULL'];

    if (query.status !== undefined) {
      values.push(query.status);
      clauses.push(`s.status = $${values.length}`);
    }
    if (query.search !== undefined) {
      values.push(query.search.trim().toLowerCase());
      clauses.push(`position($${values.length} in lower(s.name)) > 0`);
    }

    const result = await this.pool.query<SiteRow>(
      `${SITE_SELECT}
       WHERE ${clauses.join(' AND ')}
       ORDER BY s.updated_at DESC, s.id ASC`,
      values,
    );
    return result.rows.map(toSiteRecord);
  }

  async getSite(
    workspaceId: string,
    siteId: string,
  ): Promise<SiteRecord | undefined> {
    return this.querySite(this.pool, workspaceId, siteId);
  }

  async createSite(input: CreateSiteInput): Promise<SiteRecord> {
    const client = await this.pool.connect();
    const timestamp = this.clock().toISOString();

    try {
      await client.query('BEGIN');
      const workspaceResult = await client.query<WorkspaceRow>(
        'SELECT id FROM workspaces WHERE id = $1 FOR UPDATE',
        [input.workspaceId],
      );
      if (workspaceResult.rows[0] === undefined) {
        throw new Error('Workspace does not exist');
      }

      const baseSlug = slugify(input.name);
      let slug = baseSlug;
      let suffix = 2;
      while (await this.slugExists(client, input.workspaceId, slug)) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }

      const templateId =
        input.templateId === null
          ? null
          : await this.ensureTemplate(client, input.templateId);
      const result = await client.query<WorkspaceRow>(
        `
          INSERT INTO sites (
            workspace_id,
            name,
            slug,
            description,
            tone,
            language,
            status,
            template_id,
            settings,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, 'professional', 'en', 'draft', $5, '{}'::jsonb, $6, $6)
          RETURNING id
        `,
        [
          input.workspaceId,
          input.name.trim(),
          slug,
          input.brief ?? null,
          templateId,
          timestamp,
        ],
      );
      const created = result.rows[0];
      if (created === undefined) {
        throw new Error('PostgreSQL did not return the created site');
      }

      const site = await this.querySite(client, input.workspaceId, created.id);
      if (site === undefined) {
        throw new Error('PostgreSQL could not reload the created site');
      }
      await client.query('COMMIT');
      return site;
    } catch (error) {
      await rollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateSite(
    workspaceId: string,
    siteId: string,
    input: UpdateSiteInput,
  ): Promise<SiteRecord | undefined> {
    const timestamp = this.clock().toISOString();
    const values: unknown[] = [workspaceId, siteId, timestamp];
    const assignments = ['updated_at = $3'];
    const addAssignment = (column: string, value: unknown): void => {
      values.push(value);
      assignments.push(`${column} = $${values.length}`);
    };

    if (input.name !== undefined) {
      addAssignment('name', input.name.trim());
    }
    if (input.brief !== undefined) {
      addAssignment('description', input.brief);
    }
    if (input.tone !== undefined) {
      addAssignment('tone', input.tone);
    }
    if (input.language !== undefined) {
      addAssignment('language', input.language);
    }
    if (input.status !== undefined) {
      addAssignment('status', input.status);
      if (input.status === 'live') {
        assignments.push('published_at = COALESCE(published_at, $3)');
      }
    }
    if (input.settings !== undefined) {
      values.push(JSON.stringify(input.settings));
      assignments.push(`settings = settings || $${values.length}::jsonb`);
    }

    const result = await this.pool.query<SiteRow>(
      `
        WITH updated AS (
          UPDATE sites
          SET ${assignments.join(', ')}
          WHERE workspace_id = $1 AND id = $2 AND deleted_at IS NULL
          RETURNING *
        )
        SELECT ${SITE_COLUMNS}
        FROM updated AS s
        LEFT JOIN templates AS t ON t.id = s.template_id
      `,
      values,
    );
    const row = result.rows[0];
    return row === undefined ? undefined : toSiteRecord(row);
  }

  async deleteSite(
    workspaceId: string,
    siteId: string,
  ): Promise<DeletedSiteRecord | undefined> {
    const deletedAt = this.clock();
    const restoreBefore = new Date(deletedAt);
    restoreBefore.setUTCDate(restoreBefore.getUTCDate() + 30);
    const result = await this.pool.query<SiteRow>(
      `
        UPDATE sites
        SET deleted_at = $3, restore_before = $4, updated_at = $3
        WHERE workspace_id = $1 AND id = $2 AND deleted_at IS NULL
        RETURNING
          id,
          workspace_id,
          name,
          slug,
          description,
          tone,
          language,
          status,
          NULL::text AS template_slug,
          custom_domain,
          settings,
          published_at,
          deleted_at,
          restore_before,
          created_at,
          updated_at
      `,
      [workspaceId, siteId, deletedAt.toISOString(), restoreBefore.toISOString()],
    );
    const row = result.rows[0];
    return row === undefined
      ? undefined
      : {
          deletedAt: toIsoString(row.deleted_at ?? deletedAt),
          restoreBefore: toIsoString(row.restore_before ?? restoreBefore),
        };
  }

  async listContent(
    workspaceId: string,
    siteId: string,
  ): Promise<ContentRecord[] | undefined> {
    const result = await this.pool.query<ContentJoinRow>(
      `
        SELECT
          c.site_id,
          c.page_slug,
          c.content_json,
          c.ai_generated,
          c.version,
          c.updated_at
        FROM sites AS s
        LEFT JOIN site_content AS c ON c.site_id = s.id
        WHERE s.workspace_id = $1 AND s.id = $2 AND s.deleted_at IS NULL
        ORDER BY CASE c.page_slug
          WHEN 'home' THEN 1
          WHEN 'about' THEN 2
          WHEN 'services' THEN 3
          WHEN 'contact' THEN 4
          ELSE 5
        END
      `,
      [workspaceId, siteId],
    );
    if (result.rows.length === 0) {
      return undefined;
    }
    return result.rows.flatMap((row) =>
      row.site_id === null ? [] : [toContentRecord(row as ContentRow)],
    );
  }

  async getContent(
    workspaceId: string,
    siteId: string,
    pageSlug: PageSlug,
  ): Promise<ContentRecord | undefined> {
    const result = await this.pool.query<ContentRow>(
      `
        SELECT
          c.site_id,
          c.page_slug,
          c.content_json,
          c.ai_generated,
          c.version,
          c.updated_at
        FROM site_content AS c
        JOIN sites AS s ON s.id = c.site_id
        WHERE
          s.workspace_id = $1
          AND s.id = $2
          AND s.deleted_at IS NULL
          AND c.page_slug = $3
      `,
      [workspaceId, siteId, pageSlug],
    );
    const row = result.rows[0];
    return row === undefined ? undefined : toContentRecord(row);
  }

  async saveContent(
    workspaceId: string,
    siteId: string,
    pageSlug: PageSlug,
    content: PageContent,
  ): Promise<ContentRecord | undefined> {
    const client = await this.pool.connect();
    const timestamp = this.clock().toISOString();

    try {
      await client.query('BEGIN');
      if (!(await this.lockActiveSite(client, workspaceId, siteId))) {
        await client.query('ROLLBACK');
        return undefined;
      }

      const result = await client.query<ContentRow>(
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
          ON CONFLICT (site_id, page_slug) DO UPDATE
          SET
            content_json = EXCLUDED.content_json,
            ai_generated = false,
            version = site_content.version + 1,
            updated_at = EXCLUDED.updated_at
          RETURNING site_id, page_slug, content_json, ai_generated, version, updated_at
        `,
        [siteId, pageSlug, JSON.stringify(content), timestamp],
      );
      const row = result.rows[0];
      if (row === undefined) {
        throw new Error('PostgreSQL did not return the saved content');
      }

      await client.query('UPDATE sites SET updated_at = $2 WHERE id = $1', [
        siteId,
        timestamp,
      ]);
      await this.insertSnapshot(client, siteId, timestamp);
      await client.query('COMMIT');
      return toContentRecord(row);
    } catch (error) {
      await rollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async saveGeneratedContent(
    workspaceId: string,
    siteId: string,
    pages: Partial<Record<PageSlug, PageContent>>,
  ): Promise<ContentRecord[] | undefined> {
    const client = await this.pool.connect();
    const timestamp = this.clock().toISOString();

    try {
      await client.query('BEGIN');
      if (!(await this.lockActiveSite(client, workspaceId, siteId))) {
        await client.query('ROLLBACK');
        return undefined;
      }

      const saved: ContentRecord[] = [];
      for (const pageSlug of DEFAULT_PAGE_SLUGS) {
        const content = pages[pageSlug];
        if (content === undefined) {
          continue;
        }
        const result = await client.query<ContentRow>(
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
            VALUES ($1, $2, $3::jsonb, true, 1, $4, $4)
            ON CONFLICT (site_id, page_slug) DO UPDATE
            SET
              content_json = EXCLUDED.content_json,
              ai_generated = true,
              version = site_content.version + 1,
              updated_at = EXCLUDED.updated_at
            RETURNING site_id, page_slug, content_json, ai_generated, version, updated_at
          `,
          [siteId, pageSlug, JSON.stringify(content), timestamp],
        );
        const row = result.rows[0];
        if (row === undefined) {
          throw new Error('PostgreSQL did not return generated content');
        }
        saved.push(toContentRecord(row));
      }

      await client.query('UPDATE sites SET updated_at = $2 WHERE id = $1', [
        siteId,
        timestamp,
      ]);
      await this.insertSnapshot(client, siteId, timestamp);
      await client.query('COMMIT');
      return saved;
    } catch (error) {
      await rollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async querySite(
    queryable: Pool | PoolClient,
    workspaceId: string,
    siteId: string,
  ): Promise<SiteRecord | undefined> {
    const result = await queryable.query<SiteRow>(
      `${SITE_SELECT}
       WHERE s.workspace_id = $1 AND s.id = $2 AND s.deleted_at IS NULL`,
      [workspaceId, siteId],
    );
    const row = result.rows[0];
    return row === undefined ? undefined : toSiteRecord(row);
  }

  private async slugExists(
    client: PoolClient,
    workspaceId: string,
    slug: string,
  ): Promise<boolean> {
    const result = await client.query<SlugRow>(
      `
        SELECT 1 AS exists
        FROM sites
        WHERE workspace_id = $1 AND slug = $2
        LIMIT 1
      `,
      [workspaceId, slug],
    );
    return result.rows[0] !== undefined;
  }

  private async ensureTemplate(
    client: PoolClient,
    templateSlug: string,
  ): Promise<string> {
    const result = await client.query<TemplateRow>(
      `
        INSERT INTO templates (name, slug, category, content_structure)
        VALUES ($1, $1, 'custom', '{}'::jsonb)
        ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
        RETURNING id
      `,
      [templateSlug],
    );
    const template = result.rows[0];
    if (template === undefined) {
      throw new Error('PostgreSQL did not return the template');
    }
    return template.id;
  }

  private async lockActiveSite(
    client: PoolClient,
    workspaceId: string,
    siteId: string,
  ): Promise<boolean> {
    const result = await client.query<WorkspaceRow>(
      `
        SELECT id
        FROM sites
        WHERE workspace_id = $1 AND id = $2 AND deleted_at IS NULL
        FOR UPDATE
      `,
      [workspaceId, siteId],
    );
    return result.rows[0] !== undefined;
  }

  private async insertSnapshot(
    client: PoolClient,
    siteId: string,
    timestamp: string,
  ): Promise<void> {
    await client.query(
      `
        INSERT INTO site_versions (
          site_id,
          content_snapshot,
          version_number,
          created_at
        )
        SELECT
          $1,
          COALESCE(jsonb_object_agg(page_slug, content_json), '{}'::jsonb),
          COALESCE(
            (SELECT MAX(version_number) FROM site_versions WHERE site_id = $1),
            0
          ) + 1,
          $2
        FROM site_content
        WHERE site_id = $1
      `,
      [siteId, timestamp],
    );
  }

  private async insertSampleSites(
    client: PoolClient,
    workspaceId: string,
  ): Promise<void> {
    for (const [index, definition] of SAMPLE_SITE_DEFINITIONS.entries()) {
      const templateId = await this.ensureTemplate(client, definition.templateId);
      const createdAt = this.clock().toISOString();
      const updatedAt = new Date(this.clock().getTime() + index).toISOString();
      const slug = slugify(definition.name);
      const siteResult = await client.query<WorkspaceRow>(
        `
          INSERT INTO sites (
            workspace_id,
            name,
            slug,
            description,
            tone,
            language,
            status,
            template_id,
            custom_domain,
            settings,
            published_at,
            created_at,
            updated_at
          )
          VALUES (
            $1, $2, $3, $4, 'professional', 'en', $5, $6, $7, $8::jsonb,
            $9, $10, $11
          )
          RETURNING id
        `,
        [
          workspaceId,
          definition.name,
          slug,
          `${definition.name} sample site`,
          definition.status,
          templateId,
          definition.customDomain,
          JSON.stringify({
            meta_title: `${definition.name} — Official Site`,
            meta_description: `Discover ${definition.name}, services, story, and contact details.`,
          }),
          definition.publishedAt,
          createdAt,
          updatedAt,
        ],
      );
      const site = siteResult.rows[0];
      if (site === undefined) {
        throw new Error('PostgreSQL did not return a sample site');
      }

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
          `,
          [site.id, pageSlug, JSON.stringify(pages[pageSlug]), updatedAt],
        );
      }
      await this.insertSnapshot(client, site.id, updatedAt);
    }
  }
}
