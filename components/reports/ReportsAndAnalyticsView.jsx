'use client';

import React, { useState, useMemo } from 'react';
import styles from '../../app/dashboard.module.css';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  BarChartIcon,
  ShieldIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  FilterIcon,
} from '../icons/Icons';
import {
  COMPLAINT_CASES,
  BUREAUS,
  CATEGORIES,
  exportComplaintsToCSV,
} from '../../data/mockData';
import { useAuth } from '../../services/authContext.js';
import { ACTIONS } from '../../services/authConfig.js';
import { AnimatedCounter } from '../ui/AnimatedCounter';

export function ReportsAndAnalyticsView({ onInspectCase }) {
  const { can } = useAuth();
  const canExport = can(ACTIONS.EXPORT_CSV);

  const [selectedBureau, setSelectedBureau] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');

  const filteredCases = useMemo(() => {
    return COMPLAINT_CASES.filter((c) => {
      if (selectedBureau !== 'ALL') {
        const bObj = BUREAUS.find((b) => b.id === selectedBureau);
        if (bObj && c.assignedBureau !== bObj.name) return false;
      }
      return true;
    });
  }, [selectedBureau]);

  const totalCount = filteredCases.length;
  const overdueCount = filteredCases.filter((c) => c.status === 'Overdue' || c.ageingDays > 30).length;
  const resolvedCount = filteredCases.filter((c) => c.status === 'Resolved').length;
  const activeCount = filteredCases.filter((c) => c.status === 'Under Review' || c.status === 'Pending').length;
  const slaComplianceRate = totalCount > 0 ? Math.round(((totalCount - overdueCount) / totalCount) * 100) : 100;
  
  const avgAgeing = totalCount > 0
    ? (filteredCases.reduce((acc, c) => acc + c.ageingDays, 0) / totalCount).toFixed(1)
    : '0';

  // Category breakdown
  const categoryStats = useMemo(() => {
    const counts = {};
    filteredCases.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredCases]);

  // Bureau breakdown
  const bureauStats = useMemo(() => {
    return BUREAUS.filter((b) => b.id !== 'all').map((b) => {
      const assigned = COMPLAINT_CASES.filter((c) => c.assignedBureau === b.name);
      const overdue = assigned.filter((c) => c.status === 'Overdue' || c.ageingDays > 30).length;
      const resolved = assigned.filter((c) => c.status === 'Resolved').length;
      const rate = assigned.length > 0 ? Math.round(((assigned.length - overdue) / assigned.length) * 100) : 100;
      return {
        ...b,
        assignedCount: assigned.length,
        resolvedCount: resolved,
        overdueCount: overdue,
        rate,
      };
    });
  }, []);

  const handleExportFull = () => {
    if (!canExport) return;
    exportComplaintsToCSV(filteredCases);
    setToastMessage(`CSV export generated locally for ${filteredCases.length} complaints.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleExportOverdue = () => {
    if (!canExport) return;
    const overdueOnly = filteredCases.filter((c) => c.status === 'Overdue' || c.ageingDays > 30);
    exportComplaintsToCSV(overdueOnly);
    setToastMessage(`CSV export generated locally for ${overdueOnly.length} overdue SLA breaches.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleExportMultiBureau = () => {
    if (!canExport) return;
    const jointOnly = filteredCases.filter((c) => c.secondaryBureaus?.length > 0);
    exportComplaintsToCSV(jointOnly);
    setToastMessage(`CSV export generated locally for ${jointOnly.length} cross-bureau joint cases.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleUnintegratedExport = (serviceName) => {
    if (!canExport) return;
    setToastMessage(`Notice: ${serviceName} is pending backend endpoint integration.`);
    setTimeout(() => setToastMessage(''), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', color: '#166534', fontSize: '0.8125rem' }}>
          ✓ {toastMessage}
        </div>
      )}

      {/* Header and Controls */}
      <div className={styles.filterToolbar}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
          <div>
            <div className={styles.filterHeading}>
              <BarChartIcon size={18} />
              <span>Statutory Reports & Regulatory Analytics</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Governance performance indicators, SLA resolution rates, and client-side data exports for administrative reporting.
            </p>
          </div>

          {/* Quick Local Export Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {canExport ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExportFull}
                >
                  📥 Export Register (CSV)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportOverdue}
                >
                  ⚠️ Export Overdue SLA (CSV)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportMultiBureau}
                >
                  🔗 Export Joint Inquiries (CSV)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnintegratedExport('Automated PDF Executive Dossier (POST /api/v1/reports/pdf)')}
                  title="Backend service pending"
                >
                  📄 Executive PDF (Unintegrated)
                </Button>
              </>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                🔒 Read-only access: Export actions disabled for current role
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Analytical KPI Metrics Ribbon */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard} style={{ borderTopColor: 'var(--color-brand-primary)' }}>
          <div className={styles.summaryLabel}>
            <span>Complaints Under Scrutiny</span>
            <ShieldIcon size={18} />
          </div>
          <div className={styles.summaryValue}>
            <AnimatedCounter value={totalCount} duration={1100} delay={0} />
          </div>
          <div className={styles.summaryFooter}>
            <AnimatedCounter value={activeCount} duration={1000} delay={100} /> Active Inquiries • <AnimatedCounter value={resolvedCount} duration={1000} delay={150} /> Resolved
          </div>
        </div>

        <div className={styles.summaryCard} style={{ borderTopColor: '#059669' }}>
          <div className={styles.summaryLabel}>
            <span>Statutory SLA Compliance</span>
            <CheckCircleIcon size={18} />
          </div>
          <div className={styles.summaryValue} style={{ color: '#059669' }}>
            <AnimatedCounter value={slaComplianceRate} suffix="%" duration={1100} delay={100} />
          </div>
          <div className={styles.summaryFooter}>Within AICTE 30-day mandate</div>
        </div>

        <div className={styles.summaryCard} style={{ borderTopColor: '#d97706' }}>
          <div className={styles.summaryLabel}>
            <span>Average Case Ageing</span>
            <ClockIcon size={18} />
          </div>
          <div className={styles.summaryValue} style={{ color: '#d97706' }}>
            <AnimatedCounter value={avgAgeing} suffix=" Days" duration={1100} delay={200} />
          </div>
          <div className={styles.summaryFooter}>Target threshold: &lt; 21 days</div>
        </div>

        <div className={styles.summaryCard} style={{ borderTopColor: '#dc2626' }}>
          <div className={styles.summaryLabel}>
            <span>Overdue Mandate Breaches</span>
            <AlertTriangleIcon size={18} />
          </div>
          <div className={styles.summaryValue} style={{ color: '#dc2626' }}>
            <AnimatedCounter value={overdueCount} duration={1100} delay={300} />
          </div>
          <div className={styles.summaryFooter}>Requires Apex Committee escalation</div>
        </div>
      </div>

      {/* Bureau Performance Comparison */}
      <Card>
        <CardHeader
          title="Caseload & SLA Adherence by AICTE Bureau / Cell"
          subtitle="Real-time operational distribution across statutory directorates"
        />
        <CardContent>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>AICTE Bureau / Special Cell</th>
                  <th className={styles.th}>Total Caseload</th>
                  <th className={styles.th}>Active Matters</th>
                  <th className={styles.th}>Resolved</th>
                  <th className={styles.th}>SLA Breaches</th>
                  <th className={styles.th}>Compliance Rate</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Status Indicator</th>
                </tr>
              </thead>
              <tbody>
                {bureauStats.map((b) => (
                  <tr key={b.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: b.color }} />
                        <strong style={{ color: 'var(--color-brand-primary)' }}>{b.name}</strong>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '18px' }}>
                        Directorate Code: {b.code}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <strong>{b.assignedCount}</strong>
                    </td>
                    <td className={styles.td}>{b.assignedCount - b.resolvedCount}</td>
                    <td className={styles.td}>{b.resolvedCount}</td>
                    <td className={styles.td}>
                      <span style={{ color: b.overdueCount > 0 ? '#dc2626' : 'inherit', fontWeight: b.overdueCount > 0 ? 700 : 400 }}>
                        {b.overdueCount}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '6px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${b.rate}%`, height: '100%', backgroundColor: b.rate >= 80 ? '#059669' : '#dc2626' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{b.rate}%</span>
                      </div>
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <Badge variant={b.rate >= 80 ? 'success' : 'critical'}>
                        {b.rate >= 80 ? 'Compliant' : 'Needs Action'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown & Performance Benchmarks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
        <Card>
          <CardHeader
            title="Frequency of Violations by Category"
            subtitle="Top grievance classifications across technical institutions"
          />
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {categoryStats.map(([category, count]) => {
                const percentage = Math.round((count / totalCount) * 100);
                return (
                  <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <span style={{ fontWeight: 600 }}>{category}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{count} ({percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: 'var(--color-brand-primary)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Statutory Reporting Disclaimers & Integrity"
            subtitle="Governance compliance statements"
          />
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <strong>Data Provenance Notice:</strong> All reporting metrics reflect the active demonstration dataset for SIH 2026 Problem Statement 26264. Local CSV export operates entirely clientside without transmitting institutional records.
              </div>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <strong>Confidentiality Directive:</strong> Complainant personal identifiable information (PII) is automatically excluded from administrative CSV extracts in adherence with AICTE Whistleblower Protection Directives.
              </div>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <strong>Scheduled Backend Delivery:</strong> Automated nightly synchronization and email push notifications are labeled as pending backend microservice deployment.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
