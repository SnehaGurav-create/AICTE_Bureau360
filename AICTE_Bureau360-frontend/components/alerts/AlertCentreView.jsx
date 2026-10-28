'use client';

import React, { useState } from 'react';
import styles from '../../app/dashboard.module.css';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { BellIcon, AlertTriangleIcon, ClockIcon, ShieldIcon, CheckCircleIcon } from '../icons/Icons';
import { COMPLAINT_CASES, ALERT_CENTRE_ITEMS } from '../../data/mockData';

export function AlertCentreView({ onInspectCase }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  const overdueCases = COMPLAINT_CASES.filter((c) => c.status === 'Overdue' || c.ageingDays > 30);
  const criticalCases = COMPLAINT_CASES.filter((c) => c.priority === 'Critical');
  const newCases = COMPLAINT_CASES.filter((c) => c.ageingDays <= 3);
  const overlapCases = COMPLAINT_CASES.filter((c) => c.hasOverlap);

  const handleAcknowledge = (id) => {
    setAcknowledgedAlerts((prev) => [...prev, id]);
    setToastMessage(`Alert ${id} acknowledged and logged in session audit trail.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {toastMessage && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', color: '#166534', fontSize: '0.8125rem' }}>
          ✓ {toastMessage}
        </div>
      )}

      {/* Alert Ribbon */}
      <div className={styles.summaryGrid}>
        <div
          className={styles.summaryCard}
          style={{ borderTopColor: '#dc2626', cursor: 'pointer' }}
          onClick={() => setActiveFilter('overdue')}
        >
          <div className={styles.summaryLabel}>
            <span>Overdue SLA Breaches</span>
            <AlertTriangleIcon size={18} />
          </div>
          <div className={styles.summaryValue} style={{ color: '#dc2626' }}>{overdueCases.length}</div>
          <div className={styles.summaryFooter}>Cases exceeding 30-day statutory window</div>
        </div>

        <div
          className={styles.summaryCard}
          style={{ borderTopColor: '#b91c1c', cursor: 'pointer' }}
          onClick={() => setActiveFilter('critical')}
        >
          <div className={styles.summaryLabel}>
            <span>Critical Escalations</span>
            <ShieldIcon size={18} />
          </div>
          <div className={styles.summaryValue} style={{ color: '#b91c1c' }}>{criticalCases.length}</div>
          <div className={styles.summaryFooter}>Assigned to Vigilance or Apex Committee</div>
        </div>

        <div
          className={styles.summaryCard}
          style={{ borderTopColor: '#f59e0b', cursor: 'pointer' }}
          onClick={() => setActiveFilter('new')}
        >
          <div className={styles.summaryLabel}>
            <span>New Intake (&lt;72 Hours)</span>
            <ClockIcon size={18} />
          </div>
          <div className={styles.summaryValue} style={{ color: '#f59e0b' }}>{newCases.length}</div>
          <div className={styles.summaryFooter}>Preliminary triage required</div>
        </div>

        <div
          className={styles.summaryCard}
          style={{ borderTopColor: '#7c3aed', cursor: 'pointer' }}
          onClick={() => setActiveFilter('overlap')}
        >
          <div className={styles.summaryLabel}>
            <span>Overlap Inquiries</span>
            <BellIcon size={18} />
          </div>
          <div className={styles.summaryValue} style={{ color: '#7c3aed' }}>{overlapCases.length}</div>
          <div className={styles.summaryFooter}>Multi-bureau coordination required</div>
        </div>
      </div>

      {/* Alert Centre Notice Board */}
      <Card>
        <CardHeader
          title="Executive Alert Centre & Triage Feed"
          subtitle="Real-time notifications of statutory deadlines, multi-cell correlation, and urgent filings"
          action={
            activeFilter !== 'ALL' && (
              <Button variant="outline" size="sm" onClick={() => setActiveFilter('ALL')}>
                Show All Alerts
              </Button>
            )
          }
        />
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 1. Overdue Alerts */}
            {(activeFilter === 'ALL' || activeFilter === 'overdue') &&
              overdueCases.map((c) => (
                <div
                  key={`overdue-${c.id}`}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fecaca',
                    backgroundColor: '#fef2f2',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangleIcon size={16} />
                      <strong style={{ color: '#991b1b' }}>SLA BREACH ALERT: {c.id}</strong>
                      <Badge variant="critical">{c.ageingDays} Days Open</Badge>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>
                      Exceeds 30d Limit by {c.ageingDays - 30} days
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{c.institutionName}</div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Category: {c.category} • Assigned: {c.assignedBureau}. Mandatory show-cause response deadline elapsed.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <Button variant="outline" size="sm" onClick={() => onInspectCase(c)}>
                      Inspect Case Dossier
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAcknowledge(c.id)}
                      disabled={acknowledgedAlerts.includes(c.id)}
                    >
                      {acknowledgedAlerts.includes(c.id) ? '✓ Acknowledged' : 'Acknowledge Notice'}
                    </Button>
                  </div>
                </div>
              ))}

            {/* 2. Critical Escalations */}
            {(activeFilter === 'ALL' || activeFilter === 'critical') &&
              criticalCases
                .filter((c) => !overdueCases.some((oc) => oc.id === c.id))
                .map((c) => (
                  <div
                    key={`crit-${c.id}`}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #fed7aa',
                      backgroundColor: '#fff7ed',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldIcon size={16} />
                        <strong style={{ color: '#9a3412' }}>CRITICAL PRIORITY: {c.id}</strong>
                        <Badge variant="critical">Critical</Badge>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Assigned to {c.assignedBureau}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{c.institutionName}</div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{c.summary}</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <Button variant="outline" size="sm" onClick={() => onInspectCase(c)}>
                        Inspect Dossier
                      </Button>
                    </div>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
