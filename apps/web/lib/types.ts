import type {
  AuthResponse as SharedAuthResponse,
  SiteStatus as SharedSiteStatus,
  User as SharedUser,
} from "@autosite/shared";

export type SiteStatus = SharedSiteStatus;

export type User = SharedUser;

export type AuthResponse = SharedAuthResponse;

export interface SiteSummary {
  id: string;
  name: string;
  status: SiteStatus;
  template_id: string | null;
  custom_domain?: string | null;
  subdomain?: string | null;
  thumbnail_url?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

export interface SiteDetail extends SiteSummary {
  pages: string[];
  settings?: {
    favicon_url?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
  };
}

export interface SitesResponse {
  sites: SiteSummary[];
  total: number;
  page: number;
  pages: number;
}

export interface SiteResponse {
  site: SiteDetail;
}

export interface ContentItem {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

export interface ContentSection {
  type: string;
  heading?: string;
  subheading?: string;
  cta_text?: string;
  items?: ContentItem[];
  address?: string;
  phone?: string;
  hours?: string;
  [key: string]: unknown;
}

export interface PageContent {
  sections: ContentSection[];
}

export interface StoredPageContent {
  page_slug: string;
  content_json: PageContent;
  version: number;
  updated_at?: string;
}

export interface SiteContentResponse {
  pages: StoredPageContent[];
}

export interface UpdatePageContentResponse {
  page_slug: string;
  version: number;
  updated_at: string;
}

export type GeneratedPages = Record<string, PageContent>;

export interface GenerateContentResponse {
  pages: GeneratedPages;
  tokens_used: number;
}

export interface ApiErrorEnvelope {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}
