// SQL queries for analytics and reporting.

import { pool } from '../../config/database.js';

/**
 * Overall complaint statistics.
 *
 * @param {object} filters - { from, to, bureau_id }
 * @returns {Promise<object>}
 */
export async function getComplaintStats(filters = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.from) {
    conditions.push(`c.received_on >= $${idx++}`);
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`c.received_on <= $${idx++}`);
    params.push(filters.to);
  }
  if (filters.bureau_id) {
    conditions.push(`c.current_bureau_id = $${idx++}`);
    params.push(filters.bureau_id);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       SUM(CASE WHEN c.status NOT IN ('RESOLVED','CLOSED','REJECTED') THEN 1 ELSE 0 END)::int AS open,
       SUM(CASE WHEN c.status IN ('RESOLVED','CLOSED') THEN 1 ELSE 0 END)::int AS resolved,
       SUM(CASE WHEN c.status = 'REJECTED' THEN 1 ELSE 0 END)::int AS rejected,
       SUM(CASE WHEN c.status = 'ESCALATED' THEN 1 ELSE 0 END)::int AS escalated,
       SUM(CASE WHEN c.sla_due_at IS NOT NULL AND c.sla_due_at < now()
                 AND c.status NOT IN ('RESOLVED','CLOSED','REJECTED')
                 THEN 1 ELSE 0 END)::int AS overdue,
       SUM(CASE WHEN c.has_overlap = true THEN 1 ELSE 0 END)::int AS with_overlaps
     FROM complaints c ${where}`,
    params,
  );

  return rows[0];
}

/**
 * Complaint breakdown by status.
 *
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function getStatusBreakdown(filters = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.from) { conditions.push(`received_on >= $${idx++}`); params.push(filters.from); }
  if (filters.to) { conditions.push(`received_on <= $${idx++}`); params.push(filters.to); }
  if (filters.bureau_id) { conditions.push(`current_bureau_id = $${idx++}`); params.push(filters.bureau_id); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT status, COUNT(*)::int AS count
     FROM complaints ${where}
     GROUP BY status
     ORDER BY count DESC`,
    params,
  );
  return rows;
}

/**
 * Complaints by bureau.
 *
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function getBureauBreakdown(filters = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.from) { conditions.push(`c.received_on >= $${idx++}`); params.push(filters.from); }
  if (filters.to) { conditions.push(`c.received_on <= $${idx++}`); params.push(filters.to); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT b.id AS bureau_id, b.name AS bureau_name, b.code AS bureau_code,
            COUNT(c.id)::int AS total,
            SUM(CASE WHEN c.status NOT IN ('RESOLVED','CLOSED','REJECTED') THEN 1 ELSE 0 END)::int AS open,
            SUM(CASE WHEN c.status IN ('RESOLVED','CLOSED') THEN 1 ELSE 0 END)::int AS resolved,
            SUM(CASE WHEN c.sla_due_at < now() AND c.status NOT IN ('RESOLVED','CLOSED','REJECTED')
                      THEN 1 ELSE 0 END)::int AS overdue
     FROM bureaus b
     LEFT JOIN complaints c ON c.current_bureau_id = b.id
     ${where ? where.replace('WHERE', `${conditions.length ? 'AND' : 'WHERE'}`) : ''}
     GROUP BY b.id, b.name, b.code
     ORDER BY total DESC`,
    params,
  );
  return rows;
}

/**
 * Complaints by geographic region.
 *
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function getRegionBreakdown(filters = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.from) { conditions.push(`c.received_on >= $${idx++}`); params.push(filters.from); }
  if (filters.to) { conditions.push(`c.received_on <= $${idx++}`); params.push(filters.to); }

  const where = conditions.length ? `AND ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT r.id AS region_id, r.name AS region_name,
            COUNT(c.id)::int AS total,
            SUM(CASE WHEN c.status NOT IN ('RESOLVED','CLOSED','REJECTED') THEN 1 ELSE 0 END)::int AS open,
            SUM(CASE WHEN c.status IN ('RESOLVED','CLOSED') THEN 1 ELSE 0 END)::int AS resolved,
            SUM(CASE WHEN c.sla_due_at < now() AND c.status NOT IN ('RESOLVED','CLOSED','REJECTED')
                      THEN 1 ELSE 0 END)::int AS overdue
     FROM regions r
     LEFT JOIN institutions i ON i.region_id = r.id
     LEFT JOIN complaints c ON c.institution_id = i.id ${where}
     GROUP BY r.id, r.name
     ORDER BY total DESC`,
    params,
  );
  return rows;
}

/**
 * Complaints by category.
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function getCategoryBreakdown(filters = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.from) { conditions.push(`c.received_on >= $${idx++}`); params.push(filters.from); }
  if (filters.to) { conditions.push(`c.received_on <= $${idx++}`); params.push(filters.to); }
  if (filters.bureau_id) { conditions.push(`c.current_bureau_id = $${idx++}`); params.push(filters.bureau_id); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT cc.id AS category_id, cc.name AS category_name,
            COUNT(c.id)::int AS total,
            SUM(CASE WHEN c.status NOT IN ('RESOLVED','CLOSED','REJECTED') THEN 1 ELSE 0 END)::int AS open,
            SUM(CASE WHEN c.status IN ('RESOLVED','CLOSED') THEN 1 ELSE 0 END)::int AS resolved
     FROM complaint_categories cc
     LEFT JOIN complaints c ON c.category_id = cc.id
     ${where ? where.replace('WHERE', `${conditions.length ? 'AND' : 'WHERE'}`) : ''}
     GROUP BY cc.id, cc.name
     ORDER BY total DESC`,
    params,
  );
  return rows;
}

/**
 * SLA compliance report — disposal rate.
 *
 * @param {object} filters
 * @returns {Promise<object>}
 */
