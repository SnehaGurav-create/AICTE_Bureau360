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

async function createAdminUser() {
  const hash = await bcrypt.hash('Admin@123', 10);
  const email = `admin-dup-${Date.now()}@aicte.gov.in`;
  const res = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role_id, is_active)
     VALUES ($1, $2, 'Admin Workflow Test', (SELECT id FROM roles WHERE code = 'ADMIN' LIMIT 1), true)
     RETURNING id, email`,
    [email, hash],
  );
  const user = res.rows[0];
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: 'ADMIN', permissions: ['*'] },
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
     VALUES ($1, 'National Institute of Technology Coordination Test', 'Delhi', $2)
     RETURNING id`,
    [`AICTE-COORD-${Date.now()}`, adminUserId],
  );
  institutionId = inst.rows[0].id;
});

afterAll(async () => {
  // Test records remain in append-only audit trail
});

describe('Confirmed Duplicate & Coordination Workflow', () => {
  let caseRB101Id;
  let casePGRC205Id;
  let linkId;

  it('preserves both complaints separately in database with distinct case IDs', async () => {
    // 1. Create Case RB-101 (Regulation Bureau)
    const rbRes = await pool.query(
      `INSERT INTO complaints (
         institution_id, category_id, title, description,
         current_bureau_id, complainant_name, complainant_email,
         external_ref_no, received_on, created_by
       ) VALUES ($1, $2, 'Excess Fee Demanded for Admissions',
                 'The college is demanding unapproved admission capitation fee.',
                 $3, 'Complainant Student A', 'studenta@example.com',
                 'REF-EXCESS-FEE-2026', '2026-10-15', $4)
       RETURNING id, complaint_no, received_on, complainant_name`,
      [institutionId, categoryId, testBureauId1, adminUserId],
    );
    caseRB101Id = rbRes.rows[0].id;

    // 2. Create Case PGRC-205 (Public Grievance Redressal Cell)
    const pgrcRes = await pool.query(
      `INSERT INTO complaints (
         institution_id, category_id, title, description,
         current_bureau_id, complainant_name, complainant_email,
         external_ref_no, received_on, created_by
       ) VALUES ($1, $2, 'Capitation fee charged without receipt',
                 'Students forced to pay donation for admission seat confirmation.',
                 $3, 'Parent Association B', 'parentassoc@example.com',
                 'REF-EXCESS-FEE-2026', '2026-10-20', $4)
       RETURNING id, complaint_no, received_on, complainant_name`,
      [institutionId, categoryId, testBureauId2, adminUserId],
    );
    casePGRC205Id = pgrcRes.rows[0].id;

    expect(caseRB101Id).toBeDefined();
    expect(casePGRC205Id).toBeDefined();
    expect(caseRB101Id).not.toBe(casePGRC205Id);
  });

  it('detects potential duplicate relationship using hybrid rules + ML text similarity', async () => {
    const detectRes = await request(app)
      .post('/api/v1/overlaps/detect')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ complaint_id: casePGRC205Id });

    expect(detectRes.status).toBe(200);
    expect(detectRes.body.data.links_created).toBeGreaterThanOrEqual(1);

    const match = detectRes.body.data.results.find((r) => r.related_complaint_id === caseRB101Id);
    expect(match).toBeDefined();
    linkId = match.id;

    // Check explainable evidence signals
    const reasonMethods = match.match_reasons.map((m) => m.method);
    expect(reasonMethods).toContain('EXACT_INSTITUTION_ID');
    expect(reasonMethods).toContain('OFFICIAL_REFERENCE_MATCH');
  });

  it('confirms duplicate with authorized primary coordination case selection', async () => {
    // Authorized officer selects RB-101 as the primary coordination case
    const reviewRes = await request(app)
      .patch(`/api/v1/overlaps/${linkId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'CONFIRMED',
        relationship_type: 'CONFIRMED_DUPLICATE',
        primary_case_id: caseRB101Id,
        coordination_decision: 'PRIMARY_LEAD_COORDINATION',
        review_notes: 'Verified identical petition. RB-101 designated as primary coordination case.',
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.review_status).toBe('CONFIRMED');

    // Verify Duplicate Case (PGRC-205):
    // - Remains in DB
    // - Marked with disposition 'DUPLICATE_LINKED'
    // - Linked to RB-101 via primary_complaint_id
    // - Original received date, complainant record, and case ID preserved!
    const pgrcCheck = await pool.query('SELECT * FROM complaints WHERE id = $1', [casePGRC205Id]);
    const pgrcCase = pgrcCheck.rows[0];
    expect(pgrcCase.disposition).toBe('DUPLICATE_LINKED');
    expect(pgrcCase.primary_complaint_id).toBe(caseRB101Id);
    expect(pgrcCase.complainant_name).toBe('Parent Association B');
    expect(pgrcCase.complainant_email).toBe('parentassoc@example.com');
    expect(pgrcCase.external_ref_no).toBe('REF-EXCESS-FEE-2026');

    // Verify Primary Case (RB-101):
    // - Marked with disposition 'PRIMARY_COORDINATION'
    // - Original records preserved!
    const rbCheck = await pool.query('SELECT * FROM complaints WHERE id = $1', [caseRB101Id]);
    const rbCase = rbCheck.rows[0];
    expect(rbCase.disposition).toBe('PRIMARY_COORDINATION');
    expect(rbCase.complainant_name).toBe('Complainant Student A');

    // Verify case_relationships table
    const relCheck = await pool.query(
      `SELECT * FROM case_relationships WHERE (case_id = $1 AND related_case_id = $2) OR (case_id = $2 AND related_case_id = $1)`,
      [caseRB101Id, casePGRC205Id],
    );
    expect(relCheck.rows.length).toBe(1);
    expect(relCheck.rows[0].relationship_type).toBe('CONFIRMED_DUPLICATE');
    expect(relCheck.rows[0].review_status).toBe('CONFIRMED');
    expect(relCheck.rows[0].primary_case_id).toBe(caseRB101Id);

    // Verify case_actions timeline view records chronological coordination entry
    const actionCheck = await pool.query(
      `SELECT * FROM case_actions WHERE case_id = $1 AND remarks LIKE '%Confirmed Duplicate%'`,
      [casePGRC205Id],
    );
    expect(actionCheck.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('routes coordinated actions between primary and duplicate complaints', async () => {
    // Add a remark on duplicate case PGRC-205
    const remarkRes = await request(app)
      .post(`/api/v1/complaints/${casePGRC205Id}/remarks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        remarks: 'Affidavit submitted by student body regarding fee receipt.',
        is_internal: false,
      });

    expect(remarkRes.status).toBe(201);

    // Verify primary case RB-101 received coordinated notice
    const rbActions = await pool.query(
      `SELECT * FROM case_actions WHERE case_id = $1 AND remarks LIKE '%Coordinated Note from linked duplicate%'`,
      [caseRB101Id],
    );
    expect(rbActions.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('distinguishes total complaints received from unique issues and confirmed duplicates in reports', async () => {
    const statsRes = await request(app)
      .get('/api/v1/reports/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(statsRes.status).toBe(200);
    const summary = statsRes.body.data.summary;

    // Both complaints are counted separately in total complaints received
    expect(summary.total_received).toBeDefined();
    expect(summary.total_received).toBeGreaterThanOrEqual(2);

    // Confirmed duplicates is separated
    expect(summary.confirmed_duplicates).toBeGreaterThanOrEqual(1);

    // Unique issues distinguishes unique grievances from confirmed duplicates
    expect(summary.unique_issues).toBe(summary.total_received - summary.confirmed_duplicates);

    // Confirmed duplicate relationships reports 1 confirmed duplicate relationship
    expect(summary.confirmed_duplicate_relationships).toBeGreaterThanOrEqual(1);
  });
});

