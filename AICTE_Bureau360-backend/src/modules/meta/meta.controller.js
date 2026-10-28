// Handles the GET /meta request.

import * as metaService from './meta.service.js';

/**
 * GET /meta — returns all reference data for frontend dropdowns.
 * @param {import('express').Request}  _req
 * @param {import('express').Response} res
 */
export async function getMeta(_req, res) {
  const data = await metaService.getAllMeta();
  res.json({ data });
}
