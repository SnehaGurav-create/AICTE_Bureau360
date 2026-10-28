// Database queries for authentication and tokens.

import { pool } from '../../config/database.js';

/**
 * Find user by email with role, bureau, and permissions attached.
 *
 * @param {string} email
 * @returns {Promise<object|null>}
 */
export async function findUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.password_hash, u.is_active,
            u.failed_login_count, u.locked_until,
            u.bureau_id, u.role_id,
            r.code  AS role_code,
            r.name  AS role_name,
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
     WHERE LOWER(u.email) = LOWER($1)
     GROUP BY u.id, r.code, r.name, r.scope, b.name, b.region_id`,
    [email],
  );
  return rows[0] || null;
}

/**
 * Find user by ID with role, bureau, and permissions attached.
 *
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function findUserById(userId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.is_active,
            u.bureau_id, u.role_id,
            r.code  AS role_code,
            r.name  AS role_name,
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
     GROUP BY u.id, r.code, r.name, r.scope, b.name, b.region_id`,
    [userId],
  );
  return rows[0] || null;
}

/**
 * Update user last login timestamp.
 *
 * @param {string} userId
 */
export async function updateLastLogin(userId) {
  await pool.query(
    `UPDATE users
     SET last_login_at = now(), failed_login_count = 0, locked_until = NULL
     WHERE id = $1`,
    [userId],
  );
}

/**
 * Store a refresh token hash in the database.
 */
export async function saveRefreshToken({ userId, tokenHash, expiresAt, ip, userAgent }) {
  const { rows } = await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, token_hash, expires_at`,
    [userId, tokenHash, expiresAt, ip || null, userAgent || null],
  );
  return rows[0];
}

/**
 * Find valid (unrevoked, unexpired) refresh token.
 */
export async function findRefreshToken(tokenHash) {
  const { rows } = await pool.query(
    `SELECT rt.*, u.is_active
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1
       AND rt.revoked_at IS NULL
       AND rt.expires_at > now()`,
    [tokenHash],
  );
  return rows[0] || null;
}

/**
 * Revoke a single refresh token.
 */
export async function revokeRefreshToken(tokenHash) {
  const { rowCount } = await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`,
    [tokenHash],
  );
  return rowCount > 0;
}

/**
 * Revoke all refresh tokens for a user (e.g. global logout or password change).
 */
export async function revokeAllUserRefreshTokens(userId) {
  const { rowCount } = await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
  return rowCount;
}
