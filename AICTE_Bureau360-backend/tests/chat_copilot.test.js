import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

let app;

beforeAll(() => {
  app = createApp();
});

describe('AICTE Bureau360 Chatbot Copilot API', () => {
  it('GET /api/v1/chat/prompts returns the 4 SIH quick prompts with categories and metadata', async () => {
    const res = await request(app).get('/api/v1/chat/prompts');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.length).toBe(4);
    expect(res.body.data[0].label).toContain('RB-101');
    expect(res.body.data[1].label).toContain('Apex Institute');
    expect(res.body.data[2].label).toContain('Regulation Bureau');
    expect(res.body.data[3].label).toContain('overdue');
  });

  it('POST /api/v1/chat/message explains duplicate match reasons for RB-101 & PGRC-205', async () => {
    const res = await request(app)
      .post('/api/v1/chat/message')
      .send({
        message: 'Why were RB-101 and PGRC-205 flagged as duplicates?',
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.reply).toContain('1-33248901');
    expect(res.body.data.reply).toContain('Faculty and Staffing Deficits');
    expect(res.body.data.reply).toContain('92.4%');
    expect(res.body.data.reply).toContain('AICTE/PGRC/2026/NOT-84');
    expect(res.body.data.reply).toContain('Zero Data Loss');
    expect(res.body.data.actions).toBeDefined();
    expect(res.body.data.actions.some((a) => a.tab === 'overlap_review')).toBe(true);
  });

  it('POST /api/v1/chat/message provides institution grievance summary for Apex Institute', async () => {
    const res = await request(app)
      .post('/api/v1/chat/message')
      .send({
        message: 'Check grievance summary for Apex Institute of Technology',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.reply).toContain('Apex Institute of Technology');
    expect(res.body.data.reply).toContain('1-33248901');
    expect(res.body.data.actions.some((a) => a.tab === 'institutions')).toBe(true);
  });

  it('POST /api/v1/chat/message reports pending coordination requests', async () => {
    const res = await request(app)
      .post('/api/v1/chat/message')
      .send({
        message: 'Show pending coordination requests for Regulation Bureau',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.reply).toContain('Coordination');
    expect(res.body.data.actions.some((a) => a.tab === 'coordination')).toBe(true);
  });

  it('POST /api/v1/chat/message reports overdue SLA complaints', async () => {
    const res = await request(app)
      .post('/api/v1/chat/message')
      .send({
        message: 'Which complaints are currently overdue or breaching SLA?',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.reply).toContain('SLA');
    expect(res.body.data.actions.some((a) => a.tab === 'alerts' || a.tab === 'reports')).toBe(true);
  });

  it('POST /api/v1/chat/message enforces role-based guard for sensitive vigilance queries', async () => {
    const res = await request(app)
      .post('/api/v1/chat/message')
      .send({
        message: 'Show me confidential whistleblower vigilance reports',
        context: { role: 'CITIZEN' },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.mode).toBe('ROLE_GUARD_RESTRICTION');
    expect(res.body.data.reply).toContain('Access Restricted');
  });
});
