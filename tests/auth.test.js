// Tests for Authentication & Registration module: register, login, lockout, refresh, logout, /me.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/config/database.js';

let app;

beforeAll(async () => {
  app = createApp();
  // Clean up any old test users
  await pool.query(`DELETE FROM users WHERE email LIKE '%@authtest.com'`);
});

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE email LIKE '%@authtest.com'`);
  await pool.end();
});

describe('POST /api/v1/auth/register', () => {
  it('registers a new user and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'newuser@authtest.com',
        password: 'Password@123',
        full_name: 'New Officer',
        phone: '9876543210',
        designation: 'Field Inspector',
        role_code: 'AUTHORIZED_OFFICER',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.user.email).toBe('newuser@authtest.com');
    expect(res.body.data.user.fullName).toBe('New Officer');
    expect(res.body.data.user.roleCode).toBe('AUTHORIZED_OFFICER');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.tokenType).toBe('Bearer');
  });

  it('rejects duplicate email with 409 conflict', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'newuser@authtest.com',
        password: 'AnotherPassword@123',
        full_name: 'Duplicate Officer',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('rejects registration with short password (< 8 chars)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'shortpass@authtest.com',
        password: '123',
        full_name: 'Short Pass User',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'logintest@authtest.com',
        password: 'CorrectPassword@123',
        full_name: 'Login Test User',
        role_code: 'ADMIN',
      });
  });

  it('authenticates valid credentials and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'logintest@authtest.com',
        password: 'CorrectPassword@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe('logintest@authtest.com');
    expect(res.body.data.user.roleCode).toBe('ADMIN');
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'logintest@authtest.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects non-existent email with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'unknown@authtest.com',
        password: 'AnyPassword@123',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('locks account after 5 consecutive failed login attempts', async () => {
    const email = 'locktest@authtest.com';
    await request(app).post('/api/v1/auth/register').send({
      email,
      password: 'RealPassword@123',
      full_name: 'Lock Test User',
    });

    // 4 failed attempts -> 401
    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'WrongPassword' });
      expect(res.status).toBe(401);
    }

    // 5th failed attempt -> 423 Locked
    const fifthRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPassword' });
    expect(fifthRes.status).toBe(423);
    expect(fifthRes.body.error.code).toBe('ACCOUNT_LOCKED');

    // 6th attempt with CORRECT password still blocked because account is locked
    const lockedRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'RealPassword@123' });
    expect(lockedRes.status).toBe(423);
    expect(lockedRes.body.error.code).toBe('ACCOUNT_LOCKED');
  });
});

describe('POST /api/v1/auth/refresh and /logout', () => {
  let refreshToken;
  let accessToken;

  beforeAll(async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'refreshtest@authtest.com',
        password: 'Password@123',
        full_name: 'Refresh Tester',
      });
    refreshToken = regRes.body.data.refreshToken;
    accessToken = regRes.body.data.accessToken;
  });

  it('rotates refresh token and returns new access token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(refreshToken);

    // Old refresh token must be rejected now
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error.code).toBe('INVALID_REFRESH_TOKEN');

    // Update refreshToken pointer for logout test
    refreshToken = res.body.data.refreshToken;
    accessToken = res.body.data.accessToken;
  });

  it('GET /api/v1/auth/me returns current user profile with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('refreshtest@authtest.com');
    expect(res.body.data.fullName).toBe('Refresh Tester');
  });

  it('POST /api/v1/auth/logout revokes the refresh token', async () => {
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);

    // Refreshing with revoked token should fail
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });
});
