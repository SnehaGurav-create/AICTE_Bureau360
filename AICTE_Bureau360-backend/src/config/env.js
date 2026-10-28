// Validates environment variables at startup. The app refuses to start on bad config.

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_BASE_URL: z.string().url().default('http://localhost:3000'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(20).default(12),

  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),

  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@bureau360.aicte.gov.in'),

  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(10),
  MAX_FILES_PER_REQUEST: z.coerce.number().int().positive().default(5),

  OVERLAP_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.4),

  ADMIN_EMAIL: z.string().email().default('admin@aicte.gov.in'),
  ADMIN_PASSWORD: z.string().min(8).default('Admin@12345'),
  ADMIN_NAME: z.string().default('System Administrator'),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('debug'),
});

/**
 * Parsed and validated environment variables.
 * The app crashes here if any required variable is missing or invalid.
 */
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  /* eslint-disable no-console */
  console.error('❌  Invalid environment variables:');
  console.error(parseResult.error.flatten().fieldErrors);
  /* eslint-enable no-console */
  process.exit(1);
}

export const env = parseResult.data;
