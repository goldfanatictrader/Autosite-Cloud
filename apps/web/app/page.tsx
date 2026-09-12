"use client";

import { Plus, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, Card, Input, buttonVariants, cn } from "@autosite/ui";

import { AppShell } from "@/components/app-shell";
import { ErrorState, PageLoading } from "@/components/page-state";
import { SiteCard } from "@/components/site-card";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { filterSites, type SiteStatusFilter } from "@/lib/sites";
import type { SitesResponse } from "@/lib/types";

const STATUS_FILTERS: Array<{ label: string; value: SiteStatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Building", value: "building" },
  { label: "Live", value: "live" },
  { label: "Error", value: "error" },
];

export default function DashboardPage() {
  const authenticated = useRequireAuth();
  const [sites, setSites] = useState<SitesResponse["sites"]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SiteStatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSites = useCallback(async (silent = false): Promise<void> => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await apiFetch<SitesResponse>("/api/sites?limit=100");
      setSites(response.sites);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    void loadSites();
    const poller = window.setInterval(() => void loadSites(true), 15_000);
    return () => window.clearInterval(poller);
  }, [authenticated, loadSites]);

  const filteredSites = useMemo(
    () => filterSites(sites, query, status),
    [query, sites, status],
  );

  if (!authenticated || loading) {
    return <PageLoading />;
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label-lg font-medium text-primary">Site dashboard</p>
          <h1 className="mt-1 text-display-md">Your sites</h1>
          <p className="mt-2 text-body-md text-text-secondary">
            {sites.length} {sites.length === 1 ? "project" : "projects"} in your workspace
          </p>
        </div>
        <Link
          href="/create"
          className={cn(buttonVariants(), "hidden sm:inline-flex")}
        >
          <Plus className="size-5" aria-hidden="true" />
          Create new site
        </Link>
      </div>

      <section className="mt-8" aria-labelledby="sites-heading">
        <h2 id="sites-heading" className="sr-only">
          Sites
        </h2>
        <div className="rounded-lg border border-border bg-surface p-3 shadow-sm sm:p-4">
          <div className="relative max-w-2xl">
            <Search
              className="pointer-events-none absolute left-4 top-3.5 size-5 text-placeholder"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Search sites by name"
              placeholder="Search sites…"
              className="pl-12"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div
            className="mt-3 flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Filter sites by status"
          >
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={status === filter.value ? "primary" : "secondary"}
                size="compact"
                className="shrink-0 rounded-full"
                aria-pressed={status === filter.value}
                onClick={() => setStatus(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mt-8">
            <ErrorState message={error} onRetry={() => void loadSites()} />
          </div>
        ) : filteredSites.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            {filteredSites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        ) : sites.length === 0 ? (
          <Card className="mt-6 py-12 text-center shadow-md">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-secondary-light text-secondary dark:bg-violet-950">
              <Sparkles className="size-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-display-sm">Create your first site</h2>
            <p className="mx-auto mt-2 max-w-md text-body-md text-text-secondary">
              Describe your business in one sentence and AutoSite will draft four polished pages.
            </p>
            <Link href="/create" className={cn(buttonVariants(), "mt-6")}>
              <Plus className="size-5" aria-hidden="true" />
              Create site
            </Link>
          </Card>
        ) : (
          <Card className="mt-6 py-10 text-center">
            <h2 className="text-heading-lg">No matching sites</h2>
            <p className="mt-2 text-body-md text-text-secondary">
              Try another name or choose a different status.
            </p>
            <Button
              variant="secondary"
              className="mt-5"
              onClick={() => {
                setQuery("");
                setStatus("all");
              }}
            >
              Clear filters
            </Button>
          </Card>
        )}
      </section>

      <Link
        href="/create"
        aria-label="Create a new site"
        title="Create a new site"
        className={cn(
          buttonVariants({ size: "fab" }),
          "fixed bottom-[88px] right-4 z-20 sm:bottom-8 sm:right-8",
        )}
      >
        <Plus className="size-6" aria-hidden="true" />
      </Link>
    </AppShell>
  );
}
