// Background job: SLA reminder and escalation notifications.
// Runs on a configurable cron schedule (default: every hour).

import { logger } from '../config/logger.js';
import { pool } from '../config/database.js';
import { withTransaction } from '../utils/withTransaction.js';
import { ACTION_TYPES, ASSIGNMENT_KINDS } from '../constants/actionTypes.js';
import * as notifRepo from '../modules/notifications/notifications.repository.js';
import * as notifService from '../modules/notifications/notifications.service.js';

/**
 * Process SLA warnings (complaints nearing deadline).
 * Creates in-app notifications for assigned users and bureau members.
 */
export async function processSlaWarnings() {
  try {
    const nearingComplaints = await notifRepo.findComplainsNearingSla(24); // 24h warning
    logger.info({ count: nearingComplaints.length }, 'SLA warning check: complaints nearing deadline');

    for (const complaint of nearingComplaints) {
      try {
        await notifService.createSlaWarning(complaint);
      } catch (err) {
        logger.error({ err, complaintId: complaint.id }, 'Failed to create SLA warning');
      }
    }

    return nearingComplaints.length;
  } catch (err) {
    logger.error({ err }, 'SLA warning job failed');
    return 0;
  }
}

/**
 * Process SLA breaches (overdue complaints).
 * Creates both in-app and email notifications.
 */
export async function processSlaBreaches() {
  try {
    const overdueComplaints = await notifRepo.findOverdueComplaints();
    logger.info({ count: overdueComplaints.length }, 'SLA breach check: overdue complaints');

    for (const complaint of overdueComplaints) {
      try {
        await notifService.createSlaBreach(complaint);
      } catch (err) {
        logger.error({ err, complaintId: complaint.id }, 'Failed to create SLA breach alert');
      }
    }

    return overdueComplaints.length;
  } catch (err) {
    logger.error({ err }, 'SLA breach job failed');
    return 0;
  }
}

/**
 * Process auto-escalations for complaints overdue past escalation threshold.
 * Transitions complaint to ESCALATED and reassigns to escalation bureau.
 */
export async function processAutoEscalations() {
  try {
    const escalatableComplaints = await notifRepo.findComplaintsForAutoEscalation();
    logger.info({ count: escalatableComplaints.length }, 'SLA check: complaints eligible for auto-escalation');

    // Get an admin or system user for logging audit actions
    const { rows: adminRows } = await pool.query(
      `SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE code = 'ADMIN' LIMIT 1) LIMIT 1`,
    );
    const systemUserId = adminRows[0]?.id;

    let escalatedCount = 0;
    for (const complaint of escalatableComplaints) {
      try {
        await withTransaction(async (client) => {
          // 1. Update complaint status and bureau
          await client.query(
            `UPDATE complaints
             SET status = 'ESCALATED',
                 current_bureau_id = $1,
                 current_assignee_id = NULL,
                 updated_at = now()
             WHERE id = $2`,
            [complaint.escalate_to_bureau_id, complaint.id],
          );

          // 2. Clear previous active assignment
          await client.query(
            `UPDATE complaint_assignments
             SET is_current = false
             WHERE complaint_id = $1 AND is_current = true`,
            [complaint.id],
          );

          // 3. Insert escalation assignment record
          if (systemUserId) {
            await client.query(
              `INSERT INTO complaint_assignments
                 (complaint_id, kind, from_bureau_id, to_bureau_id, assigned_by, reason, is_current)
               VALUES ($1, $2, $3, $4, $5, $6, true)`,
              [
                complaint.id,
                ASSIGNMENT_KINDS.ESCALATION,
                complaint.current_bureau_id,
                complaint.escalate_to_bureau_id,
                systemUserId,
                `Auto-escalated by SLA monitor: breach exceeded ${complaint.escalate_after_hours}h threshold`,
              ],
            );

            // 4. Log immutable timeline action
            await client.query(
              `INSERT INTO complaint_actions
                 (complaint_id, action_type, from_status, to_status, remarks, performed_by, performed_by_bureau)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                complaint.id,
                ACTION_TYPES.ESCALATED,
                complaint.status,
                'ESCALATED',
                `System SLA trigger: Auto-escalated due to resolution overdue by ${complaint.escalate_after_hours}h`,
                systemUserId,
                complaint.escalate_to_bureau_id,
              ],
            );
          }
        });

        escalatedCount++;
        // Dispatch ESCALATION notification to target bureau users
        await notifService.createEscalationAlert(complaint).catch((err) => {
          logger.warn({ err, complaintId: complaint.id }, 'Failed to dispatch escalation notification');
        });
        logger.info({ complaintNo: complaint.complaint_no }, 'Complaint auto-escalated successfully');
      } catch (err) {
        logger.error({ err, complaintId: complaint.id }, 'Failed to auto-escalate complaint');
      }
    }

    return escalatedCount;
  } catch (err) {
    logger.error({ err }, 'Auto-escalation job failed');
    return 0;
  }
}

/**
 * Full SLA check: warnings + breaches + auto-escalations.
 */
export async function runSlaCheck() {
  logger.info('Starting SLA reminder job');
  const warnings = await processSlaWarnings();
  const breaches = await processSlaBreaches();
  const escalations = await processAutoEscalations();
  logger.info({ warnings, breaches, escalations }, 'SLA reminder job completed');
}
