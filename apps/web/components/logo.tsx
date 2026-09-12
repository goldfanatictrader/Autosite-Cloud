import { Sparkles } from "lucide-react";
import Link from "next/link";

import { cn } from "@autosite/ui";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex min-h-11 items-center gap-3 rounded-md text-heading-md text-text-primary",
        className,
      )}
      aria-label="AutoSite Cloud dashboard"
    >
      <span className="grid size-10 place-items-center rounded-lg bg-primary text-white shadow-sm">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <span>
        AutoSite <span className="text-primary">Cloud</span>
      </span>
    </Link>
  );
}
