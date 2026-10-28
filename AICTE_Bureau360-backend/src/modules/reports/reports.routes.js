// Report API routes.

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './reports.controller.js';
import * as schemas from './reports.schemas.js';

const router = Router();

// All reports require auth + report:view permission
router.use(authenticate);

// Dashboard summary
router.get(
  '/dashboard',
  authorize('report:view'),
  validate(schemas.reportFiltersSchema),
  controller.getDashboard,
);

// Bureau breakdown
router.get(
  '/bureaus',
  authorize('report:view'),
  validate(schemas.reportFiltersSchema),
  controller.getBureauReport,
);

// Region-wise breakdown
router.get(
  '/regions',
  authorize('report:view'),
  validate(schemas.reportFiltersSchema),
  controller.getRegionReport,
);

// Overlap analytics report
router.get(
  '/overlaps',
  authorize('report:view'),
  controller.getOverlapReport,
);

// Category breakdown
router.get(
  '/categories',
  authorize('report:view'),
  validate(schemas.reportFiltersSchema),
  controller.getCategoryReport,
);

// SLA compliance
router.get(
  '/sla',
  authorize('report:view'),
  validate(schemas.reportFiltersSchema),
  controller.getSlaCompliance,
);

// Aging analysis
router.get(
  '/aging',
  authorize('report:view'),
  validate(schemas.reportFiltersSchema),
  controller.getAging,
);

// Monthly trend
router.get(
  '/trend',
  authorize('report:view'),
  validate(schemas.reportFiltersSchema),
  controller.getTrend,
);

// Institution hotspots
router.get(
  '/hotspots',
  authorize('report:view'),
  validate(schemas.reportFiltersSchema),
  controller.getHotspots,
);

// Full report export (JSON / CSV)
router.get(
  '/export',
  authorize('report:view'),
  validate(schemas.reportFiltersSchema),
  controller.getFullReport,
);

export default router;
