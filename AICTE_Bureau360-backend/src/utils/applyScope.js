// Applies data-scope filtering to complaint queries based on the user's role scope.
// Shared helper used by complaints, dashboard, and overlap queries.

import { SCOPES } from '../constants/roles.js';

/**
 * Build a WHERE clause fragment that restricts complaint visibility based on the user's scope.
 * Must be combined with other filters using AND.
 *
 * @param {object} user - req.user object from authenticate middleware
 * @param {string} [complaintAlias='c'] - SQL alias for the complaints table
 * @param {string} [institutionAlias='i'] - SQL alias for the institutions table (when joined)
 * @param {number} [startIndex=1] - Starting $N parameter index
 * @returns {{ clause: string, params: Array, nextIndex: number }} - clause is a SQL fragment, params are values
 *
 * @example
 *   const { clause, params, nextIndex } = applyScope(req.user, 'c', 'i', 1);
 *   // For BUREAU scope: clause = 'c.current_bureau_id = $1', params = [user.bureau_id]
 */
export function applyScope(user, complaintAlias = 'c', institutionAlias = 'i', startIndex = 1) {
  const params = [];
  let idx = startIndex;

  switch (user.role_scope) {
    case SCOPES.ALL:
      // ADMIN, REGULATION_BUREAU, PGRC: see everything
      return { clause: '1=1', params, nextIndex: idx };

    case SCOPES.BUREAU:
      // OTHER_BUREAU: only complaints currently assigned to their bureau
      params.push(user.bureau_id);
      return {
        clause: `${complaintAlias}.current_bureau_id = $${idx++}`,
        params,
        nextIndex: idx,
      };

    case SCOPES.REGION: {
      // REGIONAL_OFFICE: complaints where the current bureau OR institution is in their region
      params.push(user.region_id, user.region_id);
      const p1 = idx++;
      const p2 = idx++;
      return {
        clause: `(
          EXISTS (SELECT 1 FROM bureaus b WHERE b.id = ${complaintAlias}.current_bureau_id AND b.region_id = $${p1})
          OR ${institutionAlias}.region_id = $${p2}
        )`,
        params,
        nextIndex: idx,
      };
    }

    case SCOPES.ASSIGNED:
      // AUTHORIZED_OFFICER: only complaints directly assigned to them
      params.push(user.id);
      return {
        clause: `${complaintAlias}.current_assignee_id = $${idx++}`,
        params,
        nextIndex: idx,
      };

    default:
      // Safety fallback: if scope is unknown, deny all access
      return { clause: '1=0', params, nextIndex: idx };
  }
}
