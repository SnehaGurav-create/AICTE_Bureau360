/**
 * AICTE Bureau360 — Complaint Model & Domain Transformation
 * SIH 2026 Problem Statement 26264
 *
 * PURE DOMAIN LAYER:
 * - Independent of HTTP transport details.
 * - Enforces agreed field mappings.
 * - Keeps attachment selection separate from the JSON model (multipart files[] expectation).
 * - Manages pending complainant email/phone field configurations.
 */

import {
  COMPLAINANT_FIELD_MAPPING,
  PERMITTED_PRIORITIES,
  DEFAULT_PRIORITY,
  PERMITTED_SOURCES,
  DEFAULT_SOURCE,
} from './apiConfig.js';

/**
 * Creates a clean, standardized complaint form state model.
 * UI components bind to this model.
 *
 * @returns {Object} Initial complaint form model
 */
export function createInitialComplaintModel() {
  return {
    // 1. Agreed Core Fields
    aicte_id: '',
    category_id: '',
    title: '',
    description: '',
    priority: DEFAULT_PRIORITY,
    source: DEFAULT_SOURCE,
    is_anonymous: false,

    // 2. Complainant Personal Fields (suppressed when is_anonymous is true)
    complainant_name: '',
    complainant_email: '',
    complainant_phone: '',

    // 3. Metadata
    external_ref_no: '',
    received_on: new Date().toISOString().slice(0, 10),
  };
}

/**
 * Validates a complaint form model against domain constraints.
 * Pure validation logic without network or side-effects.
 *
 * @param {Object} model - The complaint form model
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateComplaintModel(model) {
  const errors = {};

  // 1. Institution AICTE ID (aicte_id)
  const rawAicteId = model.aicte_id !== undefined ? model.aicte_id : model.selectedAicteId;
  const aicteId = rawAicteId ? String(rawAicteId).trim() : '';
  if (!aicteId) {
    errors.aicte_id = 'Target institution AICTE ID (aicte_id) is required.';
  }

  // 2. Category ID (category_id)
  const rawCategoryId = model.category_id !== undefined ? model.category_id : model.selectedCategoryId;
  const categoryId = rawCategoryId ? String(rawCategoryId).trim() : '';
  if (!categoryId) {
    errors.category_id = 'Grievance category selection (category_id) is required.';
  }

  // 3. Title (title)
  const title = model.title ? String(model.title).trim() : '';
  if (!title) {
    errors.title = 'Title (title) is required.';
  } else if (title.length < 5) {
    errors.title = 'Title must be at least 5 characters.';
  } else if (title.length > 200) {
    errors.title = 'Title cannot exceed 200 characters.';
  }

  // 4. Description (description)
  const description = model.description ? String(model.description).trim() : '';
  if (!description) {
    errors.description = 'Description narrative (description) is required.';
  } else if (description.length < 20) {
    errors.description = 'Description narrative must be at least 20 characters.';
  } else if (description.length > 4000) {
    errors.description = 'Description narrative cannot exceed 4000 characters.';
  }

  // 5. Priority Enum
  if (!PERMITTED_PRIORITIES.includes(model.priority)) {
    errors.priority = `Priority must be one of: ${PERMITTED_PRIORITIES.join(', ')}`;
  }

  // 6. Source Enum
  if (!PERMITTED_SOURCES.includes(model.source)) {
    errors.source = `Source must be one of: ${PERMITTED_SOURCES.join(', ')}`;
  }

  // 7. Optional Email Format (only validated if provided and not anonymous)
  const isAnon = Boolean(model.is_anonymous !== undefined ? model.is_anonymous : model.isAnonymous);
  const rawEmail = model.complainant_email !== undefined ? model.complainant_email : model.complainantEmail;
  if (!isAnon && rawEmail && String(rawEmail).trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(rawEmail).trim())) {
      errors.complainant_email = 'Please provide a valid email address.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Transforms the internal complaint form model into the agreed JSON API contract payload.
 *
 * NOTE: Attachments are deliberately NOT included in this JSON payload because the backend
 * expects files[] to be transmitted via multipart/form-data.
 *
 * @param {Object} model - Validated complaint form model
 * @returns {Object} Serialized JSON API payload conforming to agreed contract
 */
