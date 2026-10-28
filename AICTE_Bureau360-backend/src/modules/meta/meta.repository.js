// Queries for dropdown/reference data: categories, statuses, priorities, bureaus, etc.

import { pool } from '../../config/database.js';

/**
 * Fetch all active complaint categories.
 * @returns {Promise<Array>}
 */
export async function findCategories() {
  const { rows } = await pool.query(
    `SELECT id, code, name, description FROM complaint_categories WHERE is_active = TRUE ORDER BY name`,
  );
  return rows;
}

/**
 * Fetch all bureaus.
 * @returns {Promise<Array>}
 */
export async function findBureaus() {
  const { rows } = await pool.query(
    `SELECT id, code, name, type, parent_id, region_id, email, is_active
     FROM bureaus ORDER BY name`,
  );
  return rows;
}

/**
 * Fetch all regions.
 * @returns {Promise<Array>}
 */
export async function findRegions() {
  const { rows } = await pool.query(`SELECT id, name FROM regions ORDER BY name`);
  return rows;
}

/**
 * Fetch all roles.
 * @returns {Promise<Array>}
 */
export async function findRoles() {
  const { rows } = await pool.query(`SELECT id, code, name, scope FROM roles ORDER BY id`);
  return rows;
}
