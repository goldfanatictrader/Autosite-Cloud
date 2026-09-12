import type { AuthResponse, User } from '@autosite/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { HttpError } from '../../shared/errors.js';
import { verifyPassword } from '../../shared/password.js';
import { validate } from '../../shared/validation.js';
import {
  EmailAlreadyExistsError,
  type Store,
  type UserRecord,
} from '../../store/store.js';

const signupSchema = z
  .object({
    email: z.string().trim().email('Must be a valid email address').max(255),
    password: z.string().min(8, 'Must be at least 8 characters').max(128),
    name: z.string().trim().min(1, 'Name is required').max(255),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().trim().email('Must be a valid email address').max(255),
    password: z.string().min(1, 'Password is required').max(128),
  })
  .strict();

const publicUser = (user: UserRecord, includeCreatedAt: boolean): User => ({
  id: user.id,
  email: user.email,
  name: user.name,
  ...(includeCreatedAt ? { created_at: user.createdAt } : {}),
});

const issueToken = (app: FastifyInstance, user: UserRecord): string =>
  app.jwt.sign(
    {
      sub: user.id,
      workspace_id: user.workspaceId,
      role: 'owner',
    },
    { expiresIn: '15m' },
  );

export const registerAuthRoutes = (
  app: FastifyInstance,
  store: Store,
): void => {
  app.post('/auth/signup', async (request, reply) => {
    const body = validate(signupSchema, request.body);
    if ((await store.findUserByEmail(body.email)) !== undefined) {
      throw new HttpError(409, 'Email already registered', 'EMAIL_EXISTS');
    }

    let user: UserRecord;
    try {
      user = await store.createUser({
        email: body.email,
        password: body.password,
        name: body.name,
      });
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        throw new HttpError(409, 'Email already registered', 'EMAIL_EXISTS');
      }
      throw error;
    }
    const response: AuthResponse = {
      user: publicUser(user, true),
      token: issueToken(app, user),
    };

    return reply.status(201).send(response);
  });

  app.post('/auth/login', async (request, reply) => {
    const body = validate(loginSchema, request.body);
    const user = await store.findUserByEmail(body.email);

    if (user === undefined || !verifyPassword(body.password, user.passwordHash)) {
      throw new HttpError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const response: AuthResponse = {
      user: publicUser(user, false),
      token: issueToken(app, user),
    };
    return reply.status(200).send(response);
  });
};
