/**
 * AICTE Bureau360 — Future Backend HTTP Transport Service
 * SIH 2026 Problem Statement 26264
 *
 * FUTURE BACKEND INTEGRATION LAYER:
 * - Decoupled from UI components.
 * - Guarded against unconfirmed endpoint execution.
 * - Stubs the contract for backend integration once endpoints & schemas are supplied.
 * - Does NOT call unconfirmed endpoints or guess HTTP methods.
 *
 * ==============================================================================
 * INTEGRATION REQUIREMENTS & BACKEND CONTRACT TODOs:
 *
 * 1. COMPLAINT CREATION ENDPOINT & HTTP METHOD:
 *    // TODO [BACKEND-INTEGRATION]: Confirm HTTP method (e.g. POST) and endpoint path.
 *    // Current placeholder: APP_CONFIG.ENDPOINTS.CREATE_COMPLAINT (null by default)
 *
 * 2. REQUEST & RESPONSE SCHEMAS:
 *    // TODO [BACKEND-INTEGRATION]: Confirm response payload format:
 *    // Expected success: { success: true, case_id: string, aicte_id: string, ... }
 *    // Expected failure: { success: false, error: { code: string, message: string, details: array } }
 *
 * 3. COMPLAINANT EMAIL & PHONE FIELD NAMES:
 *    // TODO [BACKEND-INTEGRATION]: Supply exact keys for email and phone.
 *    // Configured via COMPLAINANT_FIELD_MAPPING in apiConfig.js.
 *
 * 4. /META RESPONSE STRUCTURE:
 *    // TODO [BACKEND-INTEGRATION]: Confirm response shape for /meta (categories, bureaus, priorities).
 *
 * 5. INSTITUTION SEARCH ENDPOINT & RESPONSE:
 *    // TODO [BACKEND-INTEGRATION]: Confirm search query parameter (e.g. ?q= or ?search=)
 *    // and pagination/return schema (e.g. array of { institution_id, aicte_id, name, ... }).
 *
 * 6. MULTIPART ATTACHMENT REQUIREMENTS & FILE LIMITS:
 *    // TODO [BACKEND-INTEGRATION]: Confirm multipart field key (agreed: files[]),
 *    // max file count (e.g. 5), max individual size (e.g. 10MB), and allowed MIME types.
 *
 * 7. AUTHENTICATION & PERMISSION REQUIREMENTS:
 *    // TODO [BACKEND-INTEGRATION]: Confirm auth header convention:
 *    // (e.g. Authorization: Bearer <token>, session cookies, or API key).
 *
 * 8. ERROR RESPONSE FORMAT:
 *    // TODO [BACKEND-INTEGRATION]: Standardize HTTP 400/422/500 error envelope structure.
 *
 * 9. COMPLAINT LISTING & DETAIL ENDPOINTS:
 *    // TODO [BACKEND-INTEGRATION]: Confirm query params for listing (status, bureau, page, limit)
 *    // and URL pattern for case details (e.g. GET /api/v1/complaints/:id).
 * ==============================================================================
 */

import { APP_CONFIG } from './apiConfig.js';
import { buildMultipartFormData } from './complaintModel.js';

/**
 * Custom error thrown when a network call is requested while integration details remain pending.
 */
export class IntegrationPendingError extends Error {
  constructor(message, missingRequirement) {
    super(message);
    this.name = 'IntegrationPendingError';
    this.missingRequirement = missingRequirement;
  }
}

/**
 * Submits a complaint via multipart/form-data to the future backend API.
 * Guarded against execution while DEMO_MODE is active or endpoint is unconfirmed.
 *
 * @param {Object} mappedPayload - Agreed JSON model fields from transformModelToApiPayload
 * @param {File[]} attachments - Native File objects for multipart files[]
 * @returns {Promise<Object>} Future backend response
 */
export async function createComplaintHttp(mappedPayload, attachments = []) {
  if (APP_CONFIG.DEMO_MODE) {
    throw new IntegrationPendingError(
      'Cannot execute HTTP request: DEMO_MODE is active. Enable real integration only after backend endpoints and schemas are provided.',
      'DEMO_MODE_ACTIVE'
    );
  }

  const endpoint = APP_CONFIG.ENDPOINTS.CREATE_COMPLAINT;
  if (!endpoint) {
    throw new IntegrationPendingError(
      'Complaint creation endpoint is not yet configured. Awaiting backend contract details from backend teammate.',
      'CREATE_COMPLAINT_ENDPOINT_UNAVAILABLE'
    );
  }

  // TODO [BACKEND-INTEGRATION]: Assemble multipart FormData
  const formData = buildMultipartFormData(mappedPayload, attachments);

  // TODO [BACKEND-INTEGRATION]: Attach authentication headers if required
  const headers = {};

  const response = await fetch(`${APP_CONFIG.API_BASE_URL}${endpoint}`, {
    method: 'POST', // TODO [BACKEND-INTEGRATION]: Confirm HTTP method with backend teammate
    headers,
    body: formData,
  });

  if (!response.ok) {
    // TODO [BACKEND-INTEGRATION]: Parse standardized backend error structure
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Backend returned HTTP status ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches dynamic category and configuration metadata from the backend.
 * Guarded against execution while DEMO_MODE is active.
 *
 * @returns {Promise<Object>}
 */
export async function fetchMetadataHttp() {
  if (APP_CONFIG.DEMO_MODE) {
    throw new IntegrationPendingError(
      'Cannot execute HTTP request: DEMO_MODE is active. Demonstration fixtures are being used instead.',
      'DEMO_MODE_ACTIVE'
    );
  }

  const endpoint = APP_CONFIG.ENDPOINTS.META;
  if (!endpoint) {
    throw new IntegrationPendingError(
      '/meta endpoint is unconfirmed. Awaiting backend schema confirmation.',
      'META_ENDPOINT_UNAVAILABLE'
    );
  }

  const response = await fetch(`${APP_CONFIG.API_BASE_URL}${endpoint}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Searches approved institutions via the backend search endpoint.
 * Guarded against execution while DEMO_MODE is active.
 *
 * @param {string} query - Search term
 * @returns {Promise<Array>}
 */
export async function searchInstitutionsHttp(query) {
  if (APP_CONFIG.DEMO_MODE) {
    throw new IntegrationPendingError(
      'Cannot execute HTTP request: DEMO_MODE is active. In-memory demo institution search is being used.',
      'DEMO_MODE_ACTIVE'
    );
  }

  const endpoint = APP_CONFIG.ENDPOINTS.SEARCH_INSTITUTIONS;
  if (!endpoint) {
    throw new IntegrationPendingError(
      'Institution search endpoint is unconfirmed. Awaiting backend schema confirmation.',
      'INSTITUTIONS_ENDPOINT_UNAVAILABLE'
    );
  }

  // TODO [BACKEND-INTEGRATION]: Confirm query parameter name (e.g. ?q= or ?search=)
  const url = `${APP_CONFIG.API_BASE_URL}${endpoint}?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Institution search failed: HTTP ${response.status}`);
  }

  return response.json();
}
