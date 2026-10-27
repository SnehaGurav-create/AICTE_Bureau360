'use client';

import React from 'react';
import styles from '../../app/dashboard.module.css';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ShieldIcon, UserIcon, CheckCircleIcon, ClockIcon } from '../icons/Icons';
import { useAuth } from '../../services/authContext.js';
import { ROLE_META } from '../../services/authConfig.js';
import { BUREAUS } from '../../data/mockData.js';

export function UserProfileView({ onNavigateDashboard }) {
  const { currentUser, role } = useAuth();
  const roleMeta = role ? ROLE_META[role] : null;

  // Resolve bureau name if assigned
  const assignedBureau = currentUser?.bureau
    ? BUREAUS.find((b) => b.id === currentUser.bureau)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* 1. Header Banner */}
      <div className={styles.filterToolbar}>
        <div>
          <div className={styles.filterHeading}>
            <UserIcon size={20} />
            <span>User Profile</span>
            {roleMeta && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: roleMeta.bgColor,
                  color: roleMeta.color,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {roleMeta.label}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            System identity, administrative role assignment, and jurisdictional scope.
          </p>
        </div>
        <div>
          {onNavigateDashboard && (
            <Button variant="outline" size="sm" onClick={onNavigateDashboard}>
              ← Return to Dashboard
            </Button>
          )}
        </div>
      </div>

      {/* 2. Main Profile Card */}
      <Card>
        <CardHeader
          title="Account Details"
          subtitle="Basic available profile parameters for the active authenticated session"
        />
        <CardContent>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {/* User Avatar Circle */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: roleMeta?.color || '#0d2946',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                flexShrink: 0,
              }}
            >
              {currentUser?.initials || currentUser?.name?.slice(0, 2).toUpperCase() || 'AO'}
            </div>

            {/* Basic Info Header */}
            <div style={{ flex: 1, minWidth: '240px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-primary)', margin: '0 0 4px 0' }}>
                {currentUser?.name || 'Authorized AICTE Officer'}
              </h2>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {currentUser?.designation || 'Institutional Officer'}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Badge variant="primary">AICTE HQ New Delhi</Badge>
                <Badge variant={role === 'ADMIN' ? 'warning' : role === 'OFFICER' ? 'success' : 'neutral'}>
                  {roleMeta?.label || role}
                </Badge>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#059669',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                  Session Active
                </span>
              </div>
            </div>
          </div>

          {/* Details Field Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                Display Name
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentUser?.name || 'Not Available'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                Assigned Role
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: roleMeta?.color || 'var(--text-primary)' }}>
                {roleMeta?.label || role}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                Official Designation
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentUser?.designation || 'Not specified'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                User Identifier
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {currentUser?.id || currentUser?.username || 'usr-aicte-demo'}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                Jurisdictional Bureau Scope
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldIcon size={16} />
                <span>
                  {role === 'OFFICER' && assignedBureau
                    ? `${assignedBureau.name} (${assignedBureau.code}) — Scope Locked`
                    : role === 'ADMIN'
                    ? 'All AICTE Statutory Bureaus & Administrative Directorates (Unrestricted Oversight)'
                    : 'All AICTE Bureaus (Read-Only Observer)'}
                </span>
              </div>
              {role === 'OFFICER' && assignedBureau && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                  Officer access is restricted to complaints assigned or co-directed under {assignedBureau.name}.
                </p>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                Authentication Type
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Demo Authentication Mode (Synthetic session credentials for SIH 2026 Problem Statement 26264 evaluation).
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserProfileView;
