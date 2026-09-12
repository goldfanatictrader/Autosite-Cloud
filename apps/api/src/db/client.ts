import { Pool } from 'pg';

export const DEFAULT_DATABASE_URL =
  'postgres://autosite:autosite@localhost:5432/autosite';

export interface DatabasePoolOptions {
  connectionTimeoutMillis?: number;
  onError?: (error: Error) => void;
}

export const createDatabasePool = (
  databaseUrl: string,
  options: DatabasePoolOptions = {},
): Pool => {
  const pool = new Pool({
    application_name: 'autosite-api',
    connectionString: databaseUrl,
    connectionTimeoutMillis: options.connectionTimeoutMillis ?? 2_000,
    idleTimeoutMillis: 30_000,
    max: 10,
  });

  pool.on('error', options.onError ?? (() => undefined));
  return pool;
};

export const verifyDatabaseConnection = async (pool: Pool): Promise<void> => {
  await pool.query('SELECT 1');
};

export const hasPostgresErrorCode = (
  error: unknown,
  code: string,
): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === code;
