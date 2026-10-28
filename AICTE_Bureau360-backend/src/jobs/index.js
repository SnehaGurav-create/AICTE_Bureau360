// Registers all background cron jobs using node-cron.

import cron from 'node-cron';
import { logger } from '../config/logger.js';
import { runSlaCheck } from './slaReminder.js';
import { processMailQueue } from './mailWorker.js';

const jobs = [];

/**
 * Start all cron jobs.
 */
export function startJobs() {
  // SLA reminder — runs every hour at minute 0
  const slaJob = cron.schedule('0 * * * *', async () => {
    logger.info('[CRON] Running SLA reminder check');
    await runSlaCheck();
  });
  jobs.push(slaJob);
  logger.info('[CRON] SLA reminder scheduled — every hour');

  // Mail worker — runs every 2 minutes
  const mailJob = cron.schedule('*/2 * * * *', async () => {
    logger.debug('[CRON] Processing mail queue');
    await processMailQueue(20);
  });
  jobs.push(mailJob);
  logger.info('[CRON] Mail worker scheduled — every 2 minutes');
}

/**
 * Stop all cron jobs (for graceful shutdown).
 */
export function stopJobs() {
  for (const job of jobs) {
    job.stop();
  }
  logger.info('[CRON] All jobs stopped');
}
