// Overlap detection business logic.
// Implements rule-based matching and optional ML bridge.

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { pool } from '../../config/database.js';
import { AppError } from '../../utils/AppError.js';
import { withTransaction } from '../../utils/withTransaction.js';
import { ACTION_TYPES } from '../../constants/actionTypes.js';
import * as repo from './overlap.repository.js';
import * as complaintRepo from '../complaints/complaints.repository.js';

// ── Name normalisation ──────────────────────────────────────────────
/**
 * Normalise an institution name for comparison:
 * lower-case, strip punctuation, collapse whitespace, remove common suffixes.
 */
function normaliseName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(
      /\b(college|institute|institution|university|of|the|and|for|engineering|technology|sciences?|education|management|pvt|ltd|limited)\b/g,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple token-overlap similarity (Jaccard index).
 */
function tokenSimilarity(a, b) {
  const tokA = new Set(normaliseName(a).split(' ').filter(Boolean));
  const tokB = new Set(normaliseName(b).split(' ').filter(Boolean));
  if (tokA.size === 0 || tokB.size === 0) return 0;
  let intersection = 0;
  for (const t of tokA) {
    if (tokB.has(t)) intersection++;
  }
  const union = new Set([...tokA, ...tokB]).size;
  return intersection / union;
}

// ── ML bridge (calls Python micro-service) ──────────────────────────
const ML_SERVICE_URL = process.env.ML_OVERLAP_URL || 'http://localhost:5050';

/**
 * Call the Python ML service for description similarity.
 * Returns { is_overlap: bool, probability: float, explanation: string }.
 * Falls back gracefully if the service is unavailable.
 */
async function callMlService(textA, textB) {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text_a: textA, text_b: textB }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    logger.warn('ML overlap service unavailable — skipping ML check');
    return null;
  }
}

// ── Core detection ──────────────────────────────────────────────────

/**
 * Run overlap detection for a complaint against all other complaints
 * for the same institution (exact ID match) and similar institutions
 * (normalised name match). Optionally enriches with ML similarity.
 *
 * Returns an array of { complaint, reasons[], aggregateScore }.
 *
 * @param {string} complaintId - The complaint to check
 * @param {object} user - req.user (for audit trail)
 * @returns {Promise<Array>}
 */
