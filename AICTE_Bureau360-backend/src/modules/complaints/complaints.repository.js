// All SQL queries for complaints. Returns raw database rows.

import { pool } from '../../config/database.js';
import { buildWhere } from '../../utils/buildWhere.js';
import { applyScope } from '../../utils/applyScope.js';

// Whitelisted sort columns (prevent SQL injection)
const SORT_COLUMNS = new Set([
  'created_at',
  'updated_at',
  'received_on',
  'priority',
  'status',
  'sla_due_at',
  'complaint_no',
]);

/**
 * Create a new complaint row.
 *
 * @param {object} data - Complaint fields
 * @param {import('pg').PoolClient} client - Transaction client
 * @returns {Promise<object>} Created complaint row
 */
export async function createComplaint(data, client) {
  const {
    institution_id,
    category_id,
    title,
    description,
    priority,
    source,
    external_ref_no,
    complainant_name,
    complainant_email,
    complainant_phone,
    is_anonymous,
    received_on,
    current_bureau_id,
    created_by,
    sla_due_at,
  } = data;

  const { rows } = await client.query(
    `INSERT INTO complaints (
       institution_id, category_id, title, description, priority, source,
       external_ref_no, complainant_name, complainant_email, complainant_phone,
       is_anonymous, received_on, current_bureau_id, created_by, sla_due_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [
      institution_id,
      category_id,
      title,
      description,
      priority,
      source,
      external_ref_no || null,
      complainant_name || null,
      complainant_email || null,
      complainant_phone || null,
      is_anonymous,
      received_on || new Date(),
      current_bureau_id || null,
      created_by,
      sla_due_at || null,
    ],
  );

  return rows[0];
}

/**
 * Find complaints with filters, scope, sorting and pagination.
 *
 * @param {object} filters - Filter object from controller
 * @param {object} user - req.user for scope
 * @param {object} pagination - { limit, offset }
 * @param {object} sort - { column, order }
 * @returns {Promise<{ rows: Array, total: number }>}
 */
export async function findComplaints(filters, user, pagination, sort) {
  const { limit, offset } = pagination;
  const { column = 'created_at', order = 'desc' } = sort;

  // Build filter conditions
  const filterDefs = [
    { column: 'c.status', operator: '=', value: filters.status },
    { column: 'c.category_id', operator: '=', value: filters.category_id },
    { column: 'c.priority', operator: '=', value: filters.priority },
    { column: 'i.aicte_id', operator: '=', value: filters.aicte_id },
    { column: 'i.region_id', operator: '=', value: filters.region_id },
    { column: 'c.current_bureau_id', operator: '=', value: filters.bureau_id },
    { column: 'c.current_assignee_id', operator: '=', value: filters.assignee_id },
    { column: 'c.received_on', operator: '>=', value: filters.from },
    { column: 'c.received_on', operator: '<=', value: filters.to },
    { column: 'c.has_overlap', operator: '=', value: filters.has_overlap },
  ];

  // Overdue filter
  if (filters.overdue === true) {
    filterDefs.push({
      column: `(c.sla_due_at < now() AND c.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED'))`,
      operator: '=',
      value: 'true',
    });
  }

  const { clause: filterClause, values: filterValues, nextIndex: scopeStart } = buildWhere(filterDefs, 1);

  // Apply scope starting after filter params
  const { clause: scopeClause, params: scopeParams, nextIndex: searchStart } = applyScope(user, 'c', 'i', scopeStart);
  const allParams = [...filterValues, ...scopeParams];
  let nextIdx = searchStart;

  // Full-text or complaint_no search
  let searchClause = '1=1';
  if (filters.q) {
    const qParam = `$${nextIdx++}`;
    allParams.push(filters.q);
    searchClause = `(c.complaint_no = ${qParam} OR c.search_tsv @@ plainto_tsquery('english', ${qParam}) OR i.name ILIKE '%' || ${qParam} || '%')`;
  }

  // Validate sort column
  const sortColumn = SORT_COLUMNS.has(column) ? `c.${column}` : 'c.created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  // Count query
  const countSql = `
    SELECT COUNT(*) AS total
    FROM complaints c
    JOIN institutions i ON i.id = c.institution_id
    WHERE ${filterClause}
      AND ${scopeClause}
      AND ${searchClause}
  `;

  const { rows: countRows } = await pool.query(countSql, allParams);
  const total = parseInt(countRows[0].total, 10);

  // Data query with joined display fields
  const dataSql = `
    SELECT
      c.*,
      c.sla_due_at AS expected_disposal_date,
      i.name AS institution_name,
      i.aicte_id,
      cc.name AS category_name,
      b.name AS bureau_name,
      u.full_name AS assignee_name,
      (SELECT action_type FROM complaint_actions WHERE complaint_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_action,
      (SELECT created_at FROM complaint_actions WHERE complaint_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_action_date,
      CASE
        WHEN c.status = 'NEW' THEN 'Assign bureau / Initial triage'
        WHEN c.status = 'UNDER_REVIEW' THEN 'Assign investigation officer'
        WHEN c.status = 'ASSIGNED' THEN 'Commence inquiry & evidence gathering'
        WHEN c.status = 'IN_PROGRESS' THEN 'Complete investigation & record findings'
        WHEN c.status = 'PENDING_INFO' THEN 'Await response from institution/complainant'
        WHEN c.status = 'ESCALATED' THEN 'Bureau Head expedited review'
        WHEN c.status = 'RESOLVED' THEN 'Final verification & case closure'
        WHEN c.status IN ('CLOSED', 'REJECTED') THEN 'None (Disposed)'
        WHEN c.status = 'REOPENED' THEN 'Re-examination under appeal'
        ELSE 'Review case'
      END AS next_action,
      (SELECT COUNT(*) FROM documents WHERE complaint_id = c.id) AS document_count
    FROM complaints c
    JOIN institutions i ON i.id = c.institution_id
    JOIN complaint_categories cc ON cc.id = c.category_id
    LEFT JOIN bureaus b ON b.id = c.current_bureau_id
    LEFT JOIN users u ON u.id = c.current_assignee_id
    WHERE ${filterClause}
      AND ${scopeClause}
      AND ${searchClause}
    ORDER BY ${sortColumn} ${sortOrder}
    LIMIT $${nextIdx} OFFSET $${nextIdx + 1}
  `;

  const dataParams = [...allParams, limit, offset];
  const { rows } = await pool.query(dataSql, dataParams);

  return { rows, total };
}

