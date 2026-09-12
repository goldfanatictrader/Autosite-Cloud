export const PAGE_SLUGS = ['home', 'about', 'services', 'contact'] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export const TONES = [
  'professional',
  'friendly',
  'luxury',
  'casual',
  'bold',
  'formal',
  'playful',
  'minimal',
] as const;
export type Tone = (typeof TONES)[number];

export const LANGUAGES = [
  'en',
  'es',
  'fr',
  'de',
  'pt',
  'it',
  'ja',
  'ko',
  'zh',
  'nl',
] as const;
export type Language = (typeof LANGUAGES)[number];

export interface ContentItem {
  title: string;
  description: string;
}

export interface HeroSection {
  type: 'hero';
  heading: string;
  subheading: string;
  cta_text?: string;
  background_image?: string;
}

export interface FeaturesSection {
  type: 'features';
  heading?: string;
  items: ContentItem[];
}

export interface ServicesSection {
  type: 'services';
  heading?: string;
  items: ContentItem[];
}

export interface ContactSection {
  type: 'contact';
  heading: string;
  subheading?: string;
  address: string;
  phone: string;
  hours: string;
  cta_text?: string;
}

export type ContentSection =
  | HeroSection
  | FeaturesSection
  | ServicesSection
  | ContactSection;

export interface PageContent {
  sections: ContentSection[];
}

export interface SiteContentPage {
  page_slug: PageSlug;
  content_json: PageContent;
  version: number;
  updated_at?: string;
}

export interface SiteContentResponse {
  pages: SiteContentPage[];
}

export interface UpdateSiteContentRequest {
  content_json: PageContent;
}

export interface UpdateSiteContentResponse {
  page_slug: PageSlug;
  version: number;
  updated_at: string;
}

export interface GenerateContentRequest {
  site_id: string;
  brief: string;
  tone: Tone;
  language: Language;
  pages: PageSlug[];
}

export interface GenerateContentResponse {
  pages: Partial<Record<PageSlug, PageContent>>;
  tokens_used: number;
}
