'use client';

import React from 'react';
import styles from '../../app/dashboard.module.css';
import {
  FileTextIcon,
  ClockIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from '../icons/Icons';
import { AnimatedCounter } from '../ui/AnimatedCounter';

export function SummaryCards({ cases = [], activeStatusFilter, onSelectStatus }) {
  // Dynamically derive summary metrics from the passed dataset
  const total = cases.length;
  const pending = cases.filter((c) => c.status === 'Pending').length;
  const underReview = cases.filter((c) => c.status === 'Under Review').length;
  const resolved = cases.filter((c) => c.status === 'Resolved').length;
  const overdue = cases.filter((c) => c.status === 'Overdue' || c.ageingDays > 30).length;

  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;
  const resolvedPct = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const cards = [
    {
      id: 'ALL',
      label: 'Total Complaints',
      value: total,
      delay: 0,
      footer: <span>Cumulative register across AICTE</span>,
      icon: <FileTextIcon size={18} />,
      classMod: styles.cardTotal,
      color: 'var(--color-brand-primary)',
    },
    {
      id: 'Pending',
      label: 'Pending Triage',
      value: pending,
      delay: 90,
      footer: (
        <span>
          <AnimatedCounter value={pendingPct} suffix="%" delay={140} duration={1000} /> of complaints pending assignment
        </span>
      ),
      icon: <ClockIcon size={18} />,
      classMod: styles.cardPending,
      color: '#d97706',
    },
    {
      id: 'Under Review',
      label: 'Under Review',
      value: underReview,
      delay: 180,
      footer: <span>Active bureau investigations &amp; notices</span>,
      icon: <RefreshCwIcon size={18} />,
      classMod: styles.cardReview,
      color: '#2563eb',
    },
    {
      id: 'Resolved',
      label: 'Resolved',
      value: resolved,
      delay: 270,
      footer: (
        <span>
          <AnimatedCounter value={resolvedPct} suffix="%" delay={320} duration={1000} /> compliance closure rate
        </span>
      ),
      icon: <CheckCircleIcon size={18} />,
      classMod: styles.cardResolved,
      color: '#16a34a',
    },
    {
      id: 'Overdue',
      label: 'Overdue (>30d SLA)',
      value: overdue,
      delay: 360,
      footer: <span>Requires immediate executive notice</span>,
      icon: <AlertTriangleIcon size={18} />,
      classMod: styles.cardOverdue,
      color: '#dc2626',
    },
  ];

  return (
    <section className={styles.summaryGrid} aria-label="Complaints Overview Cards">
      {cards.map((card) => {
        const isSelected = activeStatusFilter === card.id;
        return (
          <div
            key={card.id}
            className={`${styles.summaryCard} ${card.classMod}`}
            onClick={() => onSelectStatus(card.id === activeStatusFilter ? 'ALL' : card.id)}
            style={{
              cursor: 'pointer',
              backgroundColor: isSelected ? 'var(--bg-surface-secondary)' : 'var(--bg-surface)',
              boxShadow: isSelected ? 'var(--shadow-md)' : undefined,
              outline: isSelected ? `2px solid ${card.color}` : 'none',
              transition: 'all 0.2s ease',
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectStatus(card.id === activeStatusFilter ? 'ALL' : card.id);
              }
            }}
            aria-label={`${card.label}: ${card.value}. Click to filter.`}
          >
            <div className={styles.summaryLabel}>
              <span>{card.label}</span>
              <span style={{ color: card.color }}>{card.icon}</span>
            </div>
            <div className={styles.summaryValueGroup}>
              <span className={styles.summaryValue} style={{ color: card.color }}>
                <AnimatedCounter
                  value={card.value}
                  duration={1100}
                  delay={card.delay}
                  ariaLabel={`${card.label}: ${card.value}`}
                />
              </span>
              {isSelected && (
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: card.color, textTransform: 'uppercase' }}>
                  Filter Active
                </span>
              )}
            </div>
            <div className={styles.summaryFooter}>{card.footer}</div>
          </div>
        );
      })}
    </section>
  );
}