export async function detectOverlaps(complaintId, user) {
  // Load the source complaint
  const complaint = await complaintRepo.findComplaintById(complaintId, user);
  if (!complaint) {
    throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
  }

  const results = [];
  const threshold = env.OVERLAP_SIMILARITY_THRESHOLD;

  // ── Strategy 1: Same institution ID ───────────────────────────────
  const sameInstComplaints = await repo.findComplaintsByInstitution(
    complaint.institution_id,
    complaintId,
  );

  for (const other of sameInstComplaints) {
    const reasons = [];
    const isSameCategory = other.category_id === complaint.category_id;
    const isDifferentBureau = other.current_bureau_id !== complaint.current_bureau_id;

    // Lexical description similarity (token Jaccard)
    const textJaccard = tokenSimilarity(
      `${complaint.title} ${complaint.description}`,
      `${other.title} ${other.description}`,
    );

    // Call ML service for deep semantic similarity
    const ml = await callMlService(
      `${complaint.title} ${complaint.description}`,
      `${other.title} ${other.description}`,
    );
    const textSim = ml ? ml.probability : textJaccard;

    // ── 4-Case Taxonomy Evaluation ──────────────────────────────────
    // Case 2: Same college + different complaints (Separate cases)
    // Different category AND low description similarity (< 0.30)
    // Kept as independent cases; DO NOT create an overlap link.
    if (!isSameCategory && textSim < 0.30) {
      continue;
    }

    // Weighted composite score (Institution 40%, Category 25%, Text 35%)
    const instScore = 0.40;
    const catScore = isSameCategory ? 0.25 : 0.0;
    const textScore = textSim * 0.35;
    const compositeScore = instScore + catScore + textScore;

    // Case 1: Same college + same complaint (Potential duplicate)
    // High text similarity AND same category, OR overwhelming text overlap (>= 0.75)
    const isPotentialDuplicate = (isSameCategory && textSim >= 0.45) || textSim >= 0.75;
    const linkType = isPotentialDuplicate ? 'DUPLICATE' : 'RELATED';

    // Record explainable reasons
    reasons.push({
      method: 'EXACT_INSTITUTION_ID',
      detail: `Both complaints reference verified institution ${complaint.aicte_id}`,
      score: 1.0,
    });

    if (isSameCategory) {
      if (isDifferentBureau) {
        reasons.push({
          method: 'SAME_CATEGORY_BUREAU',
          detail: `Same category "${other.category_name}" handled by different bureaus (${complaint.bureau_name || 'Intake'} ↔ ${other.bureau_name || 'Other'}) — coordination required`,
          score: 0.9,
        });
      } else {
        reasons.push({
          method: 'SAME_CATEGORY_BUREAU',
          detail: `Same category "${other.category_name}" within same bureau`,
          score: 0.8,
        });
      }
    }

    if (textSim >= 0.25) {
      reasons.push({
        method: 'ML_DESCRIPTION_SIMILARITY',
        detail: ml?.explanation || `Semantic description similarity: ${(textSim * 100).toFixed(1)}%`,
        score: textSim,
      });
    }

    if (compositeScore >= threshold) {
      results.push({
        complaint: other,
        reasons,
        aggregateScore: Math.min(1.0, Math.round(compositeScore * 1000) / 1000),
        linkType,
        isPotentialDuplicate,
      });
    }
  }

  // ── Strategy 2: Similar institution name (pg_trgm) ────────────────
  const similarInstitutions = await repo.findSimilarInstitutions(
    complaint.institution_name,
    threshold,
    complaint.institution_id,
  );

  for (const simInst of similarInstitutions) {
    const simComplaints = await repo.findComplaintsByInstitution(simInst.id, complaintId);

    for (const other of simComplaints) {
      if (results.some((r) => r.complaint.id === other.id)) continue;

      const reasons = [];
      const nameSim = tokenSimilarity(complaint.institution_name, simInst.name);
      
      const ml = await callMlService(
        `${complaint.title} ${complaint.description}`,
        `${other.title} ${other.description}`,
      );
      const textSim = ml ? ml.probability : tokenSimilarity(
        `${complaint.title} ${complaint.description}`,
        `${other.title} ${other.description}`,
      );

      // Case 4: Different colleges with similar complaints
      // NEVER classify across different institutions as DUPLICATE.
      // Maximum classification is RELATED, only if name similarity and text similarity are both high.
      const simInstScore = simInst.sim_score * 0.40;
      const simCatScore = (other.category_id === complaint.category_id ? 0.25 : 0.0);
      const simTextScore = textSim * 0.35;
      const compositeScore = simInstScore + simCatScore + simTextScore;

      if (compositeScore >= threshold && simInst.sim_score >= 0.4) {
        reasons.push({
          method: 'NORMALIZED_NAME',
          detail: `Institution names are ${(simInst.sim_score * 100).toFixed(0)}% similar (pg_trgm: "${complaint.institution_name}" ≈ "${simInst.name}")`,
          score: simInst.sim_score,
        });

        if (textSim >= 0.25) {
          reasons.push({
            method: 'ML_DESCRIPTION_SIMILARITY',
            detail: ml?.explanation || `Semantic description similarity: ${(textSim * 100).toFixed(1)}%`,
            score: textSim,
          });
        }

        results.push({
          complaint: other,
          reasons,
          aggregateScore: Math.min(1.0, Math.round(compositeScore * 1000) / 1000),
          linkType: 'RELATED', // Strict Case 4 rule: Never duplicate across different colleges
          isPotentialDuplicate: false,
        });
      }
    }
  }

  // Sort by aggregate score descending
  results.sort((a, b) => b.aggregateScore - a.aggregateScore);

  return results;
}

