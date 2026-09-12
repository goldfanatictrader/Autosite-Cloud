import type { PageContent, PageSlug, SiteStatus } from '@autosite/shared';

export const DEMO_USER_ID = '10000000-0000-4000-8000-000000000001';
export const DEMO_WORKSPACE_ID = '20000000-0000-4000-8000-000000000001';
export const DEMO_EMAIL = 'demo@autosite.cloud';
export const DEMO_PASSWORD = 'DemoPass123!';
export const DEMO_USER_CREATED_AT = '2026-09-01T09:00:00.000Z';

export const DEFAULT_PAGE_SLUGS: readonly PageSlug[] = [
  'home',
  'about',
  'services',
  'contact',
];

export interface SampleSiteDefinition {
  id: string;
  name: string;
  status: SiteStatus;
  templateId: string;
  templateUuid: string;
  customDomain: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const SAMPLE_SITE_DEFINITIONS: readonly SampleSiteDefinition[] = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    name: 'Harbor & Hearth',
    status: 'live',
    templateId: 'tmpl-hospitality',
    templateUuid: '40000000-0000-4000-8000-000000000001',
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
    templateUuid: '40000000-0000-4000-8000-000000000002',
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
    templateUuid: '40000000-0000-4000-8000-000000000003',
    customDomain: null,
    publishedAt: null,
    createdAt: '2026-09-08T14:20:00.000Z',
    updatedAt: '2026-09-12T09:20:00.000Z',
  },
];

export const slugify = (value: string): string => {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
  return slug.length > 0 ? slug : 'new-site';
};

export const seedContent = (
  siteName: string,
): Record<PageSlug, PageContent> => ({
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
