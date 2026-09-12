"use client";

import { LoaderCircle, Save } from "lucide-react";
import type { FormEvent } from "react";

import { Button, Card } from "@autosite/ui";

import {
  labelForSlug,
  updateContentItemText,
  updateSectionText,
  type ContentItemTextField,
  type SectionTextField,
} from "@/lib/content";
import type { ContentItem, ContentSection, PageContent } from "@/lib/types";

const TEXTAREA_CLASS_NAME =
  "mt-2 flex min-h-20 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-body-md text-text-primary outline-none transition placeholder:text-placeholder focus:border-primary focus:ring-3 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50";

interface ContentEditorProps {
  pageSlug: string;
  content: PageContent;
  version?: number;
  dirty: boolean;
  saving: boolean;
  error: string | null;
  saved: boolean;
  onChange: (content: PageContent) => void;
  onSave: () => void;
}

function textValue(source: ContentSection | ContentItem, field: string): string {
  const value = source[field];
  return typeof value === "string" ? value : "";
}

function hasField(section: ContentSection, field: SectionTextField): boolean {
  if (field === "heading") {
    return true;
  }

  if (field === "subheading") {
    return section.type === "hero" || section.type === "contact" || field in section;
  }

  if (field === "cta_text") {
    return section.type === "hero" || section.type === "contact" || field in section;
  }

  return section.type === "contact" || field in section;
}

function isRequired(section: ContentSection, field: SectionTextField): boolean {
  if (field === "heading") {
    return section.type === "hero" || section.type === "contact";
  }

  if (field === "subheading") {
    return section.type === "hero";
  }

  return section.type === "contact" && ["address", "phone", "hours"].includes(field);
}

function fieldLimit(field: SectionTextField | ContentItemTextField): number {
  if (field === "phone") {
    return 100;
  }
  if (field === "address" || field === "hours") {
    return 1000;
  }
  if (field === "subheading" || field === "description") {
    return 5000;
  }
  return 255;
}

function sectionFieldLabel(field: SectionTextField): string {
  const labels: Record<SectionTextField, string> = {
    heading: "Heading",
    subheading: "Body",
    cta_text: "Call to action",
    address: "Address",
    phone: "Phone",
    hours: "Hours",
  };
  return labels[field];
}

const SECTION_FIELDS: SectionTextField[] = [
  "heading",
  "subheading",
  "cta_text",
  "address",
  "phone",
  "hours",
];

export function ContentEditor({
  pageSlug,
  content,
  version,
  dirty,
  saving,
  error,
  saved,
  onChange,
  onSave,
}: ContentEditorProps) {
  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSave();
  }

  return (
    <Card className="p-0 shadow-md hover:border-border">
      <form onSubmit={submit}>
        <div className="border-b border-border p-4 sm:p-5">
          <p className="text-label-lg font-medium text-primary">Edit page copy</p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-heading-lg">{labelForSlug(pageSlug)}</h3>
            {version ? (
              <span className="font-mono text-body-sm text-text-secondary">Version {version}</span>
            ) : null}
          </div>
          <p className="mt-2 text-body-sm text-text-secondary">
            Changes appear in the preview as you type. Save when this page is ready.
          </p>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          {content.sections.map((section, sectionIndex) => {
            const items = Array.isArray(section.items) ? section.items : [];

            return (
              <fieldset
                key={`${section.type}-${sectionIndex}`}
                disabled={saving}
                className="rounded-md border border-border p-4"
              >
                <legend className="px-2 text-label-md font-medium text-text-secondary">
                  Section {sectionIndex + 1} · {labelForSlug(section.type)}
                </legend>

                <div className="grid gap-4 sm:grid-cols-2">
                  {SECTION_FIELDS.filter((field) => hasField(section, field)).map((field) => (
                    <label
                      key={field}
                      className={field === "subheading" ? "sm:col-span-2" : undefined}
                    >
                      <span className="text-label-md text-text-primary">
                        {sectionFieldLabel(field)}
                        {isRequired(section, field) ? (
                          <span className="text-error" aria-hidden="true">
                            {" "}*
                          </span>
                        ) : null}
                      </span>
                      <textarea
                        value={textValue(section, field)}
                        required={isRequired(section, field)}
                        maxLength={fieldLimit(field)}
                        rows={field === "subheading" ? 3 : 2}
                        className={TEXTAREA_CLASS_NAME}
                        onChange={(event) =>
                          onChange(
                            updateSectionText(
                              content,
                              sectionIndex,
                              field,
                              event.target.value,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                </div>

                {items.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {items.map((item, itemIndex) => (
                      <fieldset key={itemIndex} className="rounded-md bg-muted p-3">
                        <legend className="px-2 text-label-sm font-medium text-text-secondary">
                          Item {itemIndex + 1}
                        </legend>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {(["title", "description"] as const).map((field) => (
                            <label key={field}>
                              <span className="text-label-md text-text-primary">
                                {field === "title" ? "Heading" : "Body"}
                                <span className="text-error" aria-hidden="true">
                                  {" "}*
                                </span>
                              </span>
                              <textarea
                                value={textValue(item, field)}
                                required
                                maxLength={fieldLimit(field)}
                                rows={field === "description" ? 3 : 2}
                                className={TEXTAREA_CLASS_NAME}
                                onChange={(event) =>
                                  onChange(
                                    updateContentItemText(
                                      content,
                                      sectionIndex,
                                      itemIndex,
                                      field,
                                      event.target.value,
                                    ),
                                  )
                                }
                              />
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                ) : null}
              </fieldset>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-h-5 text-body-sm" aria-live="polite">
            {error ? (
              <p className="text-error" role="alert">
                {error}
              </p>
            ) : saved ? (
              <p className="text-success">Page saved.</p>
            ) : dirty ? (
              <p className="text-text-secondary">Unsaved changes</p>
            ) : (
              <p className="text-text-secondary">All changes saved</p>
            )}
          </div>
          <Button type="submit" disabled={!dirty || saving}>
            {saving ? (
              <>
                <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              <>
                <Save className="size-5" aria-hidden="true" />
                Save page
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
