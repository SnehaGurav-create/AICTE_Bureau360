'use client';

/**
 * AICTE Bureau360 — Institutional User & Role Administration View
 * SIH 2026 Problem Statement 26264
 *
 * NOTE: Administrative UI accessible ONLY to ADMIN role.
 * Connects to future backend administrative endpoints (/api/v1/admin/users).
 * Currently displays active demonstration accounts and role permissions.
 */

import React, { useState } from 'react';
import styles from '../../app/dashboard.module.css';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { UsersIcon, ShieldIcon, CheckCircleIcon, AlertTriangleIcon } from '../icons/Icons';
import { DEMO_USERS } from '../../services/demoAuthService.js';
import { ROLE_META, ROLES, ACTIONS } from '../../services/authConfig.js';
import { useAuth } from '../../services/authContext.js';
import { AccessDenied } from '../auth/AccessDenied';

export function UserManagementView({ onNavigateDashboard }) {
  const { role } = useAuth();
  const [toastMessage, setToastMessage] = useState('');

  // Strict page-level authorization check: Only ADMIN role can access User Management
  if (role !== ROLES.ADMIN) {
    return (
      <AccessDenied
        attemptedTab="Institutional User & Role Administration"
        onGoToDashboard={onNavigateDashboard}
      />
    );
  }

  const handleAdminAction = (actionName) => {
    // Defense-in-depth: Verify role before executing any administrative handler
    if (role !== ROLES.ADMIN) {
      setToastMessage('Access Denied: Only Administrator may perform administrative user actions.');
      return;
    }
    setToastMessage(`Administrative action "${actionName}" is simulated in demo mode. Target endpoint POST /api/v1/admin/users is pending backend integration.`);
    setTimeout(() => setToastMessage(''), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {toastMessage && (
        <div style={{ padding: '12px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', color: '#1e40af', fontSize: '0.8125rem' }}>
          ℹ️ {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className={styles.filterToolbar}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
          <div>
            <div className={styles.filterHeading}>
              <UsersIcon size={18} />
              <span>Institutional User & Role Administration</span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                }}
              >
                ADMIN ACCESS ONLY
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Centralized administrative directory for AICTE Nodal Officers, Bureau In-charges, and Ministerial Observers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAdminAction('Provision New Official Account')}
            >
              + Provision Official (API Pending)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAdminAction('Audit Security Access Logs')}
            >
              Audit Trail (API Pending)
            </Button>
          </div>
        </div>
      </div>

      {/* Advisory Banner */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-md)',
          color: '#1e40af',
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
        role="status"
      >
        <ShieldIcon size={18} />
        <div>
          <strong>Backend Integration Notice:</strong> Real user provisioning and permission assignment endpoints (<code>/api/v1/admin/users</code>) are not connected yet. Real production security requires server-side authentication and role-claim validation.
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader
          title="Active System Profiles & Bureau Scoping"
          subtitle="Configured evaluation accounts and role permission scopes"
        />
        <CardContent>
          <div className={styles.tableContainer}>
            <table className={styles.table} style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th className={styles.th}>Official</th>
                  <th className={styles.th}>Email Identifier</th>
                  <th className={styles.th}>Assigned Role</th>
                  <th className={styles.th}>Bureau Scope</th>
                  <th className={styles.th}>Designation</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_USERS.map((user) => {
                  const meta = ROLE_META[user.role];
                  return (
                    <tr key={user.id} className={styles.tr}>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: meta?.color || '#0d2946',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {user.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {user.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className={styles.td}>
                        <code style={{ fontSize: '0.8125rem' }}>{user.email}</code>
                      </td>

                      <td className={styles.td}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: meta?.bgColor || '#f1f5f9',
                            color: meta?.color || '#0f172a',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {meta?.label || user.role}
                        </span>
                      </td>

                      <td className={styles.td}>
                        {user.bureau ? (
                          <Badge variant="warning">Scoped: {user.bureau}</Badge>
                        ) : (
                          <Badge variant="neutral">All Bureaus (Organization-wide)</Badge>
                        )}
                      </td>

                      <td className={styles.td}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {user.designation}
                        </span>
                      </td>

                      <td className={styles.td}>
                        <Badge variant="success">Active (Demo)</Badge>
                      </td>

                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdminAction(`Edit permissions for ${user.name}`)}
                        >
                          Edit Permissions
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
