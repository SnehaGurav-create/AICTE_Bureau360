// Business logic for complaints: create, list, update, status transitions, remarks.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { withTransaction } from '../../utils/withTransaction.js';
import { findBestSlaRule, calculateSlaDue } from '../../utils/slaLookup.js';
import { COMPLAINT_STATUSES, STATUS_TRANSITIONS, REMARKS_REQUIRED_STATUSES } from '../../constants/statuses.js';
import { ACTION_TYPES, ASSIGNMENT_KINDS } from '../../constants/actionTypes.js';
import * as repo from './complaints.repository.js';

function withAllowedNextStatuses(complaint) {
  if (!complaint) {
    return null;
  }
  return {
    ...complaint,
    allowed_next_statuses: STATUS_TRANSITIONS[complaint.status] || [],
  };
}

/**
 * Create a new complaint with SLA calculation, initial action, and optional assignment.
 *
 * @param {object} data - Complaint data from controller
 * @param {object} user - req.user
 * @returns {Promise<object>} Created complaint with joined fields
 */
export async function createComplaint(data, user) {
  // Resolve institution
  const institutionId = await repo.findInstitutionByAicteId(data.aicte_id);
  if (!institutionId) {
    throw new AppError(404, 'INSTITUTION_NOT_FOUND', `Institution with AICTE ID '${data.aicte_id}' not found`);
  }

  return withTransaction(async (client) => {
    // Find SLA rule
    const slaRule = await findBestSlaRule(
      {
        categoryId: data.category_id,
        priority: data.priority,
        bureauId: data.bureau_id || null,
      },
      client,
    );

    const slaDueAt = slaRule
      ? calculateSlaDue(data.received_on || new Date(), slaRule.resolution_hours)
      : null;

    // Create complaint
    const complaint = await repo.createComplaint(
      {
        ...data,
        institution_id: institutionId,
        created_by: user.id,
        sla_due_at: slaDueAt,
        current_bureau_id: data.bureau_id || null,
      },
      client,
    );

    // Insert CREATED action
    await repo.insertAction(
      {
        complaint_id: complaint.id,
        action_type: ACTION_TYPES.CREATED,
        to_status: COMPLAINT_STATUSES.NEW,
        performed_by: user.id,
        performed_by_bureau: user.bureau_id,
        metadata: { sla_rule_id: slaRule?.id },
      },
      client,
    );

    // If bureau_id provided, create first assignment and set status to ASSIGNED
    if (data.bureau_id) {
      await client.query(
        `INSERT INTO complaint_assignments (
           complaint_id, kind, to_bureau_id, assigned_by, is_current
         ) VALUES ($1, $2, $3, $4, true)`,
        [complaint.id, ASSIGNMENT_KINDS.ASSIGNMENT, data.bureau_id, user.id],
      );

      await client.query(`UPDATE complaints SET status = $1 WHERE id = $2`, [
        COMPLAINT_STATUSES.ASSIGNED,
        complaint.id,
      ]);

      await repo.insertAction(
        {
          complaint_id: complaint.id,
          action_type: ACTION_TYPES.ASSIGNED,
          from_status: COMPLAINT_STATUSES.NEW,
          to_status: COMPLAINT_STATUSES.ASSIGNED,
          performed_by: user.id,
          performed_by_bureau: user.bureau_id,
          metadata: { bureau_id: data.bureau_id },
        },
        client,
      );
    }

    // Return full detail
    const created = await repo.findComplaintById(complaint.id, user, client);
    return withAllowedNextStatuses(created);
  });
}

/**
 * List complaints with filters, scope, sorting and pagination.
 *
 * @param {object} filters
 * @param {object} user
 * @param {object} pagination
 * @param {object} sort
 * @returns {Promise<{ complaints: Array, total: number }>}
 */
export async function listComplaints(filters, user, pagination, sort) {
  const { rows, total } = await repo.findComplaints(filters, user, pagination, sort);

  // Add allowed_next_statuses for each complaint
  const complaints = rows.map((c) => ({
    ...c,
    allowed_next_statuses: STATUS_TRANSITIONS[c.status] || [],
  }));

  return { complaints, total };
}

/**
 * Get single complaint detail with allowed_next_statuses.
 *
 * @param {string} id
 * @param {object} user
 * @returns {Promise<object>}
 */
