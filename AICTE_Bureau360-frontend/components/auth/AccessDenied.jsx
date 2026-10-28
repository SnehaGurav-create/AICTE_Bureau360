'use client';

/**
 * AICTE Bureau360 — Access Denied Page
 * Shown when a user tries to access a tab their role does not permit.
 */

import React from 'react';
import { useAuth } from '../../services/authContext.js';
import { ROLE_META } from '../../services/authConfig.js';

export function AccessDenied({ attemptedTab, onGoToDashboard, onGoToLogin }) {
  const { currentUser, role, signOut } = useAuth();
  const meta = role ? ROLE_META[role] : null;

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      }}
      role="main"
      aria-labelledby="access-denied-title"
    >
      <div
        style={{
          fontSize: '3.5rem',
          marginBottom: '1.25rem',
          filter: 'grayscale(0.1)',
        }}
        aria-hidden="true"
      >
        🚫
      </div>

      <h1
        id="access-denied-title"
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
        }}
      >
        Access Restricted
      </h1>

      <p style={{ color: '#64748b', fontSize: '0.9375rem', maxWidth: '400px', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        {attemptedTab
          ? <>The <strong>"{attemptedTab}"</strong> section is not available for your current role.</>
          : 'You do not have permission to access this section.'}
      </p>

      {meta && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            background: meta.bgColor,
            color: meta.color,
            fontSize: '0.8125rem',
            fontWeight: 600,
            marginBottom: '2rem',
            border: `1.5px solid ${meta.color}22`,
          }}
        >
          Signed in as: {currentUser?.name} ({meta.label})
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={onGoToDashboard}
          style={{
            padding: '0.6875rem 1.5rem',
            background: 'linear-gradient(135deg, #0d2946, #13385e)',
            color: '#fff',
            border: 'none',
            borderRadius: '9px',
            fontSize: '0.9375rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(13,41,70,0.18)',
          }}
        >
          Go to Dashboard
        </button>
        <button
          type="button"
          onClick={() => { signOut(); onGoToLogin?.(); }}
          style={{
            padding: '0.6875rem 1.5rem',
            background: '#fff',
            color: '#334155',
            border: '1.5px solid #e2e8f0',
            borderRadius: '9px',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>

      <p
        style={{
          marginTop: '2rem',
          fontSize: '0.75rem',
          color: '#94a3b8',
          maxWidth: '360px',
          lineHeight: 1.5,
        }}
      >
        Note: This is a client-side UI guard only. Actual access control will be enforced
        server-side when the real backend is integrated.
      </p>
    </div>
  );
}
