import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Card, buttonVariants } from "@autosite/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <Card className="w-full max-w-lg py-12 text-center shadow-lg">
        <p className="font-mono text-heading-md text-primary">404</p>
        <h1 className="mt-3 text-display-md">That page isn’t here</h1>
        <p className="mt-3 text-body-md text-text-secondary">
          The link may be outdated, or the site may have moved.
        </p>
        <Link href="/" className={`${buttonVariants()} mt-6`}>
          <ArrowLeft className="size-5" aria-hidden="true" />
          Back to dashboard
        </Link>
      </Card>
    </main>
  );
}
