'use client';

import React, { useState } from 'react';
import styles from './landing.module.css';
import { SearchIcon, BellIcon, UserIcon } from '../icons/Icons';

export function LandingHeader({
  onEnterDashboard,
  onSearch,
  onOpenNotifications,
  activeSection = 'home',
  onNavigateSection,
}) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch?.(searchInput.trim());
    }
  };

  return (
    <header className={styles.landingHeader}>
      <div className={styles.headerContainer}>
        {/* ==================================================================
            LEFT: AICTE SEAL & BUREAU360 BRANDING
            ================================================================== */}
        <div className={styles.brandContainer}>
          {/* AICTE Emblem / Insignia SVG */}
          <div className={styles.sealWrapper} aria-hidden="true">
            <svg viewBox="0 0 44 44" width="40" height="40" fill="none">
              <circle cx="22" cy="22" r="20" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
              {/* Radiating 24 Solar Rays */}
              {Array.from({ length: 24 }).map((_, i) => (
                <line
                  key={i}
                  x1="22"
                  y1="3"
                  x2="22"
                  y2="6"
                  stroke="#d97706"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  transform={`rotate(${i * 15} 22 22)`}
                />
              ))}
              {/* Center Dharma Chakra Wheel */}
              <circle cx="22" cy="22" r="12" fill="#ffffff" stroke="#0d2946" strokeWidth="1.5" />
              <circle cx="22" cy="22" r="3" fill="#0d2946" />
              {Array.from({ length: 12 }).map((_, i) => (
                <line
                  key={i}
                  x1="22"
                  y1="10"
                  x2="22"
                  y2="22"
                  stroke="#0d2946"
                  strokeWidth="0.8"
                  transform={`rotate(${i * 30} 22 22)`}
                />
              ))}
            </svg>
          </div>

          <div className={styles.brandTitles}>
            <div className={styles.brandMainTitle}>
              <span className={styles.brandAicte}>AICTE</span>{' '}
              <span className={styles.brandBureau}>Bureau</span>
              <span className={styles.brand360}>360</span>
            </div>
            <div className={styles.brandSubtitle}>
              Complaint Monitoring & Coordination
            </div>
          </div>
        </div>

        {/* ==================================================================
            CENTER: NAVIGATION LINKS (Home, About, Features, Contact)
            ================================================================== */}
        <nav className={styles.headerNav} aria-label="Portal Navigation">
          <button
            type="button"
            className={`${styles.navLink} ${activeSection === 'home' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigateSection?.('home')}
          >
            Home
            {activeSection === 'home' && <span className={styles.activeIndicator} />}
          </button>
          <button
            type="button"
            className={`${styles.navLink} ${activeSection === 'about' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigateSection?.('about')}
          >
            About
            {activeSection === 'about' && <span className={styles.activeIndicator} />}
          </button>
          <button
            type="button"
            className={`${styles.navLink} ${activeSection === 'features' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigateSection?.('features')}
          >
            Features
            {activeSection === 'features' && <span className={styles.activeIndicator} />}
          </button>
          <button
            type="button"
            className={`${styles.navLink} ${activeSection === 'contact' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigateSection?.('contact')}
          >
            Contact
            {activeSection === 'contact' && <span className={styles.activeIndicator} />}
          </button>
        </nav>

        {/* ==================================================================
            RIGHT: SEARCH, NOTIFICATIONS & LOGIN
            ================================================================== */}
        <div className={styles.headerActions}>
          {/* Functional Search Field */}
          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <span className={styles.searchIcon} aria-hidden="true">
              <SearchIcon size={15} />
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search institutions, cases, or IDs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search institutions, cases, or IDs in AICTE Bureau360"
            />
          </form>

          {/* 14 Alerts Notification Bell */}
          <button
            type="button"
            className={styles.notificationBtn}
            onClick={onOpenNotifications}
            aria-label="14 Cross-Bureau Overlap Alerts"
            title="14 Cross-Bureau Overlap Alerts"
          >
            <BellIcon size={18} />
            <span className={styles.notificationBadge}>14</span>
          </button>

          {/* Login Button */}
          <button
            type="button"
            className={styles.loginBtn}
            onClick={onEnterDashboard}
            aria-label="Login to AICTE Central Command"
          >
            <UserIcon size={15} />
            <span>Login</span>
          </button>
        </div>
      </div>
    </header>
  );
}
