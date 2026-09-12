import { randomUUID } from 'node:crypto';

import type { PageContent, PageSlug } from '@autosite/shared';

import { hashPassword } from '../shared/password.js';
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

export { DEMO_EMAIL, DEMO_PASSWORD } from './seed-data.js';
export type {
  ContentRecord,
  DeletedSiteRecord,
  SiteRecord,
  UserRecord,
} from './store.js';

export class InMemoryStore implements Store {
  private readonly users = new Map<string, UserRecord>();
  private readonly sites = new Map<string, SiteRecord>();
  private readonly contents = new Map<string, Map<PageSlug, ContentRecord>>();

  constructor(
    private readonly clock: () => Date = () => new Date(),
    seedDemo = true,
  ) {
    if (seedDemo) {
      this.seedDemoAccount();
    }
  }

  findUserByEmail(email: string): UserRecord | undefined {
    const normalizedEmail = email.trim().toLowerCase();
    return [...this.users.values()].find(
      (user) => user.email === normalizedEmail,
    );
  }

  findUserById(id: string): UserRecord | undefined {
    return this.users.get(id);
  }

  createUser(input: CreateUserInput): UserRecord {
    if (this.findUserByEmail(input.email) !== undefined) {
      throw new EmailAlreadyExistsError();
    }
    const id = randomUUID();
    const createdAt = this.clock().toISOString();
    const record: UserRecord = {
      id,
      workspaceId: randomUUID(),
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      passwordHash: hashPassword(input.password),
      createdAt,
    };
    this.users.set(id, record);

    if (input.seedSites ?? true) {
      this.seedSites(record.workspaceId);
    }

    return record;
  }

