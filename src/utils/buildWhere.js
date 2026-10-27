// Dynamically builds a WHERE clause from a set of filter definitions.
// Prevents SQL injection by using a whitelist of allowed columns and parameterised values.

/**
 * @typedef {object} FilterDef
 * @property {string} column    - The SQL column name (must be in the whitelist)
 * @property {string} operator  - SQL operator: '=', 'ILIKE', '>=', '<=', 'IN', 'IS'
 * @property {*}      value     - The value to bind (undefined/null entries are skipped)
 */

/**
 * Build a parameterised WHERE clause from an array of filter definitions.
 * Filters with undefined or null values are silently skipped.
 *
 * @param {FilterDef[]} filters         - Array of filter definitions
 * @param {number}      [startIndex=1]  - Starting $N index for parameterised placeholders
 * @returns {{ clause: string, values: Array, nextIndex: number }}
 *
 * @example
 *   const { clause, values } = buildWhere([
 *     { column: 'status', operator: '=', value: 'NEW' },
 *     { column: 'name', operator: 'ILIKE', value: '%Delhi%' },
 *   ]);
 *   // clause = "status = $1 AND name ILIKE $2"
 *   // values = ['NEW', '%Delhi%']
 */
export function buildWhere(filters, startIndex = 1) {
  const conditions = [];
  const values = [];
  let idx = startIndex;

  for (const filter of filters) {
    if (filter.value === undefined || filter.value === null) {
      continue;
    }

    // IS NULL / IS NOT NULL — no parameter needed
    if (filter.operator === 'IS') {
      conditions.push(`${filter.column} IS ${filter.value === true ? 'NOT NULL' : 'NULL'}`);
      continue;
    }

    // IN — expand to ($1, $2, ...)
    if (filter.operator === 'IN') {
      const arr = Array.isArray(filter.value) ? filter.value : [filter.value];
      if (arr.length === 0) {
        continue;
      }
      const placeholders = arr.map(() => `$${idx++}`);
      conditions.push(`${filter.column} IN (${placeholders.join(', ')})`);
      values.push(...arr);
      continue;
    }

    // Standard operators: =, ILIKE, >=, <=, >, <
    conditions.push(`${filter.column} ${filter.operator} $${idx++}`);
    values.push(filter.value);
  }

  const clause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  return { clause, values, nextIndex: idx };
}
