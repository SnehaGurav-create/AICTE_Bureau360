// Handles HTTP requests for authentication and registration.

import * as service from './auth.service.js';

/**
 * POST /api/v1/auth/register — register a new user.
 */
export async function register(req, res) {
  const result = await service.registerUser(req.body, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  res.status(201).json({ data: result });
}

/**
 * POST /api/v1/auth/login — authenticate credentials and issue tokens.
 */
export async function login(req, res) {
  const result = await service.loginUser(req.body, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  res.status(200).json({ data: result });
}

/**
 * POST /api/v1/auth/refresh — rotate refresh token and issue new access token.
 */
export async function refresh(req, res) {
  const result = await service.refreshTokens(req.body, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  res.status(200).json({ data: result });
}

/**
 * POST /api/v1/auth/logout — revoke refresh token.
 */
export async function logout(req, res) {
  const result = await service.logoutUser(req.body);
  res.status(200).json({ data: result });
}

/**
 * GET /api/v1/auth/me — get current authenticated user profile.
 */
export async function me(req, res) {
  const user = await service.getMe(req.user.id);
  res.status(200).json({ data: user });
}
