// Assembles all dropdown/reference data into one response so the frontend never hardcodes values.

import * as metaRepo from './meta.repository.js';
import { COMPLAINT_STATUSES, STATUS_TRANSITIONS } from '../../constants/statuses.js';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const SOURCES = ['PORTAL', 'EMAIL', 'LETTER', 'PHONE', 'PG_PORTAL', 'OTHER'];

/**
 * Returns all reference data for frontend dropdowns and the status transition map.
 * @returns {Promise<object>}
 */
export async function getAllMeta() {
  const [categories, bureaus, regions, roles] = await Promise.all([
    metaRepo.findCategories(),
    metaRepo.findBureaus(),
    metaRepo.findRegions(),
    metaRepo.findRoles(),
  ]);

  return {
    categories,
    statuses: Object.values(COMPLAINT_STATUSES),
    priorities: PRIORITIES,
    sources: SOURCES,
    bureaus,
    regions,
    roles,
    status_transitions: STATUS_TRANSITIONS,
  };
}
