// Authentication request handlers.

import * as service from './auth.service.js';

/**
 * POST /api/v1/auth/login
 */
export async function login(req, res) {
  const result = await service.login({
    email: req.body.email,
    password: req.body.password,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({ data: result });
}

/**
 * POST /api/v1/auth/refresh
 */
export async function refresh(req, res) {
  const result = await service.refresh({
    refreshToken: req.body.refresh_token,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({ data: result });
}

/**
 * POST /api/v1/auth/logout
 */
export async function logout(req, res) {
  await service.logout(req.body.refresh_token);
  res.json({ data: { message: 'Logged out successfully' } });
}

/**
 * GET /api/v1/auth/me
 */
export async function getMe(req, res) {
  const user = await service.getMe(req.user.id);
  res.json({ data: user });
}
