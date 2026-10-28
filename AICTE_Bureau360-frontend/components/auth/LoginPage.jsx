'use client';

/**
 * AICTE Bureau360 — Login Page Component
 * SIH 2026 Problem Statement 26264
 *
 * DEMO MODE: Uses demoAuthService — no real authentication.
 * All sign-in is local, no passwords are stored or transmitted.
 */

import React, { useState } from 'react';
import styles from './login.module.css';
import { useAuth } from '../../services/authContext.js';
import { ROLES, ROLE_META } from '../../services/authConfig.js';

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

const DEMO_ROLE_OPTIONS = [
  { role: ROLES.AICTE_ADMINISTRATOR, label: 'Administrator', icon: '🛡️', email: 'admin@bureau360.demo' },
  { role: ROLES.REGULATION_BUREAU,   label: 'Regulation Bureau', icon: '⚖️', email: 'regulation@bureau360.demo' },
  { role: ROLES.PGRC,                label: 'PGRC Portal', icon: '📋', email: 'pgrc@bureau360.demo' },
  { role: ROLES.REGIONAL_OFFICE,      label: 'Regional Office', icon: '🏢', email: 'regional.north@bureau360.demo' },
  { role: ROLES.SENIOR_MANAGEMENT,   label: 'Senior Management', icon: '🏛️', email: 'management@bureau360.demo' },
  { role: ROLES.OTHER_BUREAU,        label: 'Other Bureau / Cell', icon: '📁', email: 'officer.approval@bureau360.demo' },
];

