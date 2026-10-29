// Notification business logic: create alerts, mark read, email dispatch.

import { logger } from '../../config/logger.js';
import { AppError } from '../../utils/AppError.js';
import * as repo from './notifications.repository.js';

// ── Notification type constants ────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  OVERLAP_DETECTED: 'OVERLAP_DETECTED',
  SLA_WARNING: 'SLA_WARNING',
  SLA_BREACH: 'SLA_BREACH',
  ESCALATION: 'ESCALATION',
  COMPLAINT_ASSIGNED: 'COMPLAINT_ASSIGNED',
  COMPLAINT_STATUS_CHANGED: 'COMPLAINT_STATUS_CHANGED',
  COMPLAINT_TRANSFERRED: 'COMPLAINT_TRANSFERRED',
  OVERLAP_REVIEW_UPDATE: 'OVERLAP_REVIEW_UPDATE',
};

/**
 * Create an overlap-detected alert for relevant bureau users.
 *
 * @param {object} data - { complaintNo, institutionName, bureauId, linksCreated }
 * @returns {Promise<Array>}
 */
export async function createOverlapAlert(data) {
  const { complaintNo, institutionName, bureauId, linksCreated } = data;

  const users = await repo.findUsersByBureau(bureauId);
  if (users.length === 0) {
    logger.warn({ bureauId }, 'No active users in bureau for overlap alert');
    return [];
  }

  const notifications = users.map((user) => ({
    user_id: user.id,
    to_email: user.email,
    type: NOTIFICATION_TYPES.OVERLAP_DETECTED,
    channel: 'IN_APP',
    subject: `Overlap detected — ${complaintNo}`,
    body: `${linksCreated} potential overlap(s) found for complaint ${complaintNo} (${institutionName}). Please review in the Overlap Review Centre.`,
    metadata: { complaint_no: complaintNo, links_created: linksCreated },
  }));

  // Also create email versions
  const emailNotifications = users
    .filter((u) => u.email)
    .map((user) => ({
      user_id: user.id,
      to_email: user.email,
      type: NOTIFICATION_TYPES.OVERLAP_DETECTED,
      channel: 'EMAIL',
      subject: `[Bureau360] Overlap detected — ${complaintNo}`,
      body: `Dear ${user.name},\n\n${linksCreated} potential overlap(s) have been found for complaint ${complaintNo} regarding ${institutionName}.\n\nPlease log in to the Overlap Review Centre to confirm or dismiss these matches.\n\nRegards,\nBureau360 System`,
      metadata: { complaint_no: complaintNo, links_created: linksCreated },
    }));

  const all = [...notifications, ...emailNotifications];
  return repo.createBulkNotifications(all);
}

/**
 * Create an SLA warning notification for approaching deadlines.
 *
 * @param {object} complaint - Row from findComplainsNearingSla
 * @returns {Promise<Array>}
 */
export async function createSlaWarning(complaint) {
  const targets = [];

  // Notify assignee
  if (complaint.assignee_id) {
    targets.push(complaint.assignee_id);
  }

  // Notify bureau users
  if (complaint.current_bureau_id) {
    const users = await repo.findUsersByBureau(complaint.current_bureau_id);
    for (const u of users) {
      if (!targets.includes(u.id)) targets.push(u.id);
    }
  }

  if (targets.length === 0) return [];

  const hoursLeft = Math.max(
    0,
    Math.round((new Date(complaint.sla_due_at) - new Date()) / 3600000),
  );

  const notifications = targets.map((userId) => ({
    user_id: userId,
    type: NOTIFICATION_TYPES.SLA_WARNING,
    channel: 'IN_APP',
    subject: `SLA deadline approaching — ${complaint.complaint_no}`,
    body: `Complaint ${complaint.complaint_no} for ${complaint.institution_name} (${complaint.aicte_id}) has ${hoursLeft}h remaining before SLA breach.`,
    metadata: {
      complaint_id: complaint.id,
      complaint_no: complaint.complaint_no,
      sla_due_at: complaint.sla_due_at,
      hours_remaining: hoursLeft,
    },
  }));

  return repo.createBulkNotifications(notifications);
}

/**
 * Create an SLA breach notification for overdue complaints.
 *
 * @param {object} complaint
 * @returns {Promise<Array>}
 */
