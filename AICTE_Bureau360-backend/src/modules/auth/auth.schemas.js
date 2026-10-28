// Validation schemas for authentication endpoints.

import { z } from 'zod';

export const loginSchema = {
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const refreshTokenSchema = {
  body: z.object({
    refresh_token: z.string().min(1, 'Refresh token is required'),
  }),
};
