import { Badge } from "@autosite/ui";

import type { SiteStatus } from "@/lib/types";

const LABELS: Record<SiteStatus, string> = {
  draft: "Draft",
  building: "Building",
  live: "Live",
  error: "Error",
};

export function StatusBadge({ status }: { status: SiteStatus }) {
  return (
    <Badge variant={status}>
      <span
        className="mr-1.5 size-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {LABELS[status]}
    </Badge>
  );
}
