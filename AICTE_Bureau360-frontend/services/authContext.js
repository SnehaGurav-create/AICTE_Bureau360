/**
 * AICTE Bureau360 — Authentication React Context
 * SIH 2026 Problem Statement 26264
 *
 * Provides:
 *  - AuthProvider: wraps the app, holds session state
 *  - useAuth(): hook to read current user and auth actions
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { demoSignIn, demoSignOut, restoreDemoSession } from './demoAuthService.js';
import { can, canAccessTab } from './authConfig.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // true while restoring session

  // On mount: attempt to restore a demo session from the current tab's sessionStorage
  useEffect(() => {
    const restored = restoreDemoSession();
    if (restored) {
      setCurrentUser(restored);
    }
    setAuthLoading(false);
  }, []);

  const signIn = useCallback(async (role) => {
    setAuthLoading(true);
    try {
      const user = await demoSignIn(role);
      setCurrentUser(user);
      return user;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    demoSignOut();
    setCurrentUser(null);
  }, []);

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    authLoading,
    role: currentUser?.role ?? null,
    signIn,
    signOut,
    can: (action) => can(currentUser?.role, action),
    canAccessTab: (tab) => canAccessTab(currentUser?.role, tab),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state and actions from any component.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
