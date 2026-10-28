// Parses page/limit from query params and builds the LIMIT/OFFSET clause + meta object.

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse pagination params from the request query string.
 *
 * @param {object} query - req.query
 * @returns {{ page: number, limit: number, offset: number }}
 */
export function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isFinite(page) || page < 1) {
    page = DEFAULT_PAGE;
  }
  if (!Number.isFinite(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Build the standard "meta" object for paginated responses.
 *
 * @param {number} total - Total number of rows matching the filters
 * @param {number} page  - Current page
 * @param {number} limit - Items per page
 * @returns {{ page: number, limit: number, total: number, total_pages: number }}
 */
export function buildPaginationMeta(total, page, limit) {
  return {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit) || 1,
  };
}
