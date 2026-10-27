// Tests for the institutions module: duplicate AICTE ID, history rows, list/search.
// Uses direct database access to set up test data (auth module not yet built).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createApp } from '../src/app.js';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';

let app;
let adminToken;
let adminUserId;
let officerToken;

/**
 * Create a test user directly in the database and return a JWT for them.
 */
async function createTestUser(email, roleCode) {
  const hash = await bcrypt.hash('TestPass123', 4); // low rounds for speed
  const roleResult = await pool.query(`SELECT id FROM roles WHERE code = $1`, [roleCode]);
  const roleId = roleResult.rows[0].id;

  const userResult = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [`Test ${roleCode}`, email, hash, roleId],
  );
  const userId = userResult.rows[0].id;

  const token = jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '1h' });
  return { userId, token };
}

beforeAll(async () => {
  app = createApp();

  // Create test users
  const admin = await createTestUser('admin-test@aicte.gov.in', 'ADMIN');
  adminUserId = admin.userId;
  adminToken = admin.token;

  const officer = await createTestUser('officer-test@aicte.gov.in', 'AUTHORIZED_OFFICER');
  officerToken = officer.token;
});

afterAll(async () => {
  // Cleanup test data
  await pool.query(`DELETE FROM documents WHERE uploaded_by = $1`, [adminUserId]);
  await pool.query(`DELETE FROM institution_history WHERE changed_by = $1`, [adminUserId]);
  await pool.query(`DELETE FROM institutions WHERE created_by = $1`, [adminUserId]);
  await pool.query(`DELETE FROM users WHERE email IN ('admin-test@aicte.gov.in', 'officer-test@aicte.gov.in')`);
  await pool.end();
});

describe('POST /api/v1/institutions', () => {
  const validBody = {
    aicte_id: 'TEST-INST-001',
    name: 'Test Engineering College',
    institution_type: 'Engineering',
    status: 'ACTIVE',
    state: 'Delhi',
    city: 'New Delhi',
  };

  afterAll(async () => {
    // Clean up institutions created in this describe block (except the one we keep for other tests)
  });

  it('should create an institution and return 201', async () => {
    const res = await request(app)
      .post('/api/v1/institutions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.aicte_id).toBe('TEST-INST-001');
    expect(res.body.data.name).toBe('Test Engineering College');
  });

  it('should return 409 for duplicate AICTE ID', async () => {
    const res = await request(app)
      .post('/api/v1/institutions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSTITUTION_EXISTS');
  });

  it('should create a history row on institution creation', async () => {
    const instRes = await pool.query(
      `SELECT id FROM institutions WHERE aicte_id = 'TEST-INST-001'`,
    );
    const historyRes = await pool.query(
      `SELECT * FROM institution_history WHERE institution_id = $1 ORDER BY changed_at DESC`,
      [instRes.rows[0].id],
    );

    expect(historyRes.rows.length).toBeGreaterThanOrEqual(1);
    expect(historyRes.rows[0].change_type).toBe('CREATED');
    expect(historyRes.rows[0].changed_by).toBe(adminUserId);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/institutions')
      .send(validBody);

    expect(res.status).toBe(401);
  });

  it('should return 403 for a user without institution:write permission', async () => {
    const res = await request(app)
      .post('/api/v1/institutions')
      .set('Authorization', `Bearer ${officerToken}`)
      .send(validBody);

    expect(res.status).toBe(403);
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/institutions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Incomplete' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/institutions', () => {
  it('should list institutions with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/institutions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.page).toBe(1);
  });

  it('should filter by state', async () => {
    const res = await request(app)
      .get('/api/v1/institutions?state=Delhi')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    for (const inst of res.body.data) {
      expect(inst.state).toBe('Delhi');
    }
  });
});

describe('GET /api/v1/institutions/search', () => {
  it('should return autocomplete results', async () => {
    const res = await request(app)
      .get('/api/v1/institutions/search?q=Test')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('aicte_id');
      expect(res.body.data[0]).toHaveProperty('name');
    }
  });
});

describe('PATCH /api/v1/institutions/:aicteId', () => {
  it('should update an institution and create a history row', async () => {
    const res = await request(app)
      .patch('/api/v1/institutions/TEST-INST-001')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ city: 'South Delhi', head_name: 'Dr. Test' });

    expect(res.status).toBe(200);
    expect(res.body.data.city).toBe('South Delhi');
    expect(res.body.data.head_name).toBe('Dr. Test');

    // Check history was recorded
    const instRes = await pool.query(
      `SELECT id FROM institutions WHERE aicte_id = 'TEST-INST-001'`,
    );
    const historyRes = await pool.query(
      `SELECT * FROM institution_history
       WHERE institution_id = $1 AND change_type = 'UPDATED'`,
      [instRes.rows[0].id],
    );

    expect(historyRes.rows.length).toBeGreaterThanOrEqual(1);
    const lastHistory = historyRes.rows[0];
    expect(lastHistory.old_data).toHaveProperty('city');
    expect(lastHistory.new_data).toHaveProperty('city', 'South Delhi');
  });

  it('should return 404 for a non-existent AICTE ID', async () => {
    const res = await request(app)
      .patch('/api/v1/institutions/DOES-NOT-EXIST')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ city: 'Nowhere' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('INSTITUTION_NOT_FOUND');
  });
});

describe('GET /api/v1/institutions/:aicteId/history', () => {
  it('should return the change history', async () => {
    const res = await request(app)
      .get('/api/v1/institutions/TEST-INST-001/history')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // At least CREATED + UPDATED
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });
});
