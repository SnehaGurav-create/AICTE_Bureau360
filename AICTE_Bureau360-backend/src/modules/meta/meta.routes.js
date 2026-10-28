// Routes for the meta module. Any authenticated user can access.

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as controller from './meta.controller.js';

const router = Router();

router.get('/meta', authenticate, controller.getMeta);

export default router;
