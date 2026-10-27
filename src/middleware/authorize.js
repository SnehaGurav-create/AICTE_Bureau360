// Checks that the authenticated user has the required permission.
// Must be used after authenticate middleware.

import { AppError } from '../utils/AppError.js';

/**
 * Returns middleware that checks req.user.permissions for the given permission code.
 *
 * @param {string} permissionCode - e.g. 'institution:write'
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.post('/institutions', authenticate, authorize('institution:write'), controller.create);
 */
export function authorize(permissionCode) {
  return (req, _res, next) => {
    if (!req.user) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Authentication is required');
    }

    if (!req.user.permissions.includes(permissionCode)) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
    }

    next();
  };
}
