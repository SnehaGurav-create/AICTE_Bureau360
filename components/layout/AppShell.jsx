'use client';

import React, { useState } from 'react';
import styles from '../../app/shell.module.css';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

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
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.shellContainer}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        selectedBureau={selectedBureau}
        onSelectBureau={onSelectBureau}
      />

      <div className={styles.mainWrapper}>
        <TopBar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          activeTab={activeTab}
          selectedBureau={selectedBureau}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onOpenNotifications={onOpenNotifications}
          onPreviewCore={onPreviewCore}
        />

        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
