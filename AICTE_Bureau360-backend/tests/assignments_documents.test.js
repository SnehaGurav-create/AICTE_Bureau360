// Tests for Phase 4: Assign, transfer, assignment history, documents, and transaction rollback.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import * as complaintsRepo from '../src/modules/complaints/complaints.repository.js';
import * as complaintsService from '../src/modules/complaints/complaints.service.js';

let app;
let adminToken;
let adminUserId;
let officerToken;
let officerUserId;
let otherBureauOfficerToken;
let otherBureauOfficerId;
let bureau1Id;
let bureau2Id;
let testInstId;
let testAicteId;
let testCategoryId;
let testComplaintId;

async function createTestUser(email, roleCode, bureauId = null) {
  const hash = await bcrypt.hash('TestPass123', 4);
  const roleResult = await pool.query(`SELECT id FROM roles WHERE code = $1`, [roleCode]);
  const roleId = roleResult.rows[0].id;

  const userResult = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role_id, bureau_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [`Test ${roleCode}`, email, hash, roleId, bureauId],
  );
  const userId = userResult.rows[0].id;

  const token = jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '1h' });
  return { userId, token };
}

beforeAll(async () => {
  app = createApp();

  await pool.query(`DELETE FROM bureaus WHERE code LIKE 'B_P4_%' OR code IN ('BUREAU_P4_A', 'BUREAU_P4_B')`);

  const bureau1Code = `B_P4_A_${Date.now()}`;
  const bureau2Code = `B_P4_B_${Date.now()}`;

  // Create two distinct test bureaus
  const b1 = await pool.query(
    `INSERT INTO bureaus (code, name, type) VALUES ($1, 'Phase 4 Bureau A', 'BUREAU')
     RETURNING id`,
    [bureau1Code],
  );
  bureau1Id = b1.rows[0].id;

  const b2 = await pool.query(
    `INSERT INTO bureaus (code, name, type) VALUES ($1, 'Phase 4 Bureau B', 'BUREAU')
     RETURNING id`,
    [bureau2Code],
  );
  bureau2Id = b2.rows[0].id;

  // Create test users
  const admin = await createTestUser('p4-admin@p4test.com', 'ADMIN');
  adminUserId = admin.userId;
  adminToken = admin.token;

  const officer = await createTestUser('p4-officer-a@p4test.com', 'AUTHORIZED_OFFICER', bureau1Id);
  officerUserId = officer.userId;
  officerToken = officer.token;

  const otherOfficer = await createTestUser('p4-officer-b@p4test.com', 'AUTHORIZED_OFFICER', bureau2Id);
  otherBureauOfficerId = otherOfficer.userId;
  otherBureauOfficerToken = otherOfficer.token;

  // Create test institution
  testAicteId = `P4-INST-${Date.now()}`;
  const instResult = await pool.query(
    `INSERT INTO institutions (aicte_id, name, status, created_by)
     VALUES ($1, 'Phase 4 Test University', 'ACTIVE', $2)
     RETURNING id`,
    [testAicteId, adminUserId],
  );
  testInstId = instResult.rows[0].id;

  // Get category
  const catResult = await pool.query(`SELECT id FROM complaint_categories LIMIT 1`);
  testCategoryId = catResult.rows[0].id;

  // Create initial test complaint
  const complaintRes = await request(app)
    .post('/api/v1/complaints')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      aicte_id: testAicteId,
      category_id: testCategoryId,
      title: 'Phase 4 Initial Complaint',
      description: 'Test complaint for assign, transfer, and documents testing',
      priority: 'MEDIUM',
      source: 'PORTAL',
      bureau_id: bureau1Id,
    });

  expect(complaintRes.status).toBe(201);
  testComplaintId = complaintRes.body.data.id;
});

afterAll(async () => {
  // Clean up test data
  if (testComplaintId) {
    await pool.query(`SET session_replication_role = 'replica'`);
    await pool.query(`DELETE FROM documents WHERE complaint_id = $1`, [testComplaintId]);
    await pool.query(`DELETE FROM complaint_actions WHERE complaint_id = $1`, [testComplaintId]);
    await pool.query(`SET session_replication_role = 'origin'`);
    await pool.query(`DELETE FROM complaint_assignments WHERE complaint_id = $1`, [testComplaintId]);
    await pool.query(`DELETE FROM complaints WHERE id = $1`, [testComplaintId]);
  }
  if (testInstId) {
    await pool.query(`DELETE FROM institutions WHERE id = $1`, [testInstId]);
  }
  await pool.query(`DELETE FROM users WHERE email LIKE '%@p4test.com'`);
  if (bureau1Id && bureau2Id) {
    await pool.query(`DELETE FROM bureaus WHERE id IN ($1, $2)`, [bureau1Id, bureau2Id]);
  }
});

