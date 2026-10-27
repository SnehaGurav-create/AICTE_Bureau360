'use client';

import React, { useState } from 'react';
import styles from './complaint.module.css';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import {
  ShieldIcon,
  AlertTriangleIcon,
  BuildingIcon,
  ClockIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
} from '../icons/Icons';
import { OVERLAP_STATUS_LABELS, COMPLAINT_CASES } from '../../data/mockData';
import { useAuth } from '../../services/authContext.js';
import { ACTIONS } from '../../services/authConfig.js';

export function ComplaintDetailView({ complaint, onBack, onSelectRelatedCase, onSelectInstitution }) {
  const { can } = useAuth();
  const canUpdateStatus = can(ACTIONS.UPDATE_STATUS);
  const canEdit = can(ACTIONS.EDIT_COMPLAINT);
  if (!complaint) {
    return (
      <div className={styles.detailContainer}>
        <button type="button" onClick={onBack} className={styles.backBtn}>
          ← Back to Complaints Dashboard
        </button>
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
          <h3>Complaint Not Found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            The requested case identifier does not exist in the demonstration repository.
          </p>
        </div>
      </div>
    );
  }

  // Interactive local state for testing overlap review transitions
  const [currentOverlapStatus, setCurrentOverlapStatus] = useState(
    complaint.overlapReview?.status || 'suggested'
  );
  const [reviewerRemarks, setReviewerRemarks] = useState(
    complaint.overlapReview?.reviewerNotes || ''
  );
  const [statusUpdatedNotice, setStatusUpdatedNotice] = useState(false);
  const [backendActionNotice, setBackendActionNotice] = useState('');

  const activeOverlapMeta = OVERLAP_STATUS_LABELS[currentOverlapStatus] || OVERLAP_STATUS_LABELS.suggested;

  const handleUpdateOverlapStatus = (newStatus) => {
    setCurrentOverlapStatus(newStatus);
    setStatusUpdatedNotice(true);
    setTimeout(() => setStatusUpdatedNotice(false), 3000);
  };

  const handleTriggerBackendAction = (actionName, endpoint) => {
    setBackendActionNotice(`Action "${actionName}" is pending backend integration. Target endpoint "${endpoint}" is not connected in the frontend demonstration build.`);
    setTimeout(() => setBackendActionNotice(''), 5000);
  };

  // Find related case objects
  const relatedCases = (complaint.relatedCaseIds || [])
    .map((id) => COMPLAINT_CASES.find((c) => c.id === id))
    .filter(Boolean);

  // Sorting timeline chronologically (earliest to latest)
  const sortedTimeline = [...(complaint.timeline || [])].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  return (
    <div className={styles.detailContainer}>
      {/* 1. Header & Context-Preserving Back Bar */}
      <div className={styles.backBar}>
        <button type="button" onClick={onBack} className={styles.backBtn}>
          ← Back to Complaints Dashboard
        </button>
        <span className={styles.backendNoticeBadge}>
          Mode: Demonstration Dataset • SIH PS 26264
        </span>
      </div>

      {backendActionNotice && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            color: '#1e40af',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          role="status"
        >
          <AlertCircleIcon size={16} />
          <span>{backendActionNotice}</span>
        </div>
      )}

      {/* 2. Main Title & Key Status Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTopRow}>
          <div className={styles.caseIdTitleGroup}>
            <span className={styles.caseIdBadge}>{complaint.id}</span>
            <h1 className={styles.caseMainTitle}>{complaint.title}</h1>
          </div>
          <div className={styles.badgeRow}>
            <Badge variant={complaint.priority === 'Critical' ? 'critical' : complaint.priority === 'High' ? 'warning' : 'neutral'} dot>
              {complaint.priority} Priority
            </Badge>
            <Badge variant={complaint.status === 'Resolved' ? 'success' : complaint.status === 'Overdue' ? 'critical' : 'info'}>
              {complaint.status}
            </Badge>
            <Badge variant={complaint.ageingDays > 30 ? 'critical' : complaint.ageingDays >= 21 ? 'warning' : 'neutral'}>
              <ClockIcon size={12} /> {complaint.ageingDays} Days Open
            </Badge>
          </div>
        </div>

        {/* Overview Parameters Grid */}
        <div className={styles.overviewGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Target Institution</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span className={styles.infoValue}>{complaint.institutionName}</span>
              {onSelectInstitution && (
                <button
                  type="button"
                  onClick={onSelectInstitution}
                  style={{
                    fontSize: '0.6875rem',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface-secondary)',
                    color: 'var(--color-brand-primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  View 360° Profile ↗
                </button>
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              AICTE PID: {complaint.institutionId} • {complaint.district}, {complaint.state}
            </span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Allegation Category</span>
            <span className={styles.infoValue}>{complaint.category}</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Assigned AICTE Bureau/Cell</span>
            <span className={styles.infoValue}>{complaint.assignedBureau}</span>
            {complaint.secondaryBureaus?.length > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Secondary: {complaint.secondaryBureaus.join(', ')}
              </span>
            )}
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Intake Source</span>
            <span className={styles.infoValue}>{complaint.source}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Received: {complaint.receivedDate} • Last Updated: {complaint.lastUpdatedDate}
            </span>
          </div>
        </div>

        <div>
          <span className={styles.infoLabel}>Official Grievance Particulars</span>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
            {complaint.description || complaint.summary}
          </p>
        </div>

        {/* Backend Pending Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '8px' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleTriggerBackendAction('Issue Show-Cause Notice', 'POST /api/v1/cases/notice')}
          >
            Dispatch Show-Cause Notice (API Pending)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTriggerBackendAction('Transfer Bureau Jurisdiction', 'POST /api/v1/cases/transfer')}
          >
            Transfer Bureau (API Pending)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTriggerBackendAction('Record Official Ruling', 'POST /api/v1/cases/ruling')}
          >
            Record Formal Ruling (API Pending)
          </Button>
        </div>
      </div>

      {/* 3. Complainant Details (Permitted vs. Protected) */}
      <Card>
        <CardHeader
          title="Complainant Disclosure Profile"
          subtitle="Display governed under AICTE Whistleblower & Vigilance Protection Directive 2024"
        />
        <CardContent>
          {complaint.complainant?.isPermitted ? (
            <div className={styles.permittedCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 700, fontSize: '0.875rem' }}>
                <CheckCircleIcon size={16} />
                Complainant Identity Permitted for Official Coordination
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '6px' }}>
                <div>
                  <span className={styles.infoLabel}>Complainant Name</span>
                  <div style={{ fontWeight: 600 }}>{complaint.complainant.name || 'Not Specified'}</div>
                </div>
                <div>
                  <span className={styles.infoLabel}>Designation / Role</span>
                  <div style={{ fontWeight: 600 }}>{complaint.complainant.designation || 'Not Specified'}</div>
                </div>
                <div>
                  <span className={styles.infoLabel}>Organization / Body</span>
                  <div style={{ fontWeight: 600 }}>{complaint.complainant.organization || 'Not Specified'}</div>
                </div>
                <div>
                  <span className={styles.infoLabel}>Verified Contact</span>
                  <div style={{ fontWeight: 600 }}>{complaint.complainant.contact || 'Not Specified'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.confidentialCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-brand-primary)', fontWeight: 700, fontSize: '0.875rem' }}>
                <ShieldIcon size={16} />
                Complainant Identity Confidential / Whistleblower Protection
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {complaint.complainant?.redactionReason ||
                  'Complainant registered anonymously under AICTE Whistleblower Protection. Personal contact details are withheld to prevent academic or professional retribution.'}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Direct contact details and personal identifiers are withheld from institutional display to prevent academic or professional retribution.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Overlap-Review Section (4-Tier Distinction) */}
      <div
        className={`${styles.overlapPanel} ${
          currentOverlapStatus === 'suggested'
            ? styles.overlapPanelSuggested
            : currentOverlapStatus === 'awaiting_review'
            ? styles.overlapPanelAwaiting
            : currentOverlapStatus === 'confirmed'
            ? styles.overlapPanelConfirmed
            : styles.overlapPanelRejected
        }`}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: activeOverlapMeta.color }}>
              Cross-Bureau Relationship & Overlap Review
            </span>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-brand-primary)', marginTop: '2px' }}>
              Multi-Bureau Relationship Status: {activeOverlapMeta.label}
            </h3>
          </div>
          <Badge variant={activeOverlapMeta.badgeVariant}>
            {activeOverlapMeta.label}
          </Badge>
        </div>

        {/* Mandatory Advisory Notice */}
        <div className={styles.advisoryNote}>
          <AlertCircleIcon size={18} />
          <div>
            <strong>Advisory Notice:</strong> Suspected relationships and overlap flags are suggestions for human evaluation. They are neither automated decisions nor confirmed duplicates until verified by an authorized reviewer.
          </div>
        </div>

        {/* Basis and Particulars */}
        <div style={{ backgroundColor: 'var(--bg-surface-secondary)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
          <span className={styles.infoLabel}>Basis of Flagging / Relationship Summary</span>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {complaint.overlapReview?.reason || 'No automated overlap flag registered for this complaint docket.'}
          </p>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Reviewer Remarks: <em>{reviewerRemarks || 'Pending reviewer entry'}</em>
          </div>
        </div>

        {/* 4-Tier Interactive Status Selector */}
        <div>
          <span className={styles.infoLabel}>Authorized Reviewer Classification</span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Select the verified relationship tier to update this case's cross-bureau status:
          </p>

          <div className={styles.statusSelectorRow}>
            <button
              type="button"
              disabled={!canUpdateStatus}
              className={`${styles.statusRadioBtn} ${currentOverlapStatus === 'suggested' ? styles.statusRadioActive : ''}`}
              onClick={() => handleUpdateOverlapStatus('suggested')}
              style={!canUpdateStatus ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              title={!canUpdateStatus ? 'Read-only mode: Cannot modify relationship tier' : undefined}
            >
              1. Possible Relationship Suggested
            </button>

            <button
              type="button"
              disabled={!canUpdateStatus}
              className={`${styles.statusRadioBtn} ${currentOverlapStatus === 'awaiting_review' ? styles.statusRadioActive : ''}`}
              onClick={() => handleUpdateOverlapStatus('awaiting_review')}
              style={!canUpdateStatus ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              title={!canUpdateStatus ? 'Read-only mode: Cannot modify relationship tier' : undefined}
            >
              2. Awaiting Human Review
            </button>

            <button
              type="button"
              disabled={!canUpdateStatus}
              className={`${styles.statusRadioBtn} ${currentOverlapStatus === 'confirmed' ? styles.statusRadioActive : ''}`}
              onClick={() => handleUpdateOverlapStatus('confirmed')}
              style={!canUpdateStatus ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              title={!canUpdateStatus ? 'Read-only mode: Cannot modify relationship tier' : undefined}
            >
              3. Relationship Confirmed by Reviewer
            </button>

            <button
              type="button"
              disabled={!canUpdateStatus}
              className={`${styles.statusRadioBtn} ${currentOverlapStatus === 'rejected' ? styles.statusRadioActive : ''}`}
              onClick={() => handleUpdateOverlapStatus('rejected')}
              style={!canUpdateStatus ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              title={!canUpdateStatus ? 'Read-only mode: Cannot modify relationship tier' : undefined}
            >
              4. Relationship Rejected by Reviewer
            </button>
          </div>

          {!canUpdateStatus && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              🔒 Read-only access: Relationship classification controls are disabled for Viewer role.
            </div>
          )}

          {statusUpdatedNotice && (
            <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '4px' }}>
              ✓ Relationship status updated to "{activeOverlapMeta.label}" in demonstration session.
            </div>
          )}
        </div>
      </div>

      {/* 5. Chronological Action Timeline & Transfer History */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Timeline */}
        <Card>
          <CardHeader
            title="Chronological Action Timeline"
            subtitle="Ordered progression of administrative events"
          />
          <CardContent>
            {sortedTimeline.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No subsequent timeline entries recorded post intake.
              </div>
            ) : (
              <div className={styles.timelineWrapper}>
                {sortedTimeline.map((item, idx) => (
                  <div key={item.id || idx} className={styles.timelineEvent}>
                    <div className={styles.timelineEventDot} />
                    <span className={styles.timelineDate}>{item.date}</span>
                    <span className={styles.timelineStage}>{item.stage}</span>
                    <span className={styles.timelineMeta}>
                      {item.bureau} • <em>{item.officer}</em>
                    </span>
                    {item.notes && <p className={styles.timelineNotes}>{item.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transfer History */}
        <Card>
          <CardHeader
            title="Bureau Transfer History"
            subtitle="Previous and current cell assignments"
          />
          <CardContent>
            {(!complaint.transferHistory || complaint.transferHistory.length === 0) ? (
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                <CheckCircleIcon size={16} style={{ verticalAlign: 'text-bottom', marginRight: '6px', color: '#16a34a' }} />
                Retained under initial assignment ({complaint.assignedBureau}). No inter-bureau jurisdiction transfers logged.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {complaint.transferHistory.map((tr) => (
                  <div key={tr.id} className={styles.transferCard}>
                    <div className={styles.transferRoute}>
                      <span>{tr.fromBureau}</span>
                      <span>→</span>
                      <span style={{ color: 'var(--color-brand-accent)' }}>{tr.toBureau}</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <strong>Transfer Reason:</strong> {tr.reason}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Authorized By: {tr.authorizedBy} • Date: {tr.date}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Case Ageing Summary Box */}
            <div style={{ marginTop: 'var(--space-4)', padding: '14px', borderTop: '1px solid var(--border-subtle)' }}>
              <span className={styles.infoLabel}>Case Ageing & SLA Metrics</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span style={{ fontSize: '0.875rem' }}>Total Duration Open:</span>
                <strong style={{ fontSize: '1rem', color: complaint.ageingDays > 30 ? '#dc2626' : 'var(--text-primary)' }}>
                  {complaint.ageingDays} Days
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Statutory AICTE Target:</span>
                <span>30 Days Maximum</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 6. Evidence Documents & Repository */}
      <Card>
        <CardHeader
          title="Evidence & Document Repository"
          subtitle="Submitted affidavits, photo logs, and institutional circulars"
          action={
            canEdit ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTriggerBackendAction('Upload Supporting Evidence', 'POST /api/v1/cases/documents')}
              >
                + Upload Document (API Pending)
              </Button>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                🔒 Read-Only Dossier
              </span>
            )
          }
        />
        <CardContent>
          {(!complaint.evidenceDocuments || complaint.evidenceDocuments.length === 0) ? (
            <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center' }}>
              No documentary attachments submitted with this petition.
            </div>
          ) : (
            <div className={styles.docGrid}>
              {complaint.evidenceDocuments.map((doc) => (
                <div key={doc.id} className={styles.docCard}>
                  <div className={styles.docMeta}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileTextIcon size={16} />
                      <span className={styles.docName} title={doc.fileName}>
                        {doc.fileName}
                      </span>
                    </div>
                    <span className={styles.docSub}>
                      {doc.fileSize} • Uploaded {doc.uploadDate} by {doc.uploader}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTriggerBackendAction(`Download ${doc.fileName}`, `GET /api/v1/documents/${doc.id}`)}
                    title="Download document (Backend pending)"
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. Related Complaints Links */}
      <Card>
        <CardHeader
          title="Related Complaints & Cross-Referenced Dockets"
          subtitle="Cases involving identical institutions or correlated allegations"
        />
        <CardContent>
          {relatedCases.length === 0 ? (
            <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              No related complaint dockets currently linked to this institution.
            </div>
          ) : (
            <div className={styles.relatedGrid}>
              {relatedCases.map((rc) => (
                <div
                  key={rc.id}
                  className={styles.relatedCard}
                  onClick={() => onSelectRelatedCase?.(rc.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelectRelatedCase?.(rc.id);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-brand-primary)' }}>{rc.id}</span>
                    <Badge variant={rc.status === 'Resolved' ? 'success' : rc.status === 'Overdue' ? 'critical' : 'info'}>
                      {rc.status}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{rc.institutionName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {rc.category} • {rc.assignedBureau}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-brand-accent)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View Cross-Referenced Dossier →
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