/**
 * Find a single complaint by ID with joined display fields.
 *
 * @param {string} id - Complaint UUID
 * @param {object} user - req.user for scope check
 * @param {import('pg').PoolClient|import('pg').Pool} [db=pool] - Optional client for transaction queries
 * @returns {Promise<object|null>}
 */
export async function findComplaintById(id, user, db = pool) {
  const { clause: scopeClause, params: scopeParams } = applyScope(user, 'c', 'i', 2);

  const { rows } = await db.query(
    `SELECT
       c.*,
       c.sla_due_at AS expected_disposal_date,
       i.name AS institution_name,
       i.aicte_id,
       i.city AS institution_city,
       i.state AS institution_state,
       cc.name AS category_name,
       b.name AS bureau_name,
       u.full_name AS assignee_name,
       u.email AS assignee_email,
       pc.complaint_no AS primary_complaint_no,
       (SELECT action_type FROM complaint_actions WHERE complaint_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_action,
       (SELECT created_at FROM complaint_actions WHERE complaint_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_action_date,
       CASE
         WHEN c.status = 'NEW' THEN 'Assign bureau / Initial triage'
         WHEN c.status = 'UNDER_REVIEW' THEN 'Assign investigation officer'
         WHEN c.status = 'ASSIGNED' THEN 'Commence inquiry & evidence gathering'
         WHEN c.status = 'IN_PROGRESS' THEN 'Complete investigation & record findings'
         WHEN c.status = 'PENDING_INFO' THEN 'Await response from institution/complainant'
         WHEN c.status = 'ESCALATED' THEN 'Bureau Head expedited review'
         WHEN c.status = 'RESOLVED' THEN 'Final verification & case closure'
         WHEN c.status IN ('CLOSED', 'REJECTED') THEN 'None (Disposed)'
         WHEN c.status = 'REOPENED' THEN 'Re-examination under appeal'
         ELSE 'Review case'
       END AS next_action,
       (SELECT COUNT(*) FROM documents WHERE complaint_id = c.id) AS document_count
     FROM complaints c
     JOIN institutions i ON i.id = c.institution_id
     JOIN complaint_categories cc ON cc.id = c.category_id
     LEFT JOIN bureaus b ON b.id = c.current_bureau_id
     LEFT JOIN users u ON u.id = c.current_assignee_id
     LEFT JOIN complaints pc ON pc.id = c.primary_complaint_id
     WHERE c.id = $1
       AND ${scopeClause}`,
    [id, ...scopeParams],
  );

  return rows[0] || null;
}

