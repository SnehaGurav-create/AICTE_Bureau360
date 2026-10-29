// Business logic for cross-bureau coordination workspace.

import { AppError } from '../../utils/AppError.js';
import { logger } from '../../config/logger.js';
import { withTransaction } from '../../utils/withTransaction.js';
import { ACTION_TYPES } from '../../constants/actionTypes.js';
import * as coordRepo from './coordination.repository.js';
import * as notifRepo from '../notifications/notifications.repository.js';

/**
 * Request cross-bureau coordination.
 */
export async function requestCoordination(body, actor) {
  const initiatingBureauId = body.initiating_bureau_id || actor.bureau_id;
  if (!initiatingBureauId) {
    throw new AppError(400, 'BUREAU_REQUIRED', 'Initiating bureau must be specified or actor must belong to a bureau');
  }

  if (initiatingBureauId === body.target_bureau_id) {
    throw new AppError(400, 'INVALID_TARGET_BUREAU', 'Initiating bureau and target bureau cannot be identical');
  }

  return withTransaction(async (client) => {
    // 1. Verify complaint exists
    const { rows: cmpRows } = await client.query(
      `SELECT id, complaint_no, institution_id, current_bureau_id FROM complaints WHERE id = $1`,
      [body.complaint_id],
    );
    if (!cmpRows[0]) {
      throw new AppError(404, 'COMPLAINT_NOT_FOUND', `Complaint ${body.complaint_id} not found`);
    }

    const complaint = cmpRows[0];
    const institutionId = body.institution_id || complaint.institution_id;

    // 2. Create coordination record
    const record = await coordRepo.createCoordinationRequest(
      {
        ...body,
        initiating_bureau_id: initiatingBureauId,
        institution_id: institutionId,
        requested_by: actor.id,
      },
      client,
    );

    // 3. Log complaint action on primary case
    await client.query(
      `INSERT INTO complaint_actions
         (complaint_id, action_type, remarks, performed_by, performed_by_bureau, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        complaint.id,
        ACTION_TYPES.FIELD_UPDATED,
        `Cross-bureau coordination requested with Bureau ID ${body.target_bureau_id} (${body.coordination_type}): ${body.purpose}`,
        actor.id,
        initiatingBureauId,
        JSON.stringify({ coordination_id: record.id, request_no: record.request_no }),
      ],
    );

    // 4. If target complaint exists, also log on target case
    if (body.target_complaint_id) {
      await client.query(
        `INSERT INTO complaint_actions
           (complaint_id, action_type, remarks, performed_by, performed_by_bureau, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          body.target_complaint_id,
          ACTION_TYPES.FIELD_UPDATED,
          `Cross-bureau coordination requested from Bureau ID ${initiatingBureauId} (${record.request_no})`,
          actor.id,
          initiatingBureauId,
          JSON.stringify({ coordination_id: record.id, request_no: record.request_no }),
        ],
      );
    }

    // 5. Dispatch in-app notification to target bureau users
    try {
      const targetUsers = await notifRepo.findUsersByBureau(body.target_bureau_id);
      if (targetUsers.length > 0) {
        const notifs = targetUsers.map((u) => ({
          user_id: u.id,
          type: 'COORDINATION_REQUESTED',
          channel: 'IN_APP',
          subject: `🤝 Coordination Requested: ${record.request_no}`,
          body: `Bureau coordination requested regarding Case ${complaint.complaint_no} (${body.coordination_type}). Please review and respond.`,
          metadata: { coordination_id: record.id, request_no: record.request_no, complaint_id: complaint.id },
        }));
        await notifRepo.createBulkNotifications(notifs);
      }
    } catch (notifErr) {
      logger.warn({ notifErr }, 'Failed to dispatch coordination notifications');
    }

    return record;
  });
}

/**
 * List coordination requests with optional filters.
 */
export async function getCoordinationList(query) {
  const { page = 1, limit = 20, ...filters } = query;
  const offset = (page - 1) * limit;

  const result = await coordRepo.findCoordinationRequests({
    ...filters,
    limit,
    offset,
  });

  return {
    data: result.rows,
    meta: {
      total: result.total,
      page,
      limit,
      pages: Math.ceil(result.total / limit) || 1,
    },
  };
}

/**
 * Get single coordination request by ID.
 */
export async function getCoordinationDetail(id) {
  const record = await coordRepo.findCoordinationById(id);
  if (!record) {
    throw new AppError(404, 'COORDINATION_NOT_FOUND', `Coordination request ${id} not found`);
  }
  return record;
}

