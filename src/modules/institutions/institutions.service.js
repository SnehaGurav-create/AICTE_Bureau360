// Business logic for institutions: create, update, search, history, documents, CSV import.

import crypto from 'node:crypto';
import fs from 'node:fs';
import { AppError } from '../../utils/AppError.js';
import { withTransaction } from '../../utils/withTransaction.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import * as institutionRepo from './institutions.repository.js';

/**
 * Create a new institution. Fails with 409 if aicte_id already exists.
 * Writes a CREATED history row in the same transaction.
 *
 * @param {object} body   - Validated request body
 * @param {object} actor  - req.user
 * @returns {Promise<object>} The created institution
 */
export async function createInstitution(body, actor) {
  return withTransaction(async (client) => {
    // Check for duplicate AICTE ID
    const existing = await institutionRepo.findByAicteId(body.aicte_id, client);
    if (existing) {
      throw new AppError(409, 'INSTITUTION_EXISTS', `Institution with AICTE ID '${body.aicte_id}' already exists`);
    }

    const institution = await institutionRepo.create(
      { ...body, created_by: actor.id },
      client,
    );

    // Record history
    await institutionRepo.insertHistory(
      {
        institution_id: institution.id,
        change_type: 'CREATED',
        old_data: null,
        new_data: institution,
        changed_by: actor.id,
      },
      client,
    );

    return institution;
  });
}

/**
 * List institutions with filters and pagination.
 *
 * @param {object} query - Validated query params
 * @returns {Promise<{ data: Array, meta: object }>}
 */
export async function listInstitutions(query) {
  const { page, limit, offset } = parsePagination(query);
  const { sort, order, ...filters } = query;

  const { rows, total } = await institutionRepo.findAll(filters, {
    sort: sort || 'name',
    order: order || 'asc',
    limit,
    offset,
  });

  return {
    data: rows,
    meta: buildPaginationMeta(total, page, limit),
  };
}

/**
 * Autocomplete search — returns top 10 matches.
 *
 * @param {string} q - Search query
 * @returns {Promise<Array>}
 */
export async function searchInstitutions(q) {
  return institutionRepo.searchAutocomplete(q);
}

/**
 * Get a single institution by AICTE ID.
 *
 * @param {string} aicteId
 * @returns {Promise<object>}
 */
export async function getInstitutionByAicteId(aicteId) {
  const institution = await institutionRepo.findByAicteId(aicteId);
  if (!institution) {
    throw new AppError(404, 'INSTITUTION_NOT_FOUND', `Institution '${aicteId}' not found`);
  }
  return institution;
}

/**
 * Update an institution. aicte_id is immutable.
 * Records an UPDATED history row with old and new values.
 *
 * @param {string} aicteId - The AICTE ID (from URL param)
 * @param {object} body    - Validated update fields
 * @param {object} actor   - req.user
 * @returns {Promise<object>} The updated institution
 */
export async function updateInstitution(aicteId, body, actor) {
  return withTransaction(async (client) => {
    const existing = await institutionRepo.findByAicteId(aicteId, client);
    if (!existing) {
      throw new AppError(404, 'INSTITUTION_NOT_FOUND', `Institution '${aicteId}' not found`);
    }

    // Build the old_data / new_data diff for history
    const oldData = {};
    const newData = {};
    for (const [key, value] of Object.entries(body)) {
      if (existing[key] !== value) {
        oldData[key] = existing[key];
        newData[key] = value;
      }
    }

    // Nothing actually changed
    if (Object.keys(newData).length === 0) {
      return existing;
    }

    const changeType = body.status && body.status !== existing.status ? 'STATUS_CHANGED' : 'UPDATED';

    const updated = await institutionRepo.update(existing.id, newData, client);

    await institutionRepo.insertHistory(
      {
        institution_id: existing.id,
        change_type: changeType,
        old_data: oldData,
        new_data: newData,
        changed_by: actor.id,
      },
      client,
    );

    return updated;
  });
}

