// All SQL queries for the notifications table.

import { pool } from '../../config/database.js';

/**
 * Insert a new notification into the outbox.
 *
 * @param {object} data
 * @param {import('pg').PoolClient|import('pg').Pool} [db=pool]
 * @returns {Promise<object>}
 */
export async function createNotification(data, db = pool) {
  const {
    user_id,
    to_email = null,
    type,
    channel = 'IN_APP',
    subject,
    body,
    metadata = {},
  } = data;

  const { rows } = await db.query(
    `INSERT INTO notifications (user_id, to_email, type, channel, subject, body, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [user_id, to_email, type, channel, subject, body, metadata],
  );
  return rows[0];
}

/**
 * Bulk-insert notifications (e.g. for SLA reminders).
 *
 * @param {Array<object>} items
 * @param {import('pg').PoolClient|import('pg').Pool} [db=pool]
 * @returns {Promise<Array>}
 */
export async function createBulkNotifications(items, db = pool) {
  if (items.length === 0) return [];

  const values = [];
  const params = [];
  let idx = 1;

  for (const item of items) {
    values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
    params.push(
      item.user_id,
      item.to_email || null,
      item.type,
      item.channel || 'IN_APP',
      item.subject,
      item.body,
      item.metadata || {},
    );
  }

  const { rows } = await db.query(
    `INSERT INTO notifications (user_id, to_email, type, channel, subject, body, metadata)
     VALUES ${values.join(', ')}
     RETURNING *`,
    params,
  );

  return rows;
}

/**
 * Find notifications for a user (in-app inbox).
 *
 * @param {string} userId
 * @param {object} pagination - { limit, offset }
 * @param {boolean} [unreadOnly=false]
 * @returns {Promise<{ rows: Array, total: number }>}
 */
export async function findByUserId(userId, pagination, unreadOnly = false) {
  const { limit, offset } = pagination;

  const unreadClause = unreadOnly ? 'AND n.is_read = false' : '';

  const countSql = `
    SELECT COUNT(*) AS total
    FROM notifications n
    WHERE n.user_id = $1 ${unreadClause}
  `;
  const { rows: countRows } = await pool.query(countSql, [userId]);
  const total = parseInt(countRows[0].total, 10);

  const dataSql = `
    SELECT *
    FROM notifications
    WHERE user_id = $1 ${unreadClause}
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const { rows } = await pool.query(dataSql, [userId, limit, offset]);

  return { rows, total };
}

/**
 * Get unread count for a user.
 *
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getUnreadCount(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = false`,
    [userId],
  );
  return parseInt(rows[0].count, 10);
}

/**
 * Mark a notification as read.
 *
 * @param {number} id
 * @param {string} userId - Ensures ownership
 * @returns {Promise<object|null>}
 */
export async function markAsRead(id, userId) {
  const { rows } = await pool.query(
    `UPDATE notifications SET is_read = true, read_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId],
  );
  return rows[0] || null;
}

/**
 * Mark all notifications as read for a user.
 *
 * @param {string} userId
 * @returns {Promise<number>} Number of rows updated
 */
export async function markAllAsRead(userId) {
  const { rowCount } = await pool.query(
    `UPDATE notifications SET is_read = true, read_at = now()
     WHERE user_id = $1 AND is_read = false`,
    [userId],
  );
  return rowCount;
}

/**
 * Fetch pending email notifications for the mail worker.
 *
 * @param {number} batchSize
 * @returns {Promise<Array>}
 */
export async function fetchPendingEmails(batchSize = 50) {
  const { rows } = await pool.query(
    `SELECT * FROM notifications
     WHERE channel = 'EMAIL' AND status = 'PENDING'
     ORDER BY created_at ASC
     LIMIT $1
     FOR UPDATE SKIP LOCKED`,
    [batchSize],
  );
  return rows;
}

/**
 * Update notification send status.
 *
 * @param {number} id
 * @param {'SENT'|'FAILED'} status
 * @param {string} [errorDetail]
 * @returns {Promise<object|null>}
 */
export async function updateSendStatus(id, status, errorDetail = null) {
  const sent = status === 'SENT' ? ', sent_at = now()' : '';
  const { rows } = await pool.query(
    `UPDATE notifications
     SET status = $1 ${sent}, metadata = metadata || $3
     WHERE id = $2
     RETURNING *`,
    [status, id, errorDetail ? { error: errorDetail } : {}],
  );
  return rows[0] || null;
}

/**
 * Find users assigned to a bureau (for SLA notifications).
 *
 * @param {number} bureauId
 * @returns {Promise<Array>}
 */
export async function findUsersByBureau(bureauId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name AS name, u.email
     FROM users u
     WHERE u.bureau_id = $1 AND u.is_active = true`,
    [bureauId],
  );
  return rows;
}

/**
 * Find complaints approaching SLA deadline (within N hours).
 *
 * @param {number} hoursAhead - How many hours before deadline
 * @returns {Promise<Array>}
 */
export async function findComplainsNearingSla(hoursAhead = 24) {
  const { rows } = await pool.query(
    `SELECT c.id, c.complaint_no, c.title, c.status, c.sla_due_at,
            c.current_bureau_id, c.institution_id,
            i.name AS institution_name, i.aicte_id,
            b.name AS bureau_name,
            COALESCE(c.current_assignee_id, a.to_user_id) AS assignee_id
     FROM complaints c
     JOIN institutions i ON i.id = c.institution_id
     LEFT JOIN bureaus b ON b.id = c.current_bureau_id
     LEFT JOIN LATERAL (
       SELECT ca.to_user_id FROM complaint_assignments ca
       WHERE ca.complaint_id = c.id AND ca.is_current = true
       LIMIT 1
     ) a ON true
     WHERE c.sla_due_at IS NOT NULL
       AND c.sla_due_at > now()
       AND c.sla_due_at <= now() + ($1 || ' hours')::interval
       AND c.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')`,
    [hoursAhead],
  );
  return rows;
}

/**
 * Find complaints overdue past escalation threshold for auto-escalation.
 *
 * @returns {Promise<Array>}
 */
export async function findComplaintsForAutoEscalation() {
  const { rows } = await pool.query(
    `SELECT c.id, c.complaint_no, c.title, c.status, c.sla_due_at,
            c.current_bureau_id, c.institution_id,
            i.name AS institution_name, i.aicte_id,
            b.name AS bureau_name,
            COALESCE(sr.escalate_to_bureau_id, 2) AS escalate_to_bureau_id,
            COALESCE(sr.escalate_after_hours, 48) AS escalate_after_hours
     FROM complaints c
     JOIN institutions i ON i.id = c.institution_id
     LEFT JOIN bureaus b ON b.id = c.current_bureau_id
     LEFT JOIN sla_rules sr ON sr.category_id = c.category_id AND sr.priority = c.priority
     WHERE c.sla_due_at IS NOT NULL
       AND c.status IN ('ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW')
       AND now() >= c.sla_due_at + (COALESCE(sr.escalate_after_hours, 48) || ' hours')::interval`,
  );
  return rows;
}
export async function findOverdueComplaints() {
  const { rows } = await pool.query(
    `SELECT c.id, c.complaint_no, c.title, c.status, c.sla_due_at,
            c.current_bureau_id, c.institution_id,
            i.name AS institution_name, i.aicte_id,
            b.name AS bureau_name,
            COALESCE(c.current_assignee_id, a.to_user_id) AS assignee_id
     FROM complaints c
     JOIN institutions i ON i.id = c.institution_id
     LEFT JOIN bureaus b ON b.id = c.current_bureau_id
     LEFT JOIN LATERAL (
       SELECT ca.to_user_id FROM complaint_assignments ca
       WHERE ca.complaint_id = c.id AND ca.is_current = true
       LIMIT 1
     ) a ON true
     WHERE c.sla_due_at IS NOT NULL
       AND c.sla_due_at < now()
       AND c.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')`,
  );
  return rows;
}
