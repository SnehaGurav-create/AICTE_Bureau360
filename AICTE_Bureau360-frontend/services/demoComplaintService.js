/**
 * AICTE Bureau360 — Demonstration Complaint Service & In-Memory Repository
 * SIH 2026 Problem Statement 26264
 *
 * DEMONSTRATION MODE LAYER:
 * - Operates entirely locally in memory.
 * - Makes ZERO network requests to non-existent backend endpoints.
 * - Explicitly marks outcomes as NOT SAVED TO THE BACKEND.
 * - Uses realistic, fictional demonstration datasets clearly labeled as demo data.
 */

import {
  transformModelToApiPayload,
  validateComplaintModel,
} from './complaintModel.js';
import { INSTITUTIONS } from '../data/mockData.js';

// Fictional demonstration grievance category dataset (clearly labeled)
export const DEMO_CATEGORIES = [
  { category_id: 1, name: 'Faculty Deficit & Ghost Faculty', code: 'CAT-FAC', label: 'Faculty Deficit & Ghost Faculty [Demo]' },
  { category_id: 2, name: 'Capitation Fee & Excess Demands', code: 'CAT-FEE', label: 'Capitation Fee & Excess Demands [Demo]' },
  { category_id: 3, name: 'Infrastructure & Lab Non-Compliance', code: 'CAT-INFRA', label: 'Infrastructure & Lab Non-Compliance [Demo]' },
  { category_id: 4, name: 'Withholding Original Certificates', code: 'CAT-CERT', label: 'Withholding Original Certificates [Demo]' },
  { category_id: 5, name: 'Unapproved Course Offerings', code: 'CAT-CRS', label: 'Unapproved Course Offerings [Demo]' },
  { category_id: 6, name: 'Non-Refund of Caution Deposit', code: 'CAT-REF', label: 'Non-Refund of Caution Deposit [Demo]' },
  { category_id: 7, name: 'Ragging & Campus Safety', code: 'CAT-RAG', label: 'Ragging & Campus Safety [Demo]' },
];

/**
 * Retrieves the demonstration categories dataset.
 * @returns {Promise<Array>}
 */
export async function getDemoCategories() {
  return DEMO_CATEGORIES;
}

/**
 * Searches approved institutions from the demonstration dataset.
 *
 * @param {string} query - Search term (name, AICTE PID, district, or state)
 * @returns {Promise<Array>} Matched demo institutions
 */
export async function searchDemoInstitutions(query = '') {
  const q = String(query).toLowerCase().trim();
  if (!q) return [];

  return INSTITUTIONS.filter((inst) => {
    return (
      inst.name.toLowerCase().includes(q) ||
      inst.id.toLowerCase().includes(q) ||
      inst.district.toLowerCase().includes(q) ||
      inst.state.toLowerCase().includes(q)
    );
  }).slice(0, 5);
}

/**
 * Simulates a local demonstration intake submission.
 * Validates the model, transforms it to the agreed API contract schema, and logs attachments.
 *
 * IMPORTANT:
 * - Does NOT make network calls.
 * - Does NOT fabricate a backend database record.
 * - Generates a local preview docket label with clear 'LOCAL-DEMO-PREVIEW' prefix.
 *
 * @param {Object} complaintModel - The complaint form model
 * @param {File[]} attachments - Separate array of File objects
 * @returns {Promise<Object>} Local demonstration outcome
 */
export async function submitComplaintDemo(complaintModel, attachments = []) {
  // Validate model before simulation
  const validation = validateComplaintModel(complaintModel);
  if (!validation.isValid) {
    const error = new Error('Complaint form validation failed.');
    error.validationErrors = validation.errors;
    throw error;
  }

  // Simulate realistic UI processing latency (300ms)
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Transform model to agreed API payload format
  const mappedPayload = transformModelToApiPayload(complaintModel);

  // Generate safe demonstration docket identifier (never claiming to be a database ID)
  const demoDocketLabel = `LOCAL-DEMO-PREVIEW-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    isDemoMode: true,
    savedToBackend: false,
    status: 'NOT_SAVED_TO_BACKEND',
    demoDocketLabel,
    mappedPayload,
    attachmentCount: attachments.length,
    attachmentsSummary: attachments.map((f) => ({
      name: f.name || 'unnamed_file',
      sizeBytes: f.size || 0,
      type: f.type || 'application/octet-stream',
    })),
    timestamp: new Date().toISOString(),
    message: 'Local demonstration result processed. This record was NOT SAVED TO THE BACKEND because the real API is not yet available.',
  };
}
