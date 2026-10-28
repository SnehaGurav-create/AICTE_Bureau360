// Tests for Phase 0 & Meta: Health check, Swagger docs, 404 handler, and Meta reference data.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createApp } from '../src/app.js';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';

let app;
let testToken;
let testUserId;

beforeAll(async () => {
  app = createApp();

  // Create a real test user in DB for authenticated endpoints
  const hash = await bcrypt.hash('TestPass123', 4);
  const roleResult = await pool.query(`SELECT id FROM roles WHERE code = 'ADMIN'`);
  const roleId = roleResult.rows[0].id;

  const userResult = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role_id)
     VALUES ('System Meta Test', 'sys-meta-user@systest.com', $1, $2)
     RETURNING id`,
    [hash, roleId],
  );
  testUserId = userResult.rows[0].id;

  testToken = jwt.sign({ sub: testUserId }, env.JWT_SECRET, {
    expiresIn: '1h',
  });
});

afterAll(async () => {
  if (testUserId) {
    await pool.query(`DELETE FROM users WHERE id = $1`, [testUserId]);
  }
});

describe('System Health & Setup (Phase 0)', () => {
  it('GET /api/v1/health should return ok and connected database', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.database).toBe('connected');
    expect(res.body.data.timestamp).toBeDefined();
  });

  it('should return 404 error format for unknown routes', async () => {
    const res = await request(app)
      .get('/api/v1/nonexistent-route-for-testing')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('nonexistent-route-for-testing');
  });

  it('should include security headers from helmet', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
  });
});

describe('Meta Module (Phase 2)', () => {
  it('GET /api/v1/meta should return 401 without authentication', async () => {
    const res = await request(app).get('/api/v1/meta');

    expect(res.status).toBe(401);
  });

  it('GET /api/v1/meta should return reference data when authenticated', async () => {
    const res = await request(app)
      .get('/api/v1/meta')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data.categories)).toBe(true);
    expect(Array.isArray(res.body.data.statuses)).toBe(true);
    expect(Array.isArray(res.body.data.priorities)).toBe(true);
    expect(Array.isArray(res.body.data.sources)).toBe(true);
    expect(Array.isArray(res.body.data.bureaus)).toBe(true);
    expect(Array.isArray(res.body.data.regions)).toBe(true);
    expect(Array.isArray(res.body.data.roles)).toBe(true);
    expect(res.body.data.status_transitions).toBeDefined();
  });
});
