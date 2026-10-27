'use client';

import React from 'react';
import styles from '../../app/dashboard.module.css';
import { ShieldIcon, UsersIcon, AlertTriangleIcon, CheckCircleIcon, FileTextIcon, ClockIcon } from '../icons/Icons';
import { useAuth } from '../../services/authContext.js';
import { ROLE_META, ROLES } from '../../services/authConfig.js';
import { BUREAUS } from '../../data/mockData';

export function RoleDashboardBanner({ onNavigateTab, onSelectStatus }) {
  const { currentUser, role } = useAuth();
  const roleMeta = role ? ROLE_META[role] : null;
  const officerBureauName = BUREAUS.find((b) => b.id === currentUser?.bureau)?.name || 'Assigned Bureau';

  if (role === ROLES.ADMIN) {
    return (
      <div
        style={{
          padding: '18px 22px',
          background: 'linear-gradient(135deg, #0d2946 0%, #1e3a5f 100%)',
          borderRadius: 'var(--radius-lg)',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(13, 41, 70, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: 'var(--space-4)',
        }}
        role="region"
        aria-label="Administrator Dashboard Scope"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#93c5fd',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                ADMINISTRATOR DASHBOARD
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(217, 99, 22, 0.25)',
                  color: '#fed7aa',
                  border: '1px solid rgba(217, 99, 22, 0.4)',
                }}
              >
                ORGANIZATION-WIDE OVERSIGHT
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '6px 0 2px 0', color: '#ffffff' }}>
              Central Command &amp; Apex Administration
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#cbd5e1', margin: 0, maxWidth: '780px' }}>
              Executive authority across all 14 AICTE bureaus, 148 active dossiers, cross-cell duplicate clustering, and institutional user administration.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => onNavigateTab?.('user_management')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Open Institutional User & Role Administration"
            >
              <UsersIcon size={15} />
              <span>User Management</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab?.('new_complaint')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FileTextIcon size={15} />
              <span>+ Register Complaint</span>
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            fontSize: '0.75rem',
            color: '#cbd5e1',
          }}
        >
          <span>👤 Officer: <strong>{currentUser?.name || 'Administrator'}</strong> ({currentUser?.designation})</span>
          <span>🏛️ Scope: <strong>All AICTE Bureaus</strong> (Cross-bureau selector active)</span>
          <span>🛡️ Permissions: <strong>Full Admin &amp; User Provisioning</strong></span>
        </div>
      </div>
    );
  }

  if (role === ROLES.OFFICER) {
    return (
      <div
        style={{
          padding: '18px 22px',
          background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
          borderRadius: 'var(--radius-lg)',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(22, 101, 52, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: 'var(--space-4)',
        }}
        role="region"
        aria-label="Bureau Officer Dashboard Scope"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  color: '#bbf7d0',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                BUREAU OFFICER DASHBOARD
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                }}
              >
                SCOPED: {officerBureauName.toUpperCase()}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '6px 0 2px 0', color: '#ffffff' }}>
              {officerBureauName} Caseload &amp; Operational Oversight
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#dcfce7', margin: 0, maxWidth: '780px' }}>
              Operational grievance handling, SLA monitoring, and case jurisdiction assigned to {officerBureauName}. All dashboard metrics, status rings, and case registers are strictly scoped to your bureau assignment.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => onNavigateTab?.('new_complaint')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                backgroundColor: '#ffffff',
                color: '#166534',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <FileTextIcon size={15} />
              <span>+ Register Complaint</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectStatus?.('Overdue')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ClockIcon size={15} />
              <span>Overdue SLA</span>
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            fontSize: '0.75rem',
            color: '#dcfce7',
          }}
        >
          <span>👤 Officer: <strong>{currentUser?.name}</strong> ({currentUser?.designation})</span>
          <span>🔒 Bureau Scope: <strong>{officerBureauName} Only</strong> (Cross-bureau selector locked)</span>
          <span>🚫 Access Control: <strong>Administrative User Management is restricted</strong></span>
        </div>
      </div>
    );
  }

  // VIEWER role
  return (
    <div
      style={{
        padding: '18px 22px',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        borderRadius: 'var(--radius-lg)',
        color: '#ffffff',
        boxShadow: '0 4px 16px rgba(30, 64, 175, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: 'var(--space-4)',
      }}
      role="region"
      aria-label="Viewer Dashboard Scope"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: '999px',
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                color: '#bfdbfe',
                border: '1px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              VIEWER DASHBOARD
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: '999px',
                backgroundColor: '#eff6ff',
                color: '#1e40af',
              }}
            >
              READ-ONLY OBSERVER MODE
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '6px 0 2px 0', color: '#ffffff' }}>
            Regulatory &amp; Statutory Oversight Dashboard
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#dbeafe', margin: 0, maxWidth: '780px' }}>
            Authorized read-only access for ministerial observers and governance auditors. View grievance volumes, institutional patterns, and compliance reports. Mutation actions and user management controls are disabled.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => onNavigateTab?.('reports')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              backgroundColor: '#ffffff',
              color: '#1e40af',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span>View Reports</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab?.('overlap_review')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>Inspect Overlaps</span>
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          fontSize: '0.75rem',
          color: '#dbeafe',
        }}
      >
        <span>👤 Observer: <strong>{currentUser?.name}</strong> ({currentUser?.designation})</span>
        <span>🔒 Access Mode: <strong>Read-Only Inspection</strong></span>
        <span>🚫 Mutation Controls: <strong>Create, edit, transfer, status update &amp; user management disabled</strong></span>
      </div>
    </div>
  );
}
