'use client';

import React from 'react';
import styles from './landing.module.css';
import {
  FileTextIcon,
  ClockIcon,
  EyeIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from '../icons/Icons';

export function DashboardPreviewStrip({ onSelectFilter }) {
  const summaryItems = [
    {
      id: 'ALL',
      value: '2,483',
      label: 'Total Complaints',
      icon: <FileTextIcon size={18} />,
      colorClass: styles.metricBlue,
    },
    {
      id: 'Pending',
      value: '312',
      label: 'Pending Cases',
      icon: <ClockIcon size={18} />,
      colorClass: styles.metricOrange,
    },
    {
      id: 'Under Review',
      value: '186',
      label: 'Under Review',
      icon: <EyeIcon size={18} />,
      colorClass: styles.metricPurple,
    },
    {
      id: 'Resolved',
      value: '1,742',
      label: 'Resolved Cases',
      icon: <CheckCircleIcon size={18} />,
      colorClass: styles.metricGreen,
    },
    {
      id: 'Overdue',
      value: '243',
      label: 'Overdue Cases',
      icon: <AlertTriangleIcon size={18} />,
      colorClass: styles.metricRed,
    },
  ];

  return (
    <section className={styles.previewStripWrapper} aria-label="Dashboard Metric Summaries">
      <div className={styles.previewStripCard}>
        {summaryItems.map((item, index) => (
          <React.Fragment key={item.id}>
            <div
              className={styles.previewMetricItem}
              onClick={() => onSelectFilter?.(item.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectFilter?.(item.id);
                }
              }}
              aria-label={`View ${item.label}: ${item.value} (Demo Data)`}
            >
              <div className={`${styles.metricIconCircle} ${item.colorClass}`}>
                {item.icon}
              </div>
              <div className={styles.metricDetails}>
                <div className={styles.metricValue}>{item.value}</div>
                <div className={styles.metricLabel}>{item.label}</div>
                <span className={styles.demoBadge}>Demo Data</span>
              </div>
            </div>
            {index < summaryItems.length - 1 && <div className={styles.metricDivider} aria-hidden="true" />}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
