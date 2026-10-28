// Background job: processes pending email notifications via Nodemailer.
// Runs on a configurable cron schedule (default: every 2 minutes).

import { logger } from '../config/logger.js';
import { mailTransport, mailDefaults } from '../config/mail.js';
import * as notifRepo from '../modules/notifications/notifications.repository.js';

/**
 * Process a batch of pending email notifications.
 * Fetches PENDING emails, sends them, and updates their status.
 *
 * @param {number} batchSize - Number of emails to process per run
 * @returns {Promise<{ sent: number, failed: number }>}
 */
export async function processMailQueue(batchSize = 20) {
  try {
    const pending = await notifRepo.fetchPendingEmails(batchSize);

    if (pending.length === 0) {
      return { sent: 0, failed: 0 };
    }

    logger.info({ count: pending.length }, 'Processing email queue');

    let sent = 0;
    let failed = 0;

    for (const notification of pending) {
      try {
        await mailTransport.sendMail({
          from: mailDefaults.from,
          to: notification.to_email,
          subject: notification.subject,
          text: notification.body,
        });

        await notifRepo.updateSendStatus(notification.id, 'SENT');
        sent++;
        logger.debug({ notificationId: notification.id, to: notification.to_email }, 'Email sent');
      } catch (err) {
        await notifRepo.updateSendStatus(notification.id, 'FAILED', err.message);
        failed++;
        logger.error(
          { err, notificationId: notification.id, to: notification.to_email },
          'Failed to send email',
        );
      }
    }

    logger.info({ sent, failed }, 'Email queue batch complete');
    return { sent, failed };
  } catch (err) {
    logger.error({ err }, 'Mail worker job failed');
    return { sent: 0, failed: 0 };
  }
}
