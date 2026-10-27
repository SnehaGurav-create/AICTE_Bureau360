// Starts the HTTP server and background jobs. This is the entry point (npm start / npm run dev).

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { pool } from './config/database.js';
import { createApp } from './app.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Bureau360 API listening on port ${env.PORT} (${env.NODE_ENV})`);
  logger.info(`Swagger docs: ${env.API_BASE_URL}/api/docs`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await pool.end();
    logger.info('Database pool closed. Goodbye.');
    process.exit(0);
  });
  // Force exit after 10 seconds if graceful shutdown stalls
  setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});
