// Institution routes — maps URLs + middleware to controller functions.

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { upload } from '../../middleware/upload.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import * as controller from './institutions.controller.js';
import {
  createInstitutionSchema,
  updateInstitutionSchema,
  listInstitutionsQuerySchema,
  searchInstitutionsQuerySchema,
  aicteIdParamSchema,
} from './institutions.schemas.js';

const router = Router();

// All institution routes require authentication
router.use(authenticate);

// Autocomplete — must be before /:aicteId so "search" isn't treated as an aicteId
router.get(
  '/institutions/search',
  authorize(PERMISSIONS.INSTITUTION_READ),
  validate({ query: searchInstitutionsQuerySchema }),
  controller.search,
);

// List
router.get(
  '/institutions',
  authorize(PERMISSIONS.INSTITUTION_READ),
  validate({ query: listInstitutionsQuerySchema }),
  controller.list,
);

// Create
router.post(
  '/institutions',
  authorize(PERMISSIONS.INSTITUTION_WRITE),
  validate({ body: createInstitutionSchema }),
  controller.create,
);

// CSV import (admin)
router.post(
  '/institutions/import',
  authorize(PERMISSIONS.INSTITUTION_WRITE),
  upload.single('file'),
  controller.importCsv,
);

// Get one
router.get(
  '/institutions/:aicteId',
  authorize(PERMISSIONS.INSTITUTION_READ),
  validate({ params: aicteIdParamSchema }),
  controller.getOne,
);

// Update
router.patch(
  '/institutions/:aicteId',
  authorize(PERMISSIONS.INSTITUTION_WRITE),
  validate({ params: aicteIdParamSchema, body: updateInstitutionSchema }),
  controller.update,
);

// History
router.get(
  '/institutions/:aicteId/history',
  authorize(PERMISSIONS.INSTITUTION_READ),
  validate({ params: aicteIdParamSchema }),
  controller.getHistory,
);

// Documents
router.post(
  '/institutions/:aicteId/documents',
  authorize(PERMISSIONS.INSTITUTION_WRITE),
  validate({ params: aicteIdParamSchema }),
  upload.array('files', 5),
  controller.uploadDocuments,
);

router.get(
  '/institutions/:aicteId/documents',
  authorize(PERMISSIONS.INSTITUTION_READ),
  validate({ params: aicteIdParamSchema }),
  controller.getDocuments,
);

export default router;
