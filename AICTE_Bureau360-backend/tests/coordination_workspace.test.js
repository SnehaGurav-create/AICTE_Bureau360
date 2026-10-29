import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

const app = createApp();

let adminToken;
let adminUserId;
let testBureauId1;
let testBureauId2;
let categoryId;
let institutionId;
let complaintAId;
let complaintBId;
let createdCoordinationId;
let createdActionId;

async function createAdminUser() {
  const hash = await bcrypt.hash('Admin@123', 10);
  const email = `admin-coord-${Date.now()}@aicte.gov.in`;
  const res = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role_id, is_active)
     VALUES ($1, $2, 'Admin Coordination Tester', (SELECT id FROM roles WHERE code = 'ADMIN' LIMIT 1), true)
     RETURNING id, email`,
    [email, hash],
  );
  const user = res.rows[0];
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: 'ADMIN', permissions: ['*'], bureau_id: 1 },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );
  return { token, userId: user.id };
}

beforeAll(async () => {
  const admin = await createAdminUser();
  adminToken = admin.token;
  adminUserId = admin.userId;

  // Get bureaus
  const b1 = await pool.query(`SELECT id FROM bureaus WHERE code = 'REG_BUREAU' LIMIT 1`);
  testBureauId1 = b1.rows[0]?.id || 1;
  const b2 = await pool.query(`SELECT id FROM bureaus WHERE code = 'PGRC' LIMIT 1`);
  testBureauId2 = b2.rows[0]?.id || 2;

  // Get category
  const cat = await pool.query(`SELECT id FROM complaint_categories LIMIT 1`);
  categoryId = cat.rows[0].id;

  // Create institution
  const inst = await pool.query(
    `INSERT INTO institutions (aicte_id, name, state, created_by)
     VALUES ($1, 'Apex Engineering College Coordination Test', 'Maharashtra', $2)
     RETURNING id`,
    [`AICTE-CW-${Date.now()}`, adminUserId],
  );
  institutionId = inst.rows[0].id;

  // Create Complaint A (Regulation Bureau docket)
  const cmpA = await pool.query(
    `INSERT INTO complaints
       (institution_id, category_id, title, description, priority, current_bureau_id, created_by)
     VALUES ($1, $2, 'RB Docket: Deficiency in Computer Engineering Labs',
             'Inspection revealed CAD lab non-compliance and deficient faculty cadre.',
             'HIGH', $3, $4)
     RETURNING id, complaint_no`,
    [institutionId, categoryId, testBureauId1, adminUserId],
  );
  complaintAId = cmpA.rows[0].id;

  // Create Complaint B (PGRC student grievance docket)
  const cmpB = await pool.query(
    `INSERT INTO complaints
       (institution_id, category_id, title, description, priority, current_bureau_id, created_by)
     VALUES ($1, $2, 'PGRC Docket: Student Petition on Faculty Shortage',
             'Multiple student grievances regarding cancelled classes and missing lab instructors.',
             'HIGH', $3, $4)
     RETURNING id, complaint_no`,
    [institutionId, categoryId, testBureauId2, adminUserId],
  );
  complaintBId = cmpB.rows[0].id;
});

afterAll(async () => {
  // Test records remain in append-only audit trail
});

describe('Cross-Bureau Coordination Workspace', () => {
  it('1. POST /api/v1/coordination — allows authorized officer to request coordination with follow-up action items', async () => {
    const res = await request(app)
      .post('/api/v1/coordination')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        initiating_bureau_id: testBureauId1,
        target_bureau_id: testBureauId2,
        complaint_id: complaintAId,
        target_complaint_id: complaintBId,
        institution_id: institutionId,
        coordination_type: 'JOINT_INQUIRY',
        priority: 'HIGH',
        purpose: 'Coordinate joint inspection between Regulation Bureau and PGRC regarding computer lab deficiency and student grievances.',
        due_date: '2026-11-15',
        action_items: [
          { description: 'Exchange inspection evidence and student petition roster', assigned_to_bureau: 'PGRC' },
          { description: 'Schedule joint site inspection with college management', assigned_to_bureau: 'REG_BUREAU' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.request_no).toMatch(/^COORD-/);
    expect(res.body.data.status).toBe('REQUESTED');
    expect(res.body.data.target_response_status).toBe('AWAITING_RESPONSE');
    expect(res.body.data.action_items).toHaveLength(2);

    createdCoordinationId = res.body.data.id;
  });

  it('2. GET /api/v1/coordination — lists coordination requests with bureau & status filtering', async () => {
    const res = await request(app)
      .get(`/api/v1/coordination?target_response_status=AWAITING_RESPONSE&bureau_id=${testBureauId1}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const match = res.body.data.find((r) => r.id === createdCoordinationId);
    expect(match).toBeDefined();
    expect(match.initiating_bureau_name).toBeDefined();
    expect(match.target_bureau_name).toBeDefined();
    expect(match.primary_complaint_no).toBeDefined();
  });

  it('3. GET /api/v1/coordination/:id — fetches detailed request with linked cases & timeline', async () => {
    const res = await request(app)
      .get(`/api/v1/coordination/${createdCoordinationId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(createdCoordinationId);
    expect(res.body.data.purpose).toContain('Coordinate joint inspection');
    expect(res.body.data.institution_name).toContain('Apex Engineering College');
  });

  it('4. POST /api/v1/coordination/:id/respond — target bureau responds and updates response tracking', async () => {
    const res = await request(app)
      .post(`/api/v1/coordination/${createdCoordinationId}/respond`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        response_status: 'RESPONDED',
        remarks: 'PGRC acknowledges request. Student grievance dossier prepared and officer nominated for joint inspection.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.target_response_status).toBe('RESPONDED');
    expect(res.body.data.status).toBe('IN_COORDINATION');
    expect(res.body.data.target_responded_at).toBeDefined();
    expect(res.body.data.target_response_remarks).toContain('PGRC acknowledges request');
  });

  it('5. POST /api/v1/coordination/:id/actions — assigns an additional follow-up action', async () => {
    const res = await request(app)
      .post(`/api/v1/coordination/${createdCoordinationId}/actions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        description: 'Verify biometric faculty attendance logs during inspection',
        assigned_to_bureau: 'REG_BUREAU',
        due_date: '2026-11-10',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.action_items.length).toBe(3);
    createdActionId = res.body.data.action_items[2].id;
    expect(createdActionId).toBeDefined();
  });

  it('6. PATCH /api/v1/coordination/:id/actions/:actionId — updates follow-up action status to COMPLETED', async () => {
    const res = await request(app)
      .patch(`/api/v1/coordination/${createdCoordinationId}/actions/${createdActionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'COMPLETED',
      });

    expect(res.status).toBe(200);
    const updatedAction = res.body.data.action_items.find((a) => a.id === createdActionId);
    expect(updatedAction).toBeDefined();
    expect(updatedAction.status).toBe('COMPLETED');
    expect(updatedAction.completed_at).toBeDefined();
  });

  it('7. POST /api/v1/coordination/:id/decision — records joint binding decision and mirrors timeline', async () => {
    const res = await request(app)
      .post(`/api/v1/coordination/${createdCoordinationId}/decision`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        joint_decision: 'Joint inspection concluded on 08 Nov. Regulation Bureau issued consolidated 30-day compliance notice. PGRC linked case marked coordinated.',
        status: 'DECISION_RECORDED',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DECISION_RECORDED');
    expect(res.body.data.joint_decision).toContain('Joint inspection concluded');
    expect(res.body.data.joint_decision_at).toBeDefined();
    expect(res.body.data.joint_decision_by).toBe(adminUserId);

    // Verify complaint timeline contains coordination action
    const timelineRes = await request(app)
      .get(`/api/v1/complaints/${complaintAId}/timeline`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(timelineRes.status).toBe(200);
    const actions = timelineRes.body.data;
    const coordAction = actions.find((a) => a.remarks && a.remarks.includes('Joint cross-bureau coordination decision'));
    expect(coordAction).toBeDefined();
  });

  it('8. GET /api/v1/coordination/metrics — calculates workspace KPI metrics', async () => {
    const res = await request(app)
      .get('/api/v1/coordination/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.total_requests).toBeGreaterThanOrEqual(1);
    expect(res.body.data.decisions_recorded).toBeGreaterThanOrEqual(1);
  });
});