export function transformModelToApiPayload(model) {
  const isAnon = Boolean(model.is_anonymous !== undefined ? model.is_anonymous : model.isAnonymous);

  // Validate and sanitize priority enum (safe fallback to MEDIUM)
  const priority = PERMITTED_PRIORITIES.includes(model.priority)
    ? model.priority
    : DEFAULT_PRIORITY;

  // Validate and sanitize source enum (safe fallback to PORTAL)
  const source = PERMITTED_SOURCES.includes(model.source)
    ? model.source
    : DEFAULT_SOURCE;

  const rawAicteId = model.aicte_id !== undefined ? model.aicte_id : model.selectedAicteId;
  const rawCategoryId = model.category_id !== undefined ? model.category_id : model.selectedCategoryId;
  const rawName = model.complainant_name !== undefined ? model.complainant_name : model.complainantName;
  const rawRef = model.external_ref_no !== undefined ? model.external_ref_no : model.externalRefNo;
  const rawReceived = model.received_on !== undefined ? model.received_on : model.receivedOn;

  const payload = {
    // 1. Agreed Core Fields
    aicte_id: rawAicteId ? String(rawAicteId).trim() : '',
    category_id: rawCategoryId ? String(rawCategoryId).trim() : '',
    title: model.title ? String(model.title).trim() : '',
    description: model.description ? String(model.description).trim() : '',
    priority,
    source,
    is_anonymous: isAnon,

    // 2. Complainant Name (strictly null if anonymous)
    complainant_name: isAnon
      ? null
      : (rawName ? String(rawName).trim() : null),

    // 3. Metadata
    external_ref_no: rawRef && String(rawRef).trim()
      ? String(rawRef).trim()
      : null,
    received_on: rawReceived && String(rawReceived).trim()
      ? String(rawReceived).trim()
      : new Date().toISOString().slice(0, 10),
  };

  // 4. Complainant Contact Fields (Pending Backend Confirmation)
  // If the backend teammate provides the exact property names (via COMPLAINANT_FIELD_MAPPING),
  // they are mapped directly. Otherwise, they are explicitly tagged as unconfirmed.
  if (isAnon) {
    if (COMPLAINANT_FIELD_MAPPING.emailProperty) {
      payload[COMPLAINANT_FIELD_MAPPING.emailProperty] = null;
    }
    if (COMPLAINANT_FIELD_MAPPING.phoneProperty) {
      payload[COMPLAINANT_FIELD_MAPPING.phoneProperty] = null;
    }
    payload._unconfirmed_complainant_email = null;
    payload._unconfirmed_complainant_phone = null;
  } else {
    const emailVal = model.complainant_email !== undefined ? model.complainant_email : model.complainantEmail;
    const phoneVal = model.complainant_phone !== undefined ? model.complainant_phone : model.complainantPhone;
    const rawEmail = emailVal ? String(emailVal).trim() : null;
    const rawPhone = phoneVal ? String(phoneVal).trim() : null;

    if (COMPLAINANT_FIELD_MAPPING.emailProperty) {
      payload[COMPLAINANT_FIELD_MAPPING.emailProperty] = rawEmail;
    } else {
      payload._unconfirmed_complainant_email = rawEmail;
    }

    if (COMPLAINANT_FIELD_MAPPING.phoneProperty) {
      payload[COMPLAINANT_FIELD_MAPPING.phoneProperty] = rawPhone;
    } else {
      payload._unconfirmed_complainant_phone = rawPhone;
    }
  }

  // Explicit notice when property names remain unconfirmed
  if (!COMPLAINANT_FIELD_MAPPING.emailProperty || !COMPLAINANT_FIELD_MAPPING.phoneProperty) {
    payload._unconfirmed_notice = COMPLAINANT_FIELD_MAPPING.notice;
  }

  // Optional attachment manifest metadata if attachments are passed
  if (model.attachments && Array.isArray(model.attachments)) {
    payload.attachments_count = model.attachments.length;
    payload.attachment_filenames = model.attachments.map((f) => f.name || 'unnamed');
  }

  return payload;
}

/**
 * Builds a multipart/form-data payload for future backend transmission.
 * Combines the agreed complaint JSON fields with the separate attachments array.
 *
 * @param {Object} mappedPayload - JSON payload from transformModelToApiPayload
 * @param {File[]} attachments - Array of File objects for multipart upload
 * @returns {FormData}
 */
export function buildMultipartFormData(mappedPayload, attachments = []) {
  if (typeof FormData === 'undefined') {
    throw new Error('FormData is not available in the current environment.');
  }

  const formData = new FormData();

  // Append agreed scalar fields
  Object.entries(mappedPayload).forEach(([key, value]) => {
    // Skip internal unconfirmed notice metadata from actual HTTP form keys
    if (key.startsWith('_unconfirmed_')) return;
    if (value !== null && value !== undefined) {
      formData.append(key, typeof value === 'boolean' ? String(value) : value);
    }
  });

  // Append attachments under expected files[] array key
  for (let i = 0; i < attachments.length; i++) {
    const file = attachments[i];
    if (file && file.name) {
      formData.append('files[]', file, file.name);
    }
  }

  return formData;
}
