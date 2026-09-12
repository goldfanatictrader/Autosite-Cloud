import type { FastifyRequest } from 'fastify';

import { HttpError } from './errors.js';

export const authenticate = async (request: FastifyRequest): Promise<void> => {
  try {
    await request.jwtVerify();
  } catch {
    throw new HttpError(
      401,
      'Missing or invalid authentication token',
      'INVALID_TOKEN',
    );
  }
};
