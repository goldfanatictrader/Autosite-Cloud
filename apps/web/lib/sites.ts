import type { SiteSummary, SiteStatus } from "./types";

export type SiteStatusFilter = "all" | SiteStatus;

export function filterSites(
  sites: SiteSummary[],
  query: string,
  status: SiteStatusFilter,
): SiteSummary[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return sites.filter((site) => {
    const matchesName =
      normalizedQuery.length === 0 ||
      site.name.toLocaleLowerCase().includes(normalizedQuery);
    const matchesStatus = status === "all" || site.status === status;

    return matchesName && matchesStatus;
  });
}
