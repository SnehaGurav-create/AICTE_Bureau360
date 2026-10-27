'use client';

import React, { useState } from 'react';
import styles from '../../app/dashboard.module.css';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AlertTriangleIcon, NetworkIcon, CheckCircleIcon, FilterIcon } from '../icons/Icons';
import { OVERLAP_COMPARISONS, OVERLAP_STATUS_LABELS, COMPLAINT_CASES } from '../../data/mockData';
import { ComplaintRelationshipGraph } from '../graph/ComplaintRelationshipGraph';
import { useAuth } from '../../services/authContext.js';
import { ACTIONS } from '../../services/authConfig.js';

export function OverlapReviewQueue({ onInspectCase }) {
  const { can } = useAuth();
  const canUpdateStatus = can(ACTIONS.UPDATE_STATUS);

  const [activeView, setActiveView] = useState('queue'); // 'queue' | 'graph'
  const [tierFilter, setTierFilter] = useState('ALL');
  const [comparisons, setComparisons] = useState(OVERLAP_COMPARISONS);
  const [notificationMsg, setNotificationMsg] = useState('');

  const handleUpdateStatus = (comparisonId, newStatus) => {
    if (!canUpdateStatus) {
      setNotificationMsg('Action restricted: Viewer role has read-only access and cannot update relationship status.');
      setTimeout(() => setNotificationMsg(''), 4000);
      return;
    }
    setComparisons((prev) =>
      prev.map((c) => (c.id === comparisonId ? { ...c, status: newStatus } : c))
    );
    setNotificationMsg(`Relationship classification updated to "${OVERLAP_STATUS_LABELS[newStatus]?.label}" in demo mode.`);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  const filteredComparisons = comparisons.filter((c) => {
    if (tierFilter !== 'ALL' && c.status !== tierFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Toast Notification */}
      {notificationMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', color: '#166534', fontSize: '0.8125rem' }}>
          ✓ {notificationMsg}
        </div>
      )}

      {/* Header and View Switcher */}
      <div className={styles.filterToolbar}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
          <div>
            <div className={styles.filterHeading}>
              <AlertTriangleIcon size={18} />
              <span>Cross-Bureau Overlap Review Queue & Relationship Analysis</span>
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
              Pairwise Review Queue
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

      {/* Overlap Advisory Banner: Explicitly clarifies suggestions are not confirmed relationships */}
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
          <strong>Human Review Mandatory:</strong> System-flagged overlaps represent potential correlations suggested for evaluation. <strong>Suggestions are not confirmed duplicates or cross-bureau linkages</strong> until explicitly verified and confirmed by an authorized reviewer.
        </div>
      </div>

      {/* If Graph Mode Selected */}
      {activeView === 'graph' && (
        <ComplaintRelationshipGraph onInspectCase={onInspectCase} />
      )}

      {/* If Queue Mode Selected */}
      {activeView === 'queue' && (
        <>
          {/* Tier Filters Bar */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by Status:</span>
            <button
              type="button"
              className={`${styles.filterPill} ${tierFilter === 'ALL' ? styles.filterPillActive : ''}`}
              onClick={() => setTierFilter('ALL')}
            >
              All Dockets ({comparisons.length})
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${tierFilter === 'suggested' ? styles.filterPillActive : ''}`}
              onClick={() => setTierFilter('suggested')}
            >
              Suggested for Review
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${tierFilter === 'awaiting_review' ? styles.filterPillActive : ''}`}
              onClick={() => setTierFilter('awaiting_review')}
            >
              Awaiting Human Review
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${tierFilter === 'confirmed' ? styles.filterPillActive : ''}`}
              onClick={() => setTierFilter('confirmed')}
            >
              Confirmed by Reviewer
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${tierFilter === 'rejected' ? styles.filterPillActive : ''}`}
              onClick={() => setTierFilter('rejected')}
            >
              Rejected
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
                    title={`${item.institutionName} — Correlation Dossier`}
                    subtitle={`PID: ${item.institutionId} • Similarity: ${item.similarityAssessment}`}
                    action={<Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>}
                  />
                  <CardContent>
                    {/* Advisory Banner */}
                    <div style={{ padding: '8px 12px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: '#581c87', marginBottom: '14px' }}>
                      <strong>Administrative Note:</strong> Both petitions involve {item.institutionName}. Compare particulars below to confirm whether matters warrant unified joint bureau adjudication or separate resolution.
                    </div>

                    {/* Side-by-Side Comparison Columns */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                      {/* Left: Primary Docket */}
                      <div style={{ padding: '14px', background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-brand-primary)' }}>
                            Docket 1: {item.primaryCaseId}
                          </span>
                          <Badge variant="neutral">{item.primaryBureau}</Badge>
                        </div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{primaryObj?.category || 'Category'}</div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {item.primarySummary}
                        </p>
                        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => primaryObj && onInspectCase(primaryObj)}
                          >
                            Inspect Docket 1 Dossier
                          </Button>
                        </div>
                      </div>

                      {/* Right: Secondary Docket */}
                      <div style={{ padding: '14px', background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-brand-primary)' }}>
                            Docket 2: {item.secondaryCaseId}
                          </span>
                          <Badge variant="neutral">{item.secondaryBureau}</Badge>
                        </div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{secondaryObj?.category || 'Category'}</div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {item.secondarySummary}
                        </p>
                        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => secondaryObj && onInspectCase(secondaryObj)}
                          >
                            Inspect Docket 2 Dossier
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Reviewer Action Bar */}
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        <strong>Current Findings:</strong> {item.notes}
                      </span>

                      {canUpdateStatus ? (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(item.id, 'awaiting_review')}
                          >
                            Mark Awaiting Review
                          </Button>
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => handleUpdateStatus(item.id, 'confirmed')}
                          >
                            Confirm Relationship
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(item.id, 'rejected')}
                          >
                            Reject False Positive
                          </Button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🔒 Read-only mode (Viewer): Relationship classification actions disabled
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
    </div>
  );
}
