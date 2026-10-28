// Application logger (pino). Every module imports { logger } from here.

import pino from 'pino';
import { env } from './env.js';

const isProduction = env.NODE_ENV === 'production';

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }),
  // Redact sensitive fields so they never appear in logs
  redact: {
    paths: ['req.headers.authorization', 'password', 'password_hash', 'token', 'refresh_token'],
    censor: '[REDACTED]',
  },
});
