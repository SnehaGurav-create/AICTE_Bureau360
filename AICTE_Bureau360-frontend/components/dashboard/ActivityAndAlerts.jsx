'use client';

import React from 'react';
import styles from '../../app/dashboard.module.css';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { RECENT_ACTIVITY, ALERT_CENTRE_ITEMS } from '../../data/mockData';
import { ClockIcon, AlertTriangleIcon, BellIcon } from '../icons/Icons';

export function ActivityAndAlerts({ onSelectAlertFilter, onReviewOverlap }) {
  return (
    <section className={styles.activityAlertsGrid} aria-label="Activity Feed and Alert Centre">
      {/* 1. Recent Activity Timeline */}
      <div className={styles.sectionCard}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>Recent Bureau Activity</h3>
            <span className={styles.chartSubtitle}>Chronological administrative audit trail</span>
          </div>
          <ClockIcon size={16} />
        </div>

        <div className={styles.activityList}>
          {RECENT_ACTIVITY.map((act) => (
            <div key={act.id} className={styles.activityItem}>
              <div className={styles.activityIconDot} />
              <div style={{ flex: 1 }}>
                <div className={styles.activityMeta}>
                  <span className={styles.activityTitle}>{act.title}</span>
                  <span className={styles.activityTime}>{act.timestamp}</span>
                </div>
                <div style={{ display: 'inline-block', marginTop: '2px' }}>
                  <Badge variant="neutral">{act.bureau}</Badge>
                </div>
                <p className={styles.activityDesc}>{act.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Alert-Centre Preview */}
      <div className={styles.sectionCard}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>Alert Centre & Escalations</h3>
            <span className={styles.chartSubtitle}>Priority action items requiring immediate clearance</span>
          </div>
          <BellIcon size={16} />
        </div>

        <div className={styles.alertList}>
          {ALERT_CENTRE_ITEMS.map((alert) => {
            const classSeverity = {
              critical: styles.alertCritical,
              warning: styles.alertWarning,
              info: styles.alertInfo,
            }[alert.severity] || styles.alertInfo;

            return (
              <div key={alert.id} className={`${styles.alertCard} ${classSeverity}`}>
                <div className={styles.alertHeader}>
                  <span className={styles.alertTitle}>
                    {alert.severity === 'critical' && <AlertTriangleIcon size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />}
                    {alert.title}
                  </span>
                  <Badge variant={alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info'}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
                <p className={styles.alertDesc}>{alert.description}</p>
                <div style={{ marginTop: '4px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (alert.id === 'ALRT-01') {
                        onSelectAlertFilter?.('Overdue');
                      } else if (alert.id === 'ALRT-02') {
                        onReviewOverlap?.();
                      } else {
                        onSelectAlertFilter?.('ALL');
                      }
                    }}
                  >
                    {alert.actionText}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
