// PostgreSQL connection pool. Every repository uses pool.query() or gets a client from the pool.

import pg from 'pg';
import { env } from './env.js';
import { logger } from './logger.js';

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle database client');
});

/**
 * Quick database connectivity check. Throws if the database is unreachable.
 * @returns {Promise<void>}
 */
export async function checkDatabaseHealth() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}
