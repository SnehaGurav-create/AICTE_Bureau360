'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../app/shell.module.css';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BureauChatbot } from '../chat/BureauChatbot';

export function AppShell({
  children,
  activeTab = 'cases',
  onSelectTab,
  selectedBureau = 'all',
  onSelectBureau,
  searchQuery = '',
  onSearchChange,
  onOpenNotifications,
  onPreviewCore,
  onLogout,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Restore desktop collapsed preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bureau360_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('bureau360_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Global keyboard shortcuts: Esc to close mobile drawer, Ctrl+B / Cmd+B to toggle desktop collapse
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleCollapse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, handleToggleCollapse]);

  return (
    <div className={styles.shellContainer}>
      <Sidebar
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        selectedBureau={selectedBureau}
        onSelectBureau={onSelectBureau}
        onLogout={onLogout}
      />

      <div className={`${styles.mainWrapper} ${isCollapsed ? styles.mainWrapperCollapsed : ''}`}>
        <TopBar
          onToggleSidebar={() => {
            if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
              setMobileOpen((prev) => !prev);
            } else {
              handleToggleCollapse();
            }
          }}
          isCollapsed={isCollapsed}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          selectedBureau={selectedBureau}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onOpenNotifications={onOpenNotifications}
          onPreviewCore={onPreviewCore}
          onLogout={onLogout}
        />

        <main className={styles.mainContent}>
          {children}
        </main>
      </div>

      {/* Floating AI Copilot Chatbot (Bottom Right) */}
      <BureauChatbot onNavigateTab={onSelectTab} />
    </div>
  );
}

export default AppShell;
