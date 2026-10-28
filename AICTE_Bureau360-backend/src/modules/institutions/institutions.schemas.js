// Zod schemas for institution request validation.

import { z } from 'zod';

/** Body schema for POST /institutions */
export const createInstitutionSchema = z.object({
  aicte_id: z.string().min(1, 'aicte_id is required').max(50),
  name: z.string().min(1, 'name is required').max(500),
  institution_type: z.string().max(100).optional(),
  status: z.enum(['ACTIVE', 'CLOSED', 'SUSPENDED', 'WITHDRAWN']).default('ACTIVE'),
  address_line: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  region_id: z.coerce.number().int().positive().optional(),
  head_name: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
  established_year: z.coerce.number().int().min(1800).max(2100).optional(),
});

/** Body schema for PATCH /institutions/:aicteId */
export const updateInstitutionSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  institution_type: z.string().max(100).optional(),
  status: z.enum(['ACTIVE', 'CLOSED', 'SUSPENDED', 'WITHDRAWN']).optional(),
  address_line: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  region_id: z.coerce.number().int().positive().nullable().optional(),
  head_name: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
  established_year: z.coerce.number().int().min(1800).max(2100).optional(),
});

/** Query schema for GET /institutions */
export const listInstitutionsQuerySchema = z.object({
  q: z.string().optional(),
  state: z.string().optional(),
  region_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'CLOSED', 'SUSPENDED', 'WITHDRAWN']).optional(),
  institution_type: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['name', 'aicte_id', 'state', 'created_at']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

/** Query schema for GET /institutions/search?q= autocomplete */
export const searchInstitutionsQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
});

/** Params schema for routes with :aicteId */
export const aicteIdParamSchema = z.object({
  aicteId: z.string().min(1),
});

/** Body schema for institution document upload */
export const institutionDocSchema = z.object({
  doc_category: z
    .enum(['SUPPORTING', 'ACTION_TAKEN_REPORT', 'INSTITUTION_DOC', 'OTHER'])
    .default('INSTITUTION_DOC'),
});
