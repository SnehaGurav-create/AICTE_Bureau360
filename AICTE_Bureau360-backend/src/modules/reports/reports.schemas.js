// Zod validation schemas for report endpoints.

import { z } from 'zod';

export const reportFiltersSchema = {
  query: z.object({
    from: z.string().date().optional(),
    to: z.string().date().optional(),
    bureau_id: z.coerce.number().int().positive().optional(),
    period: z.enum(['month', 'quarter']).optional(),
    format: z.enum(['json', 'csv']).optional(),
    top: z.coerce.number().int().positive().max(100).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
};
