// Numeric limits and thresholds used across the application.

/** Maximum failed login attempts before the account is locked. */
export const MAX_FAILED_LOGINS = 5;

/** How long an account stays locked after too many failed logins (in minutes). */
export const ACCOUNT_LOCK_MINUTES = 15;

/** Default pagination limit. */
export const DEFAULT_PAGE_LIMIT = 20;

/** Maximum pagination limit a client can request. */
export const MAX_PAGE_LIMIT = 100;

/** Maximum number of files per upload request. */
export const MAX_FILES_PER_REQUEST = 5;

/** Maximum file size in bytes (10 MB). */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Allowed MIME types for uploads. */
export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

/** Allowed file extensions for uploads. */
export const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

/** Maximum attempts for the mail worker before marking a notification as FAILED. */
export const MAX_MAIL_ATTEMPTS = 5;

/** Mail worker polling interval in milliseconds. */
export const MAIL_POLL_INTERVAL_MS = 30000;
