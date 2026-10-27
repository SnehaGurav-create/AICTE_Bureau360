'use client';

import React from 'react';
import styles from '../../app/shell.module.css';
import { MenuIcon, BellIcon, SearchIcon } from '../icons/Icons';
import { BUREAUS } from '../../data/mockData';
import { useAuth } from '../../services/authContext.js';
import { ROLE_META } from '../../services/authConfig.js';

export function TopBar({
  onToggleSidebar,
  isCollapsed = false,
  activeTab,
  onSelectTab,
  selectedBureau,
  searchQuery,
  onSearchChange,
  onOpenNotifications,
  onPreviewCore,
  onLogout,
}) {
  const currentBureau = BUREAUS.find((b) => b.id === selectedBureau) || BUREAUS[0];
  const { currentUser, role, signOut } = useAuth();
  const roleMeta = role ? ROLE_META[role] : null;

  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      signOut();
    }
  };

  const officerBureauName = BUREAUS.find((b) => b.id === currentUser?.bureau)?.name;

  let pageTitle = 'AICTE Bureau360 Portal';
  if (activeTab === 'dashboard') {
    if (role === 'AICTE_ADMINISTRATOR') {
      pageTitle = 'AICTE Administrator Portal — Central Command Dashboard';
    } else if (role === 'REGULATION_BUREAU') {
      pageTitle = 'Regulation Bureau (RB) Portal — Regulatory Oversight';
    } else if (role === 'PGRC') {
      pageTitle = 'PGRC Portal — Public Grievance Redressal Cell';
    } else if (role === 'REGIONAL_OFFICE') {
      pageTitle = 'Regional Office Portal — Northern Regional Jurisdiction';
    } else if (role === 'SENIOR_MANAGEMENT') {
      pageTitle = 'Senior Management Portal — Competent Authority Oversight';
    } else {
      pageTitle = 'AICTE Central Command Dashboard';
    }
  } else if (activeTab === 'complaints') {
    if (role === 'REGULATION_BUREAU') {
      pageTitle = 'Regulation Bureau Assigned Complaint Dossiers';
    } else if (role === 'PGRC') {
      pageTitle = 'PGRC Grievance Records & Redressal Register';
    } else if (role === 'REGIONAL_OFFICE') {
      pageTitle = 'Northern Regional Office Compliance & Inspection Dockets';
    } else if (role === 'SENIOR_MANAGEMENT') {
      pageTitle = 'Organization-Wide Complaint Register (Management View)';
    } else {
      pageTitle = selectedBureau === 'all' ? 'Institutional Complaints & Case Tracker' : `${currentBureau.name} Dashboard`;
    }
  } else {
    pageTitle = {
      institutions: 'Institution 360° Historical Dossier',
      coordination: 'Cross-Bureau Case Coordination & Joint Inquiries',
      overlap_review: 'Cross-Bureau Overlap & Duplicate Detection Engine',
      transfers: 'Inter-Bureau Case Jurisdiction Transfer Register',
      alerts: 'Priority Escalation & SLA Breach Alerts',
      reports: 'Governance, Analytical Summaries & SLA Tracking',
      new_complaint: 'Institutional Grievance Intake & New Petition Docket',
      user_management: 'Institutional User & Role Administration',
      pgrc: 'PGRC Portal — Public Grievance Redressal Cell',
      profile: 'User Profile & System Credentials',
    }[activeTab] || 'AICTE Bureau360 Portal';
  }

  const breadcrumbContext =
    role === 'AICTE_ADMINISTRATOR'
      ? 'AICTE HQ • Apex Institutional Administration • Cycle 2026-27'
      : role === 'REGULATION_BUREAU'
      ? 'Regulation Bureau • AICTE Regulatory Norms • Cycle 2026-27'
      : role === 'PGRC'
      ? 'Public Grievance Redressal Cell • Integrated Portal • Cycle 2026-27'
      : role === 'REGIONAL_OFFICE'
      ? 'Northern Regional Office (NRO) • Regional Jurisdiction • Cycle 2026-27'
      : role === 'SENIOR_MANAGEMENT'
      ? 'Competent Authority • Apex Statutory Governance • Cycle 2026-27'
      : 'AICTE HQ • Integrated Grievance Portal • Cycle 2026-27';

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarLeft}>
        <button
          type="button"
          className={styles.sidebarToggleBtn}
          onClick={onToggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          aria-expanded={!isCollapsed}
        >
          <MenuIcon size={20} />
        </button>

        <div className={styles.breadcrumbGroup}>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
          <span className={styles.breadcrumbContext}>
            {breadcrumbContext}
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

        {currentUser && (
          <div
            className={styles.userProfile}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => onSelectTab?.('profile')}
            title="View User Profile & Account Details"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectTab?.('profile');
              }
            }}
            aria-label={`User Profile: ${currentUser.name} (${roleMeta?.label})`}
          >
            <div
              className={styles.userAvatar}
              style={{
                background: roleMeta?.color || '#0d2946',
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              {currentUser.initials || currentUser.name?.slice(0, 2).toUpperCase() || 'AO'}
            </div>
            <div className={styles.userText}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={styles.userName}>{currentUser.name}</span>
                {roleMeta && (
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '999px',
                      background: roleMeta.bgColor,
                      color: roleMeta.color,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {roleMeta.shortLabel}
                  </span>
                )}
              </div>
              <div className={styles.userRole}>
                {currentUser.designation || 'AICTE Officer'}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSignOut();
              }}
              className={styles.notificationBtn}
              style={{
                marginLeft: '4px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748b',
                cursor: 'pointer',
              }}
              title="Sign Out (Demo Session)"
              aria-label="Sign Out"
            >
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
