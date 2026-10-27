// Complaint API routes.

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { upload } from '../../middleware/upload.js';
import * as controller from './complaints.controller.js';
import * as schemas from './complaints.schemas.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create complaint
router.post(
  '/',
  authorize('complaint:create'),
  validate(schemas.createComplaintSchema),
  controller.createComplaint,
);

// List complaints
router.get(
  '/',
  authorize('complaint:read'),
  validate(schemas.listComplaintsSchema),
  controller.listComplaints,
);

// Get single complaint detail
router.get('/:id', authorize('complaint:read'), controller.getComplaintDetail);

// Update complaint fields
router.patch(
  '/:id',
  authorize('complaint:update'),
  validate(schemas.updateComplaintSchema),
  controller.updateComplaint,
);

// Change status
router.patch(
  '/:id/status',
  authorize('complaint:status'),
  validate(schemas.changeStatusSchema),
  controller.changeComplaintStatus,
);

// Add remark
router.post(
  '/:id/remarks',
  authorize('complaint:remark'),
  validate(schemas.addRemarkSchema),
  controller.addRemark,
);

// Timeline
router.get('/:id/timeline', authorize('complaint:read'), controller.getComplaintTimeline);

// Assign complaint to bureau or officer
router.post(
  '/:id/assign',
  authorize('complaint:assign'),
  validate(schemas.assignComplaintSchema),
  controller.assignComplaint,
);

// Transfer complaint to another bureau
router.post(
  '/:id/transfer',
  authorize('complaint:transfer'),
  validate(schemas.transferComplaintSchema),
  controller.transferComplaint,
);

// Assignment history
router.get(
  '/:id/assignments',
  authorize('complaint:read'),
  validate(schemas.complaintIdParamSchema),
  controller.getComplaintAssignments,
);

// Upload documents for complaint
router.post(
  '/:id/documents',
  authorize('document:upload'),
  validate(schemas.uploadComplaintDocumentsSchema),
  upload.array('files', 5),
  controller.uploadDocuments,
);

// List complaint documents
router.get(
  '/:id/documents',
  authorize('complaint:read'),
  validate(schemas.complaintIdParamSchema),
  controller.getDocuments,
);

// Get single document metadata
router.get(
  '/:id/documents/:documentId',
  authorize('complaint:read'),
  validate(schemas.complaintDocumentParamsSchema),
  controller.getDocumentDetail,
);

// Download document file
router.get(
  '/:id/documents/:documentId/download',
  authorize('complaint:read'),
  validate(schemas.complaintDocumentParamsSchema),
  controller.downloadDocument,
);

export default router;

