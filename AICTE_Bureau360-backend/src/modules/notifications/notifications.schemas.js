// Zod validation schemas for notification endpoints.

import { z } from 'zod';

export const listNotificationsSchema = {
  query: z.object({
    unread: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
};

export const notificationIdSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
};
