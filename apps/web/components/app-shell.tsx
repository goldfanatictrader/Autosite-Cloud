"use client";

import { Home, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { buttonVariants, cn } from "@autosite/ui";

import { clearSession } from "@/lib/auth";

import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();

  function signOut(): void {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              href="/create"
              className={cn(buttonVariants({ size: "compact" }), "hidden sm:inline-flex")}
            >
              <Plus className="size-5" aria-hidden="true" />
              Create site
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={signOut}
              className="inline-flex size-12 items-center justify-center rounded-md text-text-secondary transition hover:bg-muted hover:text-text-primary"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
        {children}
      </main>

      <nav
        aria-label="Primary navigation"
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface sm:hidden"
      >
        <div className="grid h-16 grid-cols-2">
          <MobileNavLink href="/" active={pathname === "/"} label="Sites">
            <Home className="size-6" aria-hidden="true" />
          </MobileNavLink>
          <MobileNavLink href="/create" active={pathname === "/create"} label="Create">
            <Plus className="size-6" aria-hidden="true" />
          </MobileNavLink>
        </div>
      </nav>
    </div>
  );
}

function MobileNavLink({
  href,
  active,
  label,
  children,
}: Readonly<{
  href: string;
  active: boolean;
  label: string;
  children: ReactNode;
}>) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-11 flex-col items-center justify-center gap-1 text-body-sm text-placeholder",
        active && "text-primary",
      )}
      aria-current={active ? "page" : undefined}
    >
      {children}
      <span>{label}</span>
    </Link>
  );
}
