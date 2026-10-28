// Handles HTTP requests for institutions. No business logic — delegates to the service.

import * as service from './institutions.service.js';

/**
 * POST /institutions — create a new institution.
 */
export async function create(req, res) {
  const institution = await service.createInstitution(req.body, req.user);
  res.status(201).json({ data: institution });
}

/**
 * GET /institutions — list with filters, search and pagination.
 */
export async function list(req, res) {
  const result = await service.listInstitutions(req.query);
  res.json({ data: result.data, meta: result.meta });
}

/**
 * GET /institutions/search?q= — autocomplete (top 10).
 */
export async function search(req, res) {
  const results = await service.searchInstitutions(req.query.q);
  res.json({ data: results });
}

/**
 * GET /institutions/:aicteId — single institution detail.
 */
export async function getOne(req, res) {
  const institution = await service.getInstitutionByAicteId(req.params.aicteId);
  res.json({ data: institution });
}

/**
 * PATCH /institutions/:aicteId — update fields (aicte_id is immutable).
 */
export async function update(req, res) {
  const institution = await service.updateInstitution(req.params.aicteId, req.body, req.user);
  res.json({ data: institution });
}

/**
 * GET /institutions/:aicteId/history — change history.
 */
export async function getHistory(req, res) {
  const history = await service.getInstitutionHistory(req.params.aicteId);
  res.json({ data: history });
}

/**
 * POST /institutions/:aicteId/documents — upload institution documents.
 */
export async function uploadDocuments(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'At least one file is required' },
    });
  }

  const docCategory = req.body.doc_category || 'INSTITUTION_DOC';
  const docs = await service.uploadDocuments(req.params.aicteId, req.files, docCategory, req.user);
  res.status(201).json({ data: docs });
}

/**
 * GET /institutions/:aicteId/documents — list institution documents.
 */
export async function getDocuments(req, res) {
  const docs = await service.getInstitutionDocuments(req.params.aicteId);
  res.json({ data: docs });
}

/**
 * POST /institutions/import — CSV import (admin only).
 */
export async function importCsv(req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'CSV file is required' },
    });
  }

  // Parse CSV: simple line-by-line parser for comma-separated values
  const { parseCsvFile } = await import('../../utils/csvParser.js');
  const rows = await parseCsvFile(req.file.path);
  const result = await service.importFromCsv(rows, req.user);
  res.json({ data: result });
}
