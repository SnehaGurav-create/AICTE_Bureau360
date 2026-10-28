// Central error handler. Every error — AppError, Zod validation, or unexpected — goes through here.

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Express error-handling middleware (4 arguments).
 * Formats all errors into the standard JSON envelope:
 *   { "error": { "code": "...", "message": "...", "details": [...] } }
 *
 * @param {Error}  err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {Function} _next
 */
export function errorHandler(err, req, res, _next) {
  // Default to 500 Internal Server Error
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  const details = err.details || undefined;

  // Multer file-size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    code = 'FILE_TOO_LARGE';
    message = 'Uploaded file exceeds the size limit';
  }

  // Log server errors with full stack; client errors at warn level
  if (statusCode >= 500) {
    logger.error({ err, requestId: req.id }, message);
  } else {
    logger.warn({ requestId: req.id, code, statusCode }, message);
  }

  // Never leak stack traces in production
  const response = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(env.NODE_ENV === 'development' && statusCode >= 500
        ? { stack: err.stack }
        : {}),
    },
  };

  res.status(statusCode).json(response);
}
