'use client';

import React from 'react';
import styles from '../../app/dashboard.module.css';
import { BUREAUS } from '../../data/mockData';

export function ChartsSection({ cases = [] }) {
  const total = cases.length;

  // 1. Status Breakdown Metrics
  const pendingCount = cases.filter((c) => c.status === 'Pending').length;
  const reviewCount = cases.filter((c) => c.status === 'Under Review').length;
  const resolvedCount = cases.filter((c) => c.status === 'Resolved').length;
  const overdueCount = cases.filter((c) => c.status === 'Overdue' || c.ageingDays > 30).length;

  // Donut circumference math (radius = 45, C = 282.74)
  const C = 282.74;
  const pPending = total > 0 ? pendingCount / total : 0;
  const pReview = total > 0 ? reviewCount / total : 0;
  const pResolved = total > 0 ? resolvedCount / total : 0;
  const pOverdue = total > 0 ? overdueCount / total : 0;

  const strokePending = pPending * C;
  const strokeReview = pReview * C;
  const strokeResolved = pResolved * C;
  const strokeOverdue = pOverdue * C;

  const offsetPending = 0;
  const offsetReview = -strokePending;
  const offsetResolved = -(strokePending + strokeReview);
  const offsetOverdue = -(strokePending + strokeReview + strokeResolved);

  // 2. Monthly Trend Data (Derived from receivedDate: YYYY-MM)
  const monthlyData = [
    { key: '2026-08', label: 'Aug 2026', intake: 0, resolved: 0 },
    { key: '2026-09', label: 'Sep 2026', intake: 0, resolved: 0 },
    { key: '2026-10', label: 'Oct 2026', intake: 0, resolved: 0 },
  ];

  cases.forEach((c) => {
    const monthKey = c.receivedDate ? c.receivedDate.substring(0, 7) : '';
    const match = monthlyData.find((m) => m.key === monthKey);
    if (match) {
      match.intake += 1;
      if (c.status === 'Resolved') match.resolved += 1;
    }
  });

  const maxMonthly = Math.max(...monthlyData.map((m) => Math.max(m.intake, m.resolved)), 1);

  // 3. Bureau Workload Breakdown
  const bureauWorkload = BUREAUS.filter((b) => b.id !== 'all').map((bureau) => {
    const count = cases.filter((c) => c.assignedBureau === bureau.name).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      id: bureau.id,
      name: bureau.name,
      code: bureau.code,
      count,
      percentage,
      color: bureau.color || 'var(--color-brand-primary)',
    };
  });

  return (
    <section className={styles.chartsGrid} aria-label="Analytical Summary Charts">
      {/* 1. Status Distribution Donut */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>Status Distribution</h3>
            <span className={styles.chartSubtitle}>Current complaint portfolio</span>
          </div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-brand-primary)' }}>
            {total} Total
          </span>
        </div>

        <div className={styles.chartContainer}>
          <div className={styles.donutWrapper}>
            <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
              <svg className={styles.donutSvg} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                {total > 0 && (
                  <>
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="10"
                      strokeDasharray={`${strokePending} ${C}`}
                      strokeDashoffset={offsetPending}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="10"
                      strokeDasharray={`${strokeReview} ${C}`}
                      strokeDashoffset={offsetReview}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="10"
                      strokeDasharray={`${strokeResolved} ${C}`}
                      strokeDashoffset={offsetResolved}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="10"
                      strokeDasharray={`${strokeOverdue} ${C}`}
                      strokeDashoffset={offsetOverdue}
                    />
                  </>
                )}
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-primary)', lineHeight: 1 }}>
                  {total}
                </span>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Cases
                </span>
              </div>
            </div>

            <div className={styles.donutLegend}>
              <div className={styles.legendRow}>
                <div className={styles.legendIndicator}>
                  <span className={styles.legendDot} style={{ backgroundColor: '#f59e0b' }} />
                  <span>Pending</span>
                </div>
                <span className={styles.legendValue}>{pendingCount} ({Math.round(pPending * 100)}%)</span>
              </div>

              <div className={styles.legendRow}>
                <div className={styles.legendIndicator}>
                  <span className={styles.legendDot} style={{ backgroundColor: '#3b82f6' }} />
                  <span>Under Review</span>
                </div>
                <span className={styles.legendValue}>{reviewCount} ({Math.round(pReview * 100)}%)</span>
              </div>

              <div className={styles.legendRow}>
                <div className={styles.legendIndicator}>
                  <span className={styles.legendDot} style={{ backgroundColor: '#10b981' }} />
                  <span>Resolved</span>
                </div>
                <span className={styles.legendValue}>{resolvedCount} ({Math.round(pResolved * 100)}%)</span>
              </div>

              <div className={styles.legendRow}>
                <div className={styles.legendIndicator}>
                  <span className={styles.legendDot} style={{ backgroundColor: '#ef4444' }} />
                  <span>Overdue</span>
                </div>
                <span className={styles.legendValue} style={{ color: '#dc2626' }}>
                  {overdueCount} ({Math.round(pOverdue * 100)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Monthly Trend Chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>Monthly Intake vs Resolved</h3>
            <span className={styles.chartSubtitle}>Intake volume and case closures</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', fontSize: '0.6875rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#0d2946', borderRadius: '2px' }} />
              Intake
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '2px' }} />
              Resolved
            </span>
          </div>
        </div>

        <div className={styles.chartContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '140px', width: '100%', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            {monthlyData.map((m) => (
              <div key={m.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '28%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '110px' }}>
                  {/* Intake Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#0d2946' }}>{m.intake}</span>
                    <div
                      style={{
                        width: '18px',
                        height: `${Math.max((m.intake / maxMonthly) * 85, 4)}px`,
                        backgroundColor: '#0d2946',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                      title={`Intake: ${m.intake}`}
                    />
                  </div>
                  {/* Resolved Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#10b981' }}>{m.resolved}</span>
                    <div
                      style={{
                        width: '18px',
                        height: `${Math.max((m.resolved / maxMonthly) * 85, 4)}px`,
                        backgroundColor: '#10b981',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                      title={`Resolved: ${m.resolved}`}
                    />
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bureau Workload Breakdown */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>Bureau Workload Allocation</h3>
            <span className={styles.chartSubtitle}>Complaints distributed across cells</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            5 Cells Assigned
          </span>
        </div>

        <div className={styles.chartContainer}>
          <div className={styles.workloadList}>
            {bureauWorkload.map((b) => (
              <div key={b.id} className={styles.workloadItem}>
                <div className={styles.workloadMeta}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</span>
                  <span style={{ fontWeight: 700, color: b.color }}>
                    {b.count} cases ({b.percentage}%)
                  </span>
                </div>
                <div className={styles.workloadBarBg}>
                  <div
                    className={styles.workloadBarFill}
                    style={{
                      width: `${b.percentage}%`,
                      backgroundColor: b.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
