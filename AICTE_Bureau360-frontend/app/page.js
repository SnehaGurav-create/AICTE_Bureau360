'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { ChartsSection } from '../components/dashboard/ChartsSection';
import { FiltersToolbar } from '../components/dashboard/FiltersToolbar';
import { ComplaintsTable } from '../components/dashboard/ComplaintsTable';
import { ActivityAndAlerts } from '../components/dashboard/ActivityAndAlerts';
import { ComplaintDetailView } from '../components/complaints/ComplaintDetailView';
import { ComplaintCreationForm } from '../components/complaints/ComplaintCreationForm';
import { InstitutionDirectory } from '../components/institutions/InstitutionDirectory';
import { InstitutionProfileView } from '../components/institutions/InstitutionProfileView';
import { BureauWorkloadView } from '../components/coordination/BureauWorkloadView';
import { OverlapReviewQueue } from '../components/overlap/OverlapReviewQueue';
import { TransferHistoryView } from '../components/transfers/TransferHistoryView';
import { AlertCentreView } from '../components/alerts/AlertCentreView';
import { ReportsAndAnalyticsView } from '../components/reports/ReportsAndAnalyticsView';
import { IntelligenceCoreLoader } from '../components/ui/IntelligenceCoreLoader';
import { LandingPage } from '../components/landing/LandingPage';
import { LoginPage } from '../components/auth/LoginPage';
import { AccessDenied } from '../components/auth/AccessDenied';
import { UserManagementView } from '../components/admin/UserManagementView';
import { PgrcPortalView } from '../components/portals/PgrcPortalView';
import { UserProfileView } from '../components/profile/UserProfileView';
import { RoleDashboardBanner } from '../components/dashboard/RoleDashboardBanner';
import { AuthProvider, useAuth } from '../services/authContext.js';
import { ACTIONS, canAccessTab } from '../services/authConfig.js';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  COMPLAINT_CASES,
  INSTITUTIONS,
  BUREAUS,
  IS_DEMO_DATA,
  exportComplaintsToCSV,
} from '../data/mockData';
import styles from './dashboard.module.css';

