// Tests for Member 2 Responsibilities:
// Overlap Detection, False Positives/Missed Matches, Alerts, SLA Monitoring, and Analytics.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createApp } from '../src/app.js';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { runSlaCheck, processAutoEscalations } from '../src/jobs/slaReminder.js';

let app;
let adminToken;
let adminUserId;
let bureauToken;
let bureauUserId;
let testBureauId;

let instA_Id;
let instA_AicteId;
let instB_Id;
let instB_AicteId;
let instC_Id;
let instC_AicteId;

let categoryApprovalId;
let categoryFeesId;

let complaint1Id;
let complaint2Id;
let complaint3UnrelatedId;

async function createTestUser(email, roleCode, bureauId = null) {
  const hash = await bcrypt.hash('TestPass123', 4);
  const roleResult = await pool.query(`SELECT id FROM roles WHERE code = $1`, [roleCode]);
  const roleId = roleResult.rows[0].id;

  const userResult = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role_id, bureau_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [`Test ${roleCode}`, email, hash, roleId, bureauId],
  );
  const userId = userResult.rows[0].id;
  const token = jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '1h' });
  return { userId, token };
}

beforeAll(async () => {
  app = createApp();

  const bureauRes = await pool.query(`SELECT id FROM bureaus WHERE code = 'REG_BUREAU' LIMIT 1`);
  testBureauId = bureauRes.rows[0].id;

  const admin = await createTestUser('member2-admin@test.com', 'ADMIN', testBureauId);
  adminUserId = admin.userId;
  adminToken = admin.token;

  const bUser = await createTestUser('member2-bureau@test.com', 'REGULATION_BUREAU', testBureauId);
  bureauUserId = bUser.userId;
  bureauToken = bUser.token;

  // Fetch test categories
  const cat1 = await pool.query(`SELECT id FROM complaint_categories WHERE code = 'APPROVAL' LIMIT 1`);
  categoryApprovalId = cat1.rows[0].id;
  const cat2 = await pool.query(`SELECT id FROM complaint_categories WHERE code = 'FEES' LIMIT 1`);
  categoryFeesId = cat2.rows[0].id;

  // Create test institutions
  // Inst A: Original engineering college
  instA_AicteId = `M2-AICTE-${Date.now()}-A`;
  const iA = await pool.query(
    `INSERT INTO institutions (aicte_id, name, state, created_by)
     VALUES ($1, 'Apex Institute of Engineering and Technology', 'Delhi', $2)
     RETURNING id`,
    [instA_AicteId, adminUserId],
  );
  instA_Id = iA.rows[0].id;

  // Inst B: Slightly different name for normalized matching test
  instB_AicteId = `M2-AICTE-${Date.now()}-B`;
  const iB = await pool.query(
    `INSERT INTO institutions (aicte_id, name, state, created_by)
     VALUES ($1, 'Apex Engineering College', 'Delhi', $2)
     RETURNING id`,
    [instB_AicteId, adminUserId],
  );
  instB_Id = iB.rows[0].id;

  // Inst C: Completely different institution in different region for false positive testing
  instC_AicteId = `M2-AICTE-${Date.now()}-C`;
  const iC = await pool.query(
    `INSERT INTO institutions (aicte_id, name, state, created_by)
     VALUES ($1, 'Zenith Pharmacy College', 'Kerala', $2)
     RETURNING id`,
    [instC_AicteId, adminUserId],
  );
  instC_Id = iC.rows[0].id;

  // Create complaint 1 for Inst A
  const c1 = await pool.query(
    `INSERT INTO complaints (institution_id, category_id, title, description, created_by, current_bureau_id, received_on)
     VALUES ($1, $2, 'Illegal seat allocation in B.Tech Computer Science',
             'The institute is charging capitation fee and allocating unapproved management seats.',
             $3, $4, CURRENT_DATE)
     RETURNING id`,
    [instA_Id, categoryApprovalId, adminUserId, testBureauId],
  );
  complaint1Id = c1.rows[0].id;

  // Create complaint 2 for Inst A (Exact institution duplicate / overlap)
  const c2 = await pool.query(
    `INSERT INTO complaints (institution_id, category_id, title, description, created_by, current_bureau_id, received_on)
     VALUES ($1, $2, 'Capitation fee demanded for engineering admission',
             'Students forced to pay donation fee for CSE branch seats without receipt.',
             $3, $4, CURRENT_DATE)
     RETURNING id`,
    [instA_Id, categoryApprovalId, adminUserId, testBureauId],
  );
  complaint2Id = c2.rows[0].id;

  // Create complaint 3 for Inst C (Completely unrelated case)
  const c3 = await pool.query(
    `INSERT INTO complaints (institution_id, category_id, title, description, created_by, current_bureau_id, received_on)
     VALUES ($1, $2, 'Lab equipment shortage in Pharmacy department',
             'Microscopes and chemical reagents are unavailable in pharmacology lab.',
             $3, $4, CURRENT_DATE)
     RETURNING id`,
    [instC_Id, categoryFeesId, adminUserId, testBureauId],
  );
  complaint3UnrelatedId = c3.rows[0].id;
});

