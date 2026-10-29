// Zod validation schemas for overlap detection endpoints.

import { z } from 'zod';

/** POST /overlaps/detect — run detection on a complaint */
export const detectOverlapSchema = {
  body: z.object({
    complaint_id: z.string().uuid('Valid complaint UUID is required'),
  }),
};

/** GET /overlaps — list pending links */
export const listPendingLinksSchema = {
  query: z.object({
    review_status: z.enum(['PENDING_REVIEW', 'CONFIRMED', 'DISMISSED']).optional(),
    institution_id: z.string().uuid().optional(),
    bureau_id: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
};

/** PATCH /overlaps/:linkId/review — confirm or dismiss a link with coordination & primary case selection */
export const reviewLinkSchema = {
  params: z.object({
    linkId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    decision: z.enum(['CONFIRMED', 'DISMISSED']).optional(),
    review_status: z.enum(['CONFIRMED', 'DISMISSED']).optional(),
    relationship_type: z
      .enum(['POTENTIAL_DUPLICATE', 'CONFIRMED_DUPLICATE', 'RELATED_CASE', 'UNRELATED', 'DUPLICATE', 'RELATED'])
      .optional(),
    primary_case_id: z.string().uuid().optional(),
    coordination_decision: z.string().optional(),
    review_notes: z.string().optional(),
  }),
};

/** GET /overlaps/complaint/:complaintId — links for a complaint */
export const complaintLinksSchema = {
  params: z.object({
    complaintId: z.string().uuid(),
  }),
};
