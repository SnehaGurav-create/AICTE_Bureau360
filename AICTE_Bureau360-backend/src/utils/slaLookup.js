// Finds the best matching active SLA rule for a complaint.
// Most specific rule wins (category + priority + bureau > category + priority > ... > default).

import { pool } from '../config/database.js';

/**
 * Find the most specific active SLA rule for a given complaint.
 * Returns the first matching rule in descending specificity order.
 *
 * @param {object} params
 * @param {number} params.categoryId - Complaint category ID
 * @param {string} params.priority - Complaint priority (LOW/MEDIUM/HIGH/CRITICAL)
 * @param {number|null} params.bureauId - Current bureau ID (optional)
 * @param {import('pg').PoolClient} [client] - Optional client (use within transaction)
 * @returns {Promise<object|null>} SLA rule object or null if no default exists
 */
export async function findBestSlaRule({ categoryId, priority, bureauId }, client = pool) {
  const { rows } = await client.query(
    `SELECT id, name, first_response_hours, resolution_hours,
            reminder_before_hours, escalate_after_hours, escalate_to_bureau_id
     FROM sla_rules
     WHERE is_active = true
       AND (category_id = $1 OR category_id IS NULL)
       AND (priority = $2 OR priority IS NULL)
       AND (bureau_id = $3 OR bureau_id IS NULL)
     ORDER BY
       -- Most specific first: all three, then two, then one, then none (default)
       (category_id IS NOT NULL)::int DESC,
       (priority IS NOT NULL)::int DESC,
       (bureau_id IS NOT NULL)::int DESC,
       id
     LIMIT 1`,
    [categoryId, priority, bureauId],
  );

  return rows[0] || null;
}

/**
 * Calculate SLA due timestamp from a base timestamp and resolution hours.
 *
 * @param {Date|string} baseTime - Starting time (usually complaint.created_at or received_on)
 * @param {number} resolutionHours - Hours until due
 * @returns {Date}
 */
export function calculateSlaDue(baseTime, resolutionHours) {
  const base = new Date(baseTime);
  return new Date(base.getTime() + resolutionHours * 60 * 60 * 1000);
}
