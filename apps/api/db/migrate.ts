import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import type { Pool, PoolClient, QueryResultRow } from 'pg';

import {
  createDatabasePool,
  DEFAULT_DATABASE_URL,
} from '../src/db/client.js';

interface AppliedMigrationRow extends QueryResultRow {
  checksum: string;
}

const migrationsDirectory = fileURLToPath(
  new URL('./migrations/', import.meta.url),
);

const checksum = (sql: string): string =>
  createHash('sha256').update(sql).digest('hex');

const rollback = async (client: PoolClient): Promise<void> => {
  try {
    await client.query('ROLLBACK');
  } catch {
    // Preserve the migration failure that caused the rollback.
  }
};

export const runMigrations = async (pool: Pool): Promise<string[]> => {
  const bootstrapClient = await pool.connect();
  try {
    await bootstrapClient.query('BEGIN');
    await bootstrapClient.query(
      "SELECT pg_advisory_xact_lock(hashtext('autosite_schema_migrations'))",
    );
    await bootstrapClient.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await bootstrapClient.query('COMMIT');
  } catch (error) {
    await rollback(bootstrapClient);
    throw error;
  } finally {
    bootstrapClient.release();
  }

  const filenames = (await readdir(migrationsDirectory))
    .filter((filename) => /^\d+_[a-z0-9_]+\.sql$/.test(filename))
    .sort((left, right) => left.localeCompare(right));
  const applied: string[] = [];

  for (const filename of filenames) {
    const sql = await readFile(`${migrationsDirectory}/${filename}`, 'utf8');
    const migrationChecksum = checksum(sql);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtext('autosite_schema_migrations'))",
      );
      const existing = await client.query<AppliedMigrationRow>(
        'SELECT checksum FROM schema_migrations WHERE filename = $1',
        [filename],
      );
      const existingMigration = existing.rows[0];
      if (existingMigration !== undefined) {
        if (existingMigration.checksum !== migrationChecksum) {
          throw new Error(
            `Applied migration ${filename} has changed; add a new migration instead`,
          );
        }
        await client.query('COMMIT');
        continue;
      }

      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
        [filename, migrationChecksum],
      );
      await client.query('COMMIT');
      applied.push(filename);
    } catch (error) {
      await rollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  return applied;
};

const databaseUrl = process.env['DATABASE_URL'] ?? DEFAULT_DATABASE_URL;
const pool = createDatabasePool(databaseUrl, { connectionTimeoutMillis: 5_000 });

try {
  const applied = await runMigrations(pool);
  console.log(
    applied.length === 0
      ? 'Database schema is already up to date.'
      : `Applied migrations: ${applied.join(', ')}`,
  );
} finally {
  await pool.end();
}
