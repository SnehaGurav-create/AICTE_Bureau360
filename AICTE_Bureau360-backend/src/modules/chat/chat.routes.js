import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import * as controller from './chat.controller.js';
import * as schemas from './chat.schemas.js';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { pool } from '../../config/database.js';

const router = Router();

// Optional authentication middleware
async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      const { rows } = await pool.query(
        `SELECT u.id, u.full_name, u.email, r.code AS role_code, b.name AS bureau_name
         FROM users u
         JOIN roles r ON r.id = u.role_id
         LEFT JOIN bureaus b ON b.id = u.bureau_id
         WHERE u.id = $1`,
        [payload.sub],
      );
      if (rows.length > 0) {
        req.user = rows[0];
        req.user.role = rows[0].role_code;
      }
    } catch {
      // Ignore invalid or expired token for chat queries
    }
  }
  next();
}

router.use(optionalAuth);

// POST /api/v1/chat/message — process a chatbot query
router.post('/message', validate(schemas.chatMessageSchema), controller.handleChatMessage);

// GET /api/v1/chat/prompts — retrieve the 4 quick prompts
router.get('/prompts', controller.getQuickPrompts);

export default router;
