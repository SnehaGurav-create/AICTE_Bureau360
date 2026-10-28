// Complaint request handlers: read req, call service, send response.

import * as service from './complaints.service.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';

/**
 * POST /complaints - Create a new complaint
 */
export async function createComplaint(req, res) {
  const complaint = await service.createComplaint(req.body, req.user);
  res.status(201).json({ data: complaint });
}

/**
 * GET /complaints - List complaints with filters
 */
export async function listComplaints(req, res) {
  const filters = {
    q: req.query.q,
    status: req.query.status,
    category_id: req.query.category_id,
    priority: req.query.priority,
    aicte_id: req.query.aicte_id,
    bureau_id: req.query.bureau_id,
    assignee_id: req.query.assignee_id,
    from: req.query.from,
    to: req.query.to,
    overdue: req.query.overdue === 'true',
    has_overlap: req.query.has_overlap === 'true' ? true : req.query.has_overlap === 'false' ? false : undefined,
  };

  const pagination = parsePagination(req.query);
  const sort = {
    column: req.query.sort,
    order: req.query.order,
  };

  const { complaints, total } = await service.listComplaints(filters, req.user, pagination, sort);

  res.json({
    data: complaints,
    meta: buildPaginationMeta(total, pagination.page, pagination.limit),
  });
}

/**
 * GET /complaints/:id - Get single complaint detail
 */
export async function getComplaintDetail(req, res) {
  const complaint = await service.getComplaintDetail(req.params.id, req.user);
  res.json({ data: complaint });
}

/**
 * PATCH /complaints/:id - Update complaint fields
 */
export async function updateComplaint(req, res) {
  const complaint = await service.updateComplaint(req.params.id, req.body, req.user);
  res.json({ data: complaint });
}

/**
 * PATCH /complaints/:id/status - Change complaint status
 */
export async function changeComplaintStatus(req, res) {
  const { status, remarks } = req.body;
  const complaint = await service.changeComplaintStatus(req.params.id, status, remarks, req.user);
  res.json({ data: complaint });
}

/**
 * POST /complaints/:id/remarks - Add a remark
 */
export async function addRemark(req, res) {
  const { remarks, is_internal } = req.body;
  const action = await service.addRemark(req.params.id, remarks, is_internal, req.user);
  res.status(201).json({ data: action });
}

/**
 * GET /complaints/:id/timeline - Get complaint action history
 */
export async function getComplaintTimeline(req, res) {
  const timeline = await service.getComplaintTimeline(req.params.id, req.user);
  res.json({ data: timeline });
}

/**
 * POST /complaints/:id/assign - Assign complaint to bureau or officer
 */
export async function assignComplaint(req, res) {
  const result = await service.assignComplaint(req.params.id, req.body, req.user);
  res.json({ data: result });
}

/**
 * POST /complaints/:id/transfer - Transfer complaint to another bureau
 */
export async function transferComplaint(req, res) {
  const result = await service.transferComplaint(req.params.id, req.body, req.user);
  res.json({ data: result });
}

/**
 * GET /complaints/:id/assignments - Get assignment history
 */
export async function getComplaintAssignments(req, res) {
  const assignments = await service.getComplaintAssignments(req.params.id, req.user);
  res.json({ data: assignments });
}

/**
 * POST /complaints/:id/documents - Upload documents for complaint
 */
export async function uploadDocuments(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'At least one file is required' },
    });
  }

  const docCategory = req.body?.doc_category || 'SUPPORTING';
  const docs = await service.uploadComplaintDocuments(req.params.id, req.files, docCategory, req.user);
  res.status(201).json({ data: docs });
}

/**
 * GET /complaints/:id/documents - List documents for complaint
 */
export async function getDocuments(req, res) {
  const docs = await service.getComplaintDocuments(req.params.id, req.user);
  res.json({ data: docs });
}

/**
 * GET /complaints/:id/documents/:documentId - Get single document metadata
 */
export async function getDocumentDetail(req, res) {
  const doc = await service.getComplaintDocumentById(req.params.id, req.params.documentId, req.user);
  res.json({ data: doc });
}

/**
 * GET /complaints/:id/documents/:documentId/download - Download document file
 */
export async function downloadDocument(req, res) {
  const { doc, filePath } = await service.downloadComplaintDocument(
    req.params.id,
    req.params.documentId,
    req.user,
  );
  res.download(filePath, doc.file_name);
}

