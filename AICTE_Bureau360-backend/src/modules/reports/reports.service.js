// Report business logic: aggregates and exports.

import * as repo from './reports.repository.js';
import * as overlapRepo from '../overlap/overlap.repository.js';

/**
 * Build the full dashboard summary.
 *
 * @param {object} filters - { from, to, bureau_id }
 * @returns {Promise<object>}
 */
export async function getDashboardSummary(filters) {
  const [stats, statusBreakdown, overlapStats] = await Promise.all([
    repo.getComplaintStats(filters),
    repo.getStatusBreakdown(filters),
    overlapRepo.getOverlapStats(),
  ]);

  return {
    summary: stats,
    status_breakdown: statusBreakdown,
    overlap_summary: overlapStats,
  };
}

/**
 * Bureau-wise performance report.
 *
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function getBureauReport(filters) {
  return repo.getBureauBreakdown(filters);
}

/**
 * Region-wise performance report.
 *
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function getRegionReport(filters) {
  return repo.getRegionBreakdown(filters);
}

/**
 * Overlap intelligence analytics report.
 *
 * @returns {Promise<object>}
 */
export async function getOverlapReport() {
  return repo.getOverlapAnalytics();
}

/**
 * Category-wise breakdown.
 *
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function getCategoryReport(filters) {
  return repo.getCategoryBreakdown(filters);
}

/**
 * SLA compliance report.
 *
 * @param {object} filters
 * @returns {Promise<object>}
 */
export async function getSlaComplianceReport(filters) {
  return repo.getSlaCompliance(filters);
}

/**
 * Aging analysis.
 *
 * @param {object} filters
 * @returns {Promise<object>}
 */
export async function getAgingReport(filters) {
  return repo.getAgingAnalysis(filters);
}

/**
 * Monthly trend.
 *
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function getMonthlyTrend(filters) {
  return repo.getMonthlyTrend(filters);
}

/**
 * Institution hotspots.
 *
 * @param {number} topN
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function getInstitutionHotspots(topN, filters) {
  return repo.getInstitutionHotspots(topN, filters);
}

/**
 * Generate a comprehensive report object for CSV/JSON export.
 *
 * @param {object} filters
 * @returns {Promise<object>}
 */
export async function generateFullReport(filters) {
  const [
    summary,
    bureaus,
    categories,
    sla,
    aging,
    trend,
    hotspots,
  ] = await Promise.all([
    getDashboardSummary(filters),
    getBureauReport(filters),
    getCategoryReport(filters),
    getSlaComplianceReport(filters),
    getAgingReport(filters),
    getMonthlyTrend(filters),
    getInstitutionHotspots(20, filters),
  ]);

  return {
    generated_at: new Date().toISOString(),
    filters,
    ...summary,
    bureau_breakdown: bureaus,
    category_breakdown: categories,
    sla_compliance: sla,
    aging_analysis: aging,
    monthly_trend: trend,
    institution_hotspots: hotspots,
  };
}
