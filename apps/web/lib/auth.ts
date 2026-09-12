import type { User } from "./types";

const TOKEN_KEY = "autosite-token";
const USER_KEY = "autosite-user";

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(USER_KEY);
  if (!stored) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(stored);
    if (
      typeof value === "object" &&
      value !== null &&
      "id" in value &&
      "email" in value &&
      "name" in value &&
      typeof value.id === "string" &&
      typeof value.email === "string" &&
      typeof value.name === "string"
    ) {
      return value as User;
    }
  } catch {
    window.localStorage.removeItem(USER_KEY);
  }

  return null;
}

export function storeSession(token: string, user: User): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function loginPath(): string {
  if (typeof window === "undefined") {
    return "/login";
  }

  const current = `${window.location.pathname}${window.location.search}`;
  if (current === "/" || current.startsWith("/login")) {
    return "/login";
  }

  return `/login?next=${encodeURIComponent(current)}`;
}
