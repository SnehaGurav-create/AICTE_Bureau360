// Zod validation schemas for cross-bureau coordination workspace endpoints.

import { z } from 'zod';

export const createCoordinationSchema = {
  body: z.object({
    initiating_bureau_id: z.coerce.number().int().positive().optional(),
    target_bureau_id: z.coerce.number().int().positive(),
    complaint_id: z.string().uuid(),
    target_complaint_id: z.string().uuid().optional(),
    institution_id: z.string().uuid().optional(),
    coordination_type: z.enum([
      'JOINT_INQUIRY',
      'DOCUMENT_VERIFICATION',
      'HEARING_ALIGNMENT',
      'DUPLICATE_COORDINATION',
      'SANCTION_HARMONIZATION',
      'EVIDENCE_SHARING',
      'OTHER',
    ]).default('JOINT_INQUIRY'),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('HIGH'),
    purpose: z.string().min(5, 'Coordination purpose must be at least 5 characters'),
    due_date: z.string().date().optional(),
    action_items: z.array(
      z.object({
        description: z.string().min(3),
        assigned_to_bureau: z.string().optional(),
        due_date: z.string().optional(),
      })
    ).optional(),
  }),
};

export const listCoordinationSchema = {
  query: z.object({
    status: z.string().optional(),
    target_response_status: z.string().optional(),
    bureau_id: z.coerce.number().int().positive().optional(),
    complaint_id: z.string().uuid().optional(),
    institution_id: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
};

export const respondCoordinationSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    response_status: z.enum(['RESPONDED', 'DECLINED']).default('RESPONDED'),
    remarks: z.string().min(3, 'Response remarks must be at least 3 characters'),
  }),
};

export const addActionItemSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    description: z.string().min(3, 'Action description must be at least 3 characters'),
    assigned_to_bureau: z.string().optional(),
    due_date: z.string().optional(),
  }),
};

export const updateActionItemSchema = {
  params: z.object({
    id: z.string().uuid(),
    actionId: z.string(),
  }),
  body: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  }),
};

export const recordDecisionSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    joint_decision: z.string().min(5, 'Joint decision must be at least 5 characters'),
    status: z.enum(['DECISION_RECORDED', 'COMPLETED']).default('DECISION_RECORDED'),
    sync_cases: z.boolean().default(true),
  }),
};