/**
 * Get the change history for an institution.
 *
 * @param {string} aicteId
 * @returns {Promise<Array>}
 */
export async function getInstitutionHistory(aicteId) {
  const institution = await institutionRepo.findByAicteId(aicteId);
  if (!institution) {
    throw new AppError(404, 'INSTITUTION_NOT_FOUND', `Institution '${aicteId}' not found`);
  }
  return institutionRepo.findHistory(institution.id);
}

/**
 * Upload documents for an institution.
 *
 * @param {string} aicteId
 * @param {Array}  files      - multer file objects
 * @param {string} docCategory
 * @param {object} actor      - req.user
 * @returns {Promise<Array>} Created document records
 */
export async function uploadDocuments(aicteId, files, docCategory, actor) {
  const institution = await institutionRepo.findByAicteId(aicteId);
  if (!institution) {
    throw new AppError(404, 'INSTITUTION_NOT_FOUND', `Institution '${aicteId}' not found`);
  }

  const docs = [];
  for (const file of files) {
    // Compute SHA-256 checksum
    const fileBuffer = fs.readFileSync(file.path);
    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const doc = await institutionRepo.insertDocument({
      institution_id: institution.id,
      doc_category: docCategory,
      file_name: file.originalname,
      storage_key: file.filename,
      mime_type: file.mimetype,
      size_bytes: file.size,
      sha256,
      uploaded_by: actor.id,
    });
    docs.push(doc);
  }

  return docs;
}

/**
 * Get documents for an institution.
 *
 * @param {string} aicteId
 * @returns {Promise<Array>}
 */
export async function getInstitutionDocuments(aicteId) {
  const institution = await institutionRepo.findByAicteId(aicteId);
  if (!institution) {
    throw new AppError(404, 'INSTITUTION_NOT_FOUND', `Institution '${aicteId}' not found`);
  }
  return institutionRepo.findDocuments(institution.id);
}

/**
 * Import institutions from CSV lines. Each line must have at least aicte_id and name.
 * Returns counts of inserted, skipped (duplicate), and errored rows.
 *
 * @param {Array<object>} rows  - Parsed CSV rows (objects with header keys)
 * @param {object}        actor - req.user
 * @returns {Promise<{ inserted: number, skipped: number, errors: Array }>}
 */
export async function importFromCsv(rows, actor) {
  let inserted = 0;
  let skipped = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // +2 because line 1 is headers, array is 0-indexed

    if (!row.aicte_id || !row.name) {
      errors.push({ line: lineNum, message: 'Missing aicte_id or name' });
      continue;
    }

    try {
      const existing = await institutionRepo.findByAicteId(row.aicte_id);
      if (existing) {
        skipped++;
        continue;
      }

      await withTransaction(async (client) => {
        const institution = await institutionRepo.create(
          {
            aicte_id: row.aicte_id,
            name: row.name,
            institution_type: row.institution_type || null,
            status: row.status || 'ACTIVE',
            address_line: row.address_line || null,
            city: row.city || null,
            district: row.district || null,
            state: row.state || null,
            pincode: row.pincode || null,
            region_id: row.region_id ? parseInt(row.region_id, 10) : null,
            head_name: row.head_name || null,
            email: row.email || null,
            phone: row.phone || null,
            website: row.website || null,
            established_year: row.established_year ? parseInt(row.established_year, 10) : null,
            created_by: actor.id,
          },
          client,
        );

        await institutionRepo.insertHistory(
          {
            institution_id: institution.id,
            change_type: 'CREATED',
            old_data: null,
            new_data: { source: 'CSV_IMPORT', aicte_id: institution.aicte_id },
            changed_by: actor.id,
          },
          client,
        );
      });

      inserted++;
    } catch (err) {
      errors.push({ line: lineNum, message: err.message });
    }
  }

  return { inserted, skipped, errors };
}
