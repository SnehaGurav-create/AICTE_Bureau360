// Authentication business logic.

import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import * as repo from './auth.repository.js';

/**
 * Hash a plain string token (e.g. refresh token) using SHA-256.
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Parse a duration string like '15m' or '7d' into milliseconds.
 */
function parseDurationMs(durationStr) {
  const match = durationStr.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const num = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

/**
 * Generate access and refresh tokens for a user.
 */
async function issueTokens(user, { ip, userAgent }) {
  const accessToken = jwt.sign(
    { sub: user.id },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );

  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const refreshMs = parseDurationMs(env.JWT_REFRESH_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + refreshMs);

  await repo.saveRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt,
    ip,
    userAgent,
  });

  return {
    access_token: accessToken,
    refresh_token: rawRefreshToken,
    expires_in: env.JWT_ACCESS_EXPIRES_IN,
  };
}

/**
 * Format clean user object for API responses.
 */
function formatUserResponse(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: {
      id: user.role_id,
      code: user.role_code,
      name: user.role_name,
      scope: user.role_scope,
    },
    bureau: user.bureau_id ? {
      id: user.bureau_id,
      name: user.bureau_name,
      region_id: user.region_id,
    } : null,
    permissions: user.permissions || [],
  };
}

/**
 * Authenticate user with email and password.
 */
export async function login({ email, password, ip, userAgent }) {
  const user = await repo.findUserByEmail(email);

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (!user.is_active) {
    throw new AppError(403, 'ACCOUNT_INACTIVE', 'This account has been deactivated');
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  await repo.updateLastLogin(user.id);
  const tokens = await issueTokens(user, { ip, userAgent });

  return {
    user: formatUserResponse(user),
    tokens,
  };
}

/**
 * Refresh tokens using a valid refresh token.
 */
export async function refresh({ refreshToken, ip, userAgent }) {
  const tokenHash = hashToken(refreshToken);
  const tokenRecord = await repo.findRefreshToken(tokenHash);

  if (!tokenRecord || !tokenRecord.is_active) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
  }

  // Revoke the old refresh token (rotation)
  await repo.revokeRefreshToken(tokenHash);

  // Load fresh user data
  const user = await repo.findUserById(tokenRecord.user_id);
  if (!user || !user.is_active) {
    throw new AppError(401, 'USER_INACTIVE', 'User is no longer active');
  }

  const tokens = await issueTokens(user, { ip, userAgent });

  return {
    user: formatUserResponse(user),
    tokens,
  };
}

/**
 * Logout and revoke refresh token.
 */
export async function logout(refreshToken) {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await repo.revokeRefreshToken(tokenHash);
  }
  return { success: true };
}

/**
 * Get profile for authenticated user.
 */
export async function getMe(userId) {
  const user = await repo.findUserById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return formatUserResponse(user);
}