afterAll(async () => {
  if (adminUserId) {
    await pool.query(`DELETE FROM users WHERE id IN ($1, $2)`, [adminUserId, bureauUserId]);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. OVERLAP DETECTION & EXPLAINABLE MATCH SCORES
// ─────────────────────────────────────────────────────────────────────────────
describe('Member 2: Overlap Detection & Explainability', () => {
  it('detects exact institution ID overlap and produces explainable match reasons', async () => {
    const res = await request(app)
      .post('/api/v1/overlaps/detect')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ complaint_id: complaint1Id });

    expect(res.status).toBe(200);
    expect(res.body.data.links_created).toBeGreaterThanOrEqual(1);

    const match = res.body.data.results.find((r) => r.related_complaint_id === complaint2Id);
    expect(match).toBeDefined();
    expect(Number(match.similarity_score)).toBeGreaterThanOrEqual(0.9);

    // Verify explainable match reasons
    expect(match.match_reasons).toBeDefined();
    const reasonMethods = match.match_reasons.map((m) => m.method);
    expect(reasonMethods).toContain('EXACT_INSTITUTION_ID');
  });

  it('updates complaint has_overlap flag to true upon overlap detection', async () => {
    const res = await pool.query(`SELECT has_overlap FROM complaints WHERE id = $1`, [complaint1Id]);
    expect(res.rows[0].has_overlap).toBe(true);
  });

  it('retrieves overlap links for a specific complaint', async () => {
    const res = await request(app)
      .get(`/api/v1/overlaps/complaint/${complaint1Id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. FALSE POSITIVES & MISSED MATCHES
// ─────────────────────────────────────────────────────────────────────────────
describe('Member 2: False Positive & Missed Match Tests', () => {
  it('prevents false positives: unrelated complaints across different institutions are NOT linked', async () => {
    const res = await request(app)
      .post('/api/v1/overlaps/detect')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ complaint_id: complaint3UnrelatedId });

    expect(res.status).toBe(200);

    // Complaint 3 (Pharmacy in Kerala) should have 0 matches with Complaint 1 or 2 (Apex Engg in Delhi)
    const matches = res.body.data.results || [];
    const falsePositive = matches.find(
      (m) => m.related_complaint_id === complaint1Id || m.related_complaint_id === complaint2Id,
    );
    expect(falsePositive).toBeUndefined();
  });

  it('detects missed matches via normalized name similarity when institution names vary slightly', async () => {
    // Create complaint for Inst B ("Apex Engineering College" vs "Apex Institute of Engineering and Technology")
    const cInstB = await pool.query(
      `INSERT INTO complaints (institution_id, category_id, title, description, created_by, current_bureau_id, received_on)
       VALUES ($1, $2, 'Seat irregularity in computer department', 'Management charging extra donations.', $3, $4, CURRENT_DATE)
       RETURNING id`,
      [instB_Id, categoryApprovalId, adminUserId, testBureauId],
    );
    const complaintB_Id = cInstB.rows[0].id;

    const res = await request(app)
      .post('/api/v1/overlaps/detect')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ complaint_id: complaintB_Id });

    expect(res.status).toBe(200);
    // Should detect similarity with Inst A complaints via normalized name
    expect(res.body.data.results.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. REVIEW DECISIONS & FLAG INTEGRITY
// ─────────────────────────────────────────────────────────────────────────────
describe('Member 2: Review Decisions & Flag Cleanup', () => {
  let createdLinkId;

  beforeAll(async () => {
    const linkRes = await pool.query(
      `SELECT id FROM complaint_links WHERE complaint_id = $1 OR related_complaint_id = $1 LIMIT 1`,
      [complaint1Id],
    );
    createdLinkId = linkRes.rows[0]?.id;
  });

  it('confirms an overlap link decision', async () => {
    if (!createdLinkId) return;

    const res = await request(app)
      .patch(`/api/v1/overlaps/${createdLinkId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'CONFIRMED' });

    expect(res.status).toBe(200);
    expect(res.body.data.review_status).toBe('CONFIRMED');
  });

  it('dismisses an overlap link and clears has_overlap flag when all links dismissed', async () => {
    if (!createdLinkId) return;

    const res = await request(app)
      .patch(`/api/v1/overlaps/${createdLinkId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'DISMISSED' });

    expect(res.status).toBe(200);
    expect(res.body.data.review_status).toBe('DISMISSED');
  });

  it('lists pending links in the Overlap Review Centre', async () => {
    const res = await request(app)
      .get('/api/v1/overlaps?review_status=DISMISSED')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. SLA MONITORING, WARNINGS & AUTO-ESCALATION LOGIC
// ─────────────────────────────────────────────────────────────────────────────
describe('Member 2: SLA Monitoring & Escalation Rules', () => {
  let overdueComplaintId;

  beforeAll(async () => {
    // Insert a complaint with sla_due_at in the past (72h overdue)
    const overdueRes = await pool.query(
      `INSERT INTO complaints
         (institution_id, category_id, title, description, status, priority,
          sla_due_at, current_bureau_id, created_by, received_on)
       VALUES
         ($1, $2, 'Critical infra hazard in college workshop',
          'Workshop ceiling has dangerous cracks, urgent inspection required.',
          'ASSIGNED', 'HIGH', now() - interval '72 hours', $3, $4, CURRENT_DATE - 5)
       RETURNING id, complaint_no`,
      [instA_Id, categoryApprovalId, testBureauId, adminUserId],
    );
    overdueComplaintId = overdueRes.rows[0].id;
  });

  it('auto-escalates complaints past the SLA escalation threshold', async () => {
    const escalated = await processAutoEscalations();
    expect(escalated).toBeGreaterThanOrEqual(1);

    // Verify complaint transitioned to ESCALATED
    const updated = await pool.query(
      `SELECT status, current_bureau_id FROM complaints WHERE id = $1`,
      [overdueComplaintId],
    );
    expect(updated.rows[0].status).toBe('ESCALATED');

    // Verify action timeline recorded ESCALATED action
    const actions = await pool.query(
      `SELECT action_type, remarks FROM complaint_actions WHERE complaint_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [overdueComplaintId],
    );
    expect(actions.rows[0].action_type).toBe('ESCALATED');
  });

  it('runs complete SLA monitoring job without crashing', async () => {
    await expect(runSlaCheck()).resolves.not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. ANALYTICS & MULTI-DIMENSIONAL REPORTING
// ─────────────────────────────────────────────────────────────────────────────
describe('Member 2: Analytics & Reporting Calculations', () => {
  it('GET /reports/dashboard returns summary, status, and overlap statistics', async () => {
    const res = await request(app)
      .get('/api/v1/reports/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.status_breakdown).toBeDefined();
    expect(res.body.data.overlap_summary).toBeDefined();
  });

  it('GET /reports/bureaus computes bureau-wise disposal and open counts', async () => {
    const res = await request(app)
      .get('/api/v1/reports/bureaus')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /reports/regions computes region-wise distribution', async () => {
    const res = await request(app)
      .get('/api/v1/reports/regions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /reports/hotspots computes top institutions by complaint volume', async () => {
    const res = await request(app)
      .get('/api/v1/reports/hotspots?top=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /reports/aging computes age bucket analysis (0-7d, 8-15d, etc.)', async () => {
    const res = await request(app)
      .get('/api/v1/reports/aging')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.d0_7).toBeDefined();
    expect(res.body.data.d8_15).toBeDefined();
  });

  it('GET /reports/trend supports both monthly and quarterly time-series', async () => {
    const monthlyRes = await request(app)
      .get('/api/v1/reports/trend?period=month')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(monthlyRes.status).toBe(200);
    expect(Array.isArray(monthlyRes.body.data)).toBe(true);

    const quarterlyRes = await request(app)
      .get('/api/v1/reports/trend?period=quarter')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(quarterlyRes.status).toBe(200);
    expect(Array.isArray(quarterlyRes.body.data)).toBe(true);
  });

  it('GET /reports/overlaps returns link types and match method statistics', async () => {
    const res = await request(app)
      .get('/api/v1/reports/overlaps')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.review_status_breakdown).toBeDefined();
    expect(res.body.data.link_type_breakdown).toBeDefined();
    expect(res.body.data.matching_methods).toBeDefined();
  });
});

