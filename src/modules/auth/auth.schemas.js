// Zod schemas for authentication and registration requests.

import { z } from 'zod';
import { ROLES } from '../../constants/roles.js';

/** Body schema for POST /api/v1/auth/register */
export const registerSchema = z.object({
  email: z.string().email('Valid email is required').max(255).toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password cannot exceed 100 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(200).trim(),
  phone: z.string().max(20).optional(),
  designation: z.string().max(100).optional(),
  role_code: z
    .enum([
      ROLES.ADMIN,
      ROLES.REGULATION_BUREAU,
      ROLES.PGRC,
      ROLES.OTHER_BUREAU,
      ROLES.REGIONAL_OFFICE,
      ROLES.AUTHORIZED_OFFICER,
    ])
    .default(ROLES.AUTHORIZED_OFFICER),
  bureau_id: z.coerce.number().int().positive().optional(),
});

/** Body schema for POST /api/v1/auth/login */
export const loginSchema = z.object({
  email: z.string().email('Valid email is required').max(255).toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

/** Body schema for POST /api/v1/auth/refresh */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

/** Body schema for POST /api/v1/auth/logout */
export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});