/**
 * Lock a complaint row for update within a transaction (SELECT ... FOR UPDATE).
 *
 * @param {string} id - Complaint UUID
 * @param {import('pg').PoolClient} client
 * @returns {Promise<object|null>}
 */
export async function lockComplaintForUpdate(id, client) {
  const { rows } = await client.query(
    `SELECT * FROM complaints WHERE id = $1 FOR UPDATE`,
    [id],
  );
  return rows[0] || null;
}

/**
 * Update complaint fields.
 *
 * @param {string} id - Complaint UUID
 * @param {object} updates - Fields to update
 * @param {import('pg').PoolClient} client
 * @returns {Promise<object>}
 */
export async function updateComplaint(id, updates, client) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${idx++}`);
    values.push(value);
  }

  values.push(id);

  const { rows } = await client.query(
    `UPDATE complaints SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values,
  );

  return rows[0];
}

/**
 * Insert a complaint action (timeline entry).
 *
 * @param {object} data - Action data
 * @param {import('pg').PoolClient} client
 * @returns {Promise<object>}
 */
export async function insertAction(data, client) {
  const {
    complaint_id,
    action_type,
    from_status,
    to_status,
    remarks,
    is_internal = false, // Default to false if not provided
    performed_by,
    performed_by_bureau,
    metadata,
  } = data;

  const { rows } = await client.query(
    `INSERT INTO complaint_actions (
       complaint_id, action_type, from_status, to_status, remarks,
       is_internal, performed_by, performed_by_bureau, metadata
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      complaint_id,
      action_type,
      from_status || null,
      to_status || null,
      remarks || null,
      is_internal,
      performed_by,
      performed_by_bureau || null,
      metadata || {},
    ],
  );

  return rows[0];
}

/**
 * Get complaint timeline (actions) in chronological order.
 * Filters is_internal actions based on the caller's bureau.
 *
 * @param {string} complaintId - Complaint UUID
 * @param {object} user - req.user
 * @returns {Promise<Array>}
 */
export async function getComplaintTimeline(complaintId, user) {
  // If user is ADMIN or owns the current bureau, show all. Otherwise hide is_internal.
  let sql = `
    SELECT
       ca.*,
       u.full_name AS performer_name,
       b.name AS performer_bureau_name
     FROM complaint_actions ca
     LEFT JOIN users u ON u.id = ca.performed_by
     LEFT JOIN bureaus b ON b.id = ca.performed_by_bureau
     WHERE ca.complaint_id = $1
  `;

  const params = [complaintId];

  // Hide internal actions from other bureaus (unless ADMIN)
  if (user.role_scope !== 'ALL' && user.bureau_id) {
    sql += ` AND (ca.is_internal = false OR ca.performed_by_bureau = $2)`;
    params.push(user.bureau_id);
  }

  sql += ` ORDER BY ca.created_at ASC`;

  const { rows } = await pool.query(sql, params);
  return rows;
}

/**
 * Resolve institution ID from AICTE ID.
 *
 * @param {string} aicteId
 * @returns {Promise<string|null>} Institution UUID
 */
export async function findInstitutionByAicteId(aicteId) {
  const { rows } = await pool.query(`SELECT id FROM institutions WHERE aicte_id = $1`, [aicteId]);
  return rows[0]?.id || null;
}

/**
 * Deactivate the current assignment for a complaint.
 *
 * @param {string} complaintId
 * @param {import('pg').PoolClient} client
 */
export async function deactivateCurrentAssignment(complaintId, client) {
  await client.query(
    `UPDATE complaint_assignments SET is_current = false WHERE complaint_id = $1 AND is_current = true`,
    [complaintId],
  );
}

/**
 * Insert a new assignment record.
 *
 * @param {object} data
 * @param {import('pg').PoolClient} client
 * @returns {Promise<object>}
 */
export async function insertAssignment(data, client) {
  const {
    complaint_id,
    kind,
    from_bureau_id,
    to_bureau_id,
    from_user_id,
    to_user_id,
    assigned_by,
    reason,
    is_current = true,
  } = data;

  const { rows } = await client.query(
    `INSERT INTO complaint_assignments (
       complaint_id, kind, from_bureau_id, to_bureau_id,
       from_user_id, to_user_id, assigned_by, reason, is_current
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      complaint_id,
      kind,
      from_bureau_id || null,
      to_bureau_id || null,
      from_user_id || null,
      to_user_id || null,
      assigned_by,
      reason || null,
      is_current,
    ],
  );

  return rows[0];
}

