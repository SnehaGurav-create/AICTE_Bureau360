'use client';

import React, { useState } from 'react';
import styles from '../../app/dashboard.module.css';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  AlertTriangleIcon,
  NetworkIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  FileTextIcon,
  ClockIcon,
  BuildingIcon,
} from '../icons/Icons';
import { OVERLAP_COMPARISONS, OVERLAP_STATUS_LABELS, COMPLAINT_CASES } from '../../data/mockData';
import { ComplaintRelationshipGraph } from '../graph/ComplaintRelationshipGraph';
import { useAuth } from '../../services/authContext.js';
import { ACTIONS } from '../../services/authConfig.js';

export function OverlapReviewQueue({ onInspectCase }) {
  const { can, currentUser } = useAuth();
  const canUpdateStatus = can(ACTIONS.UPDATE_STATUS);

  const [activeView, setActiveView] = useState('queue'); // 'queue' | 'graph'
  const [tierFilter, setTierFilter] = useState('ALL');
  const [comparisons, setComparisons] = useState(OVERLAP_COMPARISONS);
  const [notificationMsg, setNotificationMsg] = useState('');
  
  // State for Decision & Remark Modal
  const [selectedCaseForReview, setSelectedCaseForReview] = useState(null);
  const [decisionType, setDecisionType] = useState('confirmed_related');
  const [reviewRemark, setReviewRemark] = useState('');
  const [coordinationBureau, setCoordinationBureau] = useState('PGRC');

  const openReviewModal = (item, defaultType = 'confirmed_related') => {
    setSelectedCaseForReview(item);
    setDecisionType(defaultType);
    setReviewRemark(
      defaultType === 'confirmed_duplicate'
        ? 'Verified: Identical grievance petition submitted across bureaus. Merging for unified investigation.'
        : defaultType === 'coordination_requested'
        ? `Requesting joint inquiry with ${item.secondaryBureau} regarding institutional compliance.`
        : defaultType === 'related_distinct'
        ? 'Cases share institutional nexus but address distinct substantive grievances. Proceed in parallel.'
        : 'Confirmed related cases: Authorizing joint review and coordinated regulatory notices.'
    );
  };

  const submitReviewDecision = () => {
    if (!selectedCaseForReview) return;
    if (!canUpdateStatus) {
      setNotificationMsg('Action restricted: Read-only access for current role.');
      setTimeout(() => setNotificationMsg(''), 4000);
      return;
    }

    const updatedStatus = decisionType === 'rejected' ? 'rejected' : decisionType;
    setComparisons((prev) =>
      prev.map((c) =>
        c.id === selectedCaseForReview.id
          ? {
              ...c,
              status: updatedStatus,
              notes: `${reviewRemark} (Reviewed by ${currentUser?.name || 'Reviewer'} on ${new Date().toLocaleDateString()})`,
            }
          : c
      )
    );

    const actionLabel = OVERLAP_STATUS_LABELS[updatedStatus]?.label || 'Decision Recorded';
    setNotificationMsg(`✓ Decision permanently recorded in audit history: "${actionLabel}"`);
    setSelectedCaseForReview(null);
    setTimeout(() => setNotificationMsg(''), 5000);
  };

  const filteredComparisons = comparisons.filter((c) => {
    if (tierFilter === 'ALL') return true;
    if (tierFilter === 'pending') return c.status === 'suggested' || c.status === 'awaiting_review';
    return c.status === tierFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Toast Notification */}
      {notificationMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', color: '#166534', fontSize: '0.8125rem', fontWeight: 600 }}>
          {notificationMsg}
        </div>
      )}

      {/* Header and View Switcher */}
      <div className={styles.filterToolbar}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
          <div>
            <div className={styles.filterHeading}>
              <AlertTriangleIcon size={18} />
              <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                Overlap Review Centre — Cross-Bureau Deduplication & Coordination
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Side-by-side evaluation of suspected overlapping petitions. Human review is required before joint inquiries or deduplication.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant={activeView === 'queue' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveView('queue')}
            >
              Pairwise Review Queue ({comparisons.length})
            </Button>
            <Button
              variant={activeView === 'graph' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveView('graph')}
              icon={<NetworkIcon size={14} />}
            >
              Interactive Topology Graph
            </Button>
          </div>
        </div>
      </div>

      {/* Overlap Advisory Banner */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 'var(--radius-md)',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.8125rem',
        }}
        role="status"
      >
        <AlertTriangleIcon size={18} />
        <div>
          <strong>Signature Core Intelligence:</strong> The system automatically compares cases across <strong>Regulation Bureau (RB), PGRC, and other Bureaus/Cells</strong> using permanent institution IDs, normalized names, and ML semantic similarity. Authorized officers review the evidence below and record binding coordination decisions.
        </div>
      </div>

      {/* Graph Mode */}
      {activeView === 'graph' && (
        <ComplaintRelationshipGraph onInspectCase={onInspectCase} />
      )}

      {/* Queue Mode */}
      {activeView === 'queue' && (
        <>
          {/* Status Filter Bar */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
            <button
              type="button"
              className={`${styles.filterPill} ${tierFilter === 'ALL' ? styles.filterPillActive : ''}`}
              onClick={() => setTierFilter('ALL')}
            >
              All Dockets ({comparisons.length})
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${tierFilter === 'pending' ? styles.filterPillActive : ''}`}
              onClick={() => setTierFilter('pending')}
            >
              Needs Review ({comparisons.filter(c => c.status === 'suggested' || c.status === 'awaiting_review').length})
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${tierFilter === 'confirmed' || tierFilter === 'confirmed_duplicate' || tierFilter === 'confirmed_related' ? styles.filterPillActive : ''}`}
              onClick={() => setTierFilter('confirmed')}
            >
              Confirmed Links
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${tierFilter === 'coordination_requested' ? styles.filterPillActive : ''}`}
              onClick={() => setTierFilter('coordination_requested')}
            >
              Coordination Active
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${tierFilter === 'rejected' ? styles.filterPillActive : ''}`}
              onClick={() => setTierFilter('rejected')}
            >
              Rejected Matches
            </button>
          </div>

          {/* Comparison Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredComparisons.map((item) => {
              const statusMeta = OVERLAP_STATUS_LABELS[item.status] || OVERLAP_STATUS_LABELS.suggested;
              const primaryObj = COMPLAINT_CASES.find((c) => c.id === item.primaryCaseId);
              const secondaryObj = COMPLAINT_CASES.find((c) => c.id === item.secondaryCaseId);

              return (
                <Card key={item.id}>
                  <CardHeader
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>{item.institutionName}</span>
                        {item.caseCategoryTag && (
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: item.caseCategoryTag.includes('Case 1') ? '#fee2e2' : item.caseCategoryTag.includes('Case 2') ? '#e0f2fe' : item.caseCategoryTag.includes('Case 3') ? '#ede9fe' : '#fef3c7',
                            color: item.caseCategoryTag.includes('Case 1') ? '#991b1b' : item.caseCategoryTag.includes('Case 2') ? '#0369a1' : item.caseCategoryTag.includes('Case 3') ? '#6b21a8' : '#92400e',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            {item.caseCategoryTag}
                          </span>
                        )}
                      </div>
                    }
                    subtitle={`AICTE Permanent ID: ${item.institutionId} • Matching Engine: ${item.similarityAssessment}`}
                    action={<Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>}
                  />
                  <CardContent>
                    {/* Cross-Bureau Coordination Header Bar */}
                    <div style={{
                      padding: '10px 14px',
                      background: 'linear-gradient(90deg, #f0fdf4 0%, #eff6ff 100%)',
                      border: '1px solid #bfdbfe',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#1e3a8a', fontWeight: 600 }}>
                        <BuildingIcon size={16} />
                        <span>Institution: <strong>{item.institutionName}</strong> (ID: {item.institutionId})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#0369a1' }}>
                          Cross-Bureau Coordination:
                        </span>
                        <Badge variant="primary">{item.primaryBureau}</Badge>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>↔</span>
                        <Badge variant="warning">{item.secondaryBureau}</Badge>
                      </div>
                    </div>

                    {/* Side-by-Side Comparison Columns */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                      {/* Left: Primary Docket */}
                      <div style={{
                        padding: '16px',
                        background: 'var(--bg-surface-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-brand-primary)', fontSize: '0.9375rem' }}>
                            {item.primaryCaseId}
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Badge variant="neutral">{item.primaryBureau}</Badge>
                            <Badge variant={item.primaryStatus === 'Under process' ? 'info' : 'warning'}>
                              {item.primaryStatus || 'Under process'}
                            </Badge>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.primaryCategory || primaryObj?.category || 'Complaint Category'}
                        </div>

                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {item.primarySummary}
                        </p>

                        <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.primaryAssignment || 'Assigned: Nodal Officer • Last Action: Notice Issued • Next: Verification'}
                        </div>

                        <div style={{ paddingTop: '6px' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => primaryObj && onInspectCase(primaryObj)}
                          >
                            Inspect {item.primaryCaseId} Dossier
                          </Button>
                        </div>
                      </div>

                      {/* Right: Secondary Docket */}
                      <div style={{
                        padding: '16px',
                        background: 'var(--bg-surface-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-brand-primary)', fontSize: '0.9375rem' }}>
                            {item.secondaryCaseId}
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Badge variant="neutral">{item.secondaryBureau}</Badge>
                            <Badge variant={item.secondaryStatus === 'Pending' ? 'warning' : 'info'}>
                              {item.secondaryStatus || 'Pending'}
                            </Badge>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.secondaryCategory || secondaryObj?.category || 'Complaint Category'}
                        </div>

                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {item.secondarySummary}
                        </p>

                        <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.secondaryAssignment || 'Assigned: Grievance Officer • Last Action: Intake Logged • Next: Response Review'}
                        </div>

                        <div style={{ paddingTop: '6px' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => secondaryObj && onInspectCase(secondaryObj)}
                          >
                            Inspect {item.secondaryCaseId} Dossier
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Evidence Shown to the Reviewer (Dynamic Matching Breakdown) */}
                    <div style={{
                      marginTop: '16px',
                      padding: '14px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircleIcon size={15} color="#059669" />
                        <span>Evidence Shown to the Reviewer (Matching Engine Confidence Breakdown):</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.6 }}>
                        {item.evidenceItems ? (
                          item.evidenceItems.map((ev, idx) => <li key={idx}>{ev}</li>)
                        ) : (
                          <>
                            <li>Both cases reference the same verified institution (AICTE Permanent ID: <strong>{item.institutionId}</strong>).</li>
                            <li>Complaint categories and descriptions have similar content ({item.similarityAssessment}).</li>
                            <li>Different bureaus are handling the cases ({item.primaryBureau} and {item.secondaryBureau} — <strong>Coordination required</strong>).</li>
                            <li>Current assignments, last actions, and next steps are verified and visible to authorized reviewers.</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {/* System Policy & Statutory Action Protocol */}
                    {item.systemActionsDescription && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px 14px',
                        background: '#f1f5f9',
                        borderLeft: '4px solid var(--color-brand-primary)',
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                        fontSize: '0.75rem',
                        color: '#334155',
                        lineHeight: 1.5,
                      }}>
                        <strong>Statutory System Action Protocol:</strong> {item.systemActionsDescription}
                      </div>
                    )}

                    {/* Reviewer Action Bar */}
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        <strong>Audit Trail Status:</strong> {item.notes}
                      </div>

                      {canUpdateStatus ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openReviewModal(item, 'confirmed_related')}
                          >
                            Confirm Related Cases
                          </Button>
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => openReviewModal(item, 'confirmed_duplicate')}
                          >
                            Mark as Confirmed Duplicate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewModal(item, 'coordination_requested')}
                          >
                            Request Coordination
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openReviewModal(item, 'related_distinct')}
                          >
                            Related but Distinct
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewModal(item, 'rejected')}
                          >
                            Reject Suggested Match
                          </Button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          🔒 Read-only access: Adjudication decision actions restricted for current role
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Reviewer Decision & Remarks Modal */}
      {selectedCaseForReview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            maxWidth: '600px',
            width: '100%',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', background: 'var(--color-brand-primary)', color: '#ffffff' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                Record Overlap Review Decision & Audit Remarks
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', opacity: 0.9 }}>
                Case Correlation: {selectedCaseForReview.primaryCaseId} ({selectedCaseForReview.primaryBureau}) ↔ {selectedCaseForReview.secondaryCaseId} ({selectedCaseForReview.secondaryBureau})
              </p>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                  Adjudication Classification Decision:
                </label>
                <select
                  value={decisionType}
                  onChange={(e) => setDecisionType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="confirmed_related">Confirm Related Cases (Joint Inquiry Authorized)</option>
                  <option value="confirmed_duplicate">Mark as Confirmed Duplicate (Merge Dossiers)</option>
                  <option value="related_distinct">Mark as Related but Distinct Issues (Parallel Tracking)</option>
                  <option value="coordination_requested">Request Coordination from Another Bureau</option>
                  <option value="rejected">Reject Suggested Match (Dismiss False Positive)</option>
                </select>
              </div>

              {decisionType === 'coordination_requested' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                    Coordinate with Target Bureau/Cell:
                  </label>
                  <select
                    value={coordinationBureau}
                    onChange={(e) => setCoordinationBureau(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="Regulation Bureau">Regulation Bureau (RB)</option>
                    <option value="PGRC">Public Grievance Redressal Cell (PGRC)</option>
                    <option value="Approval Bureau">Approval Bureau</option>
                    <option value="Vigilance Cell">Vigilance & Inspection Cell</option>
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                  Review Remarks & Legal Rationale (Immutable Audit Log):
                </label>
                <textarea
                  value={reviewRemark}
                  onChange={(e) => setReviewRemark(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8125rem',
                    fontFamily: 'inherit',
                  }}
                  placeholder="Record formal reasons for relationship decision, joint hearing notice instructions, or reasons for duplicate dismissal..."
                />
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: '#f8fafc', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                ℹ️ This action will be signed by <strong>{currentUser?.name || 'Authorized Officer'}</strong> and permanently recorded in the AICTE Bureau360 immutable audit trail.
              </div>
            </div>

            <div style={{ padding: '12px 20px', background: 'var(--bg-surface-secondary)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="sm" onClick={() => setSelectedCaseForReview(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={submitReviewDecision}>
                Confirm & Record in Audit History
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
