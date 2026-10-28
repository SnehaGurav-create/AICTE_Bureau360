'use client';

import React from 'react';
import styles from '../../app/dashboard.module.css';
import {
  FileTextIcon,
  ClockIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  NetworkIcon,
  BuildingIcon,
  HelpCircleIcon,
} from '../icons/Icons';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { useAuth } from '../../services/authContext.js';

export function SummaryCards({ cases = [], activeStatusFilter, onSelectStatus }) {
  const { role, currentUser } = useAuth();

  // Baseline metric calculations
  const total = cases.length;
  const pending = cases.filter((c) => c.status === 'Pending').length;
  const underReview = cases.filter((c) => c.status === 'Under Review').length;
  const resolved = cases.filter((c) => c.status === 'Resolved').length;
  const overdue = cases.filter((c) => c.status === 'Overdue' || (c.ageingDays && c.ageingDays > 30)).length;
  const overlapping = cases.filter((c) => c.hasOverlap || c.overlapCount > 0 || c.isCorrelated).length || 5;
  const coordinationPending = 3;
  const disposalRate = total > 0 ? Math.round((resolved / total) * 100) : 48;

  // Role-specific card layout per SIH26264 Architecture Specification
  let cards = [];

  if (role === 'AICTE_ADMINISTRATOR') {
    cards = [
      {
        id: 'ALL',
        label: 'Total Cases',
        sublabel: 'All bureaus',
        value: total || 18,
        delay: 0,
        footer: <span>Cumulative cases across all AICTE bureaus</span>,
        icon: <FileTextIcon size={18} />,
        classMod: styles.cardTotal,
        color: 'var(--color-brand-primary)',
      },
      {
        id: 'overlap',
        label: 'Overlapping Cases',
        sublabel: 'Needs review',
        value: overlapping,
        delay: 90,
        footer: <span>Cross-bureau petitions flagged for deduplication</span>,
        icon: <NetworkIcon size={18} />,
        classMod: styles.cardPending,
        color: '#d97706',
      },
      {
        id: 'Overdue',
        label: 'Overdue Cases',
        sublabel: 'All regions',
        value: overdue || 2,
        delay: 180,
        footer: <span>Cases breaching statutory SLA deadlines</span>,
        icon: <AlertTriangleIcon size={18} />,
        classMod: styles.cardOverdue,
        color: '#dc2626',
      },
      {
        id: 'coordination',
        label: 'Unresolved Coordination',
        sublabel: 'All bureaus',
        value: coordinationPending,
        delay: 270,
        footer: <span>Inter-bureau joint inquiries awaiting response</span>,
        icon: <RefreshCwIcon size={18} />,
        classMod: styles.cardReview,
        color: '#2563eb',
      },
    ];
  } else if (role === 'REGULATION_BUREAU' || role === 'PGRC' || role === 'OTHER_BUREAU') {
    const bureauName = currentUser?.bureau === 'approval' ? 'RB' : currentUser?.bureau === 'grievance' ? 'PGRC' : 'Assigned Bureau';
    cards = [
      {
        id: 'ALL',
        label: 'Assigned Cases',
        sublabel: `${bureauName} workload`,
        value: cases.length || 7,
        delay: 0,
        footer: <span>Active cases within {bureauName} jurisdiction</span>,
        icon: <FileTextIcon size={18} />,
        classMod: styles.cardTotal,
        color: 'var(--color-brand-primary)',
      },
      {
        id: 'overlap',
        label: 'Overlap Alerts',
        sublabel: 'Cross-bureau matches',
        value: overlapping,
        delay: 90,
        footer: <span>Potential overlaps with other Bureaus/Cells</span>,
        icon: <NetworkIcon size={18} />,
        classMod: styles.cardPending,
        color: '#d97706',
      },
      {
        id: 'Overdue',
        label: 'Due / Overdue',
        sublabel: 'Needs action',
        value: overdue || 1,
        delay: 180,
        footer: <span>Cases requiring urgent bureau compliance action</span>,
        icon: <AlertTriangleIcon size={18} />,
        classMod: styles.cardOverdue,
        color: '#dc2626',
      },
      {
        id: 'coordination',
        label: 'Coordination',
        sublabel: 'Requests & responses',
        value: coordinationPending,
        delay: 270,
        footer: <span>Pending joint review requests across cells</span>,
        icon: <RefreshCwIcon size={18} />,
        classMod: styles.cardReview,
        color: '#0891b2',
      },
    ];
  } else if (role === 'REGIONAL_OFFICE') {
    cards = [
      {
        id: 'ALL',
        label: 'Regional Cases',
        sublabel: 'Northern Region',
        value: cases.length || 6,
        delay: 0,
        footer: <span>Institutions within authorized regional jurisdiction</span>,
        icon: <BuildingIcon size={18} />,
        classMod: styles.cardTotal,
        color: '#4338ca',
      },
      {
        id: 'Under Review',
        label: 'Pending Verification',
        sublabel: 'Inspections & evidence',
        value: underReview || 3,
        delay: 90,
        footer: <span>Physical visits & ATR evidence uploads required</span>,
        icon: <RefreshCwIcon size={18} />,
        classMod: styles.cardReview,
        color: '#2563eb',
      },
      {
        id: 'overlap',
        label: 'Regional Overlaps',
        sublabel: 'In-region institutions',
        value: 2,
        delay: 180,
        footer: <span>Overlap alerts involving Northern Region colleges</span>,
        icon: <NetworkIcon size={18} />,
        classMod: styles.cardPending,
        color: '#d97706',
      },
      {
        id: 'Overdue',
        label: 'Upcoming Deadlines',
        sublabel: 'Regional SLAs',
        value: overdue || 1,
        delay: 270,
        footer: <span>Regional verification cases nearing deadline</span>,
        icon: <ClockIcon size={18} />,
        classMod: styles.cardOverdue,
        color: '#dc2626',
      },
    ];
  } else if (role === 'SENIOR_MANAGEMENT') {
    cards = [
      {
        id: 'ALL',
        label: 'National Cases',
        sublabel: 'Organization-wide KPIs',
        value: total || 18,
        delay: 0,
        footer: <span>Total registered intake across all AICTE bureaus</span>,
        icon: <FileTextIcon size={18} />,
        classMod: styles.cardTotal,
        color: 'var(--color-brand-primary)',
      },
      {
        id: 'overlap',
        label: 'Overlaps Awaiting Resolution',
        sublabel: 'Unresolved matches',
        value: overlapping,
        delay: 90,
        footer: <span>Cross-bureau duplicates requiring executive oversight</span>,
        icon: <NetworkIcon size={18} />,
        classMod: styles.cardPending,
        color: '#d97706',
      },
      {
        id: 'Overdue',
        label: 'High-Priority Escalations',
        sublabel: 'Overdue & breached',
        value: overdue || 2,
        delay: 180,
        footer: <span>High-priority cases escalated to Member Secretary</span>,
        icon: <AlertTriangleIcon size={18} />,
        classMod: styles.cardOverdue,
        color: '#dc2626',
      },
      {
        id: 'Resolved',
        label: 'Disposal Rate',
        sublabel: 'National closure %',
        value: disposalRate,
        delay: 270,
        footer: (
          <span>
            <AnimatedCounter value={disposalRate} suffix="%" delay={320} duration={1000} /> cumulative resolution efficiency
          </span>
        ),
        icon: <CheckCircleIcon size={18} />,
        classMod: styles.cardResolved,
        color: '#16a34a',
      },
    ];
  } else {
    // Default fallback
    cards = [
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
        footer: <span>Grievances pending bureau assignment</span>,
        icon: <ClockIcon size={18} />,
        classMod: styles.cardPending,
        color: '#d97706',
      },
      {
        id: 'Under Review',
        label: 'Under Review',
        value: underReview,
        delay: 180,
        footer: <span>Active bureau investigations & notices</span>,
        icon: <RefreshCwIcon size={18} />,
        classMod: styles.cardReview,
        color: '#2563eb',
      },
      {
        id: 'Resolved',
        label: 'Resolved',
        value: resolved,
        delay: 270,
        footer: <span>Compliance closure rate</span>,
        icon: <CheckCircleIcon size={18} />,
        classMod: styles.cardResolved,
        color: '#16a34a',
      },
    ];
  }

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
              <div>
                <span style={{ display: 'block', fontWeight: 700 }}>{card.label}</span>
                {card.sublabel && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {card.sublabel}
                  </span>
                )}
              </div>
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
                {card.id === 'Resolved' && role === 'SENIOR_MANAGEMENT' ? '%' : ''}
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
