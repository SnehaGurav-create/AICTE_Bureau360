import { z } from 'zod';

export const chatMessageSchema = {
  body: z.object({
    message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
    context: z
      .object({
        currentTab: z.string().optional(),
        selectedCaseId: z.string().optional(),
        selectedInstitutionId: z.string().optional(),
        role: z.string().optional(),
      })
      .optional(),
  }),
};
