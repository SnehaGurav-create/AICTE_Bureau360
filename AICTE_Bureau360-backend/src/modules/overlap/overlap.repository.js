// All SQL queries for overlap detection and complaint links.

import { pool } from '../../config/database.js';

/**
 * Find all complaints for a given institution.
 *
 * @param {string} institutionId - Institution UUID
 * @param {string} [excludeComplaintId] - Optionally exclude a specific complaint
 * @param {import('pg').PoolClient|import('pg').Pool} [db=pool]
 * @returns {Promise<Array>}
 */
export async function findComplaintsByInstitution(institutionId, excludeComplaintId = null, db = pool) {
  let sql = `
    SELECT c.*, i.name AS institution_name, i.aicte_id,
           cc.name AS category_name, b.name AS bureau_name
    FROM complaints c
    JOIN institutions i ON i.id = c.institution_id
    JOIN complaint_categories cc ON cc.id = c.category_id
    LEFT JOIN bureaus b ON b.id = c.current_bureau_id
    WHERE c.institution_id = $1
  `;
  const params = [institutionId];

  if (excludeComplaintId) {
    sql += ` AND c.id <> $2`;
    params.push(excludeComplaintId);
  }

  sql += ` ORDER BY c.created_at DESC`;

  const { rows } = await db.query(sql, params);
  return rows;
}

/**
 * Find institutions whose name is similar to the given name using pg_trgm.
 *
 * @param {string} name - Institution name to search
 * @param {number} [threshold=0.3] - Similarity threshold
 * @param {string} [excludeId] - Exclude an institution UUID
 * @returns {Promise<Array>}
 */
export async function findSimilarInstitutions(name, threshold = 0.3, excludeId = null) {
  let sql = `
    SELECT id, aicte_id, name,
           similarity(name, $1) AS sim_score
    FROM institutions
    WHERE similarity(name, $1) > $2
  `;
  const params = [name, threshold];

  if (excludeId) {
    sql += ` AND id <> $3`;
    params.push(excludeId);
  }

  sql += ` ORDER BY sim_score DESC LIMIT 20`;

  const { rows } = await pool.query(sql, params);
  return rows;
}

/**
 * Create a complaint link (overlap / duplicate / related).
 *
 * @param {object} data
 * @param {import('pg').PoolClient} client
 * @returns {Promise<object>}
 */
export async function createLink(data, client) {
  const {
    complaint_id,
    related_complaint_id,
    link = 'OVERLAP',
    similarity_score,
    created_by,
  } = data;

  const { rows } = await client.query(
    `INSERT INTO complaint_links (
       complaint_id, related_complaint_id, link, similarity_score, created_by
     ) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (LEAST(complaint_id, related_complaint_id), GREATEST(complaint_id, related_complaint_id)) DO UPDATE
       SET similarity_score = GREATEST(complaint_links.similarity_score, EXCLUDED.similarity_score),
           link = EXCLUDED.link
     RETURNING *`,
    [complaint_id, related_complaint_id, link, similarity_score, created_by || null],
  );

  return rows[0];
}

/**
 * Insert an explainable match reason for a link.
 *
 * @param {object} data
 * @param {import('pg').PoolClient} client
 * @returns {Promise<object>}
 */
