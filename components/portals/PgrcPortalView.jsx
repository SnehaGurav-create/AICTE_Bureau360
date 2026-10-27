'use client';

import React from 'react';
import styles from '../../app/dashboard.module.css';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ShieldIcon, ExternalLinkIcon, ClockIcon, CheckCircleIcon, ArrowRightIcon } from '../icons/Icons';

export function PgrcPortalView({ onNavigateDashboard }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* 1. Header Banner */}
      <div className={styles.filterToolbar}>
        <div>
          <div className={styles.filterHeading}>
            <ExternalLinkIcon size={20} />
            <span>PGRC Portal</span>
            <Badge variant="warning">External Portal Docket</Badge>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Access and monitor grievance cases handled through the PGRC portal.
          </p>
        </div>
        <div>
          {onNavigateDashboard && (
            <Button variant="outline" size="sm" onClick={onNavigateDashboard}>
              ← Return to Dashboard
            </Button>
          )}
        </div>
      </div>

      {/* 2. Advisory Notice */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-md)',
          color: '#1e40af',
          fontSize: '0.8125rem',
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>ℹ️</span>
        <div>
          <strong>PGRC Portal Reference Note:</strong> This view establishes the institutional navigation route for the Public Grievance Redressal Cell (PGRC) portal. Live backend API synchronization for PGRC data is pending backend integration.
        </div>
      </div>

      {/* 3. Portal Overview Card */}
      <Card>
        <CardHeader
          title="Public Grievance Redressal Cell (PGRC) Overview"
          subtitle="Statutory framework for institutional student and faculty grievance escalation"
        />
        <CardContent>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-4)',
              marginTop: '4px',
            }}
          >
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldIcon size={18} />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-brand-primary)' }}>
                  Statutory Jurisdiction
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                Handles institutional representations, student petitions, and faculty grievances escalated pursuant to AICTE (Redressal of Grievance of Students) Regulations.
              </p>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ClockIcon size={18} />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#d97706' }}>
                  Processing Mandate
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                Standard SLA requires acknowledgement within 48 hours and hearing/disposition roadmap within 30 statutory days.
              </p>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircleIcon size={18} />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#059669' }}>
                  Central Integration Status
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                Portal route configured. Bureau360 intake docket is ready to ingest PGRC grievance batches upon backend endpoint release.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start' }}>
            {onNavigateDashboard && (
              <Button variant="primary" size="md" onClick={onNavigateDashboard}>
                Go to Central Command Dashboard →
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PgrcPortalView;
