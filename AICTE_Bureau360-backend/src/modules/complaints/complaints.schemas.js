// Zod validation schemas for complaints endpoints.

import { z } from 'zod';

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const sourceEnum = z.enum(['PORTAL', 'EMAIL', 'LETTER', 'PHONE', 'PG_PORTAL', 'OTHER']);

export const createComplaintSchema = {
  body: z.object({
    aicte_id: z.string().min(1, 'Institution AICTE ID is required'),
    category_id: z.number().int().positive(),
    title: z.string().min(3).max(500),
    description: z.string().min(10),
    priority: priorityEnum.default('MEDIUM'),
    source: sourceEnum.default('PORTAL'),
    external_ref_no: z.string().max(100).optional(),
    complainant_name: z.string().max(200).optional(),
    complainant_email: z.string().email().optional(),
    complainant_phone: z.string().max(20).optional(),
    is_anonymous: z.boolean().default(false),
    received_on: z.string().date().optional(), // ISO date string, defaults to today
    bureau_id: z.number().int().positive().optional(), // If provided, creates first assignment
  }),
};

export const listComplaintsSchema = {
  query: z.object({
    q: z.string().optional(), // Full-text search or complaint_no
    status: z.string().optional(),
    category_id: z.coerce.number().int().positive().optional(),
    priority: priorityEnum.optional(),
    aicte_id: z.string().optional(),
    bureau_id: z.coerce.number().int().positive().optional(),
    assignee_id: z.string().uuid().optional(),
    from: z.string().date().optional(), // received_on >= from
    to: z.string().date().optional(), // received_on <= to
    overdue: z.enum(['true', 'false']).optional(), // sla_due_at < now AND status is open
    has_overlap: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    sort: z.string().optional(), // column name (whitelisted in repo)
    order: z.enum(['asc', 'desc']).optional(),
  }),
};

export const updateComplaintSchema = {
  body: z.object({
    title: z.string().min(3).max(500).optional(),
    description: z.string().min(10).optional(),
    category_id: z.number().int().positive().optional(),
    priority: priorityEnum.optional(),
    complainant_name: z.string().max(200).optional(),
    complainant_email: z.string().email().optional(),
    complainant_phone: z.string().max(20).optional(),
  }),
};

export const changeStatusSchema = {
  body: z.object({
    status: z.string().min(1, 'Status is required'),
    remarks: z.string().optional(),
  }),
};

export const addRemarkSchema = {
  body: z.object({
    remarks: z.string().min(1, 'Remarks cannot be empty'),
    is_internal: z.boolean().default(false),
  }),
};

export const complaintIdParamSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
};

export const complaintDocumentParamsSchema = {
  params: z.object({
    id: z.string().uuid(),
    documentId: z.string().uuid(),
  }),
};

export const assignComplaintSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      to_bureau_id: z.coerce.number().int().positive().optional(),
      bureau_id: z.coerce.number().int().positive().optional(),
      to_user_id: z.string().uuid().optional(),
      assignee_id: z.string().uuid().optional(),
      reason: z.string().optional(),
    })
    .refine(
      (data) =>
        data.bureau_id !== undefined ||
        data.to_bureau_id !== undefined ||
        data.assignee_id !== undefined ||
        data.to_user_id !== undefined,
      {
        message: 'At least one of bureau_id or assignee_id must be provided',
      },
    ),
};

export const transferComplaintSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      to_bureau_id: z.coerce.number().int().positive().optional(),
      bureau_id: z.coerce.number().int().positive().optional(),
      to_user_id: z.string().uuid().optional(),
      assignee_id: z.string().uuid().optional(),
      reason: z.string().min(1, 'Reason for transfer is required'),
    })
    .refine(
      (data) => data.to_bureau_id !== undefined || data.bureau_id !== undefined,
      {
        message: 'Target bureau (to_bureau_id or bureau_id) is required for transfer',
      },
    ),
};

export const uploadComplaintDocumentsSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
};