describe('POST /api/v1/complaints/:id/assign', () => {
  it('should assign complaint to an officer and update is_current', async () => {
    const res = await request(app)
      .post(`/api/v1/complaints/${testComplaintId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignee_id: officerUserId,
        reason: 'Assigned to Officer A for investigation',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.current_assignee_id).toBe(officerUserId);
    expect(res.body.data.current_bureau_id).toBe(bureau1Id);
    expect(res.body.data.status).toBe('ASSIGNED');

    // Check complaint_assignments in database
    const assignmentsRes = await pool.query(
      `SELECT * FROM complaint_assignments WHERE complaint_id = $1 ORDER BY id ASC`,
      [testComplaintId],
    );

    // Initial assignment was created during createComplaint, so this is the second assignment
    expect(assignmentsRes.rows.length).toBeGreaterThanOrEqual(2);

    // Only exactly one row should be current
    const currentRows = assignmentsRes.rows.filter((r) => r.is_current === true);
    expect(currentRows.length).toBe(1);
    expect(currentRows[0].to_user_id).toBe(officerUserId);
    expect(currentRows[0].kind).toBe('ASSIGNMENT');

    // Verify ASSIGNED action logged in timeline
    const actionRes = await pool.query(
      `SELECT * FROM complaint_actions WHERE complaint_id = $1 AND action_type = 'ASSIGNED'`,
      [testComplaintId],
    );
    expect(actionRes.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('should return 400 if neither bureau nor assignee is provided', async () => {
    const res = await request(app)
      .post(`/api/v1/complaints/${testComplaintId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 for a non-existent complaint', async () => {
    const res = await request(app)
      .post('/api/v1/complaints/00000000-0000-0000-0000-000000000000/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bureau_id: bureau1Id });

    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/complaints/:id/transfer', () => {
  it('should transfer complaint to Bureau B and clear previous officer', async () => {
    const res = await request(app)
      .post(`/api/v1/complaints/${testComplaintId}/transfer`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        to_bureau_id: bureau2Id,
        reason: 'Subject matter falls under jurisdiction of Bureau B',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.current_bureau_id).toBe(bureau2Id);
    expect(res.body.data.current_assignee_id).toBeNull();

    // Verify database assignments
    const assignmentsRes = await pool.query(
      `SELECT * FROM complaint_assignments WHERE complaint_id = $1 ORDER BY id DESC`,
      [testComplaintId],
    );

    const latest = assignmentsRes.rows[0];
    expect(latest.is_current).toBe(true);
    expect(latest.kind).toBe('TRANSFER');
    expect(latest.from_bureau_id).toBe(bureau1Id);
    expect(latest.to_bureau_id).toBe(bureau2Id);
    expect(latest.reason).toBe('Subject matter falls under jurisdiction of Bureau B');

    // Only one assignment is_current
    const currentRows = assignmentsRes.rows.filter((r) => r.is_current === true);
    expect(currentRows.length).toBe(1);

    // Timeline action recorded
    const actionRes = await pool.query(
      `SELECT * FROM complaint_actions WHERE complaint_id = $1 AND action_type = 'TRANSFERRED'`,
      [testComplaintId],
    );
    expect(actionRes.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('should reject transfer to the same bureau without assignee change', async () => {
    const res = await request(app)
      .post(`/api/v1/complaints/${testComplaintId}/transfer`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        to_bureau_id: bureau2Id,
        reason: 'Trying to transfer to the same bureau',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('SAME_BUREAU_TRANSFER');
  });

  it('should reject transfer without a reason', async () => {
    const res = await request(app)
      .post(`/api/v1/complaints/${testComplaintId}/transfer`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        to_bureau_id: bureau1Id,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/complaints/:id/assignments', () => {
  it('should return chronological assignment history with joined bureau and user names', async () => {
    const res = await request(app)
      .get(`/api/v1/complaints/${testComplaintId}/assignments`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);

    const latest = res.body.data[0];
    expect(latest.to_bureau_name).toBeDefined();
    expect(latest.assigned_by_name).toBeDefined();
    expect(latest.is_current).toBe(true);

    // Old assignments have is_current = false
    const previous = res.body.data[1];
    expect(previous.is_current).toBe(false);
  });
});

describe('Complaint Documents: Upload, List, Download', () => {
  let uploadedDocId;
  const testFileContent = 'Hello Bureau360 Complaint Document Testing Content';
  const expectedHash = crypto.createHash('sha256').update(testFileContent).digest('hex');

  it('should upload a complaint document and calculate SHA-256 checksum', async () => {
    const res = await request(app)
      .post(`/api/v1/complaints/${testComplaintId}/documents`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('files', Buffer.from(testFileContent), {
        filename: 'evidence.pdf',
        contentType: 'application/pdf',
      })
      .field('doc_category', 'SUPPORTING');

    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);

    const doc = res.body.data[0];
    expect(doc.file_name).toBe('evidence.pdf');
    expect(doc.doc_category).toBe('SUPPORTING');
    expect(doc.mime_type).toBe('application/pdf');
    expect(doc.sha256).toBe(expectedHash);
    uploadedDocId = doc.id;

    // Check DOCUMENT_ADDED timeline action was recorded
    const actionRes = await pool.query(
      `SELECT * FROM complaint_actions WHERE complaint_id = $1 AND action_type = 'DOCUMENT_ADDED'`,
      [testComplaintId],
    );
    expect(actionRes.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('should list documents for a complaint', async () => {
    const res = await request(app)
      .get(`/api/v1/complaints/${testComplaintId}/documents`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const doc = res.body.data.find((d) => d.id === uploadedDocId);
    expect(doc).toBeDefined();
    expect(doc.file_name).toBe('evidence.pdf');
    expect(doc.uploaded_by_name).toBeDefined();
  });

  it('should get single document metadata', async () => {
    const res = await request(app)
      .get(`/api/v1/complaints/${testComplaintId}/documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(uploadedDocId);
    expect(res.body.data.file_name).toBe('evidence.pdf');
  });

  it('should download the document file', async () => {
    const res = await request(app)
      .get(`/api/v1/complaints/${testComplaintId}/documents/${uploadedDocId}/download`)
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer()
      .parse((res, callback) => {
        let data = Buffer.from([]);
        res.on('data', (chunk) => {
          data = Buffer.concat([data, chunk]);
        });
        res.on('end', () => {
          callback(null, data);
        });
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('evidence.pdf');
    expect(res.body.toString()).toBe(testFileContent);
  });

  it('should reject disallowed file types', async () => {
    const res = await request(app)
      .post(`/api/v1/complaints/${testComplaintId}/documents`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('files', Buffer.from('malicious binary content'), {
        filename: 'exploit.exe',
        contentType: 'application/octet-stream',
      });

    // Multer filter error
    expect(res.status).toBe(500); // Handled by express error handler with error message
  });
});

describe('Transaction Integrity: Failed Transfer Rollback', () => {
  it('should leave zero partial data when transfer fails mid-transaction', async () => {
    // 1. Check pre-transfer state
    const preComplaintRes = await pool.query(
      `SELECT current_bureau_id, current_assignee_id, status FROM complaints WHERE id = $1`,
      [testComplaintId],
    );
    const initialBureau = preComplaintRes.rows[0].current_bureau_id;
    const initialAssignee = preComplaintRes.rows[0].current_assignee_id;
    const initialStatus = preComplaintRes.rows[0].status;

    const preAssignmentsRes = await pool.query(
      `SELECT id, is_current FROM complaint_assignments WHERE complaint_id = $1`,
      [testComplaintId],
    );
    const initialAssignmentCount = preAssignmentsRes.rows.length;
    const initialCurrentId = preAssignmentsRes.rows.find((a) => a.is_current)?.id;
    expect(initialCurrentId).toBeDefined();

    const preActionsRes = await pool.query(
      `SELECT count(*) FROM complaint_actions WHERE complaint_id = $1 AND action_type = 'TRANSFERRED'`,
      [testComplaintId],
    );
    const initialTransferredActionCount = parseInt(preActionsRes.rows[0].count, 10);

    // 2. Spy on insertAction to simulate unexpected failure mid-transaction (after assignments insert)
    const spy = vi
      .spyOn(complaintsRepo, 'insertAction')
      .mockImplementationOnce(async () => {
        throw new Error('Database connection dropped during timeline insert');
      });

    let thrownError = null;
    try {
      await complaintsService.transferComplaint(
        testComplaintId,
        {
          to_bureau_id: bureau1Id,
          reason: 'This transfer should fail and roll back completely',
        },
        { id: adminUserId, bureau_id: bureau2Id, role_scope: 'ALL' },
      );
    } catch (err) {
      thrownError = err;
    }

    spy.mockRestore();

    // Verify error was raised
    expect(thrownError).toBeDefined();
    expect(thrownError.message).toBe('Database connection dropped during timeline insert');

    // 3. Inspect database to prove complete rollback (ZERO PARTIAL DATA)
    // a. Complaint row remains unchanged
    const postComplaintRes = await pool.query(
      `SELECT current_bureau_id, current_assignee_id, status FROM complaints WHERE id = $1`,
      [testComplaintId],
    );
    expect(postComplaintRes.rows[0].current_bureau_id).toBe(initialBureau);
    expect(postComplaintRes.rows[0].current_assignee_id).toBe(initialAssignee);
    expect(postComplaintRes.rows[0].status).toBe(initialStatus);

    // b. Assignment rows count unchanged, and original assignment remains is_current = true
    const postAssignmentsRes = await pool.query(
      `SELECT id, is_current FROM complaint_assignments WHERE complaint_id = $1`,
      [testComplaintId],
    );
    expect(postAssignmentsRes.rows.length).toBe(initialAssignmentCount);

    const postCurrent = postAssignmentsRes.rows.find((a) => a.id === initialCurrentId);
    expect(postCurrent?.is_current).toBe(true);

    // c. No new TRANSFERRED action exists
    const postActionsRes = await pool.query(
      `SELECT count(*) FROM complaint_actions WHERE complaint_id = $1 AND action_type = 'TRANSFERRED'`,
      [testComplaintId],
    );
    expect(parseInt(postActionsRes.rows[0].count, 10)).toBe(initialTransferredActionCount);
  });
});
