/**
 * AICTE Bureau360 — Centralized Role & Permission Configuration
 * SIH 2026 Problem Statement 26264
 *
 * OFFICIAL ROLES (Five Portals):
 * 1. AICTE_ADMINISTRATOR  — Full administrative access, user management, SLA config.
 * 2. REGULATION_BUREAU    — Regulation Bureau caseload, status updates, coordination remarks.
 * 3. PGRC                 — Public Grievance Redressal Cell, overlap review, follow-ups.
 * 4. REGIONAL_OFFICE      — Region-specific cases, inspection progress, document UI.
 * 5. SENIOR_MANAGEMENT    — Read-only apex governance, performance KPIs, disposal trends.
 *
 * IMPORTANT:
 * - This is the SINGLE SOURCE OF TRUTH for all role definitions and nav/action visibility.
 * - The VIEWER role has been completely eliminated from the frontend role system.
 * - Client-side guards are UI conveniences ONLY. Real authorization must be enforced
 *   server-side once backend contracts are available.
 */

// Six Official Role Identifiers
export const ROLES = {
  AICTE_ADMINISTRATOR: 'AICTE_ADMINISTRATOR',
  REGULATION_BUREAU: 'REGULATION_BUREAU',
  PGRC: 'PGRC',
  REGIONAL_OFFICE: 'REGIONAL_OFFICE',
  SENIOR_MANAGEMENT: 'SENIOR_MANAGEMENT',
  OTHER_BUREAU: 'OTHER_BUREAU',
};

// Action Permissions
export const ACTIONS = {
  // Administrative
  VIEW_USER_MANAGEMENT: 'VIEW_USER_MANAGEMENT',
  MANAGE_USERS: 'MANAGE_USERS',
  CONFIGURE_SLA: 'CONFIGURE_SLA',
  VIEW_ALL_BUREAUS: 'VIEW_ALL_BUREAUS',

  // Complaint Lifecycle & Operations
  CREATE_COMPLAINT: 'CREATE_COMPLAINT',
  EDIT_COMPLAINT: 'EDIT_COMPLAINT',
  DELETE_COMPLAINT: 'DELETE_COMPLAINT',
  TRANSFER_COMPLAINT: 'TRANSFER_COMPLAINT',
  UPDATE_STATUS: 'UPDATE_STATUS',
  ADD_NOTE: 'ADD_NOTE',
  ASSIGN_COMPLAINT: 'ASSIGN_COMPLAINT',

  // Inspection & Regional Operations
  VERIFY_INSPECTION: 'VERIFY_INSPECTION',
  UPLOAD_REGIONAL_DOCUMENTS: 'UPLOAD_REGIONAL_DOCUMENTS',

  // Coordination & Overlap
  REQUEST_COORDINATION: 'REQUEST_COORDINATION',
  VIEW_OVERLAP_REVIEW: 'VIEW_OVERLAP_REVIEW',
  VIEW_TRANSFERS: 'VIEW_TRANSFERS',
  VIEW_ALERTS: 'VIEW_ALERTS',
  VIEW_COORDINATION: 'VIEW_COORDINATION',

  // Reporting & Information
  VIEW_REPORTS: 'VIEW_REPORTS',
  VIEW_INSTITUTIONS: 'VIEW_INSTITUTIONS',
  EXPORT_CSV: 'EXPORT_CSV',

  // Semantics Aliases
  VIEW_ALL_COMPLAINTS: 'VIEW_ALL_BUREAUS',
  REVIEW_OVERLAPS: 'VIEW_OVERLAP_REVIEW',
  RECORD_COORDINATION: 'REQUEST_COORDINATION',
  INSPECT_CASES: 'VERIFY_INSPECTION',
  UPLOAD_DOCUMENTS: 'UPLOAD_REGIONAL_DOCUMENTS',
  VIEW_ALL_REPORTS: 'VIEW_REPORTS',
};

