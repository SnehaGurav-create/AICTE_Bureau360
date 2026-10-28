// Authentication API routes.

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './auth.controller.js';
import * as schemas from './auth.schemas.js';

const router = Router();

// Dedicated rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts, please try again later' } },
});

// Public endpoints
router.post('/login', loginLimiter, validate(schemas.loginSchema), controller.login);
router.post('/refresh', validate(schemas.refreshTokenSchema), controller.refresh);
router.post('/logout', controller.logout);

// Authenticated profile
router.get('/me', authenticate, controller.getMe);

export default router;
