import type { ApiError } from '@autosite/shared';

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'HttpError';
  }

  toResponse(): ApiError {
    return {
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

export const apiError = (
  error: string,
  code: string,
  details: Record<string, unknown> = {},
): ApiError => ({ error, code, details });