// Centralized Role Permissions Mapping
export const ROLE_PERMISSIONS = {
  AICTE_ADMINISTRATOR: new Set([
    ACTIONS.VIEW_USER_MANAGEMENT,
    ACTIONS.MANAGE_USERS,
    ACTIONS.CONFIGURE_SLA,
    ACTIONS.VIEW_ALL_BUREAUS,
    ACTIONS.CREATE_COMPLAINT,
    ACTIONS.EDIT_COMPLAINT,
    ACTIONS.DELETE_COMPLAINT,
    ACTIONS.TRANSFER_COMPLAINT,
    ACTIONS.UPDATE_STATUS,
    ACTIONS.ADD_NOTE,
    ACTIONS.ASSIGN_COMPLAINT,
    ACTIONS.VERIFY_INSPECTION,
    ACTIONS.UPLOAD_REGIONAL_DOCUMENTS,
    ACTIONS.REQUEST_COORDINATION,
    ACTIONS.VIEW_OVERLAP_REVIEW,
    ACTIONS.VIEW_TRANSFERS,
    ACTIONS.VIEW_ALERTS,
    ACTIONS.VIEW_COORDINATION,
    ACTIONS.VIEW_REPORTS,
    ACTIONS.VIEW_INSTITUTIONS,
    ACTIONS.EXPORT_CSV,
  ]),

  REGULATION_BUREAU: new Set([
    ACTIONS.CREATE_COMPLAINT,
    ACTIONS.EDIT_COMPLAINT,
    ACTIONS.TRANSFER_COMPLAINT,
    ACTIONS.UPDATE_STATUS,
    ACTIONS.ADD_NOTE,
    ACTIONS.REQUEST_COORDINATION,
    ACTIONS.VIEW_OVERLAP_REVIEW,
    ACTIONS.VIEW_TRANSFERS,
    ACTIONS.VIEW_ALERTS,
    ACTIONS.VIEW_COORDINATION,
    ACTIONS.VIEW_REPORTS,
    ACTIONS.VIEW_INSTITUTIONS,
    ACTIONS.EXPORT_CSV,
  ]),

  PGRC: new Set([
    ACTIONS.CREATE_COMPLAINT,
    ACTIONS.EDIT_COMPLAINT,
    ACTIONS.UPDATE_STATUS,
    ACTIONS.ADD_NOTE,
    ACTIONS.REQUEST_COORDINATION,
    ACTIONS.VIEW_OVERLAP_REVIEW,
    ACTIONS.VIEW_TRANSFERS,
    ACTIONS.VIEW_ALERTS,
    ACTIONS.VIEW_COORDINATION,
    ACTIONS.VIEW_REPORTS,
    ACTIONS.VIEW_INSTITUTIONS,
    ACTIONS.EXPORT_CSV,
  ]),

  REGIONAL_OFFICE: new Set([
    ACTIONS.UPDATE_STATUS,
    ACTIONS.ADD_NOTE,
    ACTIONS.VERIFY_INSPECTION,
    ACTIONS.UPLOAD_REGIONAL_DOCUMENTS,
    ACTIONS.VIEW_ALERTS,
    ACTIONS.VIEW_COORDINATION,
    ACTIONS.VIEW_REPORTS,
    ACTIONS.VIEW_INSTITUTIONS,
    ACTIONS.EXPORT_CSV,
  ]),

  SENIOR_MANAGEMENT: new Set([
    // Read-only executive governance permissions
    ACTIONS.VIEW_ALL_BUREAUS,
    ACTIONS.VIEW_OVERLAP_REVIEW,
    ACTIONS.VIEW_TRANSFERS,
    ACTIONS.VIEW_ALERTS,
    ACTIONS.VIEW_COORDINATION,
    ACTIONS.VIEW_REPORTS,
    ACTIONS.VIEW_INSTITUTIONS,
    ACTIONS.EXPORT_CSV,
  ]),

  OTHER_BUREAU: new Set([
    // Scoped to assigned bureau (covers additional departments without separate dashboards)
    ACTIONS.CREATE_COMPLAINT,
    ACTIONS.EDIT_COMPLAINT,
    ACTIONS.TRANSFER_COMPLAINT,
    ACTIONS.UPDATE_STATUS,
    ACTIONS.ADD_NOTE,
    ACTIONS.REQUEST_COORDINATION,
    ACTIONS.VIEW_OVERLAP_REVIEW,
    ACTIONS.VIEW_TRANSFERS,
    ACTIONS.VIEW_ALERTS,
    ACTIONS.VIEW_COORDINATION,
    ACTIONS.VIEW_REPORTS,
    ACTIONS.VIEW_INSTITUTIONS,
    ACTIONS.EXPORT_CSV,
  ]),
};

