'use client';

import React from 'react';
import styles from '../../app/shell.module.css';
import { MenuIcon, BellIcon, SearchIcon } from '../icons/Icons';
import { BUREAUS } from '../../data/mockData';

export function TopBar({
  onToggleSidebar,
  activeTab,
  selectedBureau,
  searchQuery,
  onSearchChange,
  onOpenNotifications,
  onPreviewCore,
}) {
  const currentBureau = BUREAUS.find((b) => b.id === selectedBureau) || BUREAUS[0];

  const pageTitle = {
    dashboard: 'AICTE Central Command Dashboard',
    complaints: selectedBureau === 'all' ? 'Institutional Complaints & Case Tracker' : `${currentBureau.name} Dashboard`,
    institutions: 'Institution 360° Historical Dossier',
    coordination: 'Cross-Bureau Case Coordination & Joint Inquiries',
    overlap_review: 'Cross-Bureau Overlap & Duplicate Detection Engine',
    transfers: 'Inter-Bureau Case Jurisdiction Transfer Register',
    alerts: 'Priority Escalation & SLA Breach Alerts',
    reports: 'Governance, Analytical Summaries & SLA Tracking',
    new_complaint: 'Institutional Grievance Intake & New Petition Docket',
  }[activeTab] || 'AICTE Bureau360 Portal';

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarLeft}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={onToggleSidebar}
          aria-label="Open Navigation Sidebar"
        >
          <MenuIcon size={20} />
        </button>

        <div className={styles.breadcrumbGroup}>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
          <span className={styles.breadcrumbContext}>
            AICTE HQ • Integrated Grievance Portal • Cycle 2026-27
          </span>
        </div>
      </div>

      <div className={styles.topBarRight}>
        <div className={styles.searchBox}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                position: 'absolute',
                left: '10px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <SearchIcon size={16} />
            </span>
            <input
              type="search"
              placeholder="Search PID, college, case..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 60px 7px 34px',
                fontSize: '0.8125rem',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-secondary)',
                outline: 'none',
              }}
            />
            <span className={styles.kbdHint}>⌘K</span>
          </div>
        </div>

        {onPreviewCore && (
          <button
            type="button"
            className={styles.notificationBtn}
            onClick={onPreviewCore}
            aria-label="Preview 3D Intelligence Core Loading Animation"
            title="Preview 3D Intelligence Core"
          >
            <span style={{ fontSize: '0.9375rem', lineHeight: 1 }} aria-hidden="true">✨</span>
          </button>
        )}

        <button
          type="button"
          className={styles.notificationBtn}
          onClick={onOpenNotifications}
          aria-label="View 14 cross-bureau overlap alerts"
          title="14 Cross-Bureau Overlap Alerts"
        >
          <BellIcon size={18} />
          <span className={styles.notificationCount}>14</span>
        </button>

        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>AO</div>
          <div className={styles.userText}>
            <div className={styles.userName}>Dr. R. K. Soni</div>
            <div className={styles.userRole}>Nodal Officer, AICTE HQ</div>
          </div>
        </div>
      </div>
    </header>
  );
}