  listSites(workspaceId: string, query: SiteQuery = {}): SiteRecord[] {
    const normalizedSearch = query.search?.trim().toLowerCase();
    return [...this.sites.values()]
      .filter(
        (site) => site.workspaceId === workspaceId && site.deletedAt === null,
      )
      .filter((site) => query.status === undefined || site.status === query.status)
      .filter(
        (site) =>
          normalizedSearch === undefined ||
          site.name.toLowerCase().includes(normalizedSearch),
      )
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  getSite(workspaceId: string, siteId: string): SiteRecord | undefined {
    const site = this.sites.get(siteId);
    return site?.workspaceId === workspaceId && site.deletedAt === null
      ? site
      : undefined;
  }

  createSite(input: CreateSiteInput): SiteRecord {
    const timestamp = this.clock().toISOString();
    const baseSlug = slugify(input.name);
    let slug = baseSlug;
    let suffix = 2;

    while (
      [...this.sites.values()].some(
        (site) => site.workspaceId === input.workspaceId && site.slug === slug,
      )
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const id = randomUUID();
    const record: SiteRecord = {
      id,
      workspaceId: input.workspaceId,
      name: input.name.trim(),
      slug,
      brief: input.brief ?? null,
      tone: 'professional',
      language: 'en',
      status: 'draft',
      templateId: input.templateId,
      customDomain: null,
      subdomain: `${slug}.autosite.cloud`,
      settings: {},
      publishedAt: null,
      deletedAt: null,
      restoreBefore: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.sites.set(id, record);
    this.contents.set(id, new Map());
    return record;
  }

  updateSite(
    workspaceId: string,
    siteId: string,
    input: UpdateSiteInput,
  ): SiteRecord | undefined {
    const site = this.getSite(workspaceId, siteId);
    if (site === undefined) {
      return undefined;
    }

    const timestamp = this.clock().toISOString();
    if (input.name !== undefined) {
      site.name = input.name.trim();
    }
    if (input.brief !== undefined) {
      site.brief = input.brief;
    }
    if (input.tone !== undefined) {
      site.tone = input.tone;
    }
    if (input.language !== undefined) {
      site.language = input.language;
    }
    if (input.status !== undefined) {
      site.status = input.status;
      if (input.status === 'live' && site.publishedAt === null) {
        site.publishedAt = timestamp;
      }
    }
    if (input.settings !== undefined) {
      site.settings = { ...site.settings, ...input.settings };
    }
    site.updatedAt = timestamp;
    return site;
  }

  deleteSite(
    workspaceId: string,
    siteId: string,
  ): DeletedSiteRecord | undefined {
    if (this.getSite(workspaceId, siteId) === undefined) {
      return undefined;
    }

    const deletedAt = this.clock();
    const restoreBefore = new Date(deletedAt);
    restoreBefore.setUTCDate(restoreBefore.getUTCDate() + 30);
    const site = this.sites.get(siteId);
    if (site === undefined) {
      return undefined;
    }
    site.deletedAt = deletedAt.toISOString();
    site.restoreBefore = restoreBefore.toISOString();
    site.updatedAt = site.deletedAt;
    return {
      deletedAt: site.deletedAt,
      restoreBefore: site.restoreBefore,
    };
  }

  listContent(workspaceId: string, siteId: string): ContentRecord[] | undefined {
    if (this.getSite(workspaceId, siteId) === undefined) {
      return undefined;
    }

    const siteContent = this.contents.get(siteId);
    if (siteContent === undefined) {
      return [];
    }

    return DEFAULT_PAGE_SLUGS.flatMap((pageSlug) => {
      const record = siteContent.get(pageSlug);
      return record === undefined ? [] : [record];
    });
  }

  getContent(
    workspaceId: string,
    siteId: string,
    pageSlug: PageSlug,
  ): ContentRecord | undefined {
    if (this.getSite(workspaceId, siteId) === undefined) {
      return undefined;
    }
    return this.contents.get(siteId)?.get(pageSlug);
  }

  saveContent(
    workspaceId: string,
    siteId: string,
    pageSlug: PageSlug,
    content: PageContent,
  ): ContentRecord | undefined {
    const site = this.getSite(workspaceId, siteId);
    if (site === undefined) {
      return undefined;
    }

    const timestamp = this.clock().toISOString();
    const siteContent = this.contents.get(siteId) ?? new Map();
    const previous = siteContent.get(pageSlug);
    const record: ContentRecord = {
      siteId,
      pageSlug,
      content,
      aiGenerated: false,
      version: (previous?.version ?? 0) + 1,
      updatedAt: timestamp,
    };
    siteContent.set(pageSlug, record);
    this.contents.set(siteId, siteContent);
    site.updatedAt = timestamp;
    return record;
  }

  saveGeneratedContent(
    workspaceId: string,
    siteId: string,
    pages: Partial<Record<PageSlug, PageContent>>,
  ): ContentRecord[] | undefined {
    const site = this.getSite(workspaceId, siteId);
    if (site === undefined) {
      return undefined;
    }

    const timestamp = this.clock().toISOString();
    const siteContent = this.contents.get(siteId) ?? new Map();
    const saved: ContentRecord[] = [];

    for (const pageSlug of DEFAULT_PAGE_SLUGS) {
      const content = pages[pageSlug];
      if (content === undefined) {
        continue;
      }

      const previous = siteContent.get(pageSlug);
      const record: ContentRecord = {
        siteId,
        pageSlug,
        content,
        aiGenerated: true,
        version: (previous?.version ?? 0) + 1,
        updatedAt: timestamp,
      };
      siteContent.set(pageSlug, record);
      saved.push(record);
    }

    this.contents.set(siteId, siteContent);
    site.updatedAt = timestamp;
    return saved;
  }

  async close(): Promise<void> {
    // The in-memory store has no external resources to release.
  }

  private seedDemoAccount(): void {
    const user: UserRecord = {
      id: DEMO_USER_ID,
      workspaceId: DEMO_WORKSPACE_ID,
      email: DEMO_EMAIL,
      name: 'Demo User',
      passwordHash: hashPassword(DEMO_PASSWORD),
      createdAt: DEMO_USER_CREATED_AT,
    };
    this.users.set(user.id, user);
    this.seedSites(user.workspaceId, true);
  }

  private seedSites(workspaceId: string, fixedIds = false): void {
    for (const [index, definition] of SAMPLE_SITE_DEFINITIONS.entries()) {
      const id = fixedIds ? definition.id : randomUUID();
      const slug = slugify(definition.name);
      const site: SiteRecord = {
        id,
        workspaceId,
        name: definition.name,
        slug,
        brief: `${definition.name} sample site`,
        tone: 'professional',
        language: 'en',
        status: definition.status,
        templateId: definition.templateId,
        customDomain: definition.customDomain,
        subdomain: `${slug}.autosite.cloud`,
        settings: {
          meta_title: `${definition.name} — Official Site`,
          meta_description: `Discover ${definition.name}, services, story, and contact details.`,
        },
        publishedAt: definition.publishedAt,
        deletedAt: null,
        restoreBefore: null,
        createdAt: fixedIds ? definition.createdAt : this.clock().toISOString(),
        updatedAt: fixedIds
          ? definition.updatedAt
          : new Date(this.clock().getTime() + index).toISOString(),
      };
      this.sites.set(id, site);

      const pages = seedContent(site.name);
      this.contents.set(
        id,
        new Map<PageSlug, ContentRecord>(
          DEFAULT_PAGE_SLUGS.map(
            (pageSlug): [PageSlug, ContentRecord] => [
              pageSlug,
              {
                siteId: id,
                pageSlug,
                content: pages[pageSlug],
                aiGenerated: false,
                version: 1,
                updatedAt: site.updatedAt,
              },
            ],
          ),
        ),
      );
    }
  }
}