/**
 * Target bureau responds to / acknowledges coordination request.
 */
export async function respondToCoordination(id, body, actor) {
  return withTransaction(async (client) => {
    const existing = await coordRepo.findCoordinationById(id, client);
    if (!existing) {
      throw new AppError(404, 'COORDINATION_NOT_FOUND', `Coordination request ${id} not found`);
    }

    const updated = await coordRepo.recordTargetResponse(
      id,
      {
        response_status: body.response_status,
        remarks: body.remarks,
        user_id: actor.id,
      },
      client,
    );

    // Log timeline action on primary case
    await client.query(
      `INSERT INTO complaint_actions
         (complaint_id, action_type, remarks, performed_by, performed_by_bureau, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        existing.complaint_id,
        ACTION_TYPES.FIELD_UPDATED,
        `Target Bureau responded to coordination ${existing.request_no} (${body.response_status}): ${body.remarks}`,
        actor.id,
        existing.target_bureau_id,
        JSON.stringify({ coordination_id: id, response_status: body.response_status }),
      ],
    );

    // Notify requester
    try {
      await notifRepo.createNotification({
        user_id: existing.requested_by,
        type: 'COORDINATION_RESPONDED',
        channel: 'IN_APP',
        subject: `Response received on ${existing.request_no}`,
        body: `Target Bureau has responded with status '${body.response_status}': ${body.remarks}`,
        metadata: { coordination_id: id, request_no: existing.request_no },
      });
    } catch (notifErr) {
      logger.warn({ notifErr }, 'Failed to dispatch response notification');
    }

    return updated;
  });
}

/**
 * Assign a follow-up action under coordination.
 */
export async function addAction(id, body, actor) {
  const existing = await coordRepo.findCoordinationById(id);
  if (!existing) {
    throw new AppError(404, 'COORDINATION_NOT_FOUND', `Coordination request ${id} not found`);
  }

  return coordRepo.addFollowUpAction(id, body);
}

/**
 * Update an action item status (PENDING, IN_PROGRESS, COMPLETED).
 */
export async function updateAction(id, actionId, body, actor) {
  const existing = await coordRepo.findCoordinationById(id);
  if (!existing) {
    throw new AppError(404, 'COORDINATION_NOT_FOUND', `Coordination request ${id} not found`);
  }

  const updated = await coordRepo.updateActionItemStatus(id, actionId, body.status, actor.id);
  if (!updated) {
    throw new AppError(404, 'ACTION_NOT_FOUND', `Action ${actionId} not found`);
  }

  return updated;
}

/**
 * Record final joint binding decision and coordinate cases.
 */
export async function recordDecision(id, body, actor) {
  return withTransaction(async (client) => {
    const existing = await coordRepo.findCoordinationById(id, client);
    if (!existing) {
      throw new AppError(404, 'COORDINATION_NOT_FOUND', `Coordination request ${id} not found`);
    }

    const updated = await coordRepo.recordJointDecision(
      id,
      {
        joint_decision: body.joint_decision,
        status: body.status,
        user_id: actor.id,
      },
      client,
    );

    // Log decision on primary case
    await client.query(
      `INSERT INTO complaint_actions
         (complaint_id, action_type, remarks, performed_by, performed_by_bureau, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        existing.complaint_id,
        ACTION_TYPES.FIELD_UPDATED,
        `Joint cross-bureau coordination decision recorded (${existing.request_no}): ${body.joint_decision}`,
        actor.id,
        actor.bureau_id || existing.initiating_bureau_id,
        JSON.stringify({ coordination_id: id, decision: body.joint_decision, status: body.status }),
      ],
    );

    // If target complaint exists, mirror decision on it
    if (existing.target_complaint_id) {
      await client.query(
        `INSERT INTO complaint_actions
           (complaint_id, action_type, remarks, performed_by, performed_by_bureau, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          existing.target_complaint_id,
          ACTION_TYPES.FIELD_UPDATED,
          `Joint cross-bureau coordination decision recorded (${existing.request_no}): ${body.joint_decision}`,
          actor.id,
          actor.bureau_id || existing.target_bureau_id,
          JSON.stringify({ coordination_id: id, decision: body.joint_decision }),
        ],
      );
    }

    return updated;
  });
}

/**
 * Get workspace metrics.
 */
export async function getMetrics(bureauId = null) {
  return coordRepo.getCoordinationMetrics(bureauId);
}

