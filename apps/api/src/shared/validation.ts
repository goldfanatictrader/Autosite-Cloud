import { z } from 'zod';

import { HttpError } from './errors.js';

const formatIssues = (issues: z.ZodIssue[]): Record<string, unknown> => {
  const details: Record<string, string> = {};

  for (const issue of issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'request';
    if (details[path] === undefined) {
      details[path] = issue.message;
    }
  }

  return details;
};

export const validate = <Schema extends z.ZodTypeAny>(
  schema: Schema,
  value: unknown,
): z.infer<Schema> => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new HttpError(
      422,
      'Validation failed',
      'VALIDATION_ERROR',
      formatIssues(result.error.issues),
    );
  }

  return result.data;
};
