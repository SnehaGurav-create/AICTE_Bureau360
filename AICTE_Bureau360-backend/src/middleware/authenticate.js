// Verifies the JWT access token and loads the user onto req.user.
// Rejects expired tokens and inactive users.

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../config/database.js';
import { AppError } from '../utils/AppError.js';

/**
 * Express middleware that checks the Authorization header for a valid Bearer token.
 * On success, sets req.user with { id, full_name, email, role_code, role_scope,
 * bureau_id, permissions[] }.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} _res
 * @param {Function} next
 */
export async function authenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'AUTH_REQUIRED', 'Missing or invalid Authorization header');
  }

  const token = header.slice(7);

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';
    throw new AppError(401, 'INVALID_TOKEN', message);
  }

  // Load user with role and permissions in a single query
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.is_active,
            u.bureau_id, u.role_id,
            r.code  AS role_code,
            r.scope AS role_scope,
            b.name  AS bureau_name,
            b.region_id,
            COALESCE(
              array_agg(p.code) FILTER (WHERE p.code IS NOT NULL),
              '{}'
            ) AS permissions
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN bureaus b ON b.id = u.bureau_id
     LEFT JOIN role_permissions rp ON rp.role_id = u.role_id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE u.id = $1
     GROUP BY u.id, r.code, r.scope, b.name, b.region_id`,
    [payload.sub],
  );

  if (rows.length === 0) {
    throw new AppError(401, 'INVALID_TOKEN', 'User not found');
  }

  const user = rows[0];

  if (!user.is_active) {
    throw new AppError(401, 'ACCOUNT_INACTIVE', 'Account is deactivated');
  }

  req.user = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role_id: user.role_id,
    role_code: user.role_code,
    role_scope: user.role_scope,
    bureau_id: user.bureau_id,
    bureau_name: user.bureau_name,
    region_id: user.region_id,
    permissions: user.permissions,
  };

  next();
}
