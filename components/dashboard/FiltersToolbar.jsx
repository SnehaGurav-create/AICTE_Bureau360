'use client';

import React from 'react';
import styles from '../../app/dashboard.module.css';
import { Button } from '../ui/Button';
import { FilterIcon, RefreshCwIcon, SearchIcon } from '../icons/Icons';
import { BUREAUS, CATEGORIES, STATUS_OPTIONS, PRIORITY_OPTIONS } from '../../data/mockData';

export function FiltersToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  bureauFilter,
  onBureauChange,
  priorityFilter,
  onPriorityChange,
  categoryFilter,
  onCategoryChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onToggleSortOrder,
  onResetFilters,
  onRefresh,
  onExportCSV,
  onNewComplaint,
  officerBureau,
}) {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== 'ALL' ||
    bureauFilter !== 'all' ||
    priorityFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  return (
    <section className={styles.filterToolbar} aria-label="Complaints Filter and Search Toolbar">
      <div className={styles.filterHeaderRow}>
        <div className={styles.filterHeading}>
          <FilterIcon size={16} />
          <span>Interactive Filter Engine</span>
          {hasActiveFilters && (
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(217, 99, 22, 0.15)',
                color: 'var(--color-brand-accent)',
              }}
            >
              Filters Active
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onNewComplaint && (
            <Button
              variant="primary"
              size="sm"
              onClick={onNewComplaint}
              title="File a new grievance docket"
            >
              + Register Complaint
            </Button>
          )}

          {onExportCSV && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCSV}
              title="Download filtered complaints as CSV"
            >
              📥 Export CSV
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            icon={<RefreshCwIcon size={14} />}
            title="Refresh dashboard records"
          >
            Refresh
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </div>

      <div className={styles.filterInputsGrid}>
        {/* Search input */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              position: 'absolute',
              left: '10px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <SearchIcon size={14} />
          </span>
          <input
            type="search"
            placeholder="Search Case ID, College, PID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 32px',
              fontSize: '0.8125rem',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-secondary)',
              outline: 'none',
            }}
          />
        </div>

        {/* Status select */}
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter by Status"
        >
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st === 'All Statuses' ? 'ALL' : st}>
              {st}
            </option>
          ))}
        </select>

        {/* Bureau select */}
        <select
          className={styles.filterSelect}
          value={bureauFilter}
          disabled={Boolean(officerBureau)}
          onChange={(e) => onBureauChange(e.target.value)}
          aria-label="Filter by Bureau"
          title={officerBureau ? `Locked: Officer access is restricted to ${BUREAUS.find((b) => b.id === officerBureau)?.name || 'assigned bureau'}` : 'Filter by Bureau'}
          style={officerBureau ? { opacity: 0.8, cursor: 'not-allowed', backgroundColor: 'var(--bg-surface-secondary)' } : undefined}
        >
          {officerBureau ? (
            <option value={officerBureau}>
              {BUREAUS.find((b) => b.id === officerBureau)?.name || 'Assigned Bureau'} (Officer Scoped)
            </option>
          ) : (
            BUREAUS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))
          )}
        </select>

        {/* Priority select */}
        <select
          className={styles.filterSelect}
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value)}
          aria-label="Filter by Priority"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p === 'All Priorities' ? 'ALL' : p}>
              {p}
            </option>
          ))}
        </select>

        {/* Category select */}
        <select
          className={styles.filterSelect}
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="Filter by Category"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat === 'All Categories' ? 'ALL' : cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Date From */}
        <div className={styles.dateInputGroup}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From:</span>
          <input
            type="date"
            className={styles.dateInput}
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            title="Received on or after"
          />
        </div>

        {/* Date To */}
        <div className={styles.dateInputGroup}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To:</span>
          <input
            type="date"
            className={styles.dateInput}
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            title="Received on or before"
          />
        </div>

        {/* Sort selector */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <select
            className={styles.filterSelect}
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            aria-label="Sort by"
          >
            <option value="receivedDate">Sort: Received Date</option>
            <option value="lastUpdatedDate">Sort: Last Updated</option>
            <option value="ageingDays">Sort: Case Ageing</option>
            <option value="priority">Sort: Priority</option>
            <option value="id">Sort: Case ID</option>
          </select>
          <button
            type="button"
            onClick={onToggleSortOrder}
            title={`Toggle Sort Direction (${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
            style={{
              padding: '0 10px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-secondary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8125rem',
            }}
          >
            {sortOrder === 'asc' ? '▲' : '▼'}
          </button>
        </div>
      </div>
    </section>
  );
}