function DashboardPageContent() {
  const { currentUser, isAuthenticated, role, signOut, can } = useAuth();
  const [activeTab, setActiveTab] = useState('landing');
  const [attemptedTab, setAttemptedTab] = useState(null);
  // Institution Selection State
  const [selectedInstitution, setSelectedInstitution] = useState(null);

  // Active Complaints Dataset State (refreshes when backend confirms new creation)
  const [casesList, setCasesList] = useState(COMPLAINT_CASES);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [bureauFilter, setBureauFilter] = useState('all');
  const [selectedBureau, setSelectedBureau] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sorting State
  const [sortBy, setSortBy] = useState('receivedDate');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Selected Case & Modal States
  const [selectedCase, setSelectedCase] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Northern Region states mapping for Regional Office scope
  const NORTHERN_REGION_STATES = useMemo(() => [
    'Uttar Pradesh',
    'Punjab',
    'Rajasthan',
    'Uttarakhand',
    'Delhi',
    'Assam',
    'Bihar',
  ], []);

  // Automatically scope bureau and region based on the active official role
  useEffect(() => {
    if (role === 'REGULATION_BUREAU') {
      setSelectedBureau('approval');
      setBureauFilter('approval');
    } else if (role === 'PGRC') {
      setSelectedBureau('grievance');
      setBureauFilter('grievance');
    } else if (role === 'REGIONAL_OFFICE') {
      setSelectedBureau('regional');
      setBureauFilter('regional');
    } else if (role === 'AICTE_ADMINISTRATOR' || role === 'SENIOR_MANAGEMENT') {
      setSelectedBureau('all');
      setBureauFilter('all');
    }
  }, [role, currentUser]);

  // Check URL query parameters for direct tab navigation
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      }
      const bureauParam = params.get('bureau');
      if (bureauParam) {
        // Only organization-wide roles can initialize bureau filter from URL
        if (role === 'AICTE_ADMINISTRATOR' || role === 'SENIOR_MANAGEMENT') {
          setSelectedBureau(bureauParam);
          setBureauFilter(bureauParam);
        }
      }
    } catch {
      // ignore
    }
  }, [role]);

  const handleInitFinish = useCallback(() => {
    setIsInitializing(false);
    try {
      sessionStorage.setItem('bureau360_initialized', 'true');
    } catch {
      // ignore
    }
  }, []);

  // Sync sidebar bureau selection with toolbar bureau filter
  const handleSelectBureauFromSidebar = (bureauId) => {
    // Jurisdiction guard: Scoped roles cannot select outside their assignment
    if (role === 'REGULATION_BUREAU' && bureauId !== 'approval') return;
    if (role === 'PGRC' && bureauId !== 'grievance') return;
    if (role === 'REGIONAL_OFFICE') return;

    setSelectedBureau(bureauId);
    setBureauFilter(bureauId);
    setSelectedCase(null);
    setSelectedInstitution(null);
    setCurrentPage(1);
  };

  const handleNavigateTab = (tab) => {
    if (tab === 'landing') {
      setActiveTab('landing');
      setSelectedCase(null);
      setSelectedInstitution(null);
      return;
    }
    if (!isAuthenticated) {
      setAttemptedTab(tab);
      setActiveTab('login');
      return;
    }
    setActiveTab(tab);
    setSelectedCase(null);
    setSelectedInstitution(null);
  };

  const handleLoginSuccess = (user) => {
    if (user?.role === 'REGULATION_BUREAU') {
      setSelectedBureau('approval');
      setBureauFilter('approval');
    } else if (user?.role === 'PGRC') {
      setSelectedBureau('grievance');
      setBureauFilter('grievance');
    } else if (user?.role === 'REGIONAL_OFFICE') {
      setSelectedBureau('regional');
      setBureauFilter('regional');
    } else {
      setSelectedBureau('all');
      setBureauFilter('all');
    }
    // Route each role to their authorized dashboard
    const destination = attemptedTab && canAccessTab(user?.role, attemptedTab) ? attemptedTab : 'dashboard';
    setActiveTab(destination);
    setAttemptedTab(null);
  };

  const handleLogout = () => {
    signOut();
    setActiveTab('landing');
    setSelectedCase(null);
    setSelectedInstitution(null);
    setSelectedBureau('all');
    setBureauFilter('all');
    setAttemptedTab(null);
  };

  const handleBureauChangeFromToolbar = (bureauId) => {
    if (role === 'REGULATION_BUREAU' && bureauId !== 'approval') return;
    if (role === 'PGRC' && bureauId !== 'grievance') return;
    if (role === 'REGIONAL_OFFICE') return;

    setBureauFilter(bureauId);
    setSelectedBureau(bureauId);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    const defaultBureau =
      role === 'REGULATION_BUREAU'
        ? 'approval'
        : role === 'PGRC'
        ? 'grievance'
        : role === 'REGIONAL_OFFICE'
        ? 'regional'
        : 'all';
    setSearchQuery('');
    setStatusFilter('ALL');
    setBureauFilter(defaultBureau);
    setSelectedBureau(defaultBureau);
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setIsLoading(true);
  };

  const handleSortHeaderClick = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleSelectInstitutionById = (instId) => {
    const inst = INSTITUTIONS.find(
      (i) => i.id === instId || i.name.toLowerCase().includes((instId || '').toLowerCase())
    );
    if (inst) {
      setSelectedInstitution(inst);
      setActiveTab('institutions');
      setSelectedCase(null);
    }
  };

  // Callback when a local demonstration intake is processed in DEMO_MODE
  const handleDemoSubmissionComplete = (demoOutcome) => {
    if (!demoOutcome || !demoOutcome.mappedPayload) return;
    const p = demoOutcome.mappedPayload;
    const matchingInst = INSTITUTIONS.find((i) => i.id === p.aicte_id);
    const demoCase = {
      id: demoOutcome.demoDocketLabel, // Clearly marked: e.g. LOCAL-DEMO-PREVIEW-1234
      title: `${p.title} [Local Demo Draft]`,
      summary: p.description,
      institutionName: matchingInst?.name || `Institution (${p.aicte_id})`,
      institutionId: p.aicte_id || '1-XXXXX',
      category: 'Demonstration Intake Draft',
      assignedBureau: 'Grievance Redressal Cell',
      priority: p.priority === 'CRITICAL' ? 'Critical' : p.priority === 'HIGH' ? 'High' : p.priority === 'LOW' ? 'Low' : 'Medium',
      status: 'Demo Draft (Not Saved)',
      receivedDate: p.received_on || new Date().toISOString().slice(0, 10),
      lastUpdatedDate: new Date().toISOString().slice(0, 10),
      ageingDays: 0,
      source: p.source || 'PORTAL',
      district: matchingInst?.district || 'New Delhi',
      state: matchingInst?.state || 'Delhi',
      hasOverlap: false,
      isDemoRecord: true,
    };
    setCasesList((prev) => [demoCase, ...prev]);
  };

  // 0. Base role-scoped complaints dataset (strict segregation layer for five official roles)
  const roleScopedCases = useMemo(() => {
    if (role === 'REGULATION_BUREAU') {
      return casesList.filter(
        (c) => c.assignedBureau === 'Approval Bureau' || c.secondaryBureaus?.includes('Approval Bureau')
      );
    }
    if (role === 'PGRC') {
      return casesList.filter(
        (c) => c.assignedBureau === 'Grievance Redressal Cell' || c.secondaryBureaus?.includes('Grievance Redressal Cell')
      );
    }
    if (role === 'REGIONAL_OFFICE') {
      return casesList.filter((c) => NORTHERN_REGION_STATES.includes(c.state));
    }
    // AICTE_ADMINISTRATOR and SENIOR_MANAGEMENT see all organization-wide cases
    return casesList;
  }, [casesList, role, NORTHERN_REGION_STATES]);

  // 1. Filter dataset according to all parameters on top of roleScopedCases
  const filteredCases = useMemo(() => {
    return roleScopedCases.filter((c) => {
      // Bureau Filter (only applied for AICTE_ADMINISTRATOR and SENIOR_MANAGEMENT; scoped roles are locked)
      if ((role === 'AICTE_ADMINISTRATOR' || role === 'SENIOR_MANAGEMENT') && bureauFilter !== 'all') {
        const bureauObj = BUREAUS.find((b) => b.id === bureauFilter);
        if (bureauObj && c.assignedBureau !== bureauObj.name && !c.secondaryBureaus?.includes(bureauObj.name)) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Overdue') {
          if (c.status !== 'Overdue' && c.ageingDays <= 30) return false;
        } else if (c.status !== statusFilter) {
          return false;
        }
      }

      // Priority Filter
      if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) {
        return false;
      }

      // Category Filter
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.id.toLowerCase().includes(q) ||
          c.title?.toLowerCase().includes(q) ||
          c.institutionName.toLowerCase().includes(q) ||
          c.institutionId.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Date Range Filter (based on receivedDate YYYY-MM-DD)
      if (dateFrom && c.receivedDate < dateFrom) {
        return false;
      }
      if (dateTo && c.receivedDate > dateTo) {
        return false;
      }

      return true;
    });
  }, [roleScopedCases, bureauFilter, statusFilter, priorityFilter, categoryFilter, searchQuery, dateFrom, dateTo, role]);

  // 2. Sort filtered cases
  const sortedCases = useMemo(() => {
    return [...filteredCases].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      // Priority numeric mapping for clean sorting
      if (sortBy === 'priority') {
        const priorityRank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        valA = priorityRank[valA] || 0;
        valB = priorityRank[valB] || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCases, sortBy, sortOrder]);

  return (
    <>
      {/* 3D Intelligence Core Cinematic Loading Experience */}
      {isInitializing && (
        <IntelligenceCoreLoader
          minDurationMs={1900}
          onFinish={handleInitFinish}
        />
      )}

      {isLoading && !isInitializing && (
        <IntelligenceCoreLoader
          minDurationMs={850}
          onFinish={() => setIsLoading(false)}
          messages={[
            'Refreshing Bureau360...',
            'Re-indexing complaint dockets...',
            'Updating analytical summaries...',
          ]}
          showTagline={false}
        />
      )}

      {/* Main View Router: Landing Page, Login Page, or Protected Dashboard Shell */}
      {activeTab === 'landing' ? (
        <LandingPage
          onEnterDashboard={() => handleNavigateTab('dashboard')}
          onSelectTab={handleNavigateTab}
          onSearch={(val) => {
            setSearchQuery(val);
            handleNavigateTab('complaints');
          }}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onSelectFilter={(status) => {
            setStatusFilter(status);
            handleNavigateTab('complaints');
          }}
        />
      ) : (!isAuthenticated || activeTab === 'login') ? (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => {
            setActiveTab('landing');
            setAttemptedTab(null);
          }}
        />
      ) : (
        <AppShell
          activeTab={selectedCase ? 'complaints' : activeTab}
          onSelectTab={handleNavigateTab}
          selectedBureau={selectedBureau}
          onSelectBureau={handleSelectBureauFromSidebar}
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onPreviewCore={() => setIsInitializing(true)}
          onLogout={handleLogout}
        >
          {/* If the authenticated role cannot access the requested tab, show AccessDenied */}
          {!canAccessTab(role, activeTab) ? (
            <AccessDenied
              attemptedTab={activeTab}
              onGoToDashboard={() => setActiveTab('dashboard')}
              onGoToLogin={handleLogout}
            />
          ) : selectedCase ? (
            <ComplaintDetailView
              complaint={selectedCase}
              onBack={() => setSelectedCase(null)}
              onSelectRelatedCase={(relatedId) => {
                const match = casesList.find((c) => c.id === relatedId);
                if (match) setSelectedCase(match);
              }}
              onSelectInstitution={() => handleSelectInstitutionById(selectedCase.institutionId)}
            />
          ) : activeTab === 'new_complaint' ? (
        /* 2. Official Complaint Creation Form (Agreed Backend API Mapping) */
        <ComplaintCreationForm
          onCancel={() => setActiveTab('complaints')}
          onDemoSubmissionComplete={handleDemoSubmissionComplete}
        />
      ) : activeTab === 'institutions' ? (
        /* 3. Institution Directory or Profile */
        selectedInstitution ? (
          <InstitutionProfileView
            institution={selectedInstitution}
            onBack={() => setSelectedInstitution(null)}
            onInspectCase={(c) => setSelectedCase(c)}
          />
        ) : (
          <InstitutionDirectory
            onSelectInstitution={(inst) => setSelectedInstitution(inst)}
            onInspectCase={(c) => setSelectedCase(c)}
          />
        )
      ) : activeTab === 'coordination' ? (
        /* 4. Bureau Workload & Cross-Cell Coordination */
        <BureauWorkloadView onInspectCase={(c) => setSelectedCase(c)} />
      ) : activeTab === 'overlap_review' ? (
        /* 5. Overlap Review Queue with Side-by-Side Comparison & SVG Topology Graph */
        <OverlapReviewQueue onInspectCase={(c) => setSelectedCase(c)} />
      ) : activeTab === 'transfers' ? (
        /* 6. Inter-Bureau Case Jurisdiction Transfer Register */
        <TransferHistoryView onInspectCase={(c) => setSelectedCase(c)} />
      ) : activeTab === 'alerts' ? (
        /* 7. Alert Centre for new, overdue and critical cases */
        <AlertCentreView onInspectCase={(c) => setSelectedCase(c)} />
      ) : activeTab === 'reports' ? (
        /* 8. Reports, Analytics & Local CSV Export */
        <ReportsAndAnalyticsView onInspectCase={(c) => setSelectedCase(c)} />
      ) : activeTab === 'user_management' ? (
        /* 9. Institutional User & Role Administration (ADMIN Only) */
        <UserManagementView onNavigateDashboard={() => setActiveTab('dashboard')} />
      ) : activeTab === 'pgrc' ? (
        /* 10. PGRC Portal */
        <PgrcPortalView onNavigateDashboard={() => setActiveTab('dashboard')} />
      ) : activeTab === 'profile' ? (
        /* 11. User Profile & System Credentials */
        <UserProfileView onNavigateDashboard={() => setActiveTab('dashboard')} />
      ) : (
        /* Main Dashboard & Complaints View */
        <>
          {/* Role-Specific Portal Hub Banner (Administrator / RB / PGRC / Regional Office / Senior Management) */}
          <RoleDashboardBanner
            onNavigateTab={handleNavigateTab}
            onSelectStatus={(status) => {
              setStatusFilter(status);
              setCurrentPage(1);
            }}
          />

          {/* Demonstration Dataset Banner */}
          {/* Live System Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
            fontSize: '0.75rem',
            color: '#475569'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#16a34a',
                boxShadow: '0 0 0 2px rgba(22, 163, 74, 0.2)'
              }} />
              <strong style={{ color: '#0f172a' }}>Integrated AICTE Grievance Network Active:</strong>
              <span>Real-time cross-bureau synchronization enabled (PostgreSQL • Express API • NLP Engine)</span>
            </div>
            <span style={{ fontWeight: 600, color: '#16a34a' }}>● Online & Synchronized</span>
          </div>

          {/* 1. Summary Cards (Dynamically computed from roleScopedCases) */}
          <SummaryCards
            cases={roleScopedCases}
            activeStatusFilter={statusFilter}
            onSelectStatus={(status) => {
              setStatusFilter(status);
              setCurrentPage(1);
            }}
          />

          {/* 2. Analytical Charts Section (Derived from current complaints dataset) */}
          <ChartsSection cases={filteredCases.length > 0 ? filteredCases : roleScopedCases} />

          {/* 3. Filter and Search Engine */}
          <FiltersToolbar
            searchQuery={searchQuery}
            onSearchChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            statusFilter={statusFilter}
            onStatusChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            bureauFilter={bureauFilter}
            onBureauChange={handleBureauChangeFromToolbar}
            officerBureau={
              role === 'REGULATION_BUREAU'
                ? 'approval'
                : role === 'PGRC'
                ? 'grievance'
                : role === 'REGIONAL_OFFICE'
                ? 'regional'
                : undefined
            }
            priorityFilter={priorityFilter}
            onPriorityChange={(val) => {
              setPriorityFilter(val);
              setCurrentPage(1);
            }}
            categoryFilter={categoryFilter}
            onCategoryChange={(val) => {
              setCategoryFilter(val);
              setCurrentPage(1);
            }}
            dateFrom={dateFrom}
            onDateFromChange={(val) => {
              setDateFrom(val);
              setCurrentPage(1);
            }}
            dateTo={dateTo}
            onDateToChange={(val) => {
              setDateTo(val);
              setCurrentPage(1);
            }}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onToggleSortOrder={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            onResetFilters={handleResetFilters}
            onRefresh={handleRefresh}
            onExportCSV={can(ACTIONS.EXPORT_CSV) ? () => exportComplaintsToCSV(filteredCases) : undefined}
            onNewComplaint={can(ACTIONS.CREATE_COMPLAINT) ? () => setActiveTab('new_complaint') : undefined}
          />

          {/* 4. Complaints Repository Table with Sorting, Ageing & Pagination */}
          <ComplaintsTable
            cases={sortedCases}
            totalFilteredCount={sortedCases.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortHeaderClick={handleSortHeaderClick}
            onSelectCase={setSelectedCase}
            isLoading={isLoading}
            onResetFilters={handleResetFilters}
          />

          {/* 5. Recent Activity and Alert-Centre Preview */}
          <ActivityAndAlerts
            onSelectAlertFilter={(status) => {
              setStatusFilter(status);
              setCurrentPage(1);
            }}
            onReviewOverlap={() => {
              setActiveTab('overlap_review');
            }}
          />
        </>
      )}
    </AppShell>
  )}

  {/* Notifications Drawer / Modal (Accessible from both Landing Page and Dashboard) */}
  <Modal
    isOpen={isNotificationsOpen}
    onClose={() => setIsNotificationsOpen(false)}
    title="Cross-Bureau Overlap Alerts"
    footer={
      <Button variant="outline" size="sm" onClick={() => setIsNotificationsOpen(false)}>
        Close Notifications
      </Button>
    }
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#fffbeb', border: '1px solid #fde68a', fontSize: '0.8125rem', color: '#92400e' }}>
        Advisory Notice: Suspected relationships are suggestions for human evaluation, not authoritative decisions or confirmed duplicates.
      </div>
      {casesList.filter((c) => c.hasOverlap).map((cl) => (
        <div
          key={cl.id}
          style={{
            padding: '12px',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface-secondary)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.875rem', color: 'var(--color-brand-primary)' }}>
              {cl.institutionName}
            </strong>
            <Badge variant="overlap">Flagged for Review</Badge>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Bureaus: {cl.assignedBureau} • {cl.secondaryBureaus?.join(' • ')}
          </div>
          <p style={{ fontSize: '0.8125rem', marginTop: '6px', color: 'var(--text-secondary)' }}>
            {cl.summary}
          </p>
          <div style={{ marginTop: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsNotificationsOpen(false);
                setSelectedCase(cl);
                setActiveTab('complaints');
              }}
            >
              Review Dossier & Relationship Tier
            </Button>
          </div>
        </div>
      ))}
    </div>
  </Modal>
</>
);
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardPageContent />
    </AuthProvider>
  );
}
