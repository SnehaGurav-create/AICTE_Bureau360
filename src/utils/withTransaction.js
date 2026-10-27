// Runs a callback inside a PostgreSQL transaction. Used for any write that touches >1 table.

import { pool } from '../config/database.js';

/**
 * Acquires a client from the pool, begins a transaction, runs the callback,
 * and commits on success or rolls back on error.
 *
 * @param {(client: import('pg').PoolClient) => Promise<T>} callback
 * @returns {Promise<T>} The value returned by the callback
 * @template T
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
