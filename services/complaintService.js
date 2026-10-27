/**
 * AICTE Bureau360 — Complaint Service Facade
 * SIH 2026 Problem Statement 26264
 *
 * UNIFIED SERVICE INTERFACE:
 * - Keeps UI components completely independent from transport mechanisms.
 * - Automatically dispatches to demo service or future HTTP service based on APP_CONFIG.DEMO_MODE.
 * - Enforces agreed field mappings and validation.
 */

import { APP_CONFIG, COMPLAINANT_FIELD_MAPPING, isDemoMode } from './apiConfig.js';
import {
  createInitialComplaintModel,
  validateComplaintModel,
  transformModelToApiPayload,
} from './complaintModel.js';
import {
  submitComplaintDemo,
  getDemoCategories,
  searchDemoInstitutions,
  DEMO_CATEGORIES,
} from './demoComplaintService.js';
import {
  createComplaintHttp,
  fetchMetadataHttp,
  searchInstitutionsHttp,
} from './httpComplaintService.js';

/**
 * Unified complaint submission method.
 * Dispatches to demo handler or future HTTP service based on configuration.
 *
 * @param {Object} complaintModel - Complaint form model
 * @param {File[]} attachments - Separate array of File objects
 * @returns {Promise<Object>} Submission result
 */
export async function submitComplaint(complaintModel, attachments = []) {
  if (isDemoMode()) {
    // Local in-memory demonstration flow (zero network requests)
    return submitComplaintDemo(complaintModel, attachments);
  }

  // Future real HTTP flow
  const mappedPayload = transformModelToApiPayload(complaintModel);
  return createComplaintHttp(mappedPayload, attachments);
}

/**
 * Retrieves grievance categories (demo fixtures or backend metadata).
 * @returns {Promise<Array>}
 */
export async function getCategories() {
  if (isDemoMode()) {
    return getDemoCategories();
  }

  return fetchMetadataHttp();
}

/**
 * Searches approved institutions (demo dataset or backend search endpoint).
 *
 * @param {string} query - Search term
 * @returns {Promise<Array>}
 */
export async function searchInstitutions(query) {
  if (isDemoMode()) {
    return searchDemoInstitutions(query);
  }

  return searchInstitutionsHttp(query);
}

/**
 * Validates a complaint form model.
 * @param {Object} model - Complaint form model
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateComplaint(model) {
  return validateComplaintModel(model);
}

/**
 * Returns configuration details about fields pending backend confirmation.
 * @returns {Object}
 */
export function getPendingFieldConfig() {
  return COMPLAINANT_FIELD_MAPPING;
}

// Re-export core helpers for components
export {
  createInitialComplaintModel,
  transformModelToApiPayload,
  isDemoMode,
  DEMO_CATEGORIES,
};
