// Overlap API routes.

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './overlap.controller.js';
import * as schemas from './overlap.schemas.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Run overlap detection on a complaint
router.post(
  '/detect',
  authorize('overlap:review'),
  validate(schemas.detectOverlapSchema),
  controller.detectOverlap,
);

// List pending overlap links (review centre)
router.get(
  '/',
  authorize('overlap:review'),
  validate(schemas.listPendingLinksSchema),
  controller.listPendingLinks,
);

// Dashboard statistics
router.get(
  '/dashboard',
  authorize('overlap:review'),
  controller.getOverlapDashboard,
);

// Get links for a specific complaint
router.get(
  '/complaint/:complaintId',
  authorize('complaint:read'),
  validate(schemas.complaintLinksSchema),
  controller.getComplaintLinks,
);

// Confirm or dismiss an overlap link
router.patch(
  '/:linkId/review',
  authorize('overlap:review'),
  validate(schemas.reviewLinkSchema),
  controller.reviewLink,
);

export default router;
