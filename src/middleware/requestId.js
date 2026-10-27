// Attaches a unique request ID to every incoming request for tracing in logs.

import crypto from 'node:crypto';

/**
 * Middleware that sets req.id from the X-Request-Id header (if present) or generates a new UUID.
 * Also sets the response header so the frontend/caller can correlate.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {Function} next
 */
export function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
