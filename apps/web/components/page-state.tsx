import { AlertCircle, LoaderCircle } from "lucide-react";

import { Button, Card } from "@autosite/ui";

export function PageLoading({ label = "Loading your sites…" }: { label?: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-body-md text-text-secondary">
        <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="mx-auto max-w-xl border-error/30 text-center shadow-md" role="alert">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-error dark:bg-red-950">
        <AlertCircle className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-heading-lg">We couldn’t load this view</h2>
      <p className="mt-2 text-body-md text-text-secondary">{message}</p>
      <Button className="mt-6" onClick={onRetry}>
        Try again
      </Button>
    </Card>
  );
}
