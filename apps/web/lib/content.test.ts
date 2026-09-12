import { describe, expect, it } from "vitest";

import {
  deriveSiteName,
  orderedPageSlugs,
  updateContentItemText,
  updateSectionText,
} from "./content";

describe("content helpers", () => {
  it("derives a concise project name from a one-line brief", () => {
    expect(deriveSiteName("Italian restaurant in Brooklyn serving fresh pasta")).toBe(
      "Italian Restaurant",
    );
  });

  it("orders the standard pages before custom pages", () => {
    expect(
      orderedPageSlugs({
        faq: { sections: [] },
        services: { sections: [] },
        home: { sections: [] },
      }),
    ).toEqual(["home", "services", "faq"]);
  });

  it("updates section copy without mutating the original page", () => {
    const original = {
      sections: [
        {
          type: "hero",
          heading: "Original heading",
          subheading: "Original body",
        },
      ],
    };

    const updated = updateSectionText(original, 0, "heading", "New heading");

    expect(updated.sections[0]?.heading).toBe("New heading");
    expect(original.sections[0]?.heading).toBe("Original heading");
  });

  it("removes an optional field when its copy is cleared", () => {
    const updated = updateSectionText(
      {
        sections: [
          {
            type: "contact",
            heading: "Visit",
            subheading: "Come say hello",
            address: "123 Main Street",
            phone: "555-0100",
            hours: "Weekdays",
          },
        ],
      },
      0,
      "subheading",
      "",
    );

    expect(updated.sections[0]).not.toHaveProperty("subheading");
  });

  it("updates an item body without changing sibling items", () => {
    const original = {
      sections: [
        {
          type: "features",
          items: [
            { title: "First", description: "First body" },
            { title: "Second", description: "Second body" },
          ],
        },
      ],
    };

    const updated = updateContentItemText(original, 0, 1, "description", "Updated body");

    expect(updated.sections[0]?.items?.[0]?.description).toBe("First body");
    expect(updated.sections[0]?.items?.[1]?.description).toBe("Updated body");
    expect(original.sections[0]?.items?.[1]?.description).toBe("Second body");
  });
});
