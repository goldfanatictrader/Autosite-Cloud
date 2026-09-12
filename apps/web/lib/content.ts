import type { ContentItem, ContentSection, GeneratedPages } from "./types";

export const PAGE_ORDER = ["home", "about", "services", "contact"] as const;

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
