"use client";

import { ArrowLeft, CalendarDays, Eye, Globe2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, Card, badgeVariants, buttonVariants, cn } from "@autosite/ui";

import { AppShell } from "@/components/app-shell";
import { ContentEditor } from "@/components/content-editor";
import { ContentPreview } from "@/components/content-preview";
import { ErrorState, PageLoading } from "@/components/page-state";
import { StatusBadge } from "@/components/status-badge";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { labelForSlug, orderedPageSlugs } from "@/lib/content";
import { formatUpdatedDate } from "@/lib/format";
import type {
  GeneratedPages,
  PageContent,
  SiteContentResponse,
  SiteDetail,
  SiteResponse,
  UpdatePageContentResponse,
} from "@/lib/types";

export default function SiteDetailPage({ params }: { params: { id: string } }) {
  const authenticated = useRequireAuth();
  const [site, setSite] = useState<SiteDetail | null>(null);
  const [pages, setPages] = useState<GeneratedPages>({});
  const [versions, setVersions] = useState<Record<string, number>>({});
  const [activePage, setActivePage] = useState("");
  const [dirtyPages, setDirtyPages] = useState<Set<string>>(() => new Set());
  const [savingPage, setSavingPage] = useState<string | null>(null);
  const [savedPage, setSavedPage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<{ page: string; message: string } | null>(null);
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
      setActivePage((current) =>
        pageMap[current] ? current : (orderedPageSlugs(pageMap)[0] ?? ""),
      );
      setDirtyPages(new Set());
      setSavedPage(null);
      setSaveError(null);
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

  const pageSlugs = useMemo(() => orderedPageSlugs(pages), [pages]);

  function updateActivePage(content: PageContent): void {
    if (!activePage) {
      return;
    }

    setPages((current) => ({ ...current, [activePage]: content }));
    setDirtyPages((current) => {
      const next = new Set(current);
      next.add(activePage);
      return next;
    });
    setSavedPage((current) => (current === activePage ? null : current));
    setSaveError((current) => (current?.page === activePage ? null : current));
  }

  async function saveActivePage(): Promise<void> {
    const content = pages[activePage];
    if (!activePage || !content) {
      return;
    }

    const pageToSave = activePage;
    setSavingPage(pageToSave);
    setSavedPage(null);
    setSaveError(null);

    try {
      const response = await apiFetch<UpdatePageContentResponse>(
        `/api/sites/${encodeURIComponent(params.id)}/content/${encodeURIComponent(pageToSave)}`,
        {
          method: "PUT",
          body: JSON.stringify({ content_json: content }),
        },
      );

      setVersions((current) => ({ ...current, [response.page_slug]: response.version }));
      setDirtyPages((current) => {
        const next = new Set(current);
        next.delete(pageToSave);
        return next;
      });
      setSite((current) =>
        current ? { ...current, updated_at: response.updated_at } : current,
      );
      setSavedPage(pageToSave);
    } catch (caught) {
      setSaveError({ page: pageToSave, message: getErrorMessage(caught) });
    } finally {
      setSavingPage(null);
    }
  }

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

          {pageSlugs.length > 0 && activePage && pages[activePage] ? (
            <section className="mt-8" aria-labelledby="content-heading">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-label-lg font-medium text-primary">Generated content</p>
                  <h2 id="content-heading" className="mt-1 text-display-sm">
                    Edit and preview
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

              <div
                className="mb-5 flex gap-2 overflow-x-auto pb-1"
                role="tablist"
                aria-label="Site pages"
              >
                {pageSlugs.map((slug) => (
                  <Button
                    key={slug}
                    type="button"
                    role="tab"
                    id={`editor-tab-${slug}`}
                    aria-selected={activePage === slug}
                    aria-controls="editor-page-panel"
                    variant={activePage === slug ? "primary" : "secondary"}
                    size="compact"
                    className="shrink-0"
                    disabled={savingPage !== null}
                    onClick={() => setActivePage(slug)}
                  >
                    {labelForSlug(slug)}
                    {dirtyPages.has(slug) ? (
                      <span className="size-2 rounded-full bg-warning" aria-label="Unsaved changes" />
                    ) : null}
                  </Button>
                ))}
              </div>

              <div
                id="editor-page-panel"
                role="tabpanel"
                aria-labelledby={`editor-tab-${activePage}`}
                className="grid items-start gap-6 lg:grid-cols-2"
              >
                <ContentEditor
                  pageSlug={activePage}
                  content={pages[activePage]}
                  version={versions[activePage]}
                  dirty={dirtyPages.has(activePage)}
                  saving={savingPage === activePage}
                  error={saveError?.page === activePage ? saveError.message : null}
                  saved={savedPage === activePage && !dirtyPages.has(activePage)}
                  onChange={updateActivePage}
                  onSave={() => void saveActivePage()}
                />

                <div className="lg:sticky lg:top-24">
                  <div className="mb-3 flex items-center gap-2 text-label-lg font-medium text-text-secondary">
                    <Eye className="size-5 text-primary" aria-hidden="true" />
                    Live preview
                  </div>
                  <ContentPreview
                    pages={pages}
                    activePage={activePage}
                    showPageTabs={false}
                  />
                </div>
              </div>
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
