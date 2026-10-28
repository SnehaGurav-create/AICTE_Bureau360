// Catches requests that don't match any route and returns a 404 JSON response.

import { AppError } from '../utils/AppError.js';

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} _res
 * @param {Function} next
 */
export function notFound(req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
}
