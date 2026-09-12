import '@fastify/jwt';

interface JwtUser {
  sub: string;
  workspace_id: string;
  role: 'owner';
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtUser;
    user: JwtUser;
  }
}