export function LoginPage({ onLoginSuccess, onCancel }) {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSelectDemoRole = (role) => {
    setSelectedDemoRole(role);
    const opt = DEMO_ROLE_OPTIONS.find((o) => o.role === role);
    if (opt) {
      setEmail(opt.email);
      setPassword('demo-password');
    }
    setErrorMsg('');
    setFieldErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email or username is required.';
    if (!password) errs.password = 'Password is required.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!selectedDemoRole) {
      setErrorMsg('Please select a demo role above to sign in (DEMO MODE — no real backend is available).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const user = await signIn(selectedDemoRole);
      onLoginSuccess?.(user);
    } catch (err) {
      setErrorMsg(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginRoot}>
      {/* ── Left illustration panel ── */}
      <div className={styles.illustrationPanel} aria-hidden="true">
        <div className={styles.illuOrb + ' ' + styles.illuOrb1} />
        <div className={styles.illuOrb + ' ' + styles.illuOrb2} />
        <div className={styles.illuOrb + ' ' + styles.illuOrb3} />

        <div className={styles.illuCore}>
          <div className={styles.illuCoreRing} />
          <div className={styles.illuCoreRing} />
          <div className={styles.illuCoreRing} />
          <div className={styles.illuCoreCenter}>🏛️</div>
        </div>

        <div className={styles.illuContent}>
          <div className={styles.illuBrand}>
            AICTE <span className={styles.illuBrandAccent}>Bureau360</span>
          </div>
          <p className={styles.illuTagline}>
            Smarter Oversight. Stronger Institutions. Connecting cases. Revealing patterns.
          </p>
          <div className={styles.illuStats}>
            <div className={styles.illuStat}>
              <span className={styles.illuStatNum}>148</span>
              <span className={styles.illuStatLabel}>Cases</span>
            </div>
            <div className={styles.illuStat}>
              <span className={styles.illuStatNum}>14</span>
              <span className={styles.illuStatLabel}>Bureaus</span>
            </div>
            <div className={styles.illuStat}>
              <span className={styles.illuStatNum}>2K+</span>
              <span className={styles.illuStatLabel}>Institutions</span>
            </div>
          </div>
        </div>

        <p className={styles.illuFooterBadge}>
          SIH 2026 • PS 26264 • Demonstration Data
        </p>
      </div>

      {/* ── Right form panel ── */}
      <main className={styles.formPanel}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0 0 12px 0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ← Back to Public Portal
          </button>
        )}
        <div className={styles.formHeader}>
          <div className={styles.formBrandRow}>
            <div className={styles.formBrandMonogram}>360</div>
            <div className={styles.formBrandText}>
              <span className={styles.formBrandName}>AICTE Bureau360</span>
              <span className={styles.formBrandSub}>INTEGRATED GRIEVANCE PORTAL</span>
            </div>
          </div>
          <h1 className={styles.formTitle}>Sign in to your account</h1>
          <p className={styles.formSubtitle}>
            Access your bureau dashboard, complaints and analytical reports.
          </p>
        </div>

        {/* Demo mode notice */}
        <div className={styles.demoBanner} role="status">
          <span className={styles.demoBannerIcon}>⚠️</span>
          <p className={styles.demoBannerText}>
            <span className={styles.demoBannerBold}>DEMO AUTHENTICATION MODE</span> — No backend is connected.
            Select a role below to explore the application. No real credentials are required or stored.
          </p>
        </div>

        {/* Quick role selector */}
        <div className={styles.quickLoginSection}>
          <p className={styles.quickLoginLabel}>Select a demo role to sign in</p>
          <div className={styles.quickLoginGrid}>
            {DEMO_ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.role}
                type="button"
                className={`${styles.quickRoleBtn} ${selectedDemoRole === opt.role ? styles.active : ''}`}
                onClick={() => handleSelectDemoRole(opt.role)}
                aria-pressed={selectedDemoRole === opt.role}
                style={{
                  '--b-color': selectedDemoRole === opt.role ? '#0d2946' : ROLE_META[opt.role].bgColor,
                  '--b-bg': ROLE_META[opt.role].bgColor,
                  '--b-text': ROLE_META[opt.role].color,
                }}
              >
                <span className={styles.quickRoleIcon}>{opt.icon}</span>
                <span className={styles.quickRoleLabel}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.dividerRow}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or sign in with credentials</span>
          <span className={styles.dividerLine} />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="login-email" className={styles.fieldLabel}>
              Email or Username <span className={styles.fieldRequired} aria-hidden>*</span>
            </label>
            <div className={styles.fieldInputWrap}>
              <input
                id="login-email"
                type="email"
                autoComplete="username email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
                className={`${styles.fieldInput} ${fieldErrors.email ? styles.hasError : ''}`}
                placeholder="officer@bureau360.gov.in"
                aria-describedby={fieldErrors.email ? 'login-email-err' : undefined}
                aria-invalid={!!fieldErrors.email}
              />
            </div>
            {fieldErrors.email && (
              <p id="login-email-err" className={styles.fieldError} role="alert">
                ⚠ {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="login-password" className={styles.fieldLabel}>
              Password <span className={styles.fieldRequired} aria-hidden>*</span>
            </label>
            <div className={styles.fieldInputWrap}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
                className={`${styles.fieldInput} ${fieldErrors.password ? styles.hasError : ''}`}
                placeholder="••••••••"
                aria-describedby={fieldErrors.password ? 'login-pw-err' : undefined}
                aria-invalid={!!fieldErrors.password}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                className={styles.fieldPasswordToggle}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {fieldErrors.password && (
              <p id="login-pw-err" className={styles.fieldError} role="alert">
                ⚠ {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.submitSpinner} aria-hidden />
                Signing in…
              </>
            ) : (
              'Sign In to Bureau360'
            )}
          </button>

          {errorMsg && (
            <div className={styles.errorAlert} role="alert">
              <span>⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}
        </form>

        <footer className={styles.formFooter}>
          <p>AICTE Bureau360 — SIH 2026 Problem Statement 26264</p>
          <p>Integrated Complaint &amp; Overlap Tracking Dashboard</p>
          <span className={styles.formFooterBadge}>🔒 Demo Mode Active</span>
        </footer>
      </main>
    </div>
  );
}
