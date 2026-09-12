"use client";

import { ArrowLeft, CalendarDays, Globe2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Card, badgeVariants, buttonVariants, cn } from "@autosite/ui";

import { AppShell } from "@/components/app-shell";
import { ContentPreview } from "@/components/content-preview";
import { ErrorState, PageLoading } from "@/components/page-state";
import { StatusBadge } from "@/components/status-badge";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { formatUpdatedDate } from "@/lib/format";
import type {
  GeneratedPages,
  SiteContentResponse,
  SiteDetail,
  SiteResponse,
} from "@/lib/types";

export default function SiteDetailPage({ params }: { params: { id: string } }) {
  const authenticated = useRequireAuth();
  const [site, setSite] = useState<SiteDetail | null>(null);
  const [pages, setPages] = useState<GeneratedPages>({});
  const [versions, setVersions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSite = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const encodedId = encodeURIComponent(params.id);
      const [siteResponse, contentResponse] = await Promise.all([
        apiFetch<SiteResponse>(`/api/sites/${encodedId}`),
        apiFetch<SiteContentResponse>(`/api/sites/${encodedId}/content`),
      ]);

      const pageMap: GeneratedPages = {};
      const versionMap: Record<string, number> = {};
      for (const page of contentResponse.pages) {
        pageMap[page.page_slug] = page.content_json;
        versionMap[page.page_slug] = page.version;
      }

      setSite(siteResponse.site);
      setPages(pageMap);
      setVersions(versionMap);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (authenticated) {
      void loadSite();
    }
  }, [authenticated, loadSite]);

  if (!authenticated || loading) {
    return <PageLoading label="Loading site content…" />;
  }

  return (
    <AppShell>
      {error || !site ? (
        <ErrorState message={error ?? "This site could not be found."} onRetry={() => void loadSite()} />
      ) : (
        <>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-md text-label-lg text-text-secondary hover:text-primary"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            Back to sites
          </Link>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-display-md sm:text-display-lg">{site.name}</h1>
                <StatusBadge status={site.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-body-md text-text-secondary">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  Updated {formatUpdatedDate(site.updated_at)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Globe2 className="size-4" aria-hidden="true" />
                  {site.custom_domain || site.subdomain || "Not published"}
                </span>
              </div>
            </div>

            <Link href="/create" className={cn(buttonVariants({ variant: "secondary" }))}>
              <Sparkles className="size-5 text-secondary" aria-hidden="true" />
              Create another site
            </Link>
          </div>

          {Object.keys(pages).length > 0 ? (
            <section className="mt-8" aria-labelledby="content-heading">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-label-lg font-medium text-primary">Generated content</p>
                  <h2 id="content-heading" className="mt-1 text-display-sm">
                    Page preview
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2" aria-label="Content versions">
                  {Object.entries(versions).map(([slug, version]) => (
                    <span key={slug} className={badgeVariants({ variant: "default" })}>
                      {slug} · v{version}
                    </span>
                  ))}
                </div>
              </div>
              <ContentPreview pages={pages} />
            </section>
          ) : (
            <Card className="mt-8 py-12 text-center shadow-md">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-secondary-light text-secondary dark:bg-violet-950">
                <Sparkles className="size-7" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-display-sm">This site needs some words</h2>
              <p className="mx-auto mt-2 max-w-md text-body-md text-text-secondary">
                Open the AI Content Writer to generate home, about, services, and contact copy.
              </p>
              <Link href="/create" className={cn(buttonVariants(), "mt-6")}>
                Generate site copy
              </Link>
            </Card>
          )}
        </>
      )}
    </AppShell>
  );
}
