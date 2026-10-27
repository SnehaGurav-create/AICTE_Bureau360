'use client';

import React, { useState } from 'react';
import styles from './landing.module.css';
import { LandingHeader } from './LandingHeader';
import { Hero3DScene } from './Hero3DScene';
import { DashboardPreviewStrip } from './DashboardPreviewStrip';
import { WhySection } from './WhySection';
import {
  SearchIcon,
  NetworkIcon,
  UsersIcon,
  ShieldIcon,
  ArrowRightIcon,
  BuildingIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
} from '../icons/Icons';

export function LandingPage({
  onEnterDashboard,
  onSelectTab,
  onSearch,
  onOpenNotifications,
  onSelectFilter,
}) {
  const [activeNavSection, setActiveNavSection] = useState('home');

  const scrollToSection = (sectionId) => {
    setActiveNavSection(sectionId);
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className={styles.landingWrapper}>
      {/* ==================================================================
          1. LIGHT-THEMED STICKY HEADER
          ================================================================== */}
      <LandingHeader
        onEnterDashboard={onEnterDashboard}
        onSearch={onSearch}
        onOpenNotifications={onOpenNotifications}
        activeSection={activeNavSection}
        onNavigateSection={scrollToSection}
      />

      <main className={styles.mainContent}>
        {/* ==================================================================
            2. HERO SECTION
            ================================================================== */}
        <section className={styles.heroSection} aria-label="Hero Overview">
          <div className={styles.heroContainer}>
            {/* Left Column: Institutional Messaging & Actions */}
            <div className={styles.heroLeft}>
              {/* Institutional Pill Badge */}
              <div className={styles.ministryBadge}>
                <span className={styles.badgeIcon}>🏛️</span>
                <span>AICTE | Ministry of Education, Government of India</span>
              </div>

              {/* Bold Institutional Headline */}
              <h1 className={styles.heroHeadline}>
                Smarter Oversight.
                <br />
                <span className={styles.headlineHighlight}>Stronger Institutions.</span>
              </h1>

              {/* Supporting Institutional Description */}
              <p className={styles.heroDescription}>
                AICTE Bureau360 is an integrated dashboard for monitoring and tracking
                institution-related complaint cases across AICTE bureaus and cells.
              </p>

              {/* 4 Circular Feature Highlights */}
              <div className={styles.featurePillarsRow}>
                <button
                  type="button"
                  className={styles.featureCircleBtn}
                  onClick={() => onSelectTab?.('complaints')}
                  aria-label="Track Complaints"
                >
                  <div className={styles.circleIconWrapper}>
                    <SearchIcon size={18} />
                  </div>
                  <span className={styles.circleIconLabel}>Track Complaints</span>
                </button>

                <button
                  type="button"
                  className={styles.featureCircleBtn}
                  onClick={() => onSelectTab?.('overlap_review')}
                  aria-label="Detect Overlaps"
                >
                  <div className={styles.circleIconWrapper}>
                    <NetworkIcon size={18} />
                  </div>
                  <span className={styles.circleIconLabel}>Detect Overlaps</span>
                </button>

                <button
                  type="button"
                  className={styles.featureCircleBtn}
                  onClick={() => onSelectTab?.('coordination')}
                  aria-label="Coordinate Across Bureaus"
                >
                  <div className={styles.circleIconWrapper}>
                    <UsersIcon size={18} />
                  </div>
                  <span className={styles.circleIconLabel}>Coordinate Across Bureaus</span>
                </button>

                <button
                  type="button"
                  className={styles.featureCircleBtn}
                  onClick={() => onSelectTab?.('dashboard')}
                  aria-label="Enable Faster Resolution"
                >
                  <div className={styles.circleIconWrapper}>
                    <ShieldIcon size={18} />
                  </div>
                  <span className={styles.circleIconLabel}>Enable Faster Resolution</span>
                </button>
              </div>

              {/* Primary Call-to-Action Buttons */}
              <div className={styles.heroActionBtns}>
                <button
                  type="button"
                  className={styles.primaryCtaBtn}
                  onClick={onEnterDashboard}
                >
                  <span>Get Started</span>
                  <ArrowRightIcon size={16} />
                </button>

                <button
                  type="button"
                  className={styles.secondaryCtaBtn}
                  onClick={() => scrollToSection('why-bureau360')}
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Right Column: 3D Spatial Neoclassical Building & Holographic Globe */}
            <div className={styles.heroRight}>
              <Hero3DScene onCardClick={onSelectTab} />
            </div>
          </div>

          {/* Tagline Centered Beneath Hero */}
          <div className={styles.heroTagline}>
            Connecting cases. Revealing patterns. Enabling resolution.
          </div>
        </section>

        {/* ==================================================================
            3. DASHBOARD METRICS PREVIEW STRIP
            ================================================================== */}
        <DashboardPreviewStrip onSelectFilter={onSelectFilter} />

        {/* ==================================================================
            4. WHY AICTE BUREAU360? SECTION
            ================================================================== */}
        <WhySection onLearnMoreTab={onSelectTab} />

        {/* ==================================================================
            5. ABOUT SECTION (Institutional Mandate)
            ================================================================== */}
        <section id="about" className={styles.aboutSection} aria-label="About AICTE Bureau360">
          <div className={styles.aboutContainer}>
            <div className={styles.aboutHeader}>
              <span className={styles.aboutSuper}>Institutional Context</span>
              <h2 className={styles.aboutTitle}>Unified Governance Across AICTE Bureaus</h2>
              <p className={styles.aboutSubtitle}>
                Empowering technical education governance through coordinated case management,
                automated correlation detection, and multi-bureau accountability.
              </p>
            </div>

            <div className={styles.bureauGrid}>
              <div className={styles.bureauCard}>
                <div className={styles.bureauBadge}>AB</div>
                <h3 className={styles.bureauName}>Approval Bureau</h3>
                <p className={styles.bureauText}>
                  Validates institutional compliance, faculty ratios, infrastructure mandates,
                  and Extension of Approval (EOA) disclosures.
                </p>
              </div>

              <div className={styles.bureauCard}>
                <div className={styles.bureauBadge} style={{ background: '#e0e7ff', color: '#3730a3' }}>
                  GRC
                </div>
                <h3 className={styles.bureauName}>Grievance Redressal Cell</h3>
                <p className={styles.bureauText}>
                  Processes complaints from students, faculty, and stakeholders with strict SLA
                  tracking and whistleblower confidentiality.
                </p>
              </div>

              <div className={styles.bureauCard}>
                <div className={styles.bureauBadge} style={{ background: '#fef3c7', color: '#92400e' }}>
                  VC
                </div>
                <h3 className={styles.bureauName}>Vigilance & Inspection</h3>
                <p className={styles.bureauText}>
                  Conducts surprise inspections, forensic audits, and inquiries into fictitious
                  faculty rosters and capitation fees.
                </p>
              </div>

              <div className={styles.bureauCard}>
                <div className={styles.bureauBadge} style={{ background: '#dcfce7', color: '#166534' }}>
                  SDC
                </div>
                <h3 className={styles.bureauName}>Student Development Cell</h3>
                <p className={styles.bureauText}>
                  Monitors student welfare, scholarship disbursements, harassment redressal, and
                  institutional refund compliance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            6. CONTACT & NODAL OFFICE SECTION
            ================================================================== */}
        <section id="contact" className={styles.contactSection} aria-label="Official Contact Information">
          <div className={styles.contactContainer}>
            <div className={styles.contactCard}>
              <div className={styles.contactDetails}>
                <h2 className={styles.contactTitle}>AICTE Central Grievance Cell</h2>
                <p className={styles.contactAddress}>
                  Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070
                </p>
                <div className={styles.contactMeta}>
                  <span>📞 Nodal Helpline: 011-29581000</span>
                  <span>✉️ Email: grievance@aicte-india.org</span>
                  <span>🛡️ Whistleblower Protection: Confidentiality Tier 1 Active</span>
                </div>
              </div>

              <div className={styles.contactAction}>
                <button
                  type="button"
                  className={styles.contactCtaBtn}
                  onClick={() => onSelectTab?.('new_complaint')}
                >
                  <span>Submit Institutional Petition</span>
                  <ExternalLinkIcon size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Decorative Neoclassical Watermark Background Motifs */}
      <div className={styles.bottomWatermarkRight} aria-hidden="true" />
      <div className={styles.bottomWaveLeft} aria-hidden="true" />

      {/* ==================================================================
          7. FOOTER
          ================================================================== */}
      <footer className={styles.landingFooter}>
        <div className={styles.footerContainer}>
          <div className={styles.footerLeft}>
            <div className={styles.footerBrand}>
              <span style={{ fontWeight: 800 }}>AICTE Bureau360</span> — Smart India Hackathon 2026 (Problem Statement 26264)
            </div>
            <div className={styles.footerLegal}>
              All India Council for Technical Education • Ministry of Education, Government of India.
              Demonstration environment. Synthetic fixtures for evaluation.
            </div>
          </div>

          <div className={styles.footerRight}>
            <button
              type="button"
              className={styles.footerLink}
              onClick={() => scrollToSection('home')}
            >
              Back to Top ↑
            </button>
            <button
              type="button"
              className={styles.footerLink}
              onClick={onEnterDashboard}
            >
              Central Command Dashboard →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