/**
 * Run detection AND persist results as complaint_links with match reasons.
 * Also sets has_overlap flag on the source complaint.
 *
 * @param {string} complaintId
 * @param {object} user
 * @returns {Promise<{ links_created: number, results: Array }>}
 */
export async function detectAndPersistOverlaps(complaintId, user) {
  const results = await detectOverlaps(complaintId, user);
  if (results.length === 0) {
    return { links_created: 0, results: [] };
  }

  const persistedLinks = await withTransaction(async (client) => {
    const links = [];

    for (const result of results) {
      // Create or update link
      const link = await repo.createLink(
        {
          complaint_id: complaintId,
          related_complaint_id: result.complaint.id,
          link: result.linkType || (result.aggregateScore >= 0.85 ? 'DUPLICATE' : 'RELATED'),
          similarity_score: result.aggregateScore,
          created_by: null, // system-generated
        },
        client,
      );

      // Persist each match reason
      for (const reason of result.reasons) {
        await repo.insertMatchReason(
          {
            link_id: link.id,
            method: reason.method,
            detail: reason.detail,
            score: reason.score,
            metadata: {},
          },
          client,
        );
      }

      links.push({ ...link, match_reasons: result.reasons });
    }

    // Set has_overlap on the complaint
    await complaintRepo.updateComplaint(complaintId, { has_overlap: true }, client);

    // Insert timeline action
    await complaintRepo.insertAction(
      {
        complaint_id: complaintId,
        action_type: ACTION_TYPES.OVERLAP_LINKED,
        performed_by: user.id,
        performed_by_bureau: user.bureau_id,
        remarks: `Overlap detection found ${links.length} potential match(es)`,
        metadata: { link_ids: links.map((l) => l.id) },
      },
      client,
    );

    return links;
  });

  return { links_created: persistedLinks.length, results: persistedLinks };
}

/**
 * Review a link (confirm or dismiss).
 *
 * @param {number} linkId
 * @param {string} decision - 'CONFIRMED' | 'DISMISSED'
 * @param {object} user
 * @returns {Promise<object>}
 */
export async function reviewLink(linkId, decision, user) {
  if (!['CONFIRMED', 'DISMISSED'].includes(decision)) {
    throw new AppError(400, 'INVALID_DECISION', 'Decision must be CONFIRMED or DISMISSED');
  }

  const existing = await repo.findLinkById(linkId);
  if (!existing) {
    throw new AppError(404, 'LINK_NOT_FOUND', 'Overlap link not found');
  }

  const updated = await repo.updateLinkReview(linkId, decision, user.id);

  // If dismissed, potentially clear has_overlap flag
  if (decision === 'DISMISSED') {
    // Check if any confirmed/pending links remain for either complaint
    const linksA = await repo.findLinksByComplaintId(existing.complaint_id);
    const activeA = linksA.filter(
      (l) => l.id !== linkId && l.review_status !== 'DISMISSED',
    );
    if (activeA.length === 0) {
      await complaintRepo.updateComplaint(existing.complaint_id, { has_overlap: false }, pool);
    }

    const linksB = await repo.findLinksByComplaintId(existing.related_complaint_id);
    const activeB = linksB.filter(
      (l) => l.id !== linkId && l.review_status !== 'DISMISSED',
    );
    if (activeB.length === 0) {
      await complaintRepo.updateComplaint(existing.related_complaint_id, { has_overlap: false }, pool);
    }
  }

  return updated;
}

/**
 * List pending overlap links (for the review centre).
 */
export async function listPendingLinks(filters, pagination) {
  return repo.findPendingLinks(filters, pagination);
}

/**
 * Get overlap links for a specific complaint.
 */
export async function getComplaintLinks(complaintId) {
  return repo.findLinksByComplaintId(complaintId);
}

/**
 * Get overlap dashboard stats.
 */
export async function getOverlapDashboard() {
  return repo.getOverlapStats();
}
