'use client';

import React from 'react';
import styles from '../../app/shell.module.css';
import {
  HomeIcon,
  FileTextIcon,
  BuildingIcon,
  NetworkIcon,
  AlertTriangleIcon,
  BellIcon,
  BarChartIcon,
  ShieldIcon,
  LayersIcon,
  ClockIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from '../icons/Icons';
import { BUREAUS } from '../../data/mockData';
import { useAuth } from '../../services/authContext.js';
import { ROLE_META, ACTIONS } from '../../services/authConfig.js';

export function Sidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  activeTab,
  onSelectTab,
  selectedBureau,
  onSelectBureau,
  onLogout,
}) {
  const { currentUser, role, canAccessTab } = useAuth();
  const roleMeta = role ? ROLE_META[role] : null;

  return (
    <>
      {isOpen && (
        <div
          className={styles.drawerOverlay}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''} ${isCollapsed ? styles.sidebarCollapsed : ''}`}
        aria-label="Bureau Navigation"
      >
        <div className={styles.tricolorStrip} />

        <div className={styles.sidebarHeader}>
          <div
            className={styles.logoMonogram}
            title={isCollapsed ? "AICTE Bureau360" : undefined}
          >
            360
          </div>
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle}>
              AICTE Bureau360
            </span>
            <span className={styles.brandSubtitle}>
              Grievance &amp; Overlap Portal
            </span>
          </div>

          {/* Desktop collapse toggle button */}
          <button
            type="button"
            className={styles.desktopCollapseBtn}
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            aria-label={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
          >
            {isCollapsed ? <ChevronRightIcon size={16} /> : <ChevronLeftIcon size={16} />}
          </button>

          {/* Mobile drawer close button */}
          <button
            type="button"
            className={styles.sidebarCloseBtn}
            onClick={onClose}
            title="Close navigation drawer (Esc)"
            aria-label="Close navigation drawer"
          >
            <XIcon size={18} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navSectionLabel}>Core Navigation</div>

          {canAccessTab('landing') && (
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'landing' ? styles.navItemActive : ''}`}
              onClick={() => {
                onSelectTab('landing');
                onClose?.();
              }}
              title="Return to the public institutional landing page"
              aria-label="Public Portal"
            >
              <div className={styles.navItemLeft}>
                <HomeIcon size={18} />
                <span>Public Portal</span>
              </div>
              <span className={styles.navBadge} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                Home
              </span>
            </button>
          )}

          {canAccessTab('dashboard') && (
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.navItemActive : ''}`}
              onClick={() => {
                onSelectTab('dashboard');
                onClose?.();
              }}
              title="AICTE Central Command Dashboard"
              aria-label="Dashboard"
            >
              <div className={styles.navItemLeft}>
                <LayersIcon size={18} />
                <span>Dashboard</span>
              </div>
            </button>
          )}

          {canAccessTab('complaints') && (
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'complaints' && (selectedBureau === 'all' || (role === 'OFFICER' && selectedBureau === currentUser?.bureau)) ? styles.navItemActive : ''}`}
              onClick={() => {
                onSelectTab('complaints');
                onSelectBureau(role === 'OFFICER' && currentUser?.bureau ? currentUser.bureau : 'all');
                onClose?.();
              }}
              title={`Complaints (${role === 'OFFICER' && currentUser?.bureau ? (BUREAUS.find((b) => b.id === currentUser.bureau)?.count || 5) : 148})`}
              aria-label="Complaints"
            >
              <div className={styles.navItemLeft}>
                <FileTextIcon size={18} />
                <span>Complaints</span>
              </div>
              <span className={styles.navBadge}>
                {role === 'OFFICER' && currentUser?.bureau
                  ? (BUREAUS.find((b) => b.id === currentUser.bureau)?.count || 5)
                  : 148}
              </span>
            </button>
          )}

          {canAccessTab('new_complaint') && (
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'new_complaint' ? styles.navItemActive : ''}`}
              onClick={() => {
                onSelectTab('new_complaint');
                onClose?.();
              }}
              style={{
                color: activeTab === 'new_complaint' ? '#ffffff' : 'inherit',
                fontWeight: 600,
              }}
              title="Register Institutional Grievance"
              aria-label="Register Complaint"
            >
              <div className={styles.navItemLeft}>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, lineHeight: 1 }}>+</span>
                <span>Register Complaint</span>
              </div>
              <span
                className={styles.navBadge}
                style={{ background: 'rgba(13, 41, 70, 0.15)', color: 'var(--color-brand-primary)' }}
              >
                Intake
              </span>
            </button>
          )}

          {canAccessTab('institutions') && (
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'institutions' ? styles.navItemActive : ''}`}
              onClick={() => {
                onSelectTab('institutions');
                onClose?.();
              }}
              title="Institutions 360° Historical Dossier"
              aria-label="Institutions"
            >
              <div className={styles.navItemLeft}>
                <BuildingIcon size={18} />
                <span>Institutions</span>
              </div>
            </button>
          )}

          {canAccessTab('coordination') && (
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'coordination' ? styles.navItemActive : ''}`}
              onClick={() => {
                onSelectTab('coordination');
                onClose?.();
              }}
              title="Cross-Bureau Case Coordination & Joint Inquiries"
              aria-label="Bureau Coordination"
            >
              <div className={styles.navItemLeft}>
                <NetworkIcon size={18} />
                <span>Bureau Coordination</span>
              </div>
            </button>
          )}

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'overlap_review' ? styles.navItemActive : ''}`}
            onClick={() => {
              onSelectTab('overlap_review');
              onClose?.();
            }}
            title="Overlap Review Engine (14 Pending)"
            aria-label="Overlap Review (14)"
          >
            <div className={styles.navItemLeft}>
              <AlertTriangleIcon size={18} />
              <span>Overlap Review</span>
            </div>
            <span
              className={styles.navBadge}
              style={{ background: 'rgba(217, 99, 22, 0.35)', color: '#ffedd5' }}
            >
              14
            </span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'transfers' ? styles.navItemActive : ''}`}
            onClick={() => {
              onSelectTab('transfers');
              onClose?.();
            }}
            title="Inter-Bureau Case Jurisdiction Transfer Register (6)"
            aria-label="Transfer History (6)"
          >
            <div className={styles.navItemLeft}>
              <ClockIcon size={18} />
              <span>Transfer History</span>
            </div>
            <span className={styles.navBadge}>6</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'alerts' ? styles.navItemActive : ''}`}
            onClick={() => {
              onSelectTab('alerts');
              onClose?.();
            }}
            title="Priority Escalation & SLA Breach Alerts (8)"
            aria-label="Alerts (8)"
          >
            <div className={styles.navItemLeft}>
              <BellIcon size={18} />
              <span>Alerts</span>
            </div>
            <span
              className={styles.navBadge}
              style={{ background: 'rgba(185, 28, 28, 0.25)', color: '#fecaca' }}
            >
              8
            </span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'reports' ? styles.navItemActive : ''}`}
            onClick={() => {
              onSelectTab('reports');
              onClose?.();
            }}
            title="Governance, Analytical Summaries & SLA Tracking"
            aria-label="Reports"
          >
            <div className={styles.navItemLeft}>
              <BarChartIcon size={18} />
              <span>Reports</span>
            </div>
          </button>

          {canAccessTab('user_management') && (
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'user_management' ? styles.navItemActive : ''}`}
              onClick={() => {
                onSelectTab('user_management');
                onClose?.();
              }}
              title="Institutional User & Role Administration (Admin)"
              aria-label="User Management"
            >
              <div className={styles.navItemLeft}>
                <UsersIcon size={18} />
                <span>User Management</span>
              </div>
              <span className={styles.navBadge} style={{ background: '#fef3c7', color: '#92400e' }}>
                Admin
              </span>
            </button>
          )}

          <div className={styles.navSectionLabel}>
            {role === 'OFFICER' ? 'AICTE Bureau Scope (Officer Locked)' : 'Filter By AICTE Bureau'}
          </div>

          {BUREAUS.filter((b) => b.id !== 'all').map((bureau) => {
            const isOfficer = role === 'OFFICER';
            const isAssigned = isOfficer && currentUser?.bureau === bureau.id;
            const isRestricted = isOfficer && !isAssigned;

            return (
              <button
                key={bureau.id}
                type="button"
                disabled={isRestricted}
                className={`${styles.navItem} ${selectedBureau === bureau.id && activeTab === 'complaints' ? styles.navItemActive : ''}`}
                onClick={() => {
                  if (isRestricted) return;
                  onSelectBureau(bureau.id);
                  onSelectTab('complaints');
                  onClose?.();
                }}
                style={isRestricted ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
                title={
                  isRestricted
                    ? `Restricted: Officer access is scoped to ${BUREAUS.find((b) => b.id === currentUser?.bureau)?.name || 'assigned bureau'}`
                    : isAssigned
                    ? `${bureau.name} (Assigned Scope)`
                    : `${bureau.name} (${bureau.count} cases)`
                }
                aria-label={bureau.name}
              >
                <div className={styles.navItemLeft}>
                  <ShieldIcon size={16} />
                  <span className="text-truncate" style={{ maxWidth: '140px' }} title={bureau.name}>
                    {bureau.name}
                  </span>
                </div>
                {isAssigned ? (
                  <span className={styles.navBadge} style={{ background: '#dcfce7', color: '#166534', fontWeight: 700 }}>
                    Assigned
                  </span>
                ) : isRestricted ? (
                  <span style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                    Locked
                  </span>
                ) : (
                  <span className={styles.navBadge}>{bureau.count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          {currentUser && roleMeta && (
            isCollapsed ? (
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: roleMeta.color,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
                title={`${currentUser.name} (${roleMeta.label}) • Click to Sign Out`}
                onClick={() => onLogout?.()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onLogout?.();
                  }
                }}
                aria-label={`Signed in as ${currentUser.name}. Click to sign out.`}
              >
                {currentUser.initials || currentUser.name?.slice(0, 2).toUpperCase()}
              </div>
            ) : (
              <div style={{ marginBottom: '8px', padding: '8px 10px', borderRadius: '8px', background: roleMeta.bgColor, border: `1px solid ${roleMeta.color}22` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: roleMeta.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0 }}>
                    {currentUser.initials || currentUser.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: roleMeta.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
                    <div style={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{roleMeta.label}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { onLogout?.(); }}
                  style={{ marginTop: '8px', width: '100%', padding: '5px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', fontSize: '0.75rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                >
                  Sign Out
                </button>
              </div>
            )
          )}
          <div className={styles.portalBadge} title="Demo Mode Active">
            <span className={styles.liveIndicator} />
            <span>Demo Mode Active</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
