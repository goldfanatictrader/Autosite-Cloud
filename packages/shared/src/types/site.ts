import type { Language, PageSlug, Tone } from './content.js';

export const SITE_STATUSES = ['draft', 'building', 'live', 'error'] as const;
export type SiteStatus = (typeof SITE_STATUSES)[number];

export interface SiteSettings {
  favicon_url?: string;
  meta_title?: string;
  meta_description?: string;
}

export interface Site {
  id: string;
  name: string;
  brief: string | null;
  tone: Tone;
  language: Language;
  status: SiteStatus;
  template_id: string | null;
  custom_domain?: string | null;
  subdomain?: string;
  pages?: PageSlug[];
  settings?: SiteSettings;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

export interface CreateSiteRequest {
  name: string;
  template_id?: string;
}

export interface CreateSiteResponse {
  site: Site & { pages: PageSlug[] };
}

export interface UpdateSiteRequest {
  name?: string;
  brief?: string | null;
  tone?: Tone;
  language?: Language;
  status?: SiteStatus;
  settings?: SiteSettings;
}

export interface SiteResponse {
  site: Site;
}

export interface SitesResponse {
  sites: Site[];
  total: number;
  page: number;
  pages: number;
}

export interface DeleteSiteResponse {
  message: 'Site moved to trash';
  deleted_at: string;
  restore_before: string;
}
