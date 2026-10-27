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
} from '../icons/Icons';
import { BUREAUS } from '../../data/mockData';

export function Sidebar({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  selectedBureau,
  onSelectBureau,
}) {
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
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
        aria-label="Bureau Navigation"
      >
        <div className={styles.tricolorStrip} />

        <div className={styles.sidebarHeader}>
          <div className={styles.logoMonogram}>360</div>
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle}>
              AICTE Bureau360
            </span>
            <span className={styles.brandSubtitle}>
              Grievance & Overlap Portal
            </span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navSectionLabel}>Core Navigation</div>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'landing' ? styles.navItemActive : ''}`}
            onClick={() => {
              onSelectTab('landing');
              onClose?.();
            }}
            title="Return to the public institutional landing page"
          >
            <div className={styles.navItemLeft}>
              <HomeIcon size={18} />
              <span>Public Portal</span>
            </div>
            <span className={styles.navBadge} style={{ background: '#e0f2fe', color: '#0369a1' }}>
              Home
            </span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.navItemActive : ''}`}
            onClick={() => {
              onSelectTab('dashboard');
              onClose?.();
            }}
          >
            <div className={styles.navItemLeft}>
              <LayersIcon size={18} />
              <span>Dashboard</span>
            </div>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'complaints' && selectedBureau === 'all' ? styles.navItemActive : ''}`}
            onClick={() => {
              onSelectTab('complaints');
              onSelectBureau('all');
              onClose?.();
            }}
          >
            <div className={styles.navItemLeft}>
              <FileTextIcon size={18} />
              <span>Complaints</span>
            </div>
            <span className={styles.navBadge}>148</span>
          </button>

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

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'institutions' ? styles.navItemActive : ''}`}
            onClick={() => {
              onSelectTab('institutions');
              onClose?.();
            }}
          >
            <div className={styles.navItemLeft}>
              <BuildingIcon size={18} />
              <span>Institutions</span>
            </div>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'coordination' ? styles.navItemActive : ''}`}
            onClick={() => {
              onSelectTab('coordination');
              onClose?.();
            }}
          >
            <div className={styles.navItemLeft}>
              <NetworkIcon size={18} />
              <span>Bureau Coordination</span>
            </div>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'overlap_review' ? styles.navItemActive : ''}`}
            onClick={() => {
              onSelectTab('overlap_review');
              onClose?.();
            }}
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
          >
            <div className={styles.navItemLeft}>
              <BarChartIcon size={18} />
              <span>Reports</span>
            </div>
          </button>

          <div className={styles.navSectionLabel}>Filter By AICTE Bureau</div>

          {BUREAUS.filter((b) => b.id !== 'all').map((bureau) => (
            <button
              key={bureau.id}
              type="button"
              className={`${styles.navItem} ${selectedBureau === bureau.id && activeTab === 'complaints' ? styles.navItemActive : ''}`}
              onClick={() => {
                onSelectBureau(bureau.id);
                onSelectTab('complaints');
                onClose?.();
              }}
            >
              <div className={styles.navItemLeft}>
                <ShieldIcon size={16} />
                <span className="text-truncate" style={{ maxWidth: '140px' }} title={bureau.name}>
                  {bureau.name}
                </span>
              </div>
              <span className={styles.navBadge}>{bureau.count}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.portalBadge}>
            <span className={styles.liveIndicator} />
            <span>AICTE Sync: Connected</span>
          </div>
        </div>
      </aside>
    </>
  );
}
