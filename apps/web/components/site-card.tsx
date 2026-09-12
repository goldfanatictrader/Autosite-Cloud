import { ArrowUpRight, Globe2 } from "lucide-react";
import Link from "next/link";

import { Card } from "@autosite/ui";

import { formatUpdatedDate } from "@/lib/format";
import type { SiteSummary } from "@/lib/types";

import { StatusBadge } from "./status-badge";

const PREVIEW_STYLES = [
  "from-blue-100 to-violet-100 dark:from-blue-950 dark:to-violet-950",
  "from-emerald-100 to-blue-100 dark:from-emerald-950 dark:to-blue-950",
  "from-amber-100 to-rose-100 dark:from-amber-950 dark:to-rose-950",
] as const;

function previewStyle(name: string): (typeof PREVIEW_STYLES)[number] {
  const score = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return PREVIEW_STYLES[score % PREVIEW_STYLES.length] ?? PREVIEW_STYLES[0];
}

export function SiteCard({ site }: { site: SiteSummary }) {
  return (
    <Link
      href={`/sites/${encodeURIComponent(site.id)}`}
      className="group block min-w-0 rounded-lg"
    >
      <Card className="h-full min-w-0 overflow-hidden p-0 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary group-hover:shadow-md group-focus-visible:border-primary group-focus-visible:ring-3 group-focus-visible:ring-primary/20">
        <div
          className={`relative aspect-[16/9] overflow-hidden bg-gradient-to-br ${previewStyle(site.name)} p-5`}
          aria-hidden="true"
        >
          <div className="h-full rounded-md border border-white/70 bg-white/80 p-3 shadow-sm dark:border-slate-600 dark:bg-slate-800/80">
            <div className="flex gap-1">
              <span className="size-1.5 rounded-full bg-error" />
              <span className="size-1.5 rounded-full bg-warning" />
              <span className="size-1.5 rounded-full bg-success" />
            </div>
            <div className="mt-5 h-2 w-1/2 rounded-full bg-primary/60" />
            <div className="mt-2 h-1.5 w-3/4 rounded-full bg-gray-200 dark:bg-slate-600" />
            <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-gray-200 dark:bg-slate-600" />
            <div className="mt-4 h-5 w-16 rounded-sm bg-primary" />
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-heading-md text-text-primary group-hover:text-primary">
                {site.name}
              </h2>
              <p className="mt-1 text-body-sm text-text-secondary">
                Updated {formatUpdatedDate(site.updated_at)}
              </p>
            </div>
            <StatusBadge status={site.status} />
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-body-md">
            <span className="flex min-w-0 items-center gap-2 text-text-secondary">
              <Globe2 className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {site.custom_domain || site.subdomain || "Draft workspace"}
              </span>
            </span>
            <span className="ml-3 inline-flex items-center gap-1 font-medium text-primary">
              Open
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
