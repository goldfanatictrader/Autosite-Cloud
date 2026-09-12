"use client";

import { ArrowRight, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Button, Card, Input } from "@autosite/ui";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { getToken, storeSession } from "@/lib/auth";
import type { AuthResponse } from "@/lib/types";

const DEMO_EMAIL = "demo@autosite.cloud";
const DEMO_PASSWORD = "DemoPass123!";

function safeNextPath(): string {
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace(safeNextPath());
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await apiFetch<AuthResponse>(
        "/auth/login",
        {
          authenticated: false,
          method: "POST",
          body: JSON.stringify({ email: email.trim(), password }),
        },
      );
      storeSession(response.token, response.user);
      window.location.replace(safeNextPath());
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 size-[28rem] rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl items-center justify-between">
        <Logo />
        <ThemeToggle />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl items-center gap-12 py-10 lg:grid-cols-2">
        <section className="hidden lg:block" aria-labelledby="welcome-heading">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary-light px-3 py-2 text-label-md text-violet-800 dark:bg-violet-950 dark:text-violet-200">
            <Sparkles className="size-4" aria-hidden="true" />
            AI-powered website copy
          </span>
          <h1 id="welcome-heading" className="mt-6 max-w-xl text-display-lg text-text-primary">
            Your next website starts with one sentence.
          </h1>
          <p className="mt-5 max-w-lg text-body-lg text-text-secondary">
            Turn a short business brief into polished home, about, services, and contact
            pages—then manage every project in one place.
          </p>
        </section>

        <Card className="mx-auto w-full max-w-md border-border p-6 shadow-lg sm:p-8">
          <div className="grid size-12 place-items-center rounded-lg bg-primary-light text-primary dark:bg-blue-950">
            <LockKeyhole className="size-6" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-display-sm">Welcome back</h1>
          <p className="mt-2 text-body-md text-text-secondary">
            Sign in to manage your sites and create new content.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="mb-2 block text-label-lg text-text-primary">
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-4 top-3.5 size-5 text-placeholder"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-12"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-label-lg text-text-primary">
                  Password
                </label>
                <span className="text-body-sm text-text-secondary">8+ characters</span>
              </div>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-4 top-3.5 size-5 text-placeholder"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  className="pl-12"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-md border border-error/30 bg-red-50 p-3 text-body-md text-red-800 dark:bg-red-950 dark:text-red-200"
              >
                {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
              {!submitting ? <ArrowRight className="size-5" aria-hidden="true" /> : null}
            </Button>
          </form>

          <div className="mt-6 rounded-md bg-muted p-4">
            <p className="text-label-md font-medium text-text-primary">Demo account</p>
            <p className="mt-1 break-all font-mono text-body-sm text-text-secondary">
              {DEMO_EMAIL} · {DEMO_PASSWORD}
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
