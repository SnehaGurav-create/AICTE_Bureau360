/**
 * AICTE Bureau360 — Central API & Service Configuration
 * SIH 2026 Problem Statement 26264
 *
 * Manages configuration switches, pending field contracts, and permitted enum domains.
 * UI components must NOT contain transport details or hardcoded endpoints.
 */

export const APP_CONFIG = {
  // Master Demonstration Mode Switch:
  // Defaults to TRUE while backend endpoints and schemas are unavailable.
  // In demo mode: zero network requests are made to unconfirmed endpoints.
  DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE !== 'false',

  // API Base URL (empty by default; supplied via environment variable in production)
  // Does NOT hardcode invented URLs or secrets in source code.
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',

  // Endpoints: Explicitly marked as null until confirmed by backend teammate.
  // Configurable via environment variables once confirmed.
  ENDPOINTS: {
    CREATE_COMPLAINT: process.env.NEXT_PUBLIC_ENDPOINT_CREATE_COMPLAINT || null,
    META: process.env.NEXT_PUBLIC_ENDPOINT_META || null,
    SEARCH_INSTITUTIONS: process.env.NEXT_PUBLIC_ENDPOINT_INSTITUTIONS || null,
    COMPLAINTS_LIST: process.env.NEXT_PUBLIC_ENDPOINT_COMPLAINTS_LIST || null,
    COMPLAINT_DETAIL: process.env.NEXT_PUBLIC_ENDPOINT_COMPLAINT_DETAIL || null,
  },
};

/**
 * Complainant Contact Fields Mapping:
 * Property names for complainant email and phone are pending confirmation from the backend teammate.
 * These are configurable via environment variables once confirmed.
 */
export const COMPLAINANT_FIELD_MAPPING = {
  emailProperty: process.env.NEXT_PUBLIC_API_COMPLAINANT_EMAIL_KEY || null,
  phoneProperty: process.env.NEXT_PUBLIC_API_COMPLAINANT_PHONE_KEY || null,
  status: 'PENDING_BACKEND_CONFIRMATION',
  notice: 'Complainant email and phone API property names are awaiting backend schema confirmation.',
};

// Permitted Enum Values per Agreed Contract
export const PERMITTED_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const DEFAULT_PRIORITY = 'MEDIUM';

export const PERMITTED_SOURCES = ['PORTAL', 'EMAIL', 'LETTER', 'PHONE', 'PG_PORTAL', 'OTHER'];
export const DEFAULT_SOURCE = 'PORTAL';

/**
 * Check if the application is currently running in demonstration mode.
 * @returns {boolean}
 */
export function isDemoMode() {
  return APP_CONFIG.DEMO_MODE;
}
