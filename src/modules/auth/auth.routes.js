// Authentication routes with rate limiting and schema validation.

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as controller from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from './auth.schemas.js';

const router = Router();

// Dedicated rate limiting for sensitive authentication endpoints
const authLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_MAX,
  skip: () => env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
});

// Register
router.post('/register', authLimiter, validate({ body: registerSchema }), controller.register);

// Login
router.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);

// Refresh token
router.post('/refresh', validate({ body: refreshTokenSchema }), controller.refresh);

// Logout
router.post('/logout', validate({ body: logoutSchema }), controller.logout);

// Current user profile (requires valid Bearer token)
router.get('/me', authenticate, controller.me);

export default router;
