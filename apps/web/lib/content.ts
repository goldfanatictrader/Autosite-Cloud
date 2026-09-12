import type {
  ContentItem,
  ContentSection,
  GeneratedPages,
  PageContent,
} from "./types";

export const PAGE_ORDER = ["home", "about", "services", "contact"] as const;

export type SectionTextField =
  | "heading"
  | "subheading"
  | "cta_text"
  | "address"
  | "phone"
  | "hours";

export type ContentItemTextField = "title" | "description";

export function orderedPageSlugs(pages: GeneratedPages): string[] {
  const known = PAGE_ORDER.filter((slug) => Boolean(pages[slug]));
  const additional = Object.keys(pages)
    .filter((slug) => !PAGE_ORDER.includes(slug as (typeof PAGE_ORDER)[number]))
    .sort();
  return [...known, ...additional];
}

export function isContentItem(value: unknown): value is ContentItem {
  return typeof value === "object" && value !== null;
}

export function stringValue(
  source: ContentSection | ContentItem,
  key: string,
): string | null {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export function labelForSlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function isOptionalSectionField(
  section: ContentSection,
  field: SectionTextField,
): boolean {
  if (field === "cta_text") {
    return true;
  }

  if (field === "heading") {
    return section.type === "features" || section.type === "services";
  }

  return field === "subheading" && section.type === "contact";
}

export function updateSectionText(
  content: PageContent,
  sectionIndex: number,
  field: SectionTextField,
  value: string,
): PageContent {
  return {
    sections: content.sections.map((section, index) => {
      if (index !== sectionIndex) {
        return section;
      }

      const nextSection: ContentSection = { ...section };
      if (value.length === 0 && isOptionalSectionField(section, field)) {
        delete nextSection[field];
      } else {
        nextSection[field] = value;
      }

      return nextSection;
    }),
  };
}

export function updateContentItemText(
  content: PageContent,
  sectionIndex: number,
  itemIndex: number,
  field: ContentItemTextField,
  value: string,
): PageContent {
  return {
    sections: content.sections.map((section, index) => {
      if (index !== sectionIndex || !Array.isArray(section.items)) {
        return section;
      }

      return {
        ...section,
        items: section.items.map((item, currentItemIndex) =>
          currentItemIndex === itemIndex ? { ...item, [field]: value } : item,
        ),
      };
    }),
  };
}

export function deriveSiteName(brief: string): string {
  const leadingPhrase = brief
    .trim()
    .split(/\b(?:in|serving|with|for|that|who)\b/i)[0]
    ?.replace(/[^\p{L}\p{N}'& -]/gu, "")
    .trim();

  const words = (leadingPhrase || brief.trim()).split(/\s+/).filter(Boolean).slice(0, 5);
  if (words.length === 0) {
    return "My AI Site";
  }

  return words
    .map((word) => `${word.charAt(0).toLocaleUpperCase()}${word.slice(1)}`)
    .join(" ")
    .slice(0, 60);
}
