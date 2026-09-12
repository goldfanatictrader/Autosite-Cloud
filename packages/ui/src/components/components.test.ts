import { describe, expect, it } from "vitest";

import { badgeVariants } from "./badge";
import { buttonVariants } from "./button";

describe("shared component variants", () => {
  it("uses the primary design token for the main call to action", () => {
    expect(buttonVariants()).toContain("bg-primary");
    expect(buttonVariants()).toContain("rounded-md");
  });

  it("maps deployment statuses to their semantic tokens", () => {
    expect(badgeVariants({ variant: "draft" })).toContain("text-draft");
    expect(badgeVariants({ variant: "live" })).toContain("text-success");
    expect(badgeVariants({ variant: "building" })).toContain("text-warning");
    expect(badgeVariants({ variant: "error" })).toContain("text-error");
  });
});
