/**
 * AICTE Bureau360 — Centralized Role & Permission Configuration
 * SIH 2026 Problem Statement 26264
 *
 * IMPORTANT:
 * - This is the SINGLE SOURCE OF TRUTH for all role definitions and nav/action visibility.
 * - Never scatter role-name comparisons across components; import from here.
 * - Client-side guards are UI conveniences ONLY. Real authorization must be enforced
 *   server-side once backend contracts are available.
 */

// Role Identifiers
export const ROLES = {
  ADMIN: 'ADMIN',
  OFFICER: 'OFFICER',
  VIEWER: 'VIEWER',
};

// Action Permissions
export const ACTIONS = {
  CREATE_COMPLAINT: 'CREATE_COMPLAINT',
  EDIT_COMPLAINT: 'EDIT_COMPLAINT',
  DELETE_COMPLAINT: 'DELETE_COMPLAINT',
  TRANSFER_COMPLAINT: 'TRANSFER_COMPLAINT',
  UPDATE_STATUS: 'UPDATE_STATUS',
  ADD_NOTE: 'ADD_NOTE',
  ASSIGN_COMPLAINT: 'ASSIGN_COMPLAINT',
  EXPORT_CSV: 'EXPORT_CSV',
  VIEW_REPORTS: 'VIEW_REPORTS',
  VIEW_USER_MANAGEMENT: 'VIEW_USER_MANAGEMENT',
  VIEW_ALL_BUREAUS: 'VIEW_ALL_BUREAUS',
  VIEW_OVERLAP_REVIEW: 'VIEW_OVERLAP_REVIEW',
  VIEW_TRANSFERS: 'VIEW_TRANSFERS',
  VIEW_ALERTS: 'VIEW_ALERTS',
  VIEW_COORDINATION: 'VIEW_COORDINATION',
  VIEW_INSTITUTIONS: 'VIEW_INSTITUTIONS',
};

const ROLE_PERMISSIONS = {
  ADMIN: new Set([
    'CREATE_COMPLAINT','EDIT_COMPLAINT','DELETE_COMPLAINT','TRANSFER_COMPLAINT',
    'UPDATE_STATUS','ADD_NOTE','ASSIGN_COMPLAINT','EXPORT_CSV','VIEW_REPORTS',
    'VIEW_USER_MANAGEMENT','VIEW_ALL_BUREAUS','VIEW_OVERLAP_REVIEW','VIEW_TRANSFERS',
    'VIEW_ALERTS','VIEW_COORDINATION','VIEW_INSTITUTIONS',
  ]),
  OFFICER: new Set([
    'CREATE_COMPLAINT','EDIT_COMPLAINT','TRANSFER_COMPLAINT','UPDATE_STATUS',
    'ADD_NOTE','EXPORT_CSV','VIEW_REPORTS','VIEW_OVERLAP_REVIEW','VIEW_TRANSFERS',
    'VIEW_ALERTS','VIEW_COORDINATION','VIEW_INSTITUTIONS',
  ]),
  VIEWER: new Set([
    'VIEW_REPORTS','VIEW_OVERLAP_REVIEW','VIEW_TRANSFERS','VIEW_ALERTS',
    'VIEW_COORDINATION','VIEW_INSTITUTIONS',
  ]),
};

export function can(role, action) {
  if (!role || !action) return false;
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}

export const NAV_VISIBILITY = {
  dashboard:      ['ADMIN','OFFICER','VIEWER'],
  complaints:     ['ADMIN','OFFICER','VIEWER'],
  new_complaint:  ['ADMIN','OFFICER'],
  institutions:   ['ADMIN','OFFICER','VIEWER'],
  coordination:   ['ADMIN','OFFICER','VIEWER'],
  overlap_review: ['ADMIN','OFFICER','VIEWER'],
  transfers:      ['ADMIN','OFFICER','VIEWER'],
  alerts:         ['ADMIN','OFFICER','VIEWER'],
  reports:        ['ADMIN','OFFICER','VIEWER'],
  user_management:['ADMIN'],
  landing:        ['ADMIN','OFFICER','VIEWER'],
};

export function canAccessTab(role, tab) {
  if (!role || !tab) return false;
  return NAV_VISIBILITY[tab]?.includes(role) ?? false;
}

export const ROLE_META = {
  ADMIN: {
    label: 'Administrator',
    shortLabel: 'Admin',
    description: 'Full access — all bureaus, all complaints, user management.',
    color: '#0d2946',
    bgColor: '#e0f2fe',
    initials: 'AD',
  },
  OFFICER: {
    label: 'Bureau Officer',
    shortLabel: 'Officer',
    description: 'Bureau-scoped operations — complaints, notes, transfers.',
    color: '#166534',
    bgColor: '#f0fdf4',
    initials: 'BO',
  },
  VIEWER: {
    label: 'Viewer',
    shortLabel: 'Viewer',
    description: 'Read-only access — dashboards, reports and case details.',
    color: '#1e40af',
    bgColor: '#eff6ff',
    initials: 'VW',
  },
};
