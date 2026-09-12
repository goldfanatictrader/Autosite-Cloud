import { randomUUID } from 'node:crypto';

import type {
  PageContent,
  PageSlug,
  SiteSettings,
  SiteStatus,
} from '@autosite/shared';

import { hashPassword } from '../shared/password.js';

export const DEMO_EMAIL = 'demo@autosite.cloud';
export const DEMO_PASSWORD = 'DemoPass123!';

export interface UserRecord {
  id: string;
  workspaceId: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface SiteRecord {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  status: SiteStatus;
  templateId: string | null;
  customDomain: string | null;
  subdomain: string;
  settings: SiteSettings;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentRecord {
  siteId: string;
  pageSlug: PageSlug;
  content: PageContent;
  aiGenerated: boolean;
  version: number;
  updatedAt: string;
}

interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  seedSites?: boolean;
}

interface CreateSiteInput {
  workspaceId: string;
  name: string;
  templateId: string | null;
  description?: string | null;
}

interface SiteQuery {
  status?: SiteStatus;
  search?: string;
}

const DEFAULT_PAGE_SLUGS: PageSlug[] = [
  'home',
  'about',
  'services',
  'contact',
];

const slugify = (value: string): string => {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
  return slug.length > 0 ? slug : 'new-site';
};

const seedContent = (siteName: string): Record<PageSlug, PageContent> => ({
  home: {
    sections: [
      {
        type: 'hero',
        heading: `Welcome to ${siteName}`,
        subheading: 'Thoughtful experiences, made for real life.',
        cta_text: 'Discover More',
      },
      {
        type: 'features',
        heading: 'Why choose us',
        items: [
          {
            title: 'Made with care',
            description: 'Every detail is considered from start to finish.',
          },
          {
            title: 'Local expertise',
            description: 'Friendly guidance grounded in our community.',
          },
          {
            title: 'Dependable service',
            description: 'Clear communication and support you can count on.',
          },
        ],
      },
    ],
  },
  about: {
    sections: [
      {
        type: 'hero',
        heading: 'Our Story',
        subheading: `${siteName} was created to make a meaningful difference for every customer.`,
      },
    ],
  },
  services: {
    sections: [
      {
        type: 'services',
        heading: 'What we offer',
        items: [
          {
            title: 'Personal service',
            description: 'Practical help shaped around your needs.',
          },
          {
            title: 'Expert guidance',
            description: 'Straightforward advice at every step.',
          },
          {
            title: 'Flexible options',
            description: 'A simple path that works with your schedule.',
          },
        ],
      },
    ],
  },
  contact: {
    sections: [
      {
        type: 'contact',
        heading: 'Let’s Talk',
        subheading: 'We would love to hear what you are planning.',
        address: '123 Main Street, Your City',
        phone: '(555) 123-4567',
        hours: 'Monday–Friday, 9am–6pm',
        cta_text: 'Get in Touch',
      },
    ],
  },
});

export class InMemoryStore {
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
      .filter((site) => site.workspaceId === workspaceId)
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
    return site?.workspaceId === workspaceId ? site : undefined;
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
      description: input.description ?? null,
      status: 'draft',
      templateId: input.templateId,
      customDomain: null,
      subdomain: `${slug}.autosite.cloud`,
      settings: {},
      publishedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.sites.set(id, record);
    this.contents.set(id, new Map());
    return record;
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

  private seedDemoAccount(): void {
    const user: UserRecord = {
      id: '10000000-0000-4000-8000-000000000001',
      workspaceId: '20000000-0000-4000-8000-000000000001',
      email: DEMO_EMAIL,
      name: 'Demo User',
      passwordHash: hashPassword(DEMO_PASSWORD),
      createdAt: '2026-09-01T09:00:00.000Z',
    };
    this.users.set(user.id, user);
    this.seedSites(user.workspaceId, true);
  }

  private seedSites(workspaceId: string, fixedIds = false): void {
    const definitions: Array<{
      id: string;
      name: string;
      status: SiteStatus;
      templateId: string;
      customDomain: string | null;
      publishedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }> = [
      {
        id: '30000000-0000-4000-8000-000000000001',
        name: 'Harbor & Hearth',
        status: 'live',
        templateId: 'tmpl-hospitality',
        customDomain: 'harborandhearth.example',
        publishedAt: '2026-09-10T15:30:00.000Z',
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-10T15:30:00.000Z',
      },
      {
        id: '30000000-0000-4000-8000-000000000002',
        name: 'Northstar Studio',
        status: 'draft',
        templateId: 'tmpl-portfolio',
        customDomain: null,
        publishedAt: null,
        createdAt: '2026-09-04T11:00:00.000Z',
        updatedAt: '2026-09-11T08:45:00.000Z',
      },
      {
        id: '30000000-0000-4000-8000-000000000003',
        name: 'Greenway Wellness',
        status: 'building',
        templateId: 'tmpl-wellness',
        customDomain: null,
        publishedAt: null,
        createdAt: '2026-09-08T14:20:00.000Z',
        updatedAt: '2026-09-12T09:20:00.000Z',
      },
    ];

    for (const [index, definition] of definitions.entries()) {
      const id = fixedIds ? definition.id : randomUUID();
      const slug = slugify(definition.name);
      const site: SiteRecord = {
        id,
        workspaceId,
        name: definition.name,
        slug,
        description: `${definition.name} sample site`,
        status: definition.status,
        templateId: definition.templateId,
        customDomain: definition.customDomain,
        subdomain: `${slug}.autosite.cloud`,
        settings: {
          meta_title: `${definition.name} — Official Site`,
          meta_description: `Discover ${definition.name}, services, story, and contact details.`,
        },
        publishedAt: definition.publishedAt,
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
