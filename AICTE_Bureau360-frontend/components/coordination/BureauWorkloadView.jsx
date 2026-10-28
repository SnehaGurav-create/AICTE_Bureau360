'use client';

import React, { useState } from 'react';
import styles from '../../app/dashboard.module.css';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ShieldIcon, NetworkIcon, ClockIcon, AlertTriangleIcon, CheckCircleIcon } from '../icons/Icons';
import { BUREAUS, COMPLAINT_CASES } from '../../data/mockData';
import { useAuth } from '../../services/authContext.js';
import { ACTIONS } from '../../services/authConfig.js';
import { AnimatedCounter } from '../ui/AnimatedCounter';

export function BureauWorkloadView({ onInspectCase }) {
  const { can } = useAuth();
  const canCoordinate = can(ACTIONS.ASSIGN_COMPLAINT) || can(ACTIONS.TRANSFER_COMPLAINT);

  const [selectedBureauId, setSelectedBureauId] = useState('all');
  const [backendActionNotice, setBackendActionNotice] = useState('');

  // Find cases potentially involving multiple bureaus
  const multiBureauCases = COMPLAINT_CASES.filter(
    (c) => c.secondaryBureaus && c.secondaryBureaus.length > 0
  );

  // Derive bureau workload statistics
  const bureauStats = BUREAUS.filter((b) => b.id !== 'all').map((bureau) => {
    const assignedCases = COMPLAINT_CASES.filter((c) => c.assignedBureau === bureau.name);
    const active = assignedCases.filter((c) => c.status === 'Under Review' || c.status === 'Pending').length;
    const resolved = assignedCases.filter((c) => c.status === 'Resolved').length;
    const overdue = assignedCases.filter((c) => c.status === 'Overdue' || c.ageingDays > 30).length;
    const multiCount = assignedCases.filter((c) => c.secondaryBureaus?.length > 0).length;

    return {
      ...bureau,
      totalAssigned: assignedCases.length,
      active,
      resolved,
      overdue,
      multiCount,
      slaRate: assignedCases.length > 0 ? Math.round(((assignedCases.length - overdue) / assignedCases.length) * 100) : 100,
    };
  });

  const handleScheduleJointHearing = (caseId) => {
    if (!canCoordinate) return;
    setBackendActionNotice(`Joint hearing scheduling for docket ${caseId} is pending backend integration (POST /api/v1/coordination/schedule-hearing).`);
    setTimeout(() => setBackendActionNotice(''), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Backend Action Toast */}
      {backendActionNotice && (
        <div style={{ padding: '12px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', color: '#1e40af', fontSize: '0.8125rem' }}>
          ℹ️ {backendActionNotice}
        </div>
      )}

      {/* Header Banner */}
      <div className={styles.filterToolbar}>
        <div className={styles.filterHeading}>
          <NetworkIcon size={18} />
          <span>AICTE Bureau Workload & Cross-Cell Coordination Engine</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Monitor individual cell caseloads, prevent siloed grievance investigations, and manage joint multi-bureau inquiries.
        </p>
      </div>

      {/* 1. Bureau Workload Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        {bureauStats.map((b) => (
          <div
            key={b.id}
            className={styles.summaryCard}
            style={{
              borderTopColor: b.color,
              cursor: 'pointer',
              backgroundColor: selectedBureauId === b.id ? 'var(--bg-surface-secondary)' : 'var(--bg-surface)',
              outline: selectedBureauId === b.id ? `2px solid ${b.color}` : 'none',
            }}
            onClick={() => setSelectedBureauId(selectedBureauId === b.id ? 'all' : b.id)}
          >
            <div className={styles.summaryLabel}>
              <span>{b.code} • {b.name}</span>
              <ShieldIcon size={16} />
            </div>
            <div className={styles.summaryValueGroup}>
              <span className={styles.summaryValue} style={{ color: b.color }}>
                <AnimatedCounter value={b.totalAssigned} delay={bureauStats.indexOf(b) * 80} duration={1000} /> Cases
              </span>
              <Badge variant={b.overdue > 0 ? 'critical' : 'success'}>
                <AnimatedCounter value={b.slaRate} suffix="% SLA" delay={bureauStats.indexOf(b) * 80 + 40} duration={900} />
              </Badge>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
              <div>Active Inquiries: <strong><AnimatedCounter value={b.active} delay={100} duration={900} /></strong></div>
              <div>Joint Cell Cases: <strong><AnimatedCounter value={b.multiCount} delay={150} duration={900} /></strong></div>
              <div>Overdue SLA: <strong style={{ color: b.overdue > 0 ? '#dc2626' : 'inherit' }}><AnimatedCounter value={b.overdue} delay={200} duration={900} /></strong></div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Multi-Bureau Coordination Queue */}
      <Card>
        <CardHeader
          title={`Inter-Bureau Coordination Docket (${multiBureauCases.length} Joint Cases)`}
          subtitle="Complaints requiring coordinated evaluation across two or more AICTE cells"
          action={
            <Badge variant="warning">
              {multiBureauCases.length} Active Cross-Cell Inquiries
            </Badge>
          }
        />
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {multiBureauCases.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                  <div>
                    <strong style={{ color: 'var(--color-brand-primary)' }}>{c.id}</strong> — {c.institutionName}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      PID: {c.institutionId} • {c.district}, {c.state} • Category: <strong>{c.category}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Badge variant={c.priority === 'Critical' ? 'critical' : 'warning'}>{c.priority}</Badge>
                    <Badge variant="info">{c.status}</Badge>
                  </div>
                </div>

                {/* Bureaus Coordination Path */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '6px 0' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Cells Involved:</span>
                  <Badge variant="neutral">Lead: {c.assignedBureau}</Badge>
                  <span>↔</span>
                  {c.secondaryBureaus.map((sb) => (
                    <Badge key={sb} variant="overlap">Co-Assigned: {sb}</Badge>
                  ))}
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {c.summary}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <Button variant="outline" size="sm" onClick={() => onInspectCase(c)}>
                    Inspect Full Dossier
                  </Button>
                  {canCoordinate && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleScheduleJointHearing(c.id)}
                    >
                      Schedule Joint Cell Hearing (API Pending)
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
