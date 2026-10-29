// Data access layer for cross-bureau coordination requests and actions.

import { pool } from '../../config/database.js';

/**
 * Insert a new coordination request.
 */
export async function createCoordinationRequest(data, db = pool) {
  const {
    initiating_bureau_id,
    target_bureau_id,
    complaint_id,
    target_complaint_id = null,
    institution_id = null,
    coordination_type,
    priority = 'HIGH',
    purpose,
    action_items = [],
    requested_by,
    due_date = null,
  } = data;

  // Format initial action items with unique IDs
  const formattedItems = action_items.map((item, idx) => ({
    id: `ACT-${Date.now()}-${idx + 1}`,
    description: item.description,
    assigned_to_bureau: item.assigned_to_bureau || null,
    due_date: item.due_date || null,
    status: 'PENDING',
    created_at: new Date().toISOString(),
  }));

  const { rows } = await db.query(
    `INSERT INTO bureau_coordination_requests
       (initiating_bureau_id, target_bureau_id, complaint_id, target_complaint_id,
        institution_id, coordination_type, priority, purpose, action_items,
        requested_by, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      initiating_bureau_id,
      target_bureau_id,
      complaint_id,
      target_complaint_id,
      institution_id,
      coordination_type,
      priority,
      purpose,
      JSON.stringify(formattedItems),
      requested_by,
      due_date,
    ],
  );

  return rows[0];
}

/**
 * List coordination requests with filters, pagination, and joined bureau/complaint details.
 */
export async function findCoordinationRequests(filters = {}, db = pool) {
  const {
    status,
    target_response_status,
    bureau_id,
    complaint_id,
    institution_id,
    limit = 50,
    offset = 0,
  } = filters;

  const conditions = [];
  const params = [];
  let idx = 1;

  if (status) {
    conditions.push(`r.status = $${idx++}`);
    params.push(status);
  }
  if (target_response_status) {
    conditions.push(`r.target_response_status = $${idx++}`);
    params.push(target_response_status);
  }
  if (bureau_id) {
    conditions.push(`(r.initiating_bureau_id = $${idx} OR r.target_bureau_id = $${idx})`);
    params.push(bureau_id);
    idx++;
  }
  if (complaint_id) {
    conditions.push(`(r.complaint_id = $${idx} OR r.target_complaint_id = $${idx})`);
    params.push(complaint_id);
    idx++;
  }
  if (institution_id) {
    conditions.push(`r.institution_id = $${idx++}`);
    params.push(institution_id);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) AS total FROM bureau_coordination_requests r ${where}`;
  const { rows: countRows } = await db.query(countSql, params);
  const total = parseInt(countRows[0].total, 10);

  const dataSql = `
    SELECT
      r.*,
      b1.name AS initiating_bureau_name,
      b1.code AS initiating_bureau_code,
      b2.name AS target_bureau_name,
      b2.code AS target_bureau_code,
      c1.complaint_no AS primary_complaint_no,
      c1.title AS primary_complaint_title,
      c1.status AS primary_complaint_status,
      c2.complaint_no AS target_complaint_no,
      c2.title AS target_complaint_title,
      c2.status AS target_complaint_status,
      i.name AS institution_name,
      i.aicte_id,
      u1.full_name AS requester_name,
      u2.full_name AS responded_by_name,
      u3.full_name AS decision_by_name
    FROM bureau_coordination_requests r
    JOIN bureaus b1 ON b1.id = r.initiating_bureau_id
    JOIN bureaus b2 ON b2.id = r.target_bureau_id
    JOIN complaints c1 ON c1.id = r.complaint_id
    LEFT JOIN complaints c2 ON c2.id = r.target_complaint_id
    LEFT JOIN institutions i ON i.id = coalesce(r.institution_id, c1.institution_id)
    JOIN users u1 ON u1.id = r.requested_by
    LEFT JOIN users u2 ON u2.id = r.target_responded_by
    LEFT JOIN users u3 ON u3.id = r.joint_decision_by
    ${where}
    ORDER BY r.created_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  const { rows } = await db.query(dataSql, [...params, limit, offset]);

  return { rows, total };
}

/**
 * Find single coordination request by ID with full details.
 */
export async function findCoordinationById(id, db = pool) {
  const { rows } = await db.query(
    `SELECT
       r.*,
       b1.name AS initiating_bureau_name,
       b1.code AS initiating_bureau_code,
       b2.name AS target_bureau_name,
       b2.code AS target_bureau_code,
       c1.complaint_no AS primary_complaint_no,
       c1.title AS primary_complaint_title,
       c1.status AS primary_complaint_status,
       c2.complaint_no AS target_complaint_no,
       c2.title AS target_complaint_title,
       c2.status AS target_complaint_status,
       i.name AS institution_name,
       i.aicte_id,
       u1.full_name AS requester_name,
       u2.full_name AS responded_by_name,
       u3.full_name AS decision_by_name
     FROM bureau_coordination_requests r
     JOIN bureaus b1 ON b1.id = r.initiating_bureau_id
     JOIN bureaus b2 ON b2.id = r.target_bureau_id
     JOIN complaints c1 ON c1.id = r.complaint_id
     LEFT JOIN complaints c2 ON c2.id = r.target_complaint_id
     LEFT JOIN institutions i ON i.id = coalesce(r.institution_id, c1.institution_id)
     JOIN users u1 ON u1.id = r.requested_by
     LEFT JOIN users u2 ON u2.id = r.target_responded_by
     LEFT JOIN users u3 ON u3.id = r.joint_decision_by
     WHERE r.id = $1`,
    [id],
  );

  return rows[0] || null;
}

/**
 * Record target bureau's response to coordination request.
 */
export async function recordTargetResponse(id, data, db = pool) {
  const { response_status, remarks, user_id } = data;

  const nextStatus = response_status === 'DECLINED' ? 'DECLINED' : 'IN_COORDINATION';

  const { rows } = await db.query(
    `UPDATE bureau_coordination_requests
     SET target_response_status = $1,
         target_responded_at = now(),
         target_responded_by = $2,
         target_response_remarks = $3,
         status = $4,
         updated_at = now()
     WHERE id = $5
     RETURNING *`,
    [response_status, user_id, remarks, nextStatus, id],
  );

  return rows[0] || null;
}

/**
 * Append a follow-up action item to a coordination request.
 */
export async function addFollowUpAction(id, actionData, db = pool) {
  const newAction = {
    id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    description: actionData.description,
    assigned_to_bureau: actionData.assigned_to_bureau || null,
    due_date: actionData.due_date || null,
    status: 'PENDING',
    created_at: new Date().toISOString(),
  };

  const { rows } = await db.query(
    `UPDATE bureau_coordination_requests
     SET action_items = action_items || $1::jsonb,
         updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify([newAction]), id],
  );

  return rows[0] || null;
}

