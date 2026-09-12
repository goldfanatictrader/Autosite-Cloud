import { describe, expect, it } from "vitest";

import { filterSites } from "./sites";
import type { SiteSummary } from "./types";

const sites: SiteSummary[] = [
  {
    id: "site-1",
    name: "Brooklyn Pizza",
    status: "live",
    template_id: null,
    created_at: "2026-09-10T10:00:00.000Z",
    updated_at: "2026-09-12T10:00:00.000Z",
  },
  {
    id: "site-2",
    name: "Harbor Coffee",
    status: "draft",
    template_id: null,
    created_at: "2026-09-10T10:00:00.000Z",
    updated_at: "2026-09-12T10:00:00.000Z",
  },
  {
    id: "site-3",
    name: "Pizza Studio",
    status: "error",
    template_id: null,
    created_at: "2026-09-10T10:00:00.000Z",
    updated_at: "2026-09-12T10:00:00.000Z",
  },
];

describe("filterSites", () => {
  it("searches site names case-insensitively and ignores surrounding whitespace", () => {
    expect(filterSites(sites, "  PIZZA ", "all").map((site) => site.id)).toEqual([
      "site-1",
      "site-3",
    ]);
  });

  it("combines the name query with the selected status", () => {
    expect(filterSites(sites, "pizza", "live").map((site) => site.id)).toEqual([
      "site-1",
    ]);
  });

  it("returns all sites when both filters are clear", () => {
    expect(filterSites(sites, "", "all")).toEqual(sites);
  });
});