export async function createSlaBreach(complaint) {
  const targets = [];

  if (complaint.assignee_id) {
    targets.push(complaint.assignee_id);
  }

  if (complaint.current_bureau_id) {
    const users = await repo.findUsersByBureau(complaint.current_bureau_id);
    for (const u of users) {
      if (!targets.includes(u.id)) targets.push(u.id);
    }
  }

  if (targets.length === 0) return [];

  const hoursOverdue = Math.round(
    (new Date() - new Date(complaint.sla_due_at)) / 3600000,
  );

  const notifications = [];
  for (const userId of targets) {
    // In-app
    notifications.push({
      user_id: userId,
      type: NOTIFICATION_TYPES.SLA_BREACH,
      channel: 'IN_APP',
      subject: `⚠ SLA BREACHED — ${complaint.complaint_no}`,
      body: `Complaint ${complaint.complaint_no} for ${complaint.institution_name} is ${hoursOverdue}h past SLA deadline. Immediate action required.`,
      metadata: {
        complaint_id: complaint.id,
        complaint_no: complaint.complaint_no,
        sla_due_at: complaint.sla_due_at,
        hours_overdue: hoursOverdue,
      },
    });

    // Email
    notifications.push({
      user_id: userId,
      type: NOTIFICATION_TYPES.SLA_BREACH,
      channel: 'EMAIL',
      subject: `[Bureau360] SLA BREACHED — ${complaint.complaint_no}`,
      body: `URGENT: Complaint ${complaint.complaint_no} for ${complaint.institution_name} (${complaint.aicte_id}) is ${hoursOverdue} hour(s) past SLA deadline.\n\nStatus: ${complaint.status}\nBureau: ${complaint.bureau_name || 'Unassigned'}\n\nPlease take immediate action.`,
      metadata: {
        complaint_id: complaint.id,
        complaint_no: complaint.complaint_no,
      },
    });
  }

  return repo.createBulkNotifications(notifications);
}

/**
 * Create an escalation alert when a complaint is auto-escalated or escalated by officer.
 *
 * @param {object} complaint
 * @returns {Promise<Array>}
 */
export async function createEscalationAlert(complaint) {
  const targetBureauId = complaint.escalate_to_bureau_id || complaint.current_bureau_id;
  if (!targetBureauId) return [];

  const users = await repo.findUsersByBureau(targetBureauId);
  if (users.length === 0) {
    logger.warn({ targetBureauId }, 'No active users in escalation target bureau');
    return [];
  }

  const notifications = users.map((user) => ({
    user_id: user.id,
    type: NOTIFICATION_TYPES.ESCALATION,
    channel: 'IN_APP',
    subject: `🚨 Case Escalated — ${complaint.complaint_no}`,
    body: `Complaint ${complaint.complaint_no} (${complaint.institution_name || 'Institution'}) has been escalated to your bureau for urgent intervention.`,
    metadata: {
      complaint_id: complaint.id,
      complaint_no: complaint.complaint_no,
      reason: complaint.reason || 'SLA breach escalation threshold reached',
    },
  }));

  const emailNotifications = users
    .filter((u) => u.email)
    .map((user) => ({
      user_id: user.id,
      to_email: user.email,
      type: NOTIFICATION_TYPES.ESCALATION,
      channel: 'EMAIL',
      subject: `[Bureau360] 🚨 Case Escalated — ${complaint.complaint_no}`,
      body: `Dear ${user.name},\n\nComplaint ${complaint.complaint_no} regarding ${complaint.institution_name || 'Institution'} has been escalated to your bureau for immediate review and resolution.\n\nPlease log in to Bureau360 to take required action.\n\nRegards,\nAICTE Bureau360 System`,
      metadata: {
        complaint_id: complaint.id,
        complaint_no: complaint.complaint_no,
      },
    }));

  return repo.createBulkNotifications([...notifications, ...emailNotifications]);
}


/**
 * Get user notifications (in-app inbox).
 */
export async function getUserNotifications(userId, pagination, unreadOnly) {
  return repo.findByUserId(userId, pagination, unreadOnly);
}

/**
 * Get user's unread notification count.
 */
export async function getUnreadCount(userId) {
  return repo.getUnreadCount(userId);
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId, userId) {
  const updated = await repo.markAsRead(notificationId, userId);
  if (!updated) {
    throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found or does not belong to you');
  }
  return updated;
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllAsRead(userId) {
  const count = await repo.markAllAsRead(userId);
  return { updated: count };
}
