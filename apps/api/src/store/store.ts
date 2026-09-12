import type {
  Language,
  PageContent,
  PageSlug,
  SiteSettings,
  SiteStatus,
  Tone,
} from '@autosite/shared';

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
  brief: string | null;
  tone: Tone;
  language: Language;
  status: SiteStatus;
  templateId: string | null;
  customDomain: string | null;
  subdomain: string;
  settings: SiteSettings;
  publishedAt: string | null;
  deletedAt: string | null;
  restoreBefore: string | null;
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

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  seedSites?: boolean;
}

export interface CreateSiteInput {
  workspaceId: string;
  name: string;
  templateId: string | null;
  brief?: string | null;
}

export interface UpdateSiteInput {
  name?: string;
  brief?: string | null;
  tone?: Tone;
  language?: Language;
  status?: SiteStatus;
  settings?: SiteSettings;
}

export interface DeletedSiteRecord {
  deletedAt: string;
  restoreBefore: string;
}

export interface SiteQuery {
  status?: SiteStatus;
  search?: string;
}

type StoreResult<T> = T | Promise<T>;

/**
 * Persistence contract shared by the synchronous in-memory implementation and
 * the asynchronous PostgreSQL implementation.
 */
export interface Store {
  findUserByEmail(email: string): StoreResult<UserRecord | undefined>;
  findUserById(id: string): StoreResult<UserRecord | undefined>;
  createUser(input: CreateUserInput): StoreResult<UserRecord>;
  listSites(
    workspaceId: string,
    query?: SiteQuery,
  ): StoreResult<SiteRecord[]>;
  getSite(
    workspaceId: string,
    siteId: string,
  ): StoreResult<SiteRecord | undefined>;
  createSite(input: CreateSiteInput): StoreResult<SiteRecord>;
  updateSite(
    workspaceId: string,
    siteId: string,
    input: UpdateSiteInput,
  ): StoreResult<SiteRecord | undefined>;
  deleteSite(
    workspaceId: string,
    siteId: string,
  ): StoreResult<DeletedSiteRecord | undefined>;
  listContent(
    workspaceId: string,
    siteId: string,
  ): StoreResult<ContentRecord[] | undefined>;
  getContent(
    workspaceId: string,
    siteId: string,
    pageSlug: PageSlug,
  ): StoreResult<ContentRecord | undefined>;
  saveContent(
    workspaceId: string,
    siteId: string,
    pageSlug: PageSlug,
    content: PageContent,
  ): StoreResult<ContentRecord | undefined>;
  saveGeneratedContent(
    workspaceId: string,
    siteId: string,
    pages: Partial<Record<PageSlug, PageContent>>,
  ): StoreResult<ContentRecord[] | undefined>;
  close(): Promise<void>;
}

export class EmailAlreadyExistsError extends Error {
  constructor() {
    super('Email already registered');
    this.name = 'EmailAlreadyExistsError';
  }
}
