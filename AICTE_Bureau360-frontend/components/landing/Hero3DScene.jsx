'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './landing.module.css';
import {
  FileTextIcon,
  AlertTriangleIcon,
  BuildingIcon,
  UsersIcon,
  CheckCircleIcon,
  NetworkIcon,
} from '../icons/Icons';

export function Hero3DScene({ onCardClick }) {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Subtle Mouse Parallax on Desktop
  const handleMouseMove = useCallback((e) => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const { innerWidth, innerHeight } = window;
    const normX = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
    const normY = (e.clientY / innerHeight - 0.5) * 2; // -1 to 1

    setMouseOffset({
      x: normX * 8, // max 8 deg tilt
      y: -normY * 8,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div className={styles.sceneContainer} aria-label="Interactive 3D AICTE Central Command Illustration">
      {/* Background Soft Atmospheric Ambient Glow */}
      <div className={styles.ambientAtmosphere} aria-hidden="true" />

      <div
        className={styles.scene3D}
        style={{
          transform: `rotateX(${mouseOffset.y}deg) rotateY(${mouseOffset.x}deg)`,
        }}
      >
        {/* ==================================================================
            1. MULTI-TIERED LUMINOUS PLATFORM / PEDESTAL
            ================================================================== */}
        <div className={styles.pedestalAssembly} aria-hidden="true">
          {/* Ground Glow Shadow & Reflection */}
          <div className={styles.groundReflection} />
          {/* Tier 1: Outer base rim */}
          <div className={styles.pedestalTier1} />
          {/* Tier 2: Stepped glowing ring */}
          <div className={styles.pedestalTier2} />
          {/* Tier 3: Upper polished reflection disc with cyan edge light */}
          <div className={styles.pedestalTop} />
          {/* Light Beacon Beam */}
          <div className={styles.pedestalLightBeam} />
        </div>

        {/* ==================================================================
            2. NEOCLASSICAL MINIATURE INSTITUTIONAL BUILDING (AICTE HQ)
            ================================================================== */}
        <div className={styles.buildingWrapper} aria-hidden="true">
          <svg
            className={styles.buildingSvg}
            viewBox="0 0 360 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Building Gradients */}
              <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#f1f5f9" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
              <linearGradient id="domeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="35%" stopColor="#38bdf8" />
                <stop offset="70%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <linearGradient id="pedimentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
              <linearGradient id="columnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="45%" stopColor="#ffffff" />
                <stop offset="80%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
              <linearGradient id="doorLight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0d2946" />
              </linearGradient>
              <filter id="buildingShadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#0d2946" floodOpacity="0.18" />
              </filter>
            </defs>

            <g filter="url(#buildingShadow)">
              {/* Stepped Podium Base */}
              <path d="M40 248 L320 248 L310 236 L50 236 Z" fill="#cbd5e1" />
              <path d="M50 236 L310 236 L300 226 L60 226 Z" fill="#e2e8f0" />
              <path d="M60 226 L300 226 L290 218 L70 218 Z" fill="#f1f5f9" />

              {/* Left Wing */}
              <rect x="52" y="142" width="76" height="76" rx="2" fill="url(#wallGrad)" stroke="#cbd5e1" strokeWidth="1" />
              {/* Left Wing Windows */}
              <rect x="62" y="152" width="16" height="24" rx="8" fill="#0d2946" opacity="0.85" />
              <rect x="86" y="152" width="16" height="24" rx="8" fill="#0d2946" opacity="0.85" />
              <rect x="108" y="152" width="14" height="24" rx="2" fill="#0d2946" opacity="0.85" />
              <rect x="62" y="184" width="16" height="26" rx="2" fill="#0d2946" opacity="0.85" />
              <rect x="86" y="184" width="16" height="26" rx="2" fill="#0d2946" opacity="0.85" />
              <rect x="108" y="184" width="14" height="26" rx="2" fill="#0d2946" opacity="0.85" />

              {/* Right Wing */}
              <rect x="232" y="142" width="76" height="76" rx="2" fill="url(#wallGrad)" stroke="#cbd5e1" strokeWidth="1" />
              {/* Right Wing Windows */}
              <rect x="238" y="152" width="14" height="24" rx="2" fill="#0d2946" opacity="0.85" />
              <rect x="258" y="152" width="16" height="24" rx="8" fill="#0d2946" opacity="0.85" />
              <rect x="282" y="152" width="16" height="24" rx="8" fill="#0d2946" opacity="0.85" />
              <rect x="238" y="184" width="14" height="26" rx="2" fill="#0d2946" opacity="0.85" />
              <rect x="258" y="184" width="16" height="26" rx="2" fill="#0d2946" opacity="0.85" />
              <rect x="282" y="184" width="16" height="26" rx="2" fill="#0d2946" opacity="0.85" />

              {/* Center Portico Building Body */}
              <rect x="120" y="130" width="120" height="88" fill="url(#wallGrad)" stroke="#cbd5e1" strokeWidth="1" />

              {/* Main Entrance Door (Arched with Warm Light) */}
              <path d="M165 218 L165 178 Q180 166 195 178 L195 218 Z" fill="url(#doorLight)" />
              <line x1="180" y1="172" x2="180" y2="218" stroke="#475569" strokeWidth="1" />

              {/* Classical Peristyle Columns (6 Fluted Columns) */}
              <rect x="124" y="142" width="8" height="76" rx="1" fill="url(#columnGrad)" stroke="#94a3b8" strokeWidth="0.5" />
              <rect x="144" y="142" width="8" height="76" rx="1" fill="url(#columnGrad)" stroke="#94a3b8" strokeWidth="0.5" />
              <rect x="164" y="142" width="8" height="76" rx="1" fill="url(#columnGrad)" stroke="#94a3b8" strokeWidth="0.5" />
              <rect x="188" y="142" width="8" height="76" rx="1" fill="url(#columnGrad)" stroke="#94a3b8" strokeWidth="0.5" />
              <rect x="208" y="142" width="8" height="76" rx="1" fill="url(#columnGrad)" stroke="#94a3b8" strokeWidth="0.5" />
              <rect x="228" y="142" width="8" height="76" rx="1" fill="url(#columnGrad)" stroke="#94a3b8" strokeWidth="0.5" />

              {/* Column Entablature / Architrave */}
              <rect x="116" y="136" width="128" height="8" rx="1" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />

              {/* Classical Triangular Pediment with AICTE Inscription */}
              <polygon points="112,136 248,136 180,104" fill="url(#pedimentGrad)" stroke="#cbd5e1" strokeWidth="1" />
              <text
                x="180"
                y="130"
                textAnchor="middle"
                fontSize="11"
                fontWeight="900"
                letterSpacing="3"
                fill="#0f2942"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                AICTE
              </text>

              {/* Drum Rotunda Base (above pediment) */}
              <rect x="150" y="84" width="60" height="22" rx="2" fill="url(#wallGrad)" stroke="#cbd5e1" strokeWidth="1" />
              {/* Clerestory Windows in Rotunda */}
              <rect x="156" y="88" width="6" height="12" rx="3" fill="#0d2946" />
              <rect x="168" y="88" width="6" height="12" rx="3" fill="#0d2946" />
              <rect x="180" y="88" width="6" height="12" rx="3" fill="#0d2946" />
              <rect x="192" y="88" width="6" height="12" rx="3" fill="#0d2946" />
              <rect x="204" y="88" width="6" height="12" rx="3" fill="#0d2946" />

              {/* Classical Ribbed Dome */}
              <path d="M146 84 C146 50, 214 50, 214 84 Z" fill="url(#domeGrad)" stroke="#0284c7" strokeWidth="1" />
              {/* Dome Rib Lines */}
              <path d="M180 52 L180 84" stroke="#e0f2fe" strokeWidth="1" opacity="0.8" />
              <path d="M180 52 Q164 68 160 84" stroke="#e0f2fe" strokeWidth="0.8" opacity="0.6" />
              <path d="M180 52 Q196 68 200 84" stroke="#e0f2fe" strokeWidth="0.8" opacity="0.6" />

              {/* Dome Finial & Lantern Spike */}
              <circle cx="180" cy="50" r="3" fill="#f59e0b" />
              <line x1="180" y1="50" x2="180" y2="42" stroke="#f59e0b" strokeWidth="1.5" />

              {/* Brass Lamp Posts on Steps */}
              <rect x="114" y="210" width="3" height="18" fill="#d97706" />
              <circle cx="115.5" cy="208" r="3.5" fill="#fef08a" />
              <rect x="243" y="210" width="3" height="18" fill="#d97706" />
              <circle cx="244.5" cy="208" r="3.5" fill="#fef08a" />
            </g>
          </svg>
        </div>

        {/* ==================================================================
            3. LUMINOUS HOLOGRAPHIC GLOBE CENTERED ON INDIA
            ================================================================== */}
        <div className={styles.globeAssembly} aria-hidden="true">
          {/* Globe Atmosphere Corona */}
          <div className={styles.globeAtmosphere} />

          {/* Spherical Base */}
          <div className={styles.globeSphere}>
            {/* SVG Map of India & Network Meridians */}
            <svg
              className={styles.globeSvg}
              viewBox="0 0 160 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="sphereGrad" cx="40%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.75" />
                  <stop offset="75%" stopColor="#0284c7" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#082f49" stopOpacity="0.95" />
                </radialGradient>
              </defs>

              {/* Globe Spherical Surface */}
              <circle cx="80" cy="80" r="76" fill="url(#sphereGrad)" />

              {/* Latitude & Longitude Meridians */}
              <ellipse cx="80" cy="80" rx="76" ry="24" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" strokeDasharray="3 3" />
              <ellipse cx="80" cy="80" rx="76" ry="52" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" strokeDasharray="3 3" />
              <ellipse cx="80" cy="80" rx="30" ry="76" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" strokeDasharray="3 3" />
              <ellipse cx="80" cy="80" rx="56" ry="76" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" strokeDasharray="3 3" />

              {/* Stylized Silhouette of India Centered & Glowing */}
              <g className={styles.indiaSilhouette}>
                {/* Simplified geographic geometry of Indian Subcontinent */}
                <path
                  d="M78 35 
                     C80 32, 85 34, 86 38 
                     C88 43, 94 45, 96 48 
                     C100 50, 102 55, 98 58 
                     C94 62, 92 68, 90 74 
                     C88 80, 84 88, 80 96 
                     C78 100, 77 101, 75 97 
                     C72 90, 68 82, 66 75 
                     C64 68, 62 64, 60 59 
                     C58 54, 62 48, 66 45 
                     C70 42, 74 38, 78 35 Z"
                  fill="#ffffff"
                  opacity="0.95"
                  filter="drop-shadow(0 0 6px #38bdf8)"
                />
                {/* Kashmir & Northern Crown Accent */}
                <path d="M76 34 Q80 28 84 34 Z" fill="#ffffff" />
                {/* Gujarat / Western Peninsular projection */}
                <path d="M60 58 Q54 62 61 68 Z" fill="#ffffff" opacity="0.9" />
                {/* North-Eastern States cluster */}
                <path d="M96 48 Q106 50 102 58 Q96 56 94 50 Z" fill="#ffffff" opacity="0.85" />

                {/* Capital New Delhi Nodal Pulse Marker */}
                <circle cx="78" cy="48" r="3.5" fill="#f59e0b" />
                <circle cx="78" cy="48" r="6" stroke="#f59e0b" strokeWidth="1" opacity="0.8" />
              </g>

              {/* Equator Specular Light Arc */}
              <path d="M8 80 Q80 100 152 80" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
            </svg>
          </div>

          {/* Tri-Axial Orbiting Network Rings */}
          <div className={styles.globeRing1}>
            <div className={styles.globeRingNode1} />
          </div>
          <div className={styles.globeRing2}>
            <div className={styles.globeRingNode2} />
          </div>
        </div>

        {/* ==================================================================
            4. FLOATING TRANSLUCENT GLASS DASHBOARD CARDS (WITH DEMO BADGES)
            ================================================================== */}

        {/* Card 1: Top-Left — Total Complaints */}
        <div
          className={`${styles.floatingCard} ${styles.cardTopLeft}`}
          onClick={() => onCardClick?.('complaints')}
          role="button"
          tabIndex={0}
          aria-label="View Total Complaints (2,483 demo records)"
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardIconBlue}>
              <FileTextIcon size={14} />
            </div>
            <span className={styles.cardLabel}>Total Complaints</span>
            <span className={styles.demoBadge}>Demo Data</span>
          </div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>2,483</span>
            <span className={styles.trendUp}>↑ 12%</span>
          </div>
          {/* Micro Sparkline */}
          <svg className={styles.sparkline} viewBox="0 0 60 16">
            <path d="M0 12 Q15 4, 30 10 T60 2" fill="none" stroke="#0284c7" strokeWidth="1.8" />
          </svg>
        </div>

        {/* Card 2: Mid-Left — Priority Cases */}
        <div
          className={`${styles.floatingCard} ${styles.cardMidLeft}`}
          onClick={() => onCardClick?.('alerts')}
          role="button"
          tabIndex={0}
          aria-label="View Priority Cases (312 demo records)"
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardIconAmber}>
              <AlertTriangleIcon size={14} />
            </div>
            <span className={styles.cardLabel}>Priority Cases</span>
            <span className={styles.demoBadge}>Demo Data</span>
          </div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>312</span>
            <span className={styles.trendNeutral}>↑ 8%</span>
          </div>
          {/* Micro Sparkline */}
          <svg className={styles.sparkline} viewBox="0 0 60 16">
            <path d="M0 14 Q20 12, 35 6 T60 4" fill="none" stroke="#d97706" strokeWidth="1.8" />
          </svg>
        </div>

        {/* Card 3: Bottom-Left — Institution Mapping */}
        <div
          className={`${styles.floatingCard} ${styles.cardBottomLeft}`}
          onClick={() => onCardClick?.('institutions')}
          role="button"
          tabIndex={0}
          aria-label="View Institution Mapping (1,024 institutions)"
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardIconIndigo}>
              <BuildingIcon size={14} />
            </div>
            <span className={styles.cardLabel}>Institution Mapping</span>
            <span className={styles.demoBadge}>Demo Data</span>
          </div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>1,024</span>
            <span className={styles.trendUp}>↑ 15%</span>
          </div>
          {/* Micro Bar Chart */}
          <div className={styles.miniBarChart}>
            <span style={{ height: '40%' }} />
            <span style={{ height: '65%' }} />
            <span style={{ height: '85%' }} />
            <span style={{ height: '100%' }} />
          </div>
        </div>

        {/* Card 4: Top-Right — Bureau Workload */}
        <div
          className={`${styles.floatingCard} ${styles.cardTopRight}`}
          onClick={() => onCardClick?.('coordination')}
          role="button"
          tabIndex={0}
          aria-label="View Bureau Workload (12 Bureaus / Cells)"
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardIconTeal}>
              <UsersIcon size={14} />
            </div>
            <span className={styles.cardLabel}>Bureau Workload</span>
            <span className={styles.demoBadge}>Demo Data</span>
          </div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>12</span>
            <span className={styles.cardSubtext}>Bureaus / Cells</span>
          </div>
          {/* Micro Donut Chart */}
          <svg className={styles.miniDonut} viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="10" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
            <circle
              cx="14"
              cy="14"
              r="10"
              fill="none"
              stroke="#0d9488"
              strokeWidth="3.5"
              strokeDasharray="42 20"
              transform="rotate(-90 14 14)"
            />
          </svg>
        </div>

        {/* Card 5: Mid-Right — Resolution Rate */}
        <div
          className={`${styles.floatingCard} ${styles.cardMidRight}`}
          onClick={() => onCardClick?.('reports')}
          role="button"
          tabIndex={0}
          aria-label="View Resolution Rate (78% demo compliance closure rate)"
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardIconGreen}>
              <CheckCircleIcon size={14} />
            </div>
            <span className={styles.cardLabel}>Resolution Rate</span>
            <span className={styles.demoBadge}>Demo Data</span>
          </div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>78%</span>
            <span className={styles.trendUp}>↑ 6%</span>
          </div>
          {/* Micro Sparkline */}
          <svg className={styles.sparkline} viewBox="0 0 60 16">
            <path d="M0 14 L20 10 L40 6 L60 2" fill="none" stroke="#16a34a" strokeWidth="1.8" />
          </svg>
        </div>

        {/* Card 6: Bottom-Right — Overlap Detection */}
        <div
          className={`${styles.floatingCard} ${styles.cardBottomRight}`}
          onClick={() => onCardClick?.('overlap_review')}
          role="button"
          tabIndex={0}
          aria-label="View Overlap Detection (186 Under Review demo cases)"
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardIconPurple}>
              <NetworkIcon size={14} />
            </div>
            <span className={styles.cardLabel}>Overlap Detection</span>
            <span className={styles.demoBadge}>Demo Data</span>
          </div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>186</span>
            <span className={styles.cardSubtext}>Under Review</span>
          </div>
          {/* Micro Wave Chart */}
          <svg className={styles.sparkline} viewBox="0 0 60 16">
            <path d="M0 12 C15 4, 30 14, 45 6 S60 2, 60 2" fill="none" stroke="#7c3aed" strokeWidth="1.8" />
          </svg>
        </div>
      </div>

      {/* Pagination slider dots matching reference design */}
      <div className={styles.carouselIndicators} aria-hidden="true">
        <span className={`${styles.indicatorDash} ${styles.indicatorActive}`} />
        <span className={styles.indicatorDot} />
        <span className={styles.indicatorDot} />
      </div>
    </div>
  );
}
