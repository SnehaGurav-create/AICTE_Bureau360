'use client';

import React from 'react';
import styles from '../complaints/complaint.module.css';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { BuildingIcon, ShieldIcon, AlertTriangleIcon, ClockIcon } from '../icons/Icons';
import { COMPLAINT_CASES } from '../../data/mockData';

export function InstitutionProfileView({ institution, onBack, onInspectCase }) {
  if (!institution) return null;

  // Find all complaints involving this institution
  const associatedComplaints = COMPLAINT_CASES.filter(
    (c) => c.institutionId === institution.id || institution.associatedComplaintIds?.includes(c.id)
  );

  const hasMultipleOverlaps = associatedComplaints.length > 1;

  return (
    <div className={styles.detailContainer}>
      {/* Back Button */}
      <div className={styles.backBar}>
        <button type="button" onClick={onBack} className={styles.backBtn}>
          ← Back to Institution Directory
        </button>
        <Badge variant={institution.riskLevel.includes('High Risk') ? 'critical' : 'info'}>
          {institution.riskLevel}
        </Badge>
      </div>

      {/* Main Institution Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTopRow}>
          <div className={styles.caseIdTitleGroup}>
            <span className={styles.caseIdBadge}>AICTE Permanent ID: {institution.id}</span>
            <h1 className={styles.caseMainTitle}>{institution.name}</h1>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {institution.type} • Established {institution.establishedYear} • {institution.region}
            </span>
          </div>
          <div className={styles.badgeRow}>
            <Badge variant={institution.approvalStatus.includes('Approved') ? 'success' : 'critical'}>
              {institution.approvalStatus}
            </Badge>
            <Badge variant="neutral">{institution.accreditation}</Badge>
          </div>
        </div>

        {/* Institution Overview Details Grid */}
        <div className={styles.overviewGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Campus Location</span>
            <span className={styles.infoValue}>{institution.district}, {institution.state}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{institution.address}</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Head of Institution</span>
            <span className={styles.infoValue}>{institution.principalName}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Principal / Director</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Official Contact</span>
            <span className={styles.infoValue}>{institution.contactEmail}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone: {institution.phone}</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Approved Intake</span>
            <span className={styles.infoValue}>{institution.approvedIntake} Seats</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Academic Cycle 2026-27</span>
          </div>
        </div>

        {/* Multi-Bureau Overlap Risk Notification */}
        {hasMultipleOverlaps && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              color: '#991b1b',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertTriangleIcon size={18} />
            <div>
              <strong>Institutional Overlap Alert:</strong> This college has {associatedComplaints.length} concurrent complaint dockets registered across multiple AICTE bureaus/cells. Cross-bureau joint hearing recommended.
            </div>
          </div>
        )}
      </div>

      {/* Associated Complaints Section */}
      <Card>
        <CardHeader
          title={`Associated Grievance Dockets (${associatedComplaints.length})`}
          subtitle="Cumulative complaint history filed across AICTE Bureaus and Cells"
        />
        <CardContent>
          {associatedComplaints.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active or historical complaint dockets on file for this institution.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {associatedComplaints.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '14px 18px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: 'var(--color-brand-primary)' }}>{c.id}</strong>
                      <Badge variant={c.priority === 'Critical' ? 'critical' : c.priority === 'High' ? 'warning' : 'neutral'} dot>
                        {c.priority}
                      </Badge>
                      <Badge variant={c.status === 'Resolved' ? 'success' : c.status === 'Overdue' ? 'critical' : 'info'}>
                        {c.status}
                      </Badge>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Received: {c.receivedDate} • Ageing: <strong>{c.ageingDays}d</strong>
                      </span>
                      <Button variant="outline" size="sm" onClick={() => onInspectCase(c)}>
                        Inspect Dossier
                      </Button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{c.title || c.category}</div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {c.summary}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Primary Cell: <strong>{c.assignedBureau}</strong> {c.secondaryBureaus?.length > 0 && `(Secondary: ${c.secondaryBureaus.join(', ')})`}
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