export async function insertMatchReason(data, client) {
  const { link_id, method, detail, score, metadata = {} } = data;

  const { rows } = await client.query(
    `INSERT INTO overlap_match_reasons (link_id, method, detail, score, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [link_id, method, detail, score || 0, metadata],
  );

  return rows[0];
}

/**
 * Find all links for a complaint with match reasons.
 *
 * @param {string} complaintId
 * @returns {Promise<Array>}
 */
export async function findLinksByComplaintId(complaintId) {
  const { rows } = await pool.query(
    `SELECT cl.*,
            c.complaint_no AS related_complaint_no,
            c.title AS related_complaint_title,
            c.status AS related_status,
            i.name AS related_institution_name,
            i.aicte_id AS related_aicte_id,
            b.name AS related_bureau_name,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', mr.id, 'method', mr.method,
                  'detail', mr.detail, 'score', mr.score
                )
              ) FILTER (WHERE mr.id IS NOT NULL),
              '[]'
            ) AS match_reasons
     FROM complaint_links cl
     JOIN complaints c ON c.id = cl.related_complaint_id
     JOIN institutions i ON i.id = c.institution_id
     LEFT JOIN bureaus b ON b.id = c.current_bureau_id
     LEFT JOIN overlap_match_reasons mr ON mr.link_id = cl.id
     WHERE cl.complaint_id = $1
        OR cl.related_complaint_id = $1
     GROUP BY cl.id, c.complaint_no, c.title, c.status,
              i.name, i.aicte_id, b.name
     ORDER BY cl.similarity_score DESC NULLS LAST`,
    [complaintId],
  );

  return rows;
}

/**
 * List all pending-review links with pagination (overlap review centre).
 *
 * @param {object} filters - { review_status, institution_id, bureau_id }
 * @param {object} pagination - { limit, offset }
 * @returns {Promise<{ rows: Array, total: number }>}
 */
export async function findPendingLinks(filters, pagination) {
  const { limit, offset } = pagination;
  const conditions = [];
  const params = [];
  let idx = 1;

  // Default: show PENDING_REVIEW
  const reviewStatus = filters.review_status || 'PENDING_REVIEW';
  conditions.push(`cl.review_status = $${idx++}`);
  params.push(reviewStatus);

  if (filters.institution_id) {
    conditions.push(`(c1.institution_id = $${idx} OR c2.institution_id = $${idx})`);
    params.push(filters.institution_id);
    idx++;
  }

  if (filters.bureau_id) {
    conditions.push(`(c1.current_bureau_id = $${idx} OR c2.current_bureau_id = $${idx})`);
    params.push(filters.bureau_id);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count
  const countSql = `
    SELECT COUNT(*) AS total
    FROM complaint_links cl
    JOIN complaints c1 ON c1.id = cl.complaint_id
    JOIN complaints c2 ON c2.id = cl.related_complaint_id
    ${where}
  `;
  const { rows: countRows } = await pool.query(countSql, params);
  const total = parseInt(countRows[0].total, 10);

  // Data
  const dataSql = `
    SELECT cl.*,
           c1.complaint_no AS complaint_no_a,
           c1.title AS title_a,
           c1.status AS status_a,
           i1.name AS institution_name_a,
           i1.aicte_id AS aicte_id_a,
           b1.name AS bureau_name_a,
           c2.complaint_no AS complaint_no_b,
           c2.title AS title_b,
           c2.status AS status_b,
           i2.name AS institution_name_b,
           i2.aicte_id AS aicte_id_b,
           b2.name AS bureau_name_b,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', mr.id, 'method', mr.method,
                 'detail', mr.detail, 'score', mr.score
               )
             ) FILTER (WHERE mr.id IS NOT NULL),
             '[]'
           ) AS match_reasons
    FROM complaint_links cl
    JOIN complaints c1 ON c1.id = cl.complaint_id
    JOIN complaints c2 ON c2.id = cl.related_complaint_id
    JOIN institutions i1 ON i1.id = c1.institution_id
    JOIN institutions i2 ON i2.id = c2.institution_id
    LEFT JOIN bureaus b1 ON b1.id = c1.current_bureau_id
    LEFT JOIN bureaus b2 ON b2.id = c2.current_bureau_id
    LEFT JOIN overlap_match_reasons mr ON mr.link_id = cl.id
    ${where}
    GROUP BY cl.id, c1.complaint_no, c1.title, c1.status,
             i1.name, i1.aicte_id, b1.name,
             c2.complaint_no, c2.title, c2.status,
             i2.name, i2.aicte_id, b2.name
    ORDER BY cl.created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const dataParams = [...params, limit, offset];
  const { rows } = await pool.query(dataSql, dataParams);

  return { rows, total };
}

/**
 * Update review status of a link.
 *
 * @param {bigint|number} linkId
 * @param {string} reviewStatus - 'CONFIRMED' | 'DISMISSED'
 * @param {string} reviewedBy - User UUID
 * @param {import('pg').PoolClient|import('pg').Pool} [db=pool]
 * @returns {Promise<object|null>}
 */
export async function updateLinkReview(linkId, reviewStatus, reviewedBy, db = pool) {
  const { rows } = await db.query(
    `UPDATE complaint_links
     SET review_status = $1, reviewed_by = $2, reviewed_at = now()
     WHERE id = $3
     RETURNING *`,
    [reviewStatus, reviewedBy, linkId],
  );

  return rows[0] || null;
}

/**
 * Get overlap statistics for the dashboard.
 *
 * @returns {Promise<object>}
 */
export async function getOverlapStats() {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*) AS total_links,
      SUM(CASE WHEN review_status = 'PENDING_REVIEW' THEN 1 ELSE 0 END) AS pending_review,
      SUM(CASE WHEN review_status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed,
      SUM(CASE WHEN review_status = 'DISMISSED' THEN 1 ELSE 0 END) AS dismissed,
      SUM(CASE WHEN link = 'DUPLICATE' THEN 1 ELSE 0 END) AS duplicates,
      SUM(CASE WHEN link = 'OVERLAP' THEN 1 ELSE 0 END) AS overlaps,
      SUM(CASE WHEN link = 'RELATED' THEN 1 ELSE 0 END) AS related
    FROM complaint_links
  `);
  return rows[0];
}

/**
 * Find a single link by ID.
 *
 * @param {number} linkId
 * @param {import('pg').PoolClient|import('pg').Pool} [db=pool]
 * @returns {Promise<object|null>}
 */
export async function findLinkById(linkId, db = pool) {
  const { rows } = await db.query(
    `SELECT * FROM complaint_links WHERE id = $1`,
    [linkId],
  );
  return rows[0] || null;
}

/**
 * Check if a link already exists between two complaints.
 *
 * @param {string} complaintIdA
 * @param {string} complaintIdB
 * @param {import('pg').PoolClient|import('pg').Pool} [db=pool]
 * @returns {Promise<object|null>}
 */
export async function findExistingLink(complaintIdA, complaintIdB, db = pool) {
  const { rows } = await db.query(
    `SELECT * FROM complaint_links
     WHERE (complaint_id = $1 AND related_complaint_id = $2)
        OR (complaint_id = $2 AND related_complaint_id = $1)`,
    [complaintIdA, complaintIdB],
  );
  return rows[0] || null;
}
