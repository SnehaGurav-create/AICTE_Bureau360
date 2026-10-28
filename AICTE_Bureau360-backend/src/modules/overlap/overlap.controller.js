// Overlap request handlers: read req, call service, send response.

import * as service from './overlap.service.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';

/**
 * POST /overlaps/detect — run overlap detection for a complaint.
 */
export async function detectOverlap(req, res) {
  const result = await service.detectAndPersistOverlaps(req.body.complaint_id, req.user);
  res.status(200).json({ data: result });
}

/**
 * GET /overlaps — list links (overlap review centre).
 */
export async function listPendingLinks(req, res) {
  const filters = {
    review_status: req.query.review_status,
    institution_id: req.query.institution_id,
    bureau_id: req.query.bureau_id,
  };

  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listPendingLinks(filters, pagination);

  res.json({
    data: rows,
    meta: buildPaginationMeta(total, pagination.page, pagination.limit),
  });
}

/**
 * PATCH /overlaps/:linkId/review — confirm or dismiss an overlap link.
 */
export async function reviewLink(req, res) {
  const updated = await service.reviewLink(
    req.params.linkId,
    req.body.decision,
    req.user,
  );
  res.json({ data: updated });
}

/**
 * GET /overlaps/complaint/:complaintId — get all links for a complaint.
 */
export async function getComplaintLinks(req, res) {
  const links = await service.getComplaintLinks(req.params.complaintId);
  res.json({ data: links });
}

/**
 * GET /overlaps/dashboard — overlap statistics summary.
 */
export async function getOverlapDashboard(req, res) {
  const stats = await service.getOverlapDashboard();
  res.json({ data: stats });
}
