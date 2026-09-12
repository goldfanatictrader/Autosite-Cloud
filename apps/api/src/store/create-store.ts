import type { Pool } from 'pg';

import {
  createDatabasePool,
  verifyDatabaseConnection,
} from '../db/client.js';
import { InMemoryStore } from './memory-store.js';
import { PostgresStore } from './pg-store.js';
import type { Store } from './store.js';

export interface StoreSelection {
  backend: 'memory' | 'postgres';
  fallbackCode?: string;
  store: Store;
}

export interface SelectStoreOptions {
  databaseUrl: string;
  clock?: () => Date;
  onPoolError?: (code: string) => void;
}

const errorCode = (error: unknown): string =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  typeof error.code === 'string'
    ? error.code
    : 'DATABASE_UNAVAILABLE';

export const selectStore = async (
  options: SelectStoreOptions,
): Promise<StoreSelection> => {
  const clock = options.clock ?? (() => new Date());
  let pool: Pool | undefined;

  try {
    pool = createDatabasePool(options.databaseUrl, {
      connectionTimeoutMillis: 2_000,
      onError: (error) => {
        options.onPoolError?.(errorCode(error));
      },
    });
    await verifyDatabaseConnection(pool);
    return {
      backend: 'postgres',
      store: new PostgresStore(pool, clock),
    };
  } catch (error) {
    if (pool !== undefined) {
      try {
        await pool.end();
      } catch {
        // The connection probe already failed; fallback remains safe.
      }
    }
    return {
      backend: 'memory',
      fallbackCode: errorCode(error),
      store: new InMemoryStore(clock),
    };
  }
};
