"use client";

import { Check, Clock3, MapPin, Phone } from "lucide-react";
import { useMemo, useState } from "react";

import { Card, cn } from "@autosite/ui";

import {
  isContentItem,
  labelForSlug,
  orderedPageSlugs,
  stringValue,
} from "@/lib/content";
import type { ContentItem, ContentSection, GeneratedPages } from "@/lib/types";

interface ContentPreviewProps {
  pages: GeneratedPages;
  activePage?: string;
  onActivePageChange?: (slug: string) => void;
  showPageTabs?: boolean;
}

export function ContentPreview({
  pages,
  activePage,
  onActivePageChange,
  showPageTabs = true,
}: ContentPreviewProps) {
  const slugs = useMemo(() => orderedPageSlugs(pages), [pages]);
  const [internalActivePage, setInternalActivePage] = useState(slugs[0] ?? "");

  if (slugs.length === 0) {
    return (
      <Card className="text-center text-body-md text-text-secondary">
        No generated content is available yet.
      </Card>
    );
  }

  const selectedPage =
    (activePage && pages[activePage] ? activePage : null) ??
    (pages[internalActivePage] ? internalActivePage : slugs[0]);
  const page = pages[selectedPage];

  function selectPage(slug: string): void {
    setInternalActivePage(slug);
    onActivePageChange?.(slug);
  }

  return (
    <div>
      {showPageTabs ? (
        <div
          className="mb-4 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Generated pages"
        >
          {slugs.map((slug) => {
            const isActive = slug === selectedPage;
            return (
              <button
                key={slug}
                type="button"
                role="tab"
                id={`tab-${slug}`}
                aria-selected={isActive}
                aria-controls={`panel-${slug}`}
                onClick={() => selectPage(slug)}
                className={cn(
                  "min-h-11 shrink-0 rounded-md border px-4 text-label-lg transition",
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-text-secondary hover:border-primary hover:text-primary",
                )}
              >
                {labelForSlug(slug)}
              </button>
            );
          })}
        </div>
      ) : null}

      <Card
        role={showPageTabs ? "tabpanel" : "region"}
        id={showPageTabs ? `panel-${selectedPage}` : undefined}
        aria-labelledby={showPageTabs ? `tab-${selectedPage}` : undefined}
        aria-label={showPageTabs ? undefined : `${labelForSlug(selectedPage)} live preview`}
        className="overflow-hidden p-0 shadow-md"
      >
        <div className="flex h-9 items-center gap-1.5 border-b border-border bg-muted px-4">
          <span className="size-2.5 rounded-full bg-error" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-warning" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-success" aria-hidden="true" />
          <span className="ml-2 truncate font-mono text-label-sm text-text-secondary">
            your-site.autosite.cloud/{selectedPage === "home" ? "" : selectedPage}
          </span>
        </div>

        <div className="bg-surface">
          {page?.sections.map((section, index) => (
            <SectionPreview key={`${section.type}-${index}`} section={section} index={index} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function SectionPreview({ section, index }: { section: ContentSection; index: number }) {
  const heading = stringValue(section, "heading");
  const subheading = stringValue(section, "subheading");
  const cta = stringValue(section, "cta_text");
  const isHero = section.type === "hero";
  const items = Array.isArray(section.items) ? section.items.filter(isContentItem) : [];

  if (isHero) {
    return (
      <section className="bg-gradient-to-br from-primary-light via-surface to-secondary-light px-6 py-12 text-center dark:from-blue-950 dark:via-slate-800 dark:to-violet-950 sm:px-10 sm:py-16">
        <p className="mb-3 text-label-md font-medium uppercase tracking-[0.18em] text-primary">
          {index === 0 ? "Welcome" : "Our story"}
        </p>
        {heading ? (
          <h2 className="mx-auto max-w-3xl text-display-sm text-text-primary sm:text-display-md">
            {heading}
          </h2>
        ) : null}
        {subheading ? (
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-text-secondary">{subheading}</p>
        ) : null}
        {cta ? (
          <span className="mt-6 inline-flex h-12 items-center rounded-md bg-primary px-6 text-label-lg text-white shadow-sm">
            {cta}
          </span>
        ) : null}
      </section>
    );
  }

  if (section.type === "contact") {
    return (
      <section className="px-6 py-10 sm:px-10">
        {heading ? <h2 className="text-display-sm">{heading}</h2> : null}
        {subheading ? (
          <p className="mt-2 text-body-lg text-text-secondary">{subheading}</p>
        ) : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ContactRow icon="location" value={stringValue(section, "address")} />
          <ContactRow icon="phone" value={stringValue(section, "phone")} />
          <ContactRow icon="clock" value={stringValue(section, "hours")} />
        </div>
        {cta ? (
          <span className="mt-6 inline-flex h-12 items-center rounded-md bg-primary px-6 text-label-lg text-white shadow-sm">
            {cta}
          </span>
        ) : null}
      </section>
    );
  }

  return (
    <section className={cn("px-6 py-10 sm:px-10", index % 2 === 1 && "bg-muted")}>
      {heading ? <h2 className="text-display-sm">{heading}</h2> : null}
      {subheading ? (
        <p className="mt-2 max-w-3xl text-body-lg text-text-secondary">{subheading}</p>
      ) : null}
      {items.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, itemIndex) => (
            <ItemPreview key={itemIndex} item={item} />
          ))}
        </div>
      ) : null}
      {cta ? (
        <span className="mt-6 inline-flex min-h-11 items-center font-medium text-primary">{cta}</span>
      ) : null}
    </section>
  );
}

function ItemPreview({ item }: { item: ContentItem }) {
  const title = stringValue(item, "title");
  const description = stringValue(item, "description");

  return (
    <article className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <span className="mb-3 grid size-9 place-items-center rounded-full bg-primary-light text-primary">
        <Check className="size-5" aria-hidden="true" />
      </span>
      {title ? <h3 className="text-heading-md">{title}</h3> : null}
      {description ? (
        <p className="mt-2 text-body-md text-text-secondary">{description}</p>
      ) : null}
    </article>
  );
}

function ContactRow({
  icon,
  value,
}: {
  icon: "location" | "phone" | "clock";
  value: string | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-md bg-muted p-4 text-body-md">
      {icon === "location" ? (
        <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      ) : icon === "phone" ? (
        <Phone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      ) : (
        <Clock3 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      )}
      <span>{value}</span>
    </div>
  );
}
