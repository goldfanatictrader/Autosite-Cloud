import { describe, expect, it } from "vitest";

import { deriveSiteName, orderedPageSlugs } from "./content";

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
});