export async function getComplaintDetail(id, user) {
  const complaint = await repo.findComplaintById(id, user);
  if (!complaint) {
    throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
  }

  return withAllowedNextStatuses(complaint);
}

/**
 * Update complaint fields (title, description, category, priority, complainant info).
 * Records FIELD_UPDATED action with old/new values.
 *
 * @param {string} id
 * @param {object} updates
 * @param {object} user
 * @returns {Promise<object>}
 */
export async function updateComplaint(id, updates, user) {
  return withTransaction(async (client) => {
    // Lock and load
    const complaint = await repo.lockComplaintForUpdate(id, client);
    if (!complaint) {
      throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    // Track changed fields
    const oldData = {};
    const newData = {};
    const changes = {};

    for (const [key, value] of Object.entries(updates)) {
      if (complaint[key] !== value) {
        oldData[key] = complaint[key];
        newData[key] = value;
        changes[key] = value;
      }
    }

    if (Object.keys(changes).length === 0) {
      // No actual changes
      const existing = await repo.findComplaintById(id, user, client);
      return withAllowedNextStatuses(existing);
    }

    // If category or priority changed, recompute SLA
    if (changes.category_id || changes.priority) {
      const slaRule = await findBestSlaRule(
        {
          categoryId: changes.category_id || complaint.category_id,
          priority: changes.priority || complaint.priority,
          bureauId: complaint.current_bureau_id,
        },
        client,
      );

      if (slaRule) {
        changes.sla_due_at = calculateSlaDue(complaint.received_on, slaRule.resolution_hours);
      }
    }

    // Update
    await repo.updateComplaint(id, changes, client);

    // Record action
    await repo.insertAction(
      {
        complaint_id: id,
        action_type: ACTION_TYPES.FIELD_UPDATED,
        performed_by: user.id,
        performed_by_bureau: user.bureau_id,
        metadata: { old_data: oldData, new_data: newData },
      },
      client,
    );

    const updated = await repo.findComplaintById(id, user, client);
    return withAllowedNextStatuses(updated);
  });
}

/**
 * Change complaint status with validation and remarks enforcement.
 *
 * @param {string} id
 * @param {string} newStatus
 * @param {string|null} remarks
 * @param {object} user
 * @returns {Promise<object>}
 */
export async function changeComplaintStatus(id, newStatus, remarks, user) {
  return withTransaction(async (client) => {
    // Lock complaint
    const complaint = await repo.lockComplaintForUpdate(id, client);
    if (!complaint) {
      throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    const currentStatus = complaint.status;

    // Validate transition
    const allowedStatuses = STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedStatuses.includes(newStatus)) {
      throw new AppError(
        400,
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }

    // Check remarks requirement
    if (REMARKS_REQUIRED_STATUSES.has(newStatus) && (!remarks || remarks.trim().length === 0)) {
      throw new AppError(400, 'REMARKS_REQUIRED', `Remarks are required when moving to ${newStatus}`);
    }

    // Prepare updates
    const updates = { status: newStatus };

    if (newStatus === COMPLAINT_STATUSES.RESOLVED) {
      updates.resolved_at = new Date();
      if (!complaint.first_response_at) {
        updates.first_response_at = new Date();
      }
    } else if (newStatus === COMPLAINT_STATUSES.CLOSED) {
      updates.closed_at = new Date();
    } else if (newStatus === COMPLAINT_STATUSES.REOPENED) {
      updates.resolved_at = null;
      updates.closed_at = null;
    }

    // Set first_response_at if not already set
    if (!complaint.first_response_at && currentStatus === COMPLAINT_STATUSES.NEW) {
      updates.first_response_at = new Date();
    }

    // Update complaint
    await repo.updateComplaint(id, updates, client);

    // Insert STATUS_CHANGED action
    await repo.insertAction(
      {
        complaint_id: id,
        action_type: ACTION_TYPES.STATUS_CHANGED,
        from_status: currentStatus,
        to_status: newStatus,
        remarks,
        performed_by: user.id,
        performed_by_bureau: user.bureau_id,
      },
      client,
    );

    const updated = await repo.findComplaintById(id, user, client);
    return withAllowedNextStatuses(updated);
  });
}

/**
 * Add a remark (comment) to a complaint without changing its status.
 *
 * @param {string} id
 * @param {string} remarks
 * @param {boolean} isInternal
 * @param {object} user
 * @returns {Promise<object>} The created action
 */
export async function addRemark(id, remarks, isInternal, user) {
  return withTransaction(async (client) => {
    // Verify complaint exists and is accessible
    const complaint = await repo.findComplaintById(id, user, client);
    if (!complaint) {
      throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    // Lock complaint
    await repo.lockComplaintForUpdate(id, client);

    // Set first_response_at if this is the first action by an officer
    if (!complaint.first_response_at) {
      await repo.updateComplaint(id, { first_response_at: new Date() }, client);
    }

    // Insert action
    const action = await repo.insertAction(
      {
        complaint_id: id,
        action_type: ACTION_TYPES.REMARK,
        remarks,
        is_internal: isInternal,
        performed_by: user.id,
        performed_by_bureau: user.bureau_id,
      },
      client,
    );

    return action;
  });
}

/**
 * Get complaint timeline (action history).
 *
 * @param {string} id
 * @param {object} user
 * @returns {Promise<Array>}
 */
export async function getComplaintTimeline(id, user) {
  // Verify access
  const complaint = await repo.findComplaintById(id, user);
  if (!complaint) {
    throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
  }

  return repo.getComplaintTimeline(id, user);
}

/**
 * Assign a complaint to a bureau or officer.
 *
 * @param {string} id
 * @param {object} body
 * @param {object} user
 * @returns {Promise<object>}
 */
export async function assignComplaint(id, body, user) {
  return withTransaction(async (client) => {
    // 1. Lock complaint and verify scope
    const complaint = await repo.lockComplaintForUpdate(id, client);
    if (!complaint) {
      throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    const scoped = await repo.findComplaintById(id, user, client);
    if (!scoped) {
      throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    // 2. Resolve target bureau and user
    const toBureauId = body.bureau_id ?? body.to_bureau_id ?? null;
    const toUserId = body.assignee_id ?? body.to_user_id ?? null;

    if (!toBureauId && !toUserId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'At least one of bureau_id or assignee_id must be provided');
    }

    let effectiveBureauId = toBureauId;

    if (toBureauId) {
      const bureau = await repo.findBureauById(toBureauId, client);
      if (!bureau) {
        throw new AppError(404, 'BUREAU_NOT_FOUND', `Bureau with ID ${toBureauId} not found`);
      }
    }

    if (toUserId) {
      const targetUser = await repo.findUserById(toUserId, client);
      if (!targetUser) {
        throw new AppError(404, 'USER_NOT_FOUND', `User with ID ${toUserId} not found`);
      }
      if (!effectiveBureauId) {
        effectiveBureauId = targetUser.bureau_id || complaint.current_bureau_id;
      }
    } else {
      if (!effectiveBureauId) {
        effectiveBureauId = complaint.current_bureau_id;
      }
    }

    // 3. Deactivate current assignment
    await repo.deactivateCurrentAssignment(id, client);

    // 4. Insert new assignment
    const assignment = await repo.insertAssignment(
      {
        complaint_id: id,
        kind: ASSIGNMENT_KINDS.ASSIGNMENT,
        from_bureau_id: complaint.current_bureau_id,
        to_bureau_id: effectiveBureauId,
        from_user_id: complaint.current_assignee_id,
        to_user_id: toUserId ?? complaint.current_assignee_id,
        assigned_by: user.id,
        reason: body.reason || null,
        is_current: true,
      },
      client,
    );

    // 5. Update complaint status and assignee
    const currentStatus = complaint.status;
    let newStatus = currentStatus;
    if (currentStatus === COMPLAINT_STATUSES.NEW || currentStatus === COMPLAINT_STATUSES.UNDER_REVIEW) {
      newStatus = COMPLAINT_STATUSES.ASSIGNED;
    }

    const updates = {
      current_bureau_id: effectiveBureauId,
      current_assignee_id: toUserId !== undefined ? toUserId : complaint.current_assignee_id,
    };
    if (newStatus !== currentStatus) {
      updates.status = newStatus;
    }
    if (!complaint.first_response_at) {
      updates.first_response_at = new Date();
    }

    // Recompute SLA if bureau changed and specific rule exists
    if (effectiveBureauId && effectiveBureauId !== complaint.current_bureau_id) {
      const slaRule = await findBestSlaRule(
        {
          categoryId: complaint.category_id,
          priority: complaint.priority,
          bureauId: effectiveBureauId,
        },
        client,
      );
      if (slaRule) {
        updates.sla_due_at = calculateSlaDue(complaint.received_on, slaRule.resolution_hours);
      }
    }

    await repo.updateComplaint(id, updates, client);

    // 6. Insert timeline action
    await repo.insertAction(
      {
        complaint_id: id,
        action_type: ACTION_TYPES.ASSIGNED,
        from_status: currentStatus,
        to_status: newStatus,
        remarks: body.reason || null,
        performed_by: user.id,
        performed_by_bureau: user.bureau_id,
        metadata: {
          assignment_id: assignment.id,
          from_bureau_id: complaint.current_bureau_id,
          to_bureau_id: effectiveBureauId,
          from_user_id: complaint.current_assignee_id,
          to_user_id: toUserId ?? complaint.current_assignee_id,
          reason: body.reason || null,
        },
      },
      client,
    );

    const updated = await repo.findComplaintById(id, user, client);
    return {
      ...withAllowedNextStatuses(updated),
      assignment,
    };
  });
}

/**
 * Transfer a complaint to another bureau.
 *
 * @param {string} id
 * @param {object} body
 * @param {object} user
 * @returns {Promise<object>}
 */
export async function transferComplaint(id, body, user) {
  return withTransaction(async (client) => {
    // 1. Lock complaint and verify scope
    const complaint = await repo.lockComplaintForUpdate(id, client);
    if (!complaint) {
      throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    const scoped = await repo.findComplaintById(id, user, client);
    if (!scoped) {
      throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    // 2. Status check
    if (complaint.status === COMPLAINT_STATUSES.CLOSED || complaint.status === COMPLAINT_STATUSES.REJECTED) {
      throw new AppError(400, 'CANNOT_TRANSFER_CLOSED', `Cannot transfer a complaint with status ${complaint.status}`);
    }

    // 3. Validate target bureau
    const toBureauId = body.bureau_id ?? body.to_bureau_id;
    if (!toBureauId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Target bureau (to_bureau_id) is required for transfer');
    }

    const bureau = await repo.findBureauById(toBureauId, client);
    if (!bureau) {
      throw new AppError(404, 'BUREAU_NOT_FOUND', `Bureau with ID ${toBureauId} not found`);
    }

    const toUserId = body.assignee_id ?? body.to_user_id ?? null;
    if (toUserId) {
      const targetUser = await repo.findUserById(toUserId, client);
      if (!targetUser) {
        throw new AppError(404, 'USER_NOT_FOUND', `User with ID ${toUserId} not found`);
      }
    }

    if (complaint.current_bureau_id === toBureauId && (toUserId === null || complaint.current_assignee_id === toUserId)) {
      throw new AppError(400, 'SAME_BUREAU_TRANSFER', 'Complaint is already assigned to this bureau');
    }

    // 4. Deactivate current assignment
    await repo.deactivateCurrentAssignment(id, client);

    // 5. Insert new assignment with TRANSFER kind
    const assignment = await repo.insertAssignment(
      {
        complaint_id: id,
        kind: ASSIGNMENT_KINDS.TRANSFER,
        from_bureau_id: complaint.current_bureau_id,
        to_bureau_id: toBureauId,
        from_user_id: complaint.current_assignee_id,
        to_user_id: toUserId,
        assigned_by: user.id,
        reason: body.reason,
        is_current: true,
      },
      client,
    );

    // 6. Check for bureau-specific SLA rule
    const slaRule = await findBestSlaRule(
      {
        categoryId: complaint.category_id,
        priority: complaint.priority,
        bureauId: toBureauId,
      },
      client,
    );

    const currentStatus = complaint.status;
    let newStatus = currentStatus;
    if (currentStatus === COMPLAINT_STATUSES.NEW || currentStatus === COMPLAINT_STATUSES.UNDER_REVIEW) {
      newStatus = COMPLAINT_STATUSES.ASSIGNED;
    }

    const updates = {
      current_bureau_id: toBureauId,
      current_assignee_id: toUserId,
    };
    if (newStatus !== currentStatus) {
      updates.status = newStatus;
    }
    if (slaRule) {
      updates.sla_due_at = calculateSlaDue(complaint.received_on, slaRule.resolution_hours);
    }

    await repo.updateComplaint(id, updates, client);

    // 7. Insert timeline action
    await repo.insertAction(
      {
        complaint_id: id,
        action_type: ACTION_TYPES.TRANSFERRED,
        from_status: currentStatus,
        to_status: newStatus,
        remarks: body.reason,
        performed_by: user.id,
        performed_by_bureau: user.bureau_id,
        metadata: {
          assignment_id: assignment.id,
          from_bureau_id: complaint.current_bureau_id,
          to_bureau_id: toBureauId,
          from_user_id: complaint.current_assignee_id,
          to_user_id: toUserId,
          reason: body.reason,
        },
      },
      client,
    );

    const updated = await repo.findComplaintById(id, user, client);
    return {
      ...withAllowedNextStatuses(updated),
      assignment,
    };
  });
}

/**
 * Get all assignments for a complaint.
 *
 * @param {string} id
 * @param {object} user
 * @returns {Promise<Array>}
 */
export async function getComplaintAssignments(id, user) {
  const complaint = await repo.findComplaintById(id, user);
  if (!complaint) {
    throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
  }

  return repo.findAssignmentsByComplaintId(id);
}

/**
 * Upload documents for a complaint.
 *
 * @param {string} id
 * @param {Array} files
 * @param {string} docCategory
 * @param {object} user
 * @returns {Promise<Array>}
 */
export async function uploadComplaintDocuments(id, files, docCategory, user) {
  if (!files || files.length === 0) {
    throw new AppError(400, 'NO_FILES', 'No files uploaded');
  }

  const validCategories = new Set(['SUPPORTING', 'ACTION_TAKEN_REPORT', 'INSTITUTION_DOC', 'OTHER']);
  const category = docCategory && validCategories.has(docCategory) ? docCategory : 'SUPPORTING';

  try {
    return await withTransaction(async (client) => {
      // 1. Lock complaint and verify scope
      const complaint = await repo.lockComplaintForUpdate(id, client);
      if (!complaint) {
        throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
      }

      const scoped = await repo.findComplaintById(id, user, client);
      if (!scoped) {
        throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
      }

      // 2. Insert action into timeline
      const action = await repo.insertAction(
        {
          complaint_id: id,
          action_type: ACTION_TYPES.DOCUMENT_ADDED,
          remarks: `Uploaded ${files.length} document(s)`,
          performed_by: user.id,
          performed_by_bureau: user.bureau_id,
          metadata: {
            file_count: files.length,
            file_names: files.map((f) => f.originalname),
            doc_category: category,
          },
        },
        client,
      );

      // 3. Insert each document with sha256 checksum
      const createdDocs = [];
      for (const file of files) {
        const fileBuffer = fs.readFileSync(file.path);
        const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        const doc = await repo.insertDocument(
          {
            complaint_id: id,
            action_id: action.id,
            doc_category: category,
            file_name: file.originalname,
            storage_key: file.filename,
            mime_type: file.mimetype,
            size_bytes: file.size,
            sha256,
            uploaded_by: user.id,
          },
          client,
        );
        createdDocs.push(doc);
      }

      return createdDocs;
    });
  } catch (err) {
    // Clean up uploaded files on error so uncommitted files do not remain on disk
    for (const file of files) {
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          // ignore unlink error
        }
      }
    }
    throw err;
  }
}

/**
 * List documents for a complaint.
 *
 * @param {string} id
 * @param {object} user
 * @returns {Promise<Array>}
 */
export async function getComplaintDocuments(id, user) {
  const complaint = await repo.findComplaintById(id, user);
  if (!complaint) {
    throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
  }

  return repo.findDocumentsByComplaintId(id);
}

/**
 * Get a single document record for a complaint.
 *
 * @param {string} id
 * @param {string} documentId
 * @param {object} user
 * @returns {Promise<object>}
 */
export async function getComplaintDocumentById(id, documentId, user) {
  const complaint = await repo.findComplaintById(id, user);
  if (!complaint) {
    throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
  }

  const doc = await repo.findDocumentById(id, documentId);
  if (!doc) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  return doc;
}

/**
 * Download a complaint document.
 *
 * @param {string} id
 * @param {string} documentId
 * @param {object} user
 * @returns {Promise<{ doc: object, filePath: string }>}
 */
export async function downloadComplaintDocument(id, documentId, user) {
  const doc = await getComplaintDocumentById(id, documentId, user);

  const filePath = path.resolve(env.UPLOAD_DIR, doc.storage_key);
  if (!fs.existsSync(filePath)) {
    throw new AppError(404, 'FILE_NOT_FOUND', 'File not found on storage');
  }

  return { doc, filePath };
}

