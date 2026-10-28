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

/** PATCH /overlaps/:linkId/review — confirm or dismiss a link */
export const reviewLinkSchema = {
  params: z.object({
    linkId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    decision: z.enum(['CONFIRMED', 'DISMISSED']),
  }),
};

/** GET /overlaps/complaint/:complaintId — links for a complaint */
export const complaintLinksSchema = {
  params: z.object({
    complaintId: z.string().uuid(),
  }),
};
