'use client';

import React, { useState } from 'react';
import styles from '../../app/dashboard.module.css';
import {
  ShieldIcon,
  UsersIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  FileTextIcon,
  ClockIcon,
  NetworkIcon,
  BarChartIcon,
  BuildingIcon,
} from '../icons/Icons';
import { useAuth } from '../../services/authContext.js';
import { ROLE_META, ROLES } from '../../services/authConfig.js';
import { BUREAUS } from '../../data/mockData';

export function RoleDashboardBanner({ onNavigateTab, onSelectStatus }) {
  const { currentUser, role } = useAuth();
  const [docUploadNotice, setDocUploadNotice] = useState(false);

  const handleDocPlaceholderClick = () => {
    setDocUploadNotice(true);
    setTimeout(() => setDocUploadNotice(false), 5000);
  };

  // 1. AICTE Administrator Portal Banner
  if (role === ROLES.AICTE_ADMINISTRATOR) {
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
        aria-label="AICTE Administrator Portal Scope"
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
                AICTE ADMINISTRATOR PORTAL
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
                SYSTEM-WIDE COMPLAINT SUMMARY &amp; USER ADMIN
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '6px 0 2px 0', color: '#ffffff' }}>
              Central Command &amp; Apex Administration
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#cbd5e1', margin: 0, maxWidth: '780px' }}>
              Full administrative access across all 14 AICTE bureaus, 18 active dossiers, cross-bureau overlap clustering, SLA rules, and institutional user administration.
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
          <span>👤 Administrator: <strong>{currentUser?.name}</strong> ({currentUser?.designation})</span>
          <span>🏛️ Scope: <strong>Organization-Wide (All Bureaus)</strong></span>
          <span>🛡️ Authority: <strong>User &amp; Role Management • SLA Configuration</strong></span>
        </div>
      </div>
    );
  }

  // 2. Regulation Bureau (RB) Portal Banner
  if (role === ROLES.REGULATION_BUREAU) {
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
        aria-label="Regulation Bureau Portal Scope"
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
                REGULATION BUREAU (RB) PORTAL
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
                SCOPED: REGULATION &amp; APPROVAL CASELOAD
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '6px 0 2px 0', color: '#ffffff' }}>
              Regulation Bureau (RB) Caseload &amp; Compliance Hub
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#dcfce7', margin: 0, maxWidth: '780px' }}>
              View cases assigned to the Regulation Bureau. Update case status and action history, review related cross-bureau links, record coordination remarks, and monitor statutory deadlines.
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
              <span>+ Register Case</span>
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
              <span>Upcoming Deadlines</span>
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
          <span>🔒 Jurisdiction: <strong>Regulation Bureau (RB) Assigned Dockets</strong></span>
          <span>🚫 Access Policy: <strong>No User Management • No Global Configuration</strong></span>
        </div>
      </div>
    );
  }

  // 3. PGRC Portal Banner
  if (role === ROLES.PGRC) {
    return (
      <div
        style={{
          padding: '18px 22px',
          background: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)',
          borderRadius: 'var(--radius-lg)',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(154, 52, 18, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: 'var(--space-4)',
        }}
        role="region"
        aria-label="PGRC Portal Scope"
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
                  color: '#fed7aa',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                PGRC PORTAL
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  backgroundColor: '#ffedd5',
                  color: '#9a3412',
                }}
              >
                PUBLIC GRIEVANCE REDRESSAL CELL
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '6px 0 2px 0', color: '#ffffff' }}>
              Public Grievance Redressal Cell (PGRC) Processing Portal
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#ffedd5', margin: 0, maxWidth: '780px' }}>
              View and process PGRC complaints, track pending and disposed grievances, evaluate potential overlaps with Regulation Bureau, request joint coordination, and record follow-up actions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => onNavigateTab?.('overlap_review')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                backgroundColor: '#ffffff',
                color: '#9a3412',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <AlertTriangleIcon size={15} />
              <span>Review Potential Overlaps</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab?.('new_complaint')}
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
              <FileTextIcon size={15} />
              <span>+ PGRC Intake</span>
            </button>
          </div>
        </div>

        {/* Special Overlap Advisory Requirement */}
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid #f97316',
            fontSize: '0.75rem',
            color: '#ffedd5',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangleIcon size={14} style={{ color: '#fdba74', flexShrink: 0 }} />
          <span>
            <strong>Mandatory Overlap Protocol:</strong> A potential overlap detected by the correlation engine must NOT automatically be treated as a confirmed duplicate. Review side-by-side evidence before initiating joint inquiries.
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            fontSize: '0.75rem',
            color: '#fed7aa',
          }}
        >
          <span>👤 Officer: <strong>{currentUser?.name}</strong> ({currentUser?.designation})</span>
          <span>📋 Scope: <strong>Grievance Redressal Cell (PGRC)</strong></span>
          <span>🚫 Access Policy: <strong>No User Management • No Cross-Bureau Data Exposure</strong></span>
        </div>
      </div>
    );
  }

  // 4. Regional Office Portal Banner
  if (role === ROLES.REGIONAL_OFFICE) {
    return (
      <div
        style={{
          padding: '18px 22px',
          background: 'linear-gradient(135deg, #312e81 0%, #3730a3 100%)',
          borderRadius: 'var(--radius-lg)',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(49, 46, 129, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: 'var(--space-4)',
        }}
        role="region"
        aria-label="Regional Office Portal Scope"
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
                  color: '#c7d2fe',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                REGIONAL OFFICE PORTAL
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  backgroundColor: '#e0e7ff',
                  color: '#3730a3',
                }}
              >
                ASSIGNED: NORTHERN REGIONAL JURISDICTION (NRO)
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '6px 0 2px 0', color: '#ffffff' }}>
              Northern Regional Office (NRO) Verification &amp; Inspection Hub
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#e0e7ff', margin: 0, maxWidth: '780px' }}>
              View cases relevant to the Northern Region. Track verification and field inspection progress, record inspection remarks, view regional workload summaries, and upload supporting affidavits.
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
                color: '#3730a3',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <BarChartIcon size={15} />
              <span>Regional Workload</span>
            </button>
            <button
              type="button"
              onClick={handleDocPlaceholderClick}
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
              title="Regional Supporting Document Upload (Integration Placeholder)"
            >
              <span>+ Upload Inspection Document (Demo)</span>
            </button>
          </div>
        </div>

        {docUploadNotice && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              color: '#e0e7ff',
            }}
          >
            ℹ️ <strong>Document Upload Integration Placeholder:</strong> Document ingestion endpoint (<code>POST /api/v1/regional/inspections/documents</code>) is pending backend integration. Demo inspection document metadata recorded locally.
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            fontSize: '0.75rem',
            color: '#c7d2fe',
          }}
        >
          <span>👤 Regional Officer: <strong>{currentUser?.name}</strong> ({currentUser?.designation})</span>
          <span>📍 Jurisdiction: <strong>Northern Region (UP, Punjab, Rajasthan, Uttarakhand, Delhi, Assam, Bihar)</strong></span>
          <span>🚫 Access Policy: <strong>No User Management • No Cross-Regional Exposure</strong></span>
        </div>
      </div>
    );
  }

  // 5. Senior Management / Competent Authority Portal Banner
  if (role === ROLES.SENIOR_MANAGEMENT) {
    return (
      <div
        style={{
          padding: '18px 22px',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: 'var(--radius-lg)',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: 'var(--space-4)',
        }}
        role="region"
        aria-label="Senior Management Portal Scope"
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
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                SENIOR MANAGEMENT PORTAL
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a',
                }}
              >
                COMPETENT AUTHORITY OVERSIGHT (READ-ONLY)
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '6px 0 2px 0', color: '#ffffff' }}>
              Executive Governance, Disposal Trends &amp; Overlap Patterns
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#cbd5e1', margin: 0, maxWidth: '780px' }}>
              High-level statutory oversight for Competent Authorities. Monitor organization-wide performance KPIs, disposal trends, overdue escalated complaints, recurring overlap patterns, and bureau workload comparisons.
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
                color: '#0f172a',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <BarChartIcon size={15} />
              <span>Management Reports</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab?.('overlap_review')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <AlertTriangleIcon size={15} />
              <span>Recurring Overlaps</span>
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
          <span>👤 Executive: <strong>{currentUser?.name}</strong> ({currentUser?.designation})</span>
          <span>🏛️ Mode: <strong>Read-Only Governance Overview</strong></span>
          <span>🚫 Access Policy: <strong>No User Management • No System Configuration • Mutations Disabled</strong></span>
        </div>
      </div>
    );
  }

  return null;
}
