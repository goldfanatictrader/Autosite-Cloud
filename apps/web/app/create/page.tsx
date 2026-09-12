"use client";

import { ArrowLeft, ArrowRight, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { Button, Card, Input, badgeVariants, buttonVariants, cn } from "@autosite/ui";
import type { CreateSiteRequest, GenerateContentRequest } from "@autosite/shared";

import { AppShell } from "@/components/app-shell";
import { ContentPreview } from "@/components/content-preview";
import { PageLoading } from "@/components/page-state";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { deriveSiteName } from "@/lib/content";
import {
  LANGUAGES,
  TONES,
  isLanguage,
  isTone,
  type Language,
  type Tone,
} from "@/lib/options";
import type { GenerateContentResponse, GeneratedPages, SiteResponse } from "@/lib/types";

const TONE_KEY = "autosite-writer-tone";
const LANGUAGE_KEY = "autosite-writer-language";
const HISTORY_KEY = "autosite-brief-history";
const PAGE_SLUGS = ["home", "about", "services", "contact"] as const;

function readBriefHistory(): string[] {
  const stored = window.localStorage.getItem(HISTORY_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 4)
      : [];
  } catch {
    return [];
  }
}

export default function CreatePage() {
  const authenticated = useRequireAuth();
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [language, setLanguage] = useState<Language>("en");
  const [history, setHistory] = useState<string[]>([]);
  const [generatedPages, setGeneratedPages] = useState<GeneratedPages | null>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [tokensUsed, setTokensUsed] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedTone = window.localStorage.getItem(TONE_KEY);
    const storedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
    if (storedTone && isTone(storedTone)) {
      setTone(storedTone);
    }
    if (storedLanguage && isLanguage(storedLanguage)) {
      setLanguage(storedLanguage);
    }
    setHistory(readBriefHistory());
  }, []);

  function updateTone(value: Tone): void {
    setTone(value);
    window.localStorage.setItem(TONE_KEY, value);
  }

  function updateLanguage(value: Language): void {
    setLanguage(value);
    window.localStorage.setItem(LANGUAGE_KEY, value);
  }

  async function generateContent(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const cleanBrief = brief.trim();

    if (cleanBrief.length < 10) {
      setError("Tell us a little more—your brief needs at least 10 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);

    let activeSiteId = siteId;
    const nextSiteName = siteName ?? deriveSiteName(cleanBrief);

    try {
      if (!activeSiteId) {
        const createRequest = {
          name: nextSiteName,
          template_id: "default",
        } satisfies CreateSiteRequest;
        const created = await apiFetch<SiteResponse>("/api/sites", {
          method: "POST",
          body: JSON.stringify(createRequest),
        });
        activeSiteId = created.site.id;
        setSiteId(activeSiteId);
        setSiteName(created.site.name);
      }

      const generateRequest = {
        site_id: activeSiteId,
        brief: cleanBrief,
        tone,
        language,
        pages: [...PAGE_SLUGS],
      } satisfies GenerateContentRequest;
      const generated = await apiFetch<GenerateContentResponse>("/api/ai/generate-content", {
        method: "POST",
        body: JSON.stringify(generateRequest),
      });

      setGeneratedPages(generated.pages);
      setTokensUsed(generated.tokens_used);

      const nextHistory = [cleanBrief, ...history.filter((item) => item !== cleanBrief)].slice(0, 4);
      setHistory(nextHistory);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));

      window.requestAnimationFrame(() => {
        document.getElementById("generated-content")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  function resetWriter(): void {
    setBrief("");
    setGeneratedPages(null);
    setSiteId(null);
    setSiteName(null);
    setTokensUsed(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!authenticated) {
    return <PageLoading label="Opening the content writer…" />;
  }

  const selectedTone = TONES.find((option) => option.value === tone);

  return (
    <AppShell>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 rounded-md text-label-lg text-text-secondary hover:text-primary"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
        Back to sites
      </Link>

      <div className="mt-4 max-w-3xl">
        <span className={cn(badgeVariants({ variant: "secondary" }), "gap-1.5")}>
          <Sparkles className="size-3.5" aria-hidden="true" />
          AI Content Writer
        </span>
        <h1 className="mt-4 text-display-md sm:text-display-lg">Build your site with one sentence</h1>
        <p className="mt-3 text-body-lg text-text-secondary">
          Share what makes your business special. We’ll draft complete home, about, services,
          and contact pages in your chosen voice.
        </p>
      </div>

      <Card className="mt-8 max-w-4xl p-5 shadow-md sm:p-6">
        <form onSubmit={generateContent} noValidate>
          <div>
            <div className="mb-2 flex items-end justify-between gap-4">
              <label htmlFor="brief" className="text-heading-md">
                Describe your business
              </label>
              <span
                id="brief-count"
                className={cn(
                  "font-mono text-body-sm text-text-secondary",
                  brief.length > 300 && "text-error",
                )}
              >
                {brief.length}/300
              </span>
            </div>
            <Input
              id="brief"
              name="brief"
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="e.g. Family-run Italian restaurant in Brooklyn serving handmade pasta"
              minLength={10}
              maxLength={300}
              required
              disabled={submitting}
              invalid={Boolean(error && brief.trim().length < 10)}
              aria-describedby="brief-help brief-count"
            />
            <p id="brief-help" className="mt-2 text-body-sm text-text-secondary">
              Use 10–300 characters. Mention your audience, location, or specialty for richer copy.
            </p>
          </div>

          {history.length > 0 ? (
            <div className="mt-5">
              <p className="text-label-md text-text-secondary">Recent briefs</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {history.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="max-w-full truncate rounded-full border border-border bg-muted px-3 py-2 text-body-sm text-text-secondary transition hover:border-primary hover:text-primary"
                    onClick={() => setBrief(item)}
                    title={item}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-label-lg text-text-primary">Tone</span>
              <select
                value={tone}
                onChange={(event) => updateTone(event.target.value as Tone)}
                disabled={submitting}
                className="h-12 w-full rounded-md border border-border bg-surface px-4 text-body-lg text-text-primary outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
              >
                {TONES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} — {option.description}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-body-sm text-text-secondary">
                {selectedTone?.description}
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-label-lg text-text-primary">Language</span>
              <select
                value={language}
                onChange={(event) => updateLanguage(event.target.value as Language)}
                disabled={submitting}
                className="h-12 w-full rounded-md border border-border bg-surface px-4 text-body-lg text-text-primary outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
              >
                {LANGUAGES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-5 rounded-md border border-error/30 bg-red-50 p-3 text-body-md text-red-800 dark:bg-red-950 dark:text-red-200"
            >
              {error}
              {siteId ? (
                <Link className="ml-1 font-medium underline" href={`/sites/${siteId}`}>
                  Open the created site.
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body-sm text-text-secondary">
              AI drafts stay editable, and generation works without extra setup.
            </p>
            <Button type="submit" disabled={submitting || brief.trim().length < 10}>
              {submitting ? (
                <>
                  <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                  Writing four pages…
                </>
              ) : generatedPages ? (
                <>
                  <RotateCcw className="size-5" aria-hidden="true" />
                  Regenerate copy
                </>
              ) : (
                <>
                  <Sparkles className="size-5" aria-hidden="true" />
                  Generate site copy
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {submitting ? (
        <div className="mt-8 max-w-4xl rounded-lg border border-primary/20 bg-primary-light p-6 text-center dark:bg-blue-950" role="status">
          <LoaderCircle className="mx-auto size-8 animate-spin text-primary" aria-hidden="true" />
          <p className="mt-3 text-heading-md">Writing your pages</p>
          <p className="mt-1 text-body-md text-text-secondary">
            Shaping the hero, features, services, story, and contact details…
          </p>
        </div>
      ) : null}

      {generatedPages && siteId ? (
        <section id="generated-content" className="mt-12 scroll-mt-24" aria-labelledby="preview-heading">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-label-lg font-medium text-success">Four pages ready</p>
              <h2 id="preview-heading" className="mt-1 text-display-sm">
                {siteName ?? "Your generated site"}
              </h2>
              {tokensUsed !== null ? (
                <p className="mt-1 font-mono text-body-sm text-text-secondary">
                  AI draft · {tokensUsed.toLocaleString()} tokens used
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" onClick={resetWriter}>
                Create another
              </Button>
              <Link href={`/sites/${siteId}`} className={buttonVariants()}>
                Open site
                <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <ContentPreview pages={generatedPages} />
        </section>
      ) : null}
    </AppShell>
  );
}
