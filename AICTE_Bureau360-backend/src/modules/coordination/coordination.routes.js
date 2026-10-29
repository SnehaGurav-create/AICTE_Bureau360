// Router for cross-bureau coordination workspace endpoints.

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './coordination.controller.js';
import {
  createCoordinationSchema,
  listCoordinationSchema,
  respondCoordinationSchema,
  addActionItemSchema,
  updateActionItemSchema,
  recordDecisionSchema,
} from './coordination.schemas.js';

const router = Router();

// All coordination routes require authentication
router.use(authenticate);

// Workspace metrics (must precede /:id)
router.get('/metrics', controller.metrics);

// List and Create
router.get('/', validate(listCoordinationSchema), controller.list);
router.post('/', validate(createCoordinationSchema), controller.create);

// Detail
router.get('/:id', controller.getOne);

// Respond / Track response
router.post('/:id/respond', validate(respondCoordinationSchema), controller.respond);

// Follow-up actions
router.post('/:id/actions', validate(addActionItemSchema), controller.addAction);
router.patch('/:id/actions/:actionId', validate(updateActionItemSchema), controller.updateAction);

// Record joint binding decision
router.post('/:id/decision', validate(recordDecisionSchema), controller.recordDecision);

export default router;