/**
 * Evaluates whether a role is permitted to perform a specific action.
 *
 * @param {string} role - One of the five official ROLES
 * @param {string} action - One of ACTIONS
 * @returns {boolean}
 */
export function can(role, action) {
  if (!role || !action) return false;
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}

export const hasPermission = can;

// Navigation Tab Visibility Matrix for the Six Official Portals
export const NAV_VISIBILITY = {
  dashboard:      ['AICTE_ADMINISTRATOR', 'REGULATION_BUREAU', 'PGRC', 'REGIONAL_OFFICE', 'SENIOR_MANAGEMENT', 'OTHER_BUREAU'],
  complaints:     ['AICTE_ADMINISTRATOR', 'REGULATION_BUREAU', 'PGRC', 'REGIONAL_OFFICE', 'SENIOR_MANAGEMENT', 'OTHER_BUREAU'],
  new_complaint:  ['AICTE_ADMINISTRATOR', 'REGULATION_BUREAU', 'PGRC', 'OTHER_BUREAU'],
  institutions:   ['AICTE_ADMINISTRATOR', 'REGULATION_BUREAU', 'PGRC', 'REGIONAL_OFFICE', 'SENIOR_MANAGEMENT', 'OTHER_BUREAU'],
  coordination:   ['AICTE_ADMINISTRATOR', 'REGULATION_BUREAU', 'PGRC', 'REGIONAL_OFFICE', 'SENIOR_MANAGEMENT', 'OTHER_BUREAU'],
  overlap_review: ['AICTE_ADMINISTRATOR', 'REGULATION_BUREAU', 'PGRC', 'REGIONAL_OFFICE', 'SENIOR_MANAGEMENT', 'OTHER_BUREAU'],
  transfers:      ['AICTE_ADMINISTRATOR', 'REGULATION_BUREAU', 'PGRC', 'REGIONAL_OFFICE', 'SENIOR_MANAGEMENT', 'OTHER_BUREAU'],
  alerts:         ['AICTE_ADMINISTRATOR', 'REGULATION_BUREAU', 'PGRC', 'REGIONAL_OFFICE', 'SENIOR_MANAGEMENT', 'OTHER_BUREAU'],
  reports:        ['AICTE_ADMINISTRATOR', 'REGULATION_BUREAU', 'PGRC', 'REGIONAL_OFFICE', 'SENIOR_MANAGEMENT', 'OTHER_BUREAU'],
  user_management:['AICTE_ADMINISTRATOR'], // Exclusively for AICTE_ADMINISTRATOR
  landing:        ['AICTE_ADMINISTRATOR', 'REGULATION_BUREAU', 'PGRC', 'REGIONAL_OFFICE', 'SENIOR_MANAGEMENT', 'OTHER_BUREAU'],
  pgrc:           ['AICTE_ADMINISTRATOR', 'REGULATION_BUREAU', 'PGRC', 'REGIONAL_OFFICE', 'SENIOR_MANAGEMENT', 'OTHER_BUREAU'],
  pgrc_portal:    ['AICTE_ADMINISTRATOR', 'REGULATION_BUREAU', 'PGRC', 'REGIONAL_OFFICE', 'SENIOR_MANAGEMENT', 'OTHER_BUREAU'],
  profile:        ['AICTE_ADMINISTRATOR', 'REGULATION_BUREAU', 'PGRC', 'REGIONAL_OFFICE', 'SENIOR_MANAGEMENT', 'OTHER_BUREAU'],
};

