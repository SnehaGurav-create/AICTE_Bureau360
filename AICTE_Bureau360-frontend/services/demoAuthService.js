/**
 * AICTE Bureau360 — Demonstration Authentication Service
 * SIH 2026 Problem Statement 26264
 *
 * OFFICIAL ROLES (Five Portals):
 * 1. AICTE_ADMINISTRATOR
 * 2. REGULATION_BUREAU
 * 3. PGRC
 * 4. REGIONAL_OFFICE
 * 5. SENIOR_MANAGEMENT
 *
 * DEMONSTRATION MODE ONLY:
 * - Makes ZERO network requests. Does NOT connect to any backend auth endpoint.
 * - Does NOT implement secure authentication. This is a UI demonstration only.
 * - Passwords are NOT stored, hashed, or transmitted.
 * - Session is held in memory & tab sessionStorage only.
 * - Cleared cleanly on explicit logout.
 * - The VIEWER role has been completely removed.
 */

import { ROLES } from './authConfig.js';

const DEMO_SESSION_KEY = 'bureau360_demo_session';

// Official demonstration user profiles for the five portals — fictional identities
export const DEMO_USERS = [
  {
    id: 'demo-admin-001',
    name: 'Dr. R. K. Soni',
    email: 'admin@bureau360.demo',
    role: ROLES.AICTE_ADMINISTRATOR,
    portal: 'AICTE Administrator Portal',
    bureau: null, // Full organization-wide scope
    region: null,
    designation: 'AICTE Nodal Officer & Administrator, HQ',
    initials: 'AD',
  },
  {
    id: 'demo-rb-001',
    name: 'Ms. P. Iyer',
    email: 'regulation@bureau360.demo',
    role: ROLES.REGULATION_BUREAU,
    portal: 'Regulation Bureau Portal',
    bureau: 'approval', // Scoped to Regulation & Approval Bureau
    region: null,
    designation: 'Senior Officer, Regulation Bureau (RB)',
    initials: 'RB',
  },
  {
    id: 'demo-pgrc-001',
    name: 'Dr. A. K. Sharma',
    email: 'pgrc@bureau360.demo',
    role: ROLES.PGRC,
    portal: 'PGRC Portal',
    bureau: 'grievance', // Scoped to Public Grievance Redressal Cell
    region: null,
    designation: 'Convener, Public Grievance Redressal Cell (PGRC)',
    initials: 'PG',
  },
  {
    id: 'demo-ro-001',
    name: 'Sh. V. Raman',
    email: 'regional.north@bureau360.demo',
    role: ROLES.REGIONAL_OFFICE,
    portal: 'Regional Office Portal',
    bureau: null,
    region: 'Northern Regional Office', // Scoped to Northern Regional Office jurisdiction
    designation: 'Regional Officer, Northern Regional Office (NRO)',
    initials: 'RO',
  },
  {
    id: 'demo-mgmt-001',
    name: 'Prof. K. Rajagopal',
    email: 'management@bureau360.demo',
    role: ROLES.SENIOR_MANAGEMENT,
    portal: 'Senior Management Portal',
    bureau: null, // Organization-wide read-only access
    region: null,
    designation: 'Member Secretary / Competent Authority',
    initials: 'SM',
  },
  {
    id: 'demo-ob-001',
    name: 'Dr. S. K. Verma',
    email: 'officer.approval@bureau360.demo',
    role: ROLES.OTHER_BUREAU,
    portal: 'Other Bureau / Cell Portal',
    bureau: 'approval', // Scoped to assigned bureau (Approvals & Policy Cell)
    region: null,
    designation: 'Nodal Officer, Approvals & Policy Cell',
    initials: 'OB',
  },
];

/**
 * Performs a demo sign-in for one of the five official role presets.
 *
 * @param {string} role - 'AICTE_ADMINISTRATOR' | 'REGULATION_BUREAU' | 'PGRC' | 'REGIONAL_OFFICE' | 'SENIOR_MANAGEMENT'
 * @returns {Promise<Object>} demo session user object
 */
export async function demoSignIn(role) {
  // Brief simulated UI processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const validRoles = Object.values(ROLES);
  if (!validRoles.includes(role)) {
    throw new Error(`Unauthorized or invalid demo role: "${role}". Access Denied.`);
  }

  const user = DEMO_USERS.find((u) => u.role === role);
  if (!user) {
    throw new Error(`No demonstration profile configured for role: ${role}`);
  }

  const session = {
    ...user,
    isDemoSession: true,
    signedInAt: new Date().toISOString(),
    warning: 'DEMO MODE: Demonstration session for evaluation. Not connected to live AICTE backend.',
  };

  try {
    sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage might be restricted in some environments — non-fatal
  }

  return session;
}

/**
 * Restores a demo session from sessionStorage if one exists.
 * Validates that the stored session role is one of the five official roles.
 *
 * @returns {Object|null}
 */
export function restoreDemoSession() {
  try {
    const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.isDemoSession) return null;

    // Validate that the stored role is one of the five official roles
    const validRoles = Object.values(ROLES);
    if (!session.role || !validRoles.includes(session.role)) {
      // Discard invalid / legacy session (e.g. obsolete VIEWER)
      sessionStorage.removeItem(DEMO_SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Signs out the current demo session.
 * Clears sessionStorage and resets in-memory session.
 */
export function demoSignOut() {
  try {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    // non-fatal
  }
}
