// Database queries for authentication, users, roles, and refresh tokens.

import { pool } from '../../config/database.js';

/**
 * Finds an active user by email with their role, bureau, and permissions.
 *
 * @param {string} email
 * @returns {Promise<object|null>}
 */
export async function findUserByEmail(email) {
  const query = `
    SELECT u.id, u.full_name, u.email, u.password_hash, u.phone, u.designation,
           u.is_active, u.failed_login_count, u.locked_until, u.bureau_id, u.role_id,
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
    GROUP BY u.id, r.code, r.name, r.scope, b.name, b.region_id
  `;
  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
}

/**
 * Finds a user by ID with role, bureau, and permissions.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function findUserById(id) {
  const query = `
    SELECT u.id, u.full_name, u.email, u.phone, u.designation,
           u.is_active, u.bureau_id, u.role_id,
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
    GROUP BY u.id, r.code, r.name, r.scope, b.name, b.region_id
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

/**
 * Finds a role by its code (e.g. 'ADMIN', 'REGULATION_BUREAU').
 *
 * @param {string} code
 * @returns {Promise<object|null>}
 */
export async function findRoleByCode(code) {
  const { rows } = await pool.query(`SELECT id, code, name, scope FROM roles WHERE code = $1`, [code]);
  return rows[0] || null;
}

/**
 * Finds a bureau by its ID.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function findBureauById(id) {
  const { rows } = await pool.query(`SELECT id, code, name, type, region_id FROM bureaus WHERE id = $1`, [id]);
  return rows[0] || null;
}

/**
 * Creates a new user row.
 *
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function createUser({ full_name, email, password_hash, phone, designation, role_id, bureau_id }) {
  const query = `
    INSERT INTO users (full_name, email, password_hash, phone, designation, role_id, bureau_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, full_name, email, phone, designation, role_id, bureau_id, is_active, created_at
  `;
  const { rows } = await pool.query(query, [
    full_name,
    email,
    password_hash,
    phone || null,
    designation || null,
    role_id,
    bureau_id || null,
  ]);
  return rows[0];
}

/**
 * Updates failed login counter and lockout timestamp.
 *
 * @param {string} userId
 * @param {number} count
 * @param {Date|null} lockedUntil
 */
export async function updateFailedLogin(userId, count, lockedUntil) {
  await pool.query(
    `UPDATE users SET failed_login_count = $2, locked_until = $3 WHERE id = $1`,
    [userId, count, lockedUntil],
  );
}

/**
 * Resets failed logins to 0, clears lockout, and updates last_login_at.
 *
 * @param {string} userId
 */
export async function resetFailedLoginAndSetLastLogin(userId) {
  await pool.query(
    `UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = now() WHERE id = $1`,
    [userId],
  );
}

/**
 * Inserts a new refresh token hash.
 *
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function insertRefreshToken({ userId, tokenHash, expiresAt, ip, userAgent }) {
  const query = `
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip, user_agent)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, expires_at, created_at
  `;
  const { rows } = await pool.query(query, [
    userId,
    tokenHash,
    expiresAt,
    ip || null,
    userAgent || null,
  ]);
  return rows[0];
}

/**
 * Finds an unrevoked, unexpired refresh token by its SHA-256 hash.
 *
 * @param {string} tokenHash
 * @returns {Promise<object|null>}
 */
export async function findActiveRefreshToken(tokenHash) {
  const query = `
    SELECT id, user_id, token_hash, expires_at, revoked_at
    FROM refresh_tokens
    WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()
  `;
  const { rows } = await pool.query(query, [tokenHash]);
  return rows[0] || null;
}

/**
 * Revokes a refresh token by setting revoked_at = now().
 *
 * @param {string} tokenHash
 */
export async function revokeRefreshToken(tokenHash) {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash],
  );
}

/**
 * Revokes all active refresh tokens for a user (e.g. on global logout or password reset).
 *
 * @param {string} userId
 */
export async function revokeAllUserRefreshTokens(userId) {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
}