/**
 * Find all assignments for a complaint ordered by time descending.
 *
 * @param {string} complaintId
 * @returns {Promise<Array>}
 */
export async function findAssignmentsByComplaintId(complaintId) {
  const { rows } = await pool.query(
    `SELECT
       ca.*,
       fb.name AS from_bureau_name,
       fb.code AS from_bureau_code,
       tb.name AS to_bureau_name,
       tb.code AS to_bureau_code,
       fu.full_name AS from_user_name,
       tu.full_name AS to_user_name,
       ab.full_name AS assigned_by_name
     FROM complaint_assignments ca
     LEFT JOIN bureaus fb ON fb.id = ca.from_bureau_id
     LEFT JOIN bureaus tb ON tb.id = ca.to_bureau_id
     LEFT JOIN users fu ON fu.id = ca.from_user_id
     LEFT JOIN users tu ON tu.id = ca.to_user_id
     LEFT JOIN users ab ON ab.id = ca.assigned_by
     WHERE ca.complaint_id = $1
     ORDER BY ca.assigned_at DESC, ca.id DESC`,
    [complaintId],
  );
  return rows;
}

/**
 * Find bureau by ID.
 *
 * @param {number} bureauId
 * @param {import('pg').PoolClient|import('pg').Pool} [db=pool]
 * @returns {Promise<object|null>}
 */
export async function findBureauById(bureauId, db = pool) {
  const { rows } = await db.query(`SELECT * FROM bureaus WHERE id = $1`, [bureauId]);
  return rows[0] || null;
}

/**
 * Find user by ID.
 *
 * @param {string} userId
 * @param {import('pg').PoolClient|import('pg').Pool} [db=pool]
 * @returns {Promise<object|null>}
 */
export async function findUserById(userId, db = pool) {
  const { rows } = await db.query(
    `SELECT id, full_name, email, role_id, bureau_id FROM users WHERE id = $1`,
    [userId],
  );
  return rows[0] || null;
}

/**
 * Insert a document record.
 *
 * @param {object} data
 * @param {import('pg').PoolClient} client
 * @returns {Promise<object>}
 */
export async function insertDocument(data, client) {
  const {
    complaint_id,
    institution_id,
    action_id,
    doc_category = 'SUPPORTING',
    file_name,
    storage_key,
    mime_type,
    size_bytes,
    sha256,
    uploaded_by,
  } = data;

  const { rows } = await client.query(
    `INSERT INTO documents (
       complaint_id, institution_id, action_id, doc_category,
       file_name, storage_key, mime_type, size_bytes, sha256, uploaded_by
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      complaint_id || null,
      institution_id || null,
      action_id || null,
      doc_category,
      file_name,
      storage_key,
      mime_type,
      size_bytes,
      sha256 || null,
      uploaded_by,
    ],
  );

  return rows[0];
}

/**
 * Find all documents for a complaint.
 *
 * @param {string} complaintId
 * @returns {Promise<Array>}
 */
export async function findDocumentsByComplaintId(complaintId) {
  const { rows } = await pool.query(
    `SELECT
       d.*,
       u.full_name AS uploaded_by_name
     FROM documents d
     LEFT JOIN users u ON u.id = d.uploaded_by
     WHERE d.complaint_id = $1
     ORDER BY d.created_at DESC`,
    [complaintId],
  );
  return rows;
}

/**
 * Find a specific document for a complaint.
 *
 * @param {string} complaintId
 * @param {string} documentId
 * @returns {Promise<object|null>}
 */
export async function findDocumentById(complaintId, documentId) {
  const { rows } = await pool.query(
    `SELECT
       d.*,
       u.full_name AS uploaded_by_name
     FROM documents d
     LEFT JOIN users u ON u.id = d.uploaded_by
     WHERE d.id = $1 AND d.complaint_id = $2`,
    [documentId, complaintId],
  );
  return rows[0] || null;
}

