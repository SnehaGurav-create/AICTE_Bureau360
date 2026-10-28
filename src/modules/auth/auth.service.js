// Authentication business logic: registration, password verification, lockout, and token management.

import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { MAX_FAILED_LOGINS, ACCOUNT_LOCK_MINUTES } from '../../constants/limits.js';
import * as repo from './auth.repository.js';

/**
 * Parses time duration string (e.g. '15m', '7d', '1h') to milliseconds.
 *
 * @param {string} duration
 * @returns {number}
 */
export function parseDurationMs(duration) {
  const match = String(duration).trim().match(/^(\d+)([smhd])$/);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000; // default 7 days
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

/**
 * Computes SHA-256 hash of a raw token string for secure storage.
 *
 * @param {string} token
 * @returns {string}
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Formats user database row into clean client response object.
 *
 * @param {object} user
 * @returns {object}
 */
export function sanitizeUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone || null,
    designation: user.designation || null,
    roleId: user.role_id,
    roleCode: user.role_code,
    roleName: user.role_name,
    roleScope: user.role_scope,
    bureauId: user.bureau_id || null,
    bureauName: user.bureau_name || null,
    regionId: user.region_id || null,
    permissions: user.permissions || [],
  };
}

/**
 * Generates JWT access token and database-backed refresh token.
 *
 * @param {object} user
 * @param {object} [meta]
 * @returns {Promise<object>}
 */
export async function generateTokens(user, meta = {}) {
  const accessToken = jwt.sign({ sub: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const refreshExpiresInMs = parseDurationMs(env.JWT_REFRESH_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + refreshExpiresInMs);

  await repo.insertRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  const accessExpiresInMs = parseDurationMs(env.JWT_ACCESS_EXPIRES_IN);

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    tokenType: 'Bearer',
    expiresIn: Math.floor(accessExpiresInMs / 1000),
  };
}

/**
 * Registers a new user.
 *
 * @param {object} data
 * @param {object} [meta]
 * @returns {Promise<object>}
 */
export async function registerUser(data, meta = {}) {
  const existing = await repo.findUserByEmail(data.email);
  if (existing) {
    throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
  }

  const role = await repo.findRoleByCode(data.role_code);
  if (!role) {
    throw new AppError(400, 'INVALID_ROLE', `Role '${data.role_code}' does not exist`);
  }

  if (data.bureau_id) {
    const bureau = await repo.findBureauById(data.bureau_id);
    if (!bureau) {
      throw new AppError(400, 'INVALID_BUREAU', `Bureau with ID ${data.bureau_id} not found`);
    }
  }

  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

  const created = await repo.createUser({
    full_name: data.full_name,
    email: data.email,
    password_hash: passwordHash,
    phone: data.phone,
    designation: data.designation,
    role_id: role.id,
    bureau_id: data.bureau_id,
  });

  const fullUser = await repo.findUserById(created.id);
  const tokens = await generateTokens(fullUser, meta);

  return {
    user: sanitizeUser(fullUser),
    ...tokens,
  };
}

/**
 * Authenticates user credentials with brute-force lockout protection.
 *
 * @param {object} data
 * @param {object} [meta]
 * @returns {Promise<object>}
 */
export async function loginUser({ email, password }, meta = {}) {
  const user = await repo.findUserByEmail(email);
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Check lockout
  if (user.locked_until) {
    const lockExpiry = new Date(user.locked_until);
    if (lockExpiry > new Date()) {
      const remainingMinutes = Math.max(1, Math.ceil((lockExpiry.getTime() - Date.now()) / 60000));
      throw new AppError(
        423,
        'ACCOUNT_LOCKED',
        `Account is temporarily locked due to failed login attempts. Try again in ${remainingMinutes} minute(s).`,
      );
    }
    // Lock has expired; reset failed attempts
    await repo.updateFailedLogin(user.id, 0, null);
    user.failed_login_count = 0;
  }

  if (!user.is_active) {
    throw new AppError(401, 'ACCOUNT_INACTIVE', 'Account is deactivated. Please contact an administrator.');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const newCount = (user.failed_login_count || 0) + 1;
    if (newCount >= MAX_FAILED_LOGINS) {
      const lockedUntil = new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60 * 1000);
      await repo.updateFailedLogin(user.id, newCount, lockedUntil);
      throw new AppError(
        423,
        'ACCOUNT_LOCKED',
        `Account locked for ${ACCOUNT_LOCK_MINUTES} minutes due to ${MAX_FAILED_LOGINS} consecutive failed attempts.`,
      );
    }

    await repo.updateFailedLogin(user.id, newCount, null);
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Successful login — reset lockout counters and update last_login_at
  await repo.resetFailedLoginAndSetLastLogin(user.id);

  const tokens = await generateTokens(user, meta);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

/**
 * Refreshes an access token using a valid refresh token (with rotation).
 *
 * @param {object} data
 * @param {object} [meta]
 * @returns {Promise<object>}
 */
export async function refreshTokens({ refreshToken }, meta = {}) {
  const tokenHash = hashToken(refreshToken);
  const activeRecord = await repo.findActiveRefreshToken(tokenHash);

  if (!activeRecord) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or has expired');
  }

  // Revoke current refresh token to enforce rotation
  await repo.revokeRefreshToken(tokenHash);

  const user = await repo.findUserById(activeRecord.user_id);
  if (!user || !user.is_active) {
    throw new AppError(401, 'ACCOUNT_INACTIVE', 'User account is inactive or no longer exists');
  }

  const tokens = await generateTokens(user, meta);

  return {
    ...tokens,
  };
}

/**
 * Logs out a user by revoking the supplied refresh token.
 *
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function logoutUser({ refreshToken }) {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await repo.revokeRefreshToken(tokenHash);
  }
  return { message: 'Successfully logged out' };
}

/**
 * Fetches the currently authenticated user's profile.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getMe(userId) {
  const user = await repo.findUserById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return sanitizeUser(user);
}
