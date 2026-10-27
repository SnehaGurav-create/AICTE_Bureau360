// Custom application error. Services throw this; the central errorHandler formats the response.

export class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 404, 409)
   * @param {string} code       - Machine-readable error code (e.g. 'VALIDATION_ERROR')
   * @param {string} message    - Human-readable message
   * @param {Array}  [details]  - Optional array of field-level error details
   */
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
