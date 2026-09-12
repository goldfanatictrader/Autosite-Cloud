import { clearSession, getToken, loginPath } from "./auth";
import type { ApiErrorEnvelope } from "./types";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(status: number, payload: ApiErrorEnvelope) {
    super(payload.error);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code;
    this.details = payload.details ?? {};
  }
}

interface ApiFetchOptions extends RequestInit {
  authenticated?: boolean;
}

function isErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    "code" in value &&
    typeof value.error === "string" &&
    typeof value.code === "string"
  );
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  { authenticated = true, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  if (init.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (authenticated) {
    const token = getToken();
    if (!token) {
      if (typeof window !== "undefined") {
        window.location.assign(loginPath());
      }
      throw new ApiError(401, {
        error: "Please sign in to continue.",
        code: "INVALID_TOKEN",
      });
    }
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: requestHeaders,
    });
  } catch {
    throw new ApiError(0, {
      error: "Could not reach the AutoSite API. Make sure the API server is running.",
      code: "NETWORK_ERROR",
    });
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    const errorPayload: ApiErrorEnvelope = isErrorEnvelope(payload)
      ? payload
      : {
          error: "Something went wrong. Please try again.",
          code: "UNKNOWN_ERROR",
        };

    if (response.status === 401 && authenticated && typeof window !== "undefined") {
      clearSession();
      window.location.assign(loginPath());
    }

    throw new ApiError(response.status, errorPayload);
  }

  return payload as T;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