/**
 * Evaluates whether a role is authorized to view a specific navigation tab.
 *
 * @param {string} role
 * @param {string} tab
 * @returns {boolean}
 */
export function canAccessTab(role, tab) {
  if (!role || !tab) return false;
  return NAV_VISIBILITY[tab]?.includes(role) ?? false;
}

export const canAccessNavigation = canAccessTab;

// Metadata for the Five Official Roles
export const ROLE_META = {
  AICTE_ADMINISTRATOR: {
    label: 'AICTE Administrator',
    shortLabel: 'Administrator',
    portalName: 'AICTE Administrator Portal',
    description: 'Full administrative access, user management, SLA configuration, and apex oversight.',
    color: '#0d2946',
    bgColor: '#e0f2fe',
    badgeVariant: 'primary',
    initials: 'AD',
  },
  REGULATION_BUREAU: {
    label: 'Regulation Bureau (RB)',
    shortLabel: 'Regulation Bureau',
    portalName: 'Regulation Bureau (RB) Portal',
    description: 'Regulation Bureau caseload, status updates, compliance monitoring, and inter-bureau coordination.',
    color: '#166534',
    bgColor: '#f0fdf4',
    badgeVariant: 'success',
    initials: 'RB',
  },
  PGRC: {
    label: 'Public Grievance Redressal Cell (PGRC)',
    shortLabel: 'PGRC',
    portalName: 'PGRC Portal',
    description: 'PGRC grievances, overlap detection review, coordination requests, and follow-up tracking.',
    color: '#c2410c',
    bgColor: '#fff7ed',
    badgeVariant: 'warning',
    initials: 'PG',
  },
  REGIONAL_OFFICE: {
    label: 'Regional Office Officer',
    shortLabel: 'Regional Office',
    portalName: 'Regional Office Portal',
    description: 'Regional jurisdiction — inspections, verification progress, and regional compliance.',
    color: '#4338ca',
    bgColor: '#eef2ff',
    badgeVariant: 'info',
    initials: 'RO',
  },
  SENIOR_MANAGEMENT: {
    label: 'Senior Management / Competent Authority',
    shortLabel: 'Senior Mgmt',
    portalName: 'Senior Management Portal',
    description: 'Read-only apex oversight — organization-wide KPIs, disposal trends, and recurring overlap patterns.',
    color: '#475569',
    bgColor: '#f1f5f9',
    badgeVariant: 'neutral',
    initials: 'SM',
  },
  OTHER_BUREAU: {
    label: 'Other Bureau / Cell Officer',
    shortLabel: 'Other Bureau',
    portalName: 'Other Bureau / Cell Portal',
    description: 'Caseload, regulatory actions, overlap coordination and reports scoped to assigned Bureau/Cell.',
    color: '#0891b2',
    bgColor: '#ecfeff',
    badgeVariant: 'info',
    initials: 'OB',
  },
};

/**
 * Returns the official portal heading for a given role.
 * If the role is missing or invalid, returns 'Access Denied / Unauthorized Role'.
 */
export function getRoleDashboardTitle(role) {
  if (!role || !ROLE_META[role]) {
    return 'Access Denied / Unauthorized Role';
  }
  return ROLE_META[role].portalName || `${ROLE_META[role].label} Portal`;
}

/**
 * Returns the landing route for a given role.
 */
export function getRoleLandingRoute(role) {
  return '/?tab=dashboard';
}

/**
 * Returns the array of 5 official roles.
 */
export function getAvailableRoles() {
  return Object.values(ROLES);
}
