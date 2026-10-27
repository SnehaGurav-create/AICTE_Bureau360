// All SQL queries for institutions. No business logic — just database access.

import { pool } from '../../config/database.js';
import { buildWhere } from '../../utils/buildWhere.js';

// Whitelist of sortable columns to prevent SQL injection
const SORT_COLUMNS = new Set(['name', 'aicte_id', 'state', 'created_at']);

/**
 * Insert a new institution.
 * @param {object} data - Institution fields
 * @param {import('pg').PoolClient} [client] - Optional transaction client
 * @returns {Promise<object>} The created institution row
 */
export async function create(data, client) {
  const db = client || pool;
  const { rows } = await db.query(
    `INSERT INTO institutions
       (aicte_id, name, institution_type, status, address_line, city, district,
        state, pincode, region_id, head_name, email, phone, website,
        established_year, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      data.aicte_id, data.name, data.institution_type, data.status,
      data.address_line, data.city, data.district, data.state, data.pincode,
      data.region_id, data.head_name, data.email, data.phone, data.website,
      data.established_year, data.created_by,
    ],
  );
  return rows[0];
}

/**
 * Find an institution by its AICTE ID.
 * @param {string} aicteId
 * @param {import('pg').PoolClient} [client]
 * @returns {Promise<object|null>}
 */
export async function findByAicteId(aicteId, client) {
  const db = client || pool;
  const { rows } = await db.query(
    `SELECT i.*, r.name AS region_name
     FROM institutions i
     LEFT JOIN regions r ON r.id = i.region_id
     WHERE i.aicte_id = $1`,
    [aicteId],
  );
  return rows[0] || null;
}

/**
 * Find an institution by its internal UUID.
 * @param {string} id
 * @param {import('pg').PoolClient} [client]
 * @returns {Promise<object|null>}
 */
export async function findById(id, client) {
  const db = client || pool;
  const { rows } = await db.query(
    `SELECT i.*, r.name AS region_name
     FROM institutions i
     LEFT JOIN regions r ON r.id = i.region_id
     WHERE i.id = $1`,
    [id],
  );
  return rows[0] || null;
}

/**
 * List institutions with filters, search, sorting and pagination.
 * @param {object} filters - { q, state, region_id, status, institution_type }
 * @param {object} pagination - { sort, order, limit, offset }
 * @returns {Promise<{ rows: Array, total: number }>}
 */
export async function findAll(filters, pagination) {
  const whereDefs = [
    { column: 'i.state', operator: '=', value: filters.state },
    { column: 'i.region_id', operator: '=', value: filters.region_id },
    { column: 'i.status', operator: '=', value: filters.status },
    { column: 'i.institution_type', operator: '=', value: filters.institution_type },
  ];

  const { clause, values, nextIndex } = buildWhere(whereDefs);

  // Fuzzy search: trigram similarity on name OR prefix match on aicte_id
  let searchClause = '';
  if (filters.q) {
    searchClause = ` AND (i.name ILIKE $${nextIndex} OR i.aicte_id ILIKE $${nextIndex + 1})`;
    values.push(`%${filters.q}%`, `${filters.q}%`);
  }

  // Validate sort column against whitelist
  const sortCol = SORT_COLUMNS.has(pagination.sort) ? pagination.sort : 'name';
  const sortOrder = pagination.order === 'desc' ? 'DESC' : 'ASC';

  const baseFrom = `FROM institutions i LEFT JOIN regions r ON r.id = i.region_id`;
  const whereClause = `WHERE ${clause}${searchClause}`;

  const countQuery = `SELECT count(*) AS total ${baseFrom} ${whereClause}`;
  const dataQuery = `
    SELECT i.*, r.name AS region_name
    ${baseFrom}
    ${whereClause}
    ORDER BY i.${sortCol} ${sortOrder}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

  // Run count and data queries in parallel
  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, values),
    pool.query(dataQuery, [...values, pagination.limit, pagination.offset]),
  ]);

  return {
    rows: dataResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
}

/**
 * Lightweight autocomplete search — returns top 10 matches by trigram or AICTE ID prefix.
 * @param {string} q - Search query
 * @returns {Promise<Array<{ id, aicte_id, name, city, state }>>}
 */
export async function searchAutocomplete(q) {
  const { rows } = await pool.query(
    `SELECT id, aicte_id, name, city, state
     FROM institutions
     WHERE name ILIKE $1 OR aicte_id ILIKE $2
     ORDER BY similarity(name, $3) DESC
     LIMIT 10`,
    [`%${q}%`, `${q}%`, q],
  );
  return rows;
}

/**
 * Update an institution by UUID. Only updates provided fields.
 * @param {string} id - Institution UUID
 * @param {object} data - Fields to update (key-value pairs)
 * @param {import('pg').PoolClient} [client]
 * @returns {Promise<object>} The updated institution
 */
export async function update(id, data, client) {
  const db = client || pool;
  const keys = Object.keys(data);
  if (keys.length === 0) {
    return findById(id, client);
  }

  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`);
  const values = keys.map((key) => data[key]);
  values.push(id);

  const { rows } = await db.query(
    `UPDATE institutions SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values,
  );
  return rows[0];
}

/**
 * Insert a history row for an institution change.
 * @param {object} data - { institution_id, change_type, old_data, new_data, changed_by }
 * @param {import('pg').PoolClient} [client]
 * @returns {Promise<object>}
 */
export async function insertHistory(data, client) {
  const db = client || pool;
  const { rows } = await db.query(
    `INSERT INTO institution_history (institution_id, change_type, old_data, new_data, changed_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.institution_id, data.change_type, data.old_data, data.new_data, data.changed_by],
  );
  return rows[0];
}

/**
 * Fetch the change history for an institution.
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>}
 */
export async function findHistory(institutionId) {
  const { rows } = await pool.query(
    `SELECT ih.*, u.full_name AS changed_by_name
     FROM institution_history ih
     LEFT JOIN users u ON u.id = ih.changed_by
     WHERE ih.institution_id = $1
     ORDER BY ih.changed_at DESC`,
    [institutionId],
  );
  return rows;
}

/**
 * Find documents for an institution.
 * @param {string} institutionId - Institution UUID
 * @returns {Promise<Array>}
 */
export async function findDocuments(institutionId) {
  const { rows } = await pool.query(
    `SELECT d.id, d.doc_category, d.file_name, d.mime_type, d.size_bytes,
            d.sha256, d.created_at, u.full_name AS uploaded_by_name
     FROM documents d
     LEFT JOIN users u ON u.id = d.uploaded_by
     WHERE d.institution_id = $1
     ORDER BY d.created_at DESC`,
    [institutionId],
  );
  return rows;
}

/**
 * Insert a document record linked to an institution.
 * @param {object} data
 * @param {import('pg').PoolClient} [client]
 * @returns {Promise<object>}
 */
export async function insertDocument(data, client) {
  const db = client || pool;
  const { rows } = await db.query(
    `INSERT INTO documents
       (institution_id, doc_category, file_name, storage_key, mime_type, size_bytes, sha256, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.institution_id, data.doc_category, data.file_name, data.storage_key,
      data.mime_type, data.size_bytes, data.sha256, data.uploaded_by,
    ],
  );
  return rows[0];
}
