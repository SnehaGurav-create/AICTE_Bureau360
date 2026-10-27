/**
 * AICTE Bureau360 — Demonstration Authentication Service
 * SIH 2026 Problem Statement 26264
 *
 * DEMONSTRATION MODE ONLY:
 * - Makes ZERO network requests. Does NOT connect to any backend auth endpoint.
 * - Does NOT implement secure authentication. This is a UI demonstration only.
 * - Passwords are NOT stored, hashed, or transmitted.
 * - Session is held in a React Context in memory only.
 * - sessionStorage is used ONLY to restore the demo role after a browser refresh
 *   within the same tab session. It is labeled DEMO and cleared on logout.
 * - NEVER use this adapter as production authentication.
 *
 * When the real backend authentication contract is available, implement
 * httpAuthService.js following the same interface and swap via authService.js.
 */

const DEMO_SESSION_KEY = 'bureau360_demo_session';

// Demo user profiles — fictional only, no real credentials
export const DEMO_USERS = [
  {
    id: 'demo-admin-001',
    name: 'Dr. R. K. Soni',
    email: 'admin@bureau360.demo',
    role: 'ADMIN',
    bureau: null, // ADMIN sees all bureaus
    designation: 'Nodal Officer, AICTE HQ',
    initials: 'RS',
  },
  {
    id: 'demo-officer-001',
    name: 'Ms. P. Iyer',
    email: 'officer@bureau360.demo',
    role: 'OFFICER',
    bureau: 'approval', // Scoped to Approval Bureau ('approval' in mockData)
    designation: 'Grievance Officer, Approval Bureau',
    initials: 'PI',
  },
  {
    id: 'demo-viewer-001',
    name: 'Mr. A. Verma',
    email: 'viewer@bureau360.demo',
    role: 'VIEWER',
    bureau: null,
    designation: 'Ministry Observer',
    initials: 'AV',
  },
];

/**
 * Performs a demo sign-in for the given role preset.
 * Does not validate credentials against any backend.
 *
 * @param {string} role - 'ADMIN' | 'OFFICER' | 'VIEWER'
 * @returns {Promise<Object>} demo session user object
 */
export async function demoSignIn(role) {
  // Simulate a brief UI processing delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  const user = DEMO_USERS.find((u) => u.role === role);
  if (!user) throw new Error(`Unknown demo role: ${role}`);

  const session = {
    ...user,
    isDemoSession: true,
    signedInAt: new Date().toISOString(),
    warning: 'DEMO MODE: Not connected to AICTE backend. Not a real authenticated session.',
  };

  // Persist role to sessionStorage so page refresh does not log the user out
  // within the same browser tab session. Cleared on explicit logout.
  try {
    sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage may be unavailable (private mode restrictions) — non-fatal
  }

  return session;
}

/**
 * Restores a demo session from sessionStorage if one exists.
 * Called on initial page load to survive browser refresh.
 *
 * @returns {Object|null}
 */
export function restoreDemoSession() {
  try {
    const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.isDemoSession) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Signs out the current demo session.
 * Clears sessionStorage and returns to an unauthenticated state.
 */
export function demoSignOut() {
  try {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    // non-fatal
  }
}
