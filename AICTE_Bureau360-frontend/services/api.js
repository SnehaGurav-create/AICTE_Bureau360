/**
 * AICTE Bureau360 — Public Services & API Bridge
 * SIH 2026 Problem Statement 26264
 *
 * Central entry point maintaining backward compatibility while re-exporting
 * from the modular services architecture:
 * - apiConfig.js: Configuration switches, pending field mappings, enums
 * - complaintModel.js: Pure domain model, validation, transformation
 * - demoComplaintService.js: In-memory simulation and demo datasets
 * - httpComplaintService.js: Future HTTP transport layer
 * - complaintService.js: Unified service facade
 */

export {
  APP_CONFIG,
  COMPLAINANT_FIELD_MAPPING,
  PERMITTED_PRIORITIES,
  DEFAULT_PRIORITY,
  PERMITTED_SOURCES,
  DEFAULT_SOURCE,
  isDemoMode,
} from './apiConfig.js';

export {
  createInitialComplaintModel,
  validateComplaintModel,
  transformModelToApiPayload,
  buildMultipartFormData,
  // Backward compatibility alias:
  transformModelToApiPayload as mapFormToApiPayload,
} from './complaintModel.js';

export {
  DEMO_CATEGORIES,
  getDemoCategories,
  searchDemoInstitutions,
  submitComplaintDemo,
} from './demoComplaintService.js';

export {
  createComplaintHttp,
  fetchMetadataHttp,
  searchInstitutionsHttp,
  IntegrationPendingError,
  // Backward compatibility alias:
  createComplaintHttp as submitComplaintFutureAPI,
} from './httpComplaintService.js';

export {
  submitComplaint,
  getCategories,
  searchInstitutions,
  validateComplaint,
  getPendingFieldConfig,
} from './complaintService.js';
