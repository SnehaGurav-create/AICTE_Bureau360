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

    // Check relevant time period (temporal proximity: e.g. within 90 days)
    const dateA = new Date(complaint.received_on);
    const dateB = new Date(other.received_on);
    const daysApart = Math.round(Math.abs((dateA - dateB) / (1000 * 60 * 60 * 24)));
    const isRelevantTimePeriod = daysApart <= 90;

    // Check official reference or supporting evidence match (e.g. CPGRAMS docket, RTI ref, court matter)
    const hasMatchingRef = Boolean(
      complaint.external_ref_no &&
      other.external_ref_no &&
      complaint.external_ref_no.trim().toLowerCase() === other.external_ref_no.trim().toLowerCase()
    );

    // Lexical description similarity (token Jaccard)
    const textJaccard = tokenSimilarity(
      `${complaint.title} ${complaint.description}`,
      `${other.title} ${other.description}`,
    );

    // Call ML service for deep semantic similarity (TF-IDF Cosine Similarity)
    const ml = await callMlService(
      `${complaint.title} ${complaint.description}`,
      `${other.title} ${other.description}`,
    );
    const textSim = ml ? ml.probability : textJaccard;

    // ── Taxonomy Signal Evaluation ──────────────────────────────────
    // Signal: Different categories or distinct events -> More likely separate complaints
    // Different category AND low description similarity (< 0.30) AND no official ref match:
    // Kept as independent cases; DO NOT create an overlap link.
    if (!isSameCategory && textSim < 0.30 && !hasMatchingRef) {
      continue;
    }

    // Weighted composite score (Institution 40%, Category 25%, Text 35%)
    const instScore = 0.40;
    const catScore = isSameCategory ? 0.25 : 0.0;
    const textScore = textSim * 0.35;
    let compositeScore = instScore + catScore + textScore;

    // Boost score if official reference matches exactly
    if (hasMatchingRef) {
      compositeScore = Math.min(1.0, compositeScore + 0.20);
    }

    // Candidate relationship determination:
    // The ML model and rules generate candidate relationships and a score.
    // They DO NOT make the final administrative decision by themselves.
    const isPotentialDuplicate = (isSameCategory && textSim >= 0.40) || textSim >= 0.75 || hasMatchingRef;
    if (isPotentialDuplicate || (isSameCategory && complaint.institution_id === other.institution_id)) {
      compositeScore = Math.max(0.90, compositeScore);
    }
    const linkType = isPotentialDuplicate ? 'DUPLICATE' : 'RELATED';
    const relationshipType = isPotentialDuplicate ? 'POTENTIAL_DUPLICATE' : 'RELATED_CASE';

    // Record explainable reasons (The "Why" behind candidate relationship)
    // 1. Signal: Same verified institution ID
    reasons.push({
      method: 'EXACT_INSTITUTION_ID',
      detail: `Both cases concern verified institution ${complaint.aicte_id} (${complaint.institution_name})`,
      score: 1.0,
    });

    // 2. Signal: Same category & Different bureaus
    if (isSameCategory) {
      if (isDifferentBureau) {
        // Signal: Different bureaus is a coordination consideration, not proof of duplication
        reasons.push({
          method: 'SAME_CATEGORY_BUREAU',
          detail: `Same category "${other.category_name}" handled across distinct bureaus (${complaint.bureau_name || 'Intake'} ↔ ${other.bureau_name || 'Coordination Bureau'}) — inter-bureau coordination consideration, not proof of duplication`,
          score: 0.9,
        });
      } else {
        reasons.push({
          method: 'SAME_CATEGORY_BUREAU',
          detail: `Same grievance category "${other.category_name}" registered within the same bureau`,
          score: 0.8,
        });
      }
    }

    // 3. Signal: Same category and relevant time period (concurrent event window)
    if (isRelevantTimePeriod && isSameCategory) {
      reasons.push({
        method: 'SAME_TIME_PERIOD',
        detail: `Filed within ${daysApart} days of each other (${complaint.received_on} ↔ ${other.received_on}) — complaints may concern the same event, admission cycle or semester`,
        score: Math.max(0.3, Math.round((1 - daysApart / 90) * 100) / 100),
      });
    }

    // 4. Signal: Same official reference or supporting evidence
    if (hasMatchingRef) {
      reasons.push({
        method: 'OFFICIAL_REFERENCE_MATCH',
        detail: `Identical official reference docket: "${complaint.external_ref_no}" — strong corroborating evidence of duplicate or common matter`,
        score: 1.0,
      });
    }

    // 5. Signal: Similar complaint descriptions (ML semantic similarity)
    if (textSim >= 0.25) {
      reasons.push({
        method: 'ML_DESCRIPTION_SIMILARITY',
        detail: ml?.explanation || `Semantic description similarity: ${(textSim * 100).toFixed(1)}% (underlying issue may be similar)`,
        score: textSim,
      });
    }

    if (compositeScore >= threshold) {
      results.push({
        complaint: other,
        reasons,
        aggregateScore: Math.min(1.0, Math.round(compositeScore * 1000) / 1000),
        linkType,
        relationshipType,
        isPotentialDuplicate,
      });
    }
  }

  // ── Strategy 2: Similar institution name (pg_trgm) ────────────────
  const similarInstitutions = await repo.findSimilarInstitutions(
    complaint.institution_name,
    0.25,
    complaint.institution_id,
  );

  for (const simInst of similarInstitutions) {
    const simComplaints = await repo.findComplaintsByInstitution(simInst.id, complaintId);

    for (const other of simComplaints) {
      if (results.some((r) => r.complaint.id === other.id)) continue;

      const reasons = [];
      const nameSim = tokenSimilarity(complaint.institution_name, simInst.name);
      const effectiveNameSim = Math.max(Number(simInst.sim_score) || 0, nameSim);
      
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
      const simInstScore = effectiveNameSim * 0.40;
      const simCatScore = (other.category_id === complaint.category_id ? 0.25 : 0.0);
      const simTextScore = textSim * 0.35;
      const compositeScore = simInstScore + simCatScore + simTextScore;

      if (compositeScore >= threshold && effectiveNameSim >= 0.3) {
        reasons.push({
          method: 'NORMALIZED_NAME',
          detail: `Institution names are ${(effectiveNameSim * 100).toFixed(0)}% similar (pg_trgm: "${complaint.institution_name}" ≈ "${simInst.name}")`,
          score: effectiveNameSim,
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
          relationship_type: result.relationshipType || (result.isPotentialDuplicate ? 'POTENTIAL_DUPLICATE' : 'RELATED_CASE'),
          similarity_score: result.aggregateScore,
          evidence: result.reasons,
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
 * Review a link (confirm duplicate, confirm related case, or dismiss as unrelated).
 *
 * When a duplicate is confirmed:
 * 1. Authorized workflow determines which case is primary (does NOT assume oldest or RB is lead).
 * 2. Duplicate case remains in DB with disposition 'DUPLICATE_LINKED' and primary_complaint_id.
 * 3. All original case IDs, received dates, complainant records, and action histories are strictly preserved.
 * 4. Chronological audit actions are recorded in case_actions for both complaints.
 * 5. case_relationships and complaint_links are synchronized.
 *
 * @param {number} linkId
 * @param {string|object} decisionInput - 'CONFIRMED' | 'DISMISSED' or { decision, relationship_type, primary_case_id, coordination_decision, review_notes }
 * @param {object} user
 * @returns {Promise<object>}
 */
export async function reviewLink(linkId, decisionInput, user) {
  const decision = typeof decisionInput === 'string'
    ? decisionInput
    : (decisionInput?.review_status || decisionInput?.decision);

  if (!['CONFIRMED', 'DISMISSED'].includes(decision)) {
    throw new AppError(400, 'INVALID_DECISION', 'Decision must be CONFIRMED or DISMISSED');
  }

  const existing = await repo.findLinkById(linkId);
  if (!existing) {
    throw new AppError(404, 'LINK_NOT_FOUND', 'Overlap link not found');
  }

  const relationshipTypeInput = typeof decisionInput === 'object' ? decisionInput.relationship_type : null;
  const primaryCaseIdInput = typeof decisionInput === 'object' ? decisionInput.primary_case_id : null;
  const coordinationDecision = typeof decisionInput === 'object' ? decisionInput.coordination_decision : null;
  const reviewNotes = typeof decisionInput === 'object' ? (decisionInput.review_notes || decisionInput.notes) : null;

  return withTransaction(async (client) => {
    // Determine target relationship type
    let relationshipType;
    let linkType;

    if (decision === 'DISMISSED') {
      relationshipType = 'UNRELATED';
      linkType = existing.link;
    } else {
      if (relationshipTypeInput) {
        if (relationshipTypeInput === 'CONFIRMED_DUPLICATE' || relationshipTypeInput === 'DUPLICATE') {
          relationshipType = 'CONFIRMED_DUPLICATE';
          linkType = 'DUPLICATE';
        } else {
          relationshipType = 'RELATED_CASE';
          linkType = 'RELATED';
        }
      } else {
        if (existing.link === 'DUPLICATE') {
          relationshipType = 'CONFIRMED_DUPLICATE';
          linkType = 'DUPLICATE';
        } else {
          relationshipType = 'RELATED_CASE';
          linkType = 'RELATED';
        }
      }
    }

    let primaryCase = null;
    let duplicateCase = null;

    if (decision === 'CONFIRMED' && relationshipType === 'CONFIRMED_DUPLICATE') {
      // Authorized workflow determines which case leads
      const caseA = await complaintRepo.findComplaintById(existing.complaint_id, user, client);
      const caseB = await complaintRepo.findComplaintById(existing.related_complaint_id, user, client);

      if (primaryCaseIdInput && primaryCaseIdInput === caseB?.id) {
        primaryCase = caseB;
        duplicateCase = caseA;
      } else if (primaryCaseIdInput && primaryCaseIdInput === caseA?.id) {
        primaryCase = caseA;
        duplicateCase = caseB;
      } else {
        // Default to complaint_id as primary if not specified
        primaryCase = caseA;
        duplicateCase = caseB;
      }

      if (duplicateCase && primaryCase) {
        // Update duplicate case: disposition = 'DUPLICATE_LINKED', primary_complaint_id = primaryCase.id
        // Preserves original case ID, received date, complainant records, and prior history
        await complaintRepo.updateComplaint(
          duplicateCase.id,
          {
            disposition: 'DUPLICATE_LINKED',
            primary_complaint_id: primaryCase.id,
            coordination_notes: reviewNotes || `Confirmed duplicate of primary coordination case ${primaryCase.complaint_no}`,
            linked_at: new Date(),
          },
          client,
        );

        // Update primary case: disposition = 'PRIMARY_COORDINATION'
        await complaintRepo.updateComplaint(
          primaryCase.id,
          {
            disposition: 'PRIMARY_COORDINATION',
            coordination_notes: reviewNotes || `Designated lead coordination case for duplicate ${duplicateCase.complaint_no}`,
          },
          client,
        );

        // Record chronological action in case_actions (complaint_actions) for duplicate case
        await complaintRepo.insertAction(
          {
            complaint_id: duplicateCase.id,
            action_type: ACTION_TYPES.OVERLAP_LINKED,
            performed_by: user.id,
            performed_by_bureau: user.bureau_id,
            remarks: `Confirmed Duplicate — Linked to primary coordination case ${primaryCase.complaint_no}. All original records preserved. New actions routed according to coordination decision. ${reviewNotes ? `Notes: ${reviewNotes}` : ''}`,
            metadata: {
              relationship_type: 'CONFIRMED_DUPLICATE',
              primary_case_id: primaryCase.id,
              primary_complaint_no: primaryCase.complaint_no,
              coordination_decision: coordinationDecision || 'PRIMARY_LEAD',
              review_notes: reviewNotes,
            },
          },
          client,
        );

        // Record chronological action in case_actions (complaint_actions) for primary case
        await complaintRepo.insertAction(
          {
            complaint_id: primaryCase.id,
            action_type: ACTION_TYPES.OVERLAP_LINKED,
            performed_by: user.id,
            performed_by_bureau: user.bureau_id,
            remarks: `Designated as primary coordination case for confirmed duplicate ${duplicateCase.complaint_no}. Cross-bureau coordination active. ${reviewNotes ? `Notes: ${reviewNotes}` : ''}`,
            metadata: {
              relationship_type: 'CONFIRMED_DUPLICATE',
              duplicate_case_id: duplicateCase.id,
              duplicate_complaint_no: duplicateCase.complaint_no,
              coordination_decision: coordinationDecision || 'PRIMARY_LEAD',
              review_notes: reviewNotes,
            },
          },
          client,
        );
      }
    } else if (decision === 'CONFIRMED' && relationshipType === 'RELATED_CASE') {
      const caseA = await complaintRepo.findComplaintById(existing.complaint_id, user, client);
      const caseB = await complaintRepo.findComplaintById(existing.related_complaint_id, user, client);

      // Both cases remain independent grievances with cross-bureau coordination
      if (caseA) {
        await complaintRepo.updateComplaint(
          caseA.id,
          {
            disposition: caseA.disposition || 'INDEPENDENT',
            coordination_notes: reviewNotes || 'Linked as related case for multi-bureau coordination',
          },
          client,
        );

        await complaintRepo.insertAction(
          {
            complaint_id: caseA.id,
            action_type: ACTION_TYPES.OVERLAP_LINKED,
            performed_by: user.id,
            performed_by_bureau: user.bureau_id,
            remarks: `Confirmed as Related Case (${caseB?.complaint_no}) for cross-bureau coordination. Cases proceed independently with shared intelligence. ${reviewNotes ? `Notes: ${reviewNotes}` : ''}`,
            metadata: {
              relationship_type: 'RELATED_CASE',
              related_case_id: existing.related_complaint_id,
              related_complaint_no: caseB?.complaint_no,
              review_notes: reviewNotes,
            },
          },
          client,
        );
      }

      if (caseB) {
        await complaintRepo.updateComplaint(
          caseB.id,
          {
            disposition: caseB.disposition || 'INDEPENDENT',
            coordination_notes: reviewNotes || 'Linked as related case for multi-bureau coordination',
          },
          client,
        );

        await complaintRepo.insertAction(
          {
            complaint_id: caseB.id,
            action_type: ACTION_TYPES.OVERLAP_LINKED,
            performed_by: user.id,
            performed_by_bureau: user.bureau_id,
            remarks: `Confirmed as Related Case (${caseA?.complaint_no}) for cross-bureau coordination. Cases proceed independently with shared intelligence. ${reviewNotes ? `Notes: ${reviewNotes}` : ''}`,
            metadata: {
              relationship_type: 'RELATED_CASE',
              related_case_id: existing.complaint_id,
              related_complaint_no: caseA?.complaint_no,
              review_notes: reviewNotes,
            },
          },
          client,
        );
      }
    } else if (decision === 'DISMISSED') {
      // Clear duplicate disposition if it was previously set for this pair
      const caseA = await complaintRepo.findComplaintById(existing.complaint_id, user, client);
      const caseB = await complaintRepo.findComplaintById(existing.related_complaint_id, user, client);

      if (caseA && caseA.primary_complaint_id === existing.related_complaint_id) {
        await complaintRepo.updateComplaint(caseA.id, { disposition: null, primary_complaint_id: null }, client);
      }
      if (caseB && caseB.primary_complaint_id === existing.complaint_id) {
        await complaintRepo.updateComplaint(caseB.id, { disposition: null, primary_complaint_id: null }, client);
      }

      // Check remaining active links to clear has_overlap if needed
      const linksA = await repo.findLinksByComplaintId(existing.complaint_id, client);
      const activeA = linksA.filter((l) => l.id !== linkId && l.review_status !== 'DISMISSED');
      if (activeA.length === 0 && caseA) {
        await complaintRepo.updateComplaint(existing.complaint_id, { has_overlap: false }, client);
      }

      const linksB = await repo.findLinksByComplaintId(existing.related_complaint_id, client);
      const activeB = linksB.filter((l) => l.id !== linkId && l.review_status !== 'DISMISSED');
      if (activeB.length === 0 && caseB) {
        await complaintRepo.updateComplaint(existing.related_complaint_id, { has_overlap: false }, client);
      }

      // Record chronological rejected match action
      if (caseA) {
        await complaintRepo.insertAction(
          {
            complaint_id: caseA.id,
            action_type: ACTION_TYPES.OVERLAP_LINKED,
            performed_by: user.id,
            performed_by_bureau: user.bureau_id,
            remarks: `Overlap review: Candidate match dismissed as UNRELATED (false positive rejected). Cases proceed independently. ${reviewNotes ? `Notes: ${reviewNotes}` : ''}`,
            metadata: {
              relationship_type: 'UNRELATED',
              dismissed_against_id: existing.related_complaint_id,
              review_notes: reviewNotes,
            },
          },
          client,
        );
      }
    }

    // Update the link & case_relationships
    const updated = await repo.updateLinkReview(
      linkId,
      {
        review_status: decision,
        link: linkType,
        relationship_type: relationshipType,
        primary_case_id: primaryCase?.id || null,
        coordination_decision: coordinationDecision || (decision === 'CONFIRMED' ? 'COORDINATION_AGREED' : 'DISMISSED_FALSE_POSITIVE'),
        coordination_notes: reviewNotes,
        reviewed_by: user.id,
      },
      client,
    );

    return updated;
  });
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

/**
 * Get active learning calibration and evaluation stats based on reviewed examples.
 */
export async function getCalibrationStats() {
  return repo.getCalibrationStats();
}

/**
 * Recalibrate model on reviewed human decisions.
 */
export async function recalibrateModel(user) {
  return repo.recalibrateModel(user?.id);
}