/**
 * Update the status of a specific action item within the JSONB array.
 */
export async function updateActionItemStatus(id, actionId, status, user_id, db = pool) {
  // Fetch existing items
  const req = await findCoordinationById(id, db);
  if (!req) return null;

  const items = Array.isArray(req.action_items) ? req.action_items : [];
  const updatedItems = items.map((item) => {
    if (item.id === actionId) {
      return {
        ...item,
        status,
        updated_at: new Date().toISOString(),
        completed_at: status === 'COMPLETED' ? new Date().toISOString() : item.completed_at || null,
        completed_by: status === 'COMPLETED' ? user_id : item.completed_by || null,
      };
    }
    return item;
  });

  const { rows } = await db.query(
    `UPDATE bureau_coordination_requests
     SET action_items = $1::jsonb,
         updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(updatedItems), id],
  );

  return rows[0] || null;
}

/**
 * Record a joint binding coordination decision.
 */
export async function recordJointDecision(id, data, db = pool) {
  const { joint_decision, status = 'DECISION_RECORDED', user_id } = data;

  const { rows } = await db.query(
    `UPDATE bureau_coordination_requests
     SET joint_decision = $1,
         joint_decision_by = $2,
         joint_decision_at = now(),
         status = $3,
         updated_at = now()
     WHERE id = $4
     RETURNING *`,
    [joint_decision, user_id, status, id],
  );

  return rows[0] || null;
}

/**
 * Aggregated coordination metrics for workspace dashboard.
 */
export async function getCoordinationMetrics(bureau_id = null, db = pool) {
  const conditions = [];
  const params = [];

  if (bureau_id) {
    conditions.push(`(initiating_bureau_id = $1 OR target_bureau_id = $1)`);
    params.push(bureau_id);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await db.query(
    `SELECT
       COUNT(*)::int AS total_requests,
       SUM(CASE WHEN target_response_status = 'AWAITING_RESPONSE' THEN 1 ELSE 0 END)::int AS awaiting_response,
       SUM(CASE WHEN status = 'IN_COORDINATION' THEN 1 ELSE 0 END)::int AS in_active_coordination,
       SUM(CASE WHEN status IN ('DECISION_RECORDED', 'COMPLETED') THEN 1 ELSE 0 END)::int AS decisions_recorded,
       SUM(CASE WHEN status = 'DECLINED' THEN 1 ELSE 0 END)::int AS declined_requests
     FROM bureau_coordination_requests ${where}`,
    params,
  );

  return rows[0];
}

