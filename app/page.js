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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('landing');
  const [selectedBureau, setSelectedBureau] = useState('all');

  // Institution Selection State
  const [selectedInstitution, setSelectedInstitution] = useState(null);

  // Active Complaints Dataset State (refreshes when backend confirms new creation)
  const [casesList, setCasesList] = useState(COMPLAINT_CASES);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [bureauFilter, setBureauFilter] = useState('all');
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
        setSelectedBureau(bureauParam);
        setBureauFilter(bureauParam);
      }
    } catch {
      // ignore
    }
  }, []);

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
    setSelectedBureau(bureauId);
    setBureauFilter(bureauId);
    setSelectedCase(null);
    setSelectedInstitution(null);
    setCurrentPage(1);
  };

  const handleBureauChangeFromToolbar = (bureauId) => {
    setBureauFilter(bureauId);
    setSelectedBureau(bureauId);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setBureauFilter('all');
    setSelectedBureau('all');
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

  // 1. Filter dataset according to all parameters
  const filteredCases = useMemo(() => {
    return casesList.filter((c) => {
      // Bureau Filter
      if (bureauFilter !== 'all') {
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
  }, [casesList, bureauFilter, statusFilter, priorityFilter, categoryFilter, searchQuery, dateFrom, dateTo]);

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

      {/* Main View Router: Landing Page or Dashboard Shell */}
      {activeTab === 'landing' ? (
        <LandingPage
          onEnterDashboard={() => {
            setActiveTab('dashboard');
            setSelectedCase(null);
            setSelectedInstitution(null);
          }}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setSelectedCase(null);
            setSelectedInstitution(null);
          }}
          onSearch={(val) => {
            setSearchQuery(val);
            setActiveTab('complaints');
            setSelectedCase(null);
            setSelectedInstitution(null);
            setCurrentPage(1);
          }}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onSelectFilter={(status) => {
            setStatusFilter(status);
            setActiveTab('complaints');
            setSelectedCase(null);
            setSelectedInstitution(null);
            setCurrentPage(1);
          }}
        />
      ) : (
        <AppShell
          activeTab={selectedCase ? 'complaints' : activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setSelectedCase(null);
            setSelectedInstitution(null);
          }}
          selectedBureau={selectedBureau}
          onSelectBureau={handleSelectBureauFromSidebar}
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onPreviewCore={() => setIsInitializing(true)}
        >
          {/* 1. If a case is selected, render the full detailed dossier view */}
          {selectedCase ? (
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
      ) : (
        /* Main Dashboard & Complaints View */
        <>
          {/* Demonstration Dataset Banner */}
          {IS_DEMO_DATA && (
            <div className={styles.demoBanner} role="status">
              <div className={styles.demoBannerContent}>
                <span className={styles.demoTag}>Demonstration Data</span>
                <span>
                  Records are synthetic fixtures designed for SIH 2026 Problem Statement 26264 evaluation. Not connected to production AICTE databases.
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Mock Service Active</span>
            </div>
          )}

          {/* 1. Summary Cards (Dynamically computed from active dataset) */}
          <SummaryCards
            cases={casesList}
            activeStatusFilter={statusFilter}
            onSelectStatus={(status) => {
              setStatusFilter(status);
              setCurrentPage(1);
            }}
          />

          {/* 2. Analytical Charts Section (Derived from current complaints dataset) */}
          <ChartsSection cases={filteredCases.length > 0 ? filteredCases : casesList} />

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
            onExportCSV={() => exportComplaintsToCSV(filteredCases)}
            onNewComplaint={() => setActiveTab('new_complaint')}
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
