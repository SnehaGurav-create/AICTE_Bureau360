// Report request handlers.

import * as service from './reports.service.js';

function parseFilters(query) {
  return {
    from: query.from || undefined,
    to: query.to || undefined,
    bureau_id: query.bureau_id || undefined,
    period: query.period || undefined,
  };
}

/**
 * GET /reports/dashboard — overall dashboard summary.
 */
export async function getDashboard(req, res) {
  const data = await service.getDashboardSummary(parseFilters(req.query));
  res.json({ data });
}

/**
 * GET /reports/bureaus — bureau performance breakdown.
 */
export async function getBureauReport(req, res) {
  const data = await service.getBureauReport(parseFilters(req.query));
  res.json({ data });
}

/**
 * GET /reports/regions — region-wise breakdown.
 */
export async function getRegionReport(req, res) {
  const data = await service.getRegionReport(parseFilters(req.query));
  res.json({ data });
}

/**
 * GET /reports/overlaps — overlap analytics and review statistics.
 */
export async function getOverlapReport(_req, res) {
  const data = await service.getOverlapReport();
  res.json({ data });
}

/**
 * GET /reports/categories — category breakdown.
 */
export async function getCategoryReport(req, res) {
  const data = await service.getCategoryReport(parseFilters(req.query));
  res.json({ data });
}

/**
 * GET /reports/sla — SLA compliance report.
 */
export async function getSlaCompliance(req, res) {
  const data = await service.getSlaComplianceReport(parseFilters(req.query));
  res.json({ data });
}

/**
 * GET /reports/aging — aging analysis.
 */
export async function getAging(req, res) {
  const data = await service.getAgingReport(parseFilters(req.query));
  res.json({ data });
}

/**
 * GET /reports/trend — monthly trend data.
 */
export async function getTrend(req, res) {
  const data = await service.getMonthlyTrend(parseFilters(req.query));
  res.json({ data });
}

/**
 * GET /reports/hotspots — top institution hotspots.
 */
export async function getHotspots(req, res) {
  const topN = parseInt(req.query.top, 10) || 10;
  const data = await service.getInstitutionHotspots(topN, parseFilters(req.query));
  res.json({ data });
}

/**
 * GET /reports/export — full report (JSON export).
 */
export async function getFullReport(req, res) {
  const data = await service.generateFullReport(parseFilters(req.query));

  // If CSV requested
  if (req.query.format === 'csv') {
    const csv = convertToCsv(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bureau360_report.csv');
    return res.send(csv);
  }

  res.json({ data });
}

/**
 * Simple CSV conversion for flat report sections.
 */
function convertToCsv(report) {
  const lines = [];

  // Summary section
  lines.push('=== SUMMARY ===');
  lines.push(Object.keys(report.summary).join(','));
  lines.push(Object.values(report.summary).join(','));
  lines.push('');

  // Bureau breakdown
  if (report.bureau_breakdown && report.bureau_breakdown.length > 0) {
    lines.push('=== BUREAU BREAKDOWN ===');
    lines.push(Object.keys(report.bureau_breakdown[0]).join(','));
    for (const row of report.bureau_breakdown) {
      lines.push(Object.values(row).map((v) => `"${v}"`).join(','));
    }
    lines.push('');
  }

  // SLA compliance
  lines.push('=== SLA COMPLIANCE ===');
  lines.push(Object.keys(report.sla_compliance).join(','));
  lines.push(Object.values(report.sla_compliance).join(','));
  lines.push('');

  // Aging
  lines.push('=== AGING ANALYSIS ===');
  lines.push(Object.keys(report.aging_analysis).join(','));
  lines.push(Object.values(report.aging_analysis).join(','));
  lines.push('');

  // Monthly trend
  if (report.monthly_trend && report.monthly_trend.length > 0) {
    lines.push('=== MONTHLY TREND ===');
    lines.push(Object.keys(report.monthly_trend[0]).join(','));
    for (const row of report.monthly_trend) {
      lines.push(Object.values(row).join(','));
    }
    lines.push('');
  }

  // Institution hotspots
  if (report.institution_hotspots && report.institution_hotspots.length > 0) {
    lines.push('=== INSTITUTION HOTSPOTS ===');
    lines.push(Object.keys(report.institution_hotspots[0]).join(','));
    for (const row of report.institution_hotspots) {
      lines.push(Object.values(row).map((v) => `"${v}"`).join(','));
    }
  }

  return lines.join('\n');
}