export async function getSlaCompliance(filters = {}) {
  const conditions = [`c.sla_due_at IS NOT NULL`];
  const params = [];
  let idx = 1;

  if (filters.from) { conditions.push(`c.received_on >= $${idx++}`); params.push(filters.from); }
  if (filters.to) { conditions.push(`c.received_on <= $${idx++}`); params.push(filters.to); }
  if (filters.bureau_id) { conditions.push(`c.current_bureau_id = $${idx++}`); params.push(filters.bureau_id); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total_with_sla,
       SUM(CASE WHEN c.status IN ('RESOLVED','CLOSED') AND c.updated_at <= c.sla_due_at
                THEN 1 ELSE 0 END)::int AS resolved_within_sla,
       SUM(CASE WHEN c.status IN ('RESOLVED','CLOSED') AND c.updated_at > c.sla_due_at
                THEN 1 ELSE 0 END)::int AS resolved_after_sla,
       SUM(CASE WHEN c.status NOT IN ('RESOLVED','CLOSED','REJECTED') AND c.sla_due_at < now()
                THEN 1 ELSE 0 END)::int AS currently_overdue,
       SUM(CASE WHEN c.status NOT IN ('RESOLVED','CLOSED','REJECTED') AND c.sla_due_at >= now()
                THEN 1 ELSE 0 END)::int AS within_sla_open
     FROM complaints c ${where}`,
    params,
  );

  const row = rows[0];
  const totalResolved = (row.resolved_within_sla || 0) + (row.resolved_after_sla || 0);
  row.disposal_rate = totalResolved > 0
    ? parseFloat(((row.resolved_within_sla / totalResolved) * 100).toFixed(1))
    : 0;

  return row;
}

/**
 * Aging analysis — how long open complaints have been pending.
 *
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function getAgingAnalysis(filters = {}) {
  const conditions = [`c.status NOT IN ('RESOLVED','CLOSED','REJECTED')`];
  const params = [];
  let idx = 1;

  if (filters.bureau_id) { conditions.push(`c.current_bureau_id = $${idx++}`); params.push(filters.bureau_id); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const { rows } = await pool.query(
    `SELECT
       SUM(CASE WHEN age <= 7 THEN 1 ELSE 0 END)::int AS "0_7_days",
       SUM(CASE WHEN age > 7 AND age <= 15 THEN 1 ELSE 0 END)::int AS "8_15_days",
       SUM(CASE WHEN age > 15 AND age <= 30 THEN 1 ELSE 0 END)::int AS "16_30_days",
       SUM(CASE WHEN age > 30 AND age <= 60 THEN 1 ELSE 0 END)::int AS "31_60_days",
       SUM(CASE WHEN age > 60 THEN 1 ELSE 0 END)::int AS "60_plus_days",
       COUNT(*)::int AS total
     FROM (
       SELECT EXTRACT(DAY FROM now() - c.received_on)::int AS age
       FROM complaints c ${where}
     ) sub`,
    params,
  );
  return rows[0];
}

/**
 * Trend data — complaints per month or quarter.
 *
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function getMonthlyTrend(filters = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.from) { conditions.push(`received_on >= $${idx++}`); params.push(filters.from); }
  if (filters.to) { conditions.push(`received_on <= $${idx++}`); params.push(filters.to); }
  if (filters.bureau_id) { conditions.push(`current_bureau_id = $${idx++}`); params.push(filters.bureau_id); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const isQuarter = filters.period === 'quarter';
  const truncType = isQuarter ? 'quarter' : 'month';
  const formatStr = isQuarter ? 'YYYY-"Q"Q' : 'YYYY-MM';

  const { rows } = await pool.query(
    `SELECT
       TO_CHAR(DATE_TRUNC('${truncType}', received_on), '${formatStr}') AS period,
       COUNT(*)::int AS total,
       SUM(CASE WHEN status IN ('RESOLVED','CLOSED') THEN 1 ELSE 0 END)::int AS resolved,
       SUM(CASE WHEN status NOT IN ('RESOLVED','CLOSED','REJECTED') THEN 1 ELSE 0 END)::int AS open,
       SUM(CASE WHEN has_overlap = true THEN 1 ELSE 0 END)::int AS with_overlap
     FROM complaints ${where}
     GROUP BY DATE_TRUNC('${truncType}', received_on)
     ORDER BY DATE_TRUNC('${truncType}', received_on) ASC`,
    params,
  );
  return rows;
}

/**
 * Overlap analytics report — breakdown by review status, link types, and match methods.
 *
 * @returns {Promise<object>}
 */
export async function getOverlapAnalytics() {
  const statusStats = await pool.query(
    `SELECT review_status, COUNT(*)::int AS count
     FROM complaint_links
     GROUP BY review_status`,
  );

  const typeStats = await pool.query(
    `SELECT link AS link_type, COUNT(*)::int AS count,
            COALESCE(ROUND(AVG(similarity_score), 3), 0) AS avg_similarity
     FROM complaint_links
     GROUP BY link`,
  );

  const reasonsBreakdown = await pool.query(
    `SELECT method, COUNT(*)::int AS count,
            COALESCE(ROUND(AVG(score), 3), 0) AS avg_score
     FROM overlap_match_reasons
     GROUP BY method`,
  );

  return {
    review_status_breakdown: statusStats.rows,
    link_type_breakdown: typeStats.rows,
    matching_methods: reasonsBreakdown.rows,
  };
}

/**
 * Institutions with most complaints (top-N hotspots).
 *
 * @param {number} topN
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function getInstitutionHotspots(topN = 10, filters = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.from) { conditions.push(`c.received_on >= $${idx++}`); params.push(filters.from); }
  if (filters.to) { conditions.push(`c.received_on <= $${idx++}`); params.push(filters.to); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(topN);
  const limitIdx = idx;

  const { rows } = await pool.query(
    `SELECT i.id, i.aicte_id, i.name, i.city, i.state,
            COUNT(c.id)::int AS total_complaints,
            SUM(CASE WHEN c.has_overlap = true THEN 1 ELSE 0 END)::int AS overlap_complaints,
            SUM(CASE WHEN c.status NOT IN ('RESOLVED','CLOSED','REJECTED') THEN 1 ELSE 0 END)::int AS open
     FROM institutions i
     JOIN complaints c ON c.institution_id = i.id
     ${where}
     GROUP BY i.id, i.aicte_id, i.name, i.city, i.state
     ORDER BY total_complaints DESC
     LIMIT $${idx}`,
    params,
  );
  return rows;
}
