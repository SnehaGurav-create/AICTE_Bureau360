'use client';

import React from 'react';
import styles from '../../app/dashboard.module.css';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState, LoadingSkeleton } from '../ui/EmptyState';
import { AlertTriangleIcon, ClockIcon } from '../icons/Icons';

export function ComplaintsTable({
  cases = [],
  totalFilteredCount = 0,
  currentPage = 1,
  pageSize = 5,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortOrder,
  onSortHeaderClick,
  onSelectCase,
  isLoading = false,
  onResetFilters,
}) {
  // Compute pagination bounds safely
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFilteredCount);
  const currentRecords = cases.slice(startIndex, endIndex);

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'Critical': return 'critical';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      default: return 'neutral';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Overdue': return 'critical';
      case 'Under Review': return 'info';
      case 'Pending': return 'warning';
      case 'Resolved': return 'success';
      default: return 'neutral';
    }
  };

  const getAgeingBadge = (days, status) => {
    if (status === 'Resolved') {
      return (
        <span className={`${styles.ageingBadge} ${styles.ageingNormal}`}>
          Closed in {days}d
        </span>
      );
    }
    if (days > 30) {
      return (
        <span className={`${styles.ageingBadge} ${styles.ageingOverdue}`}>
          <AlertTriangleIcon size={12} />
          {days}d (Overdue)
        </span>
      );
    }
    if (days >= 21) {
      return (
        <span className={`${styles.ageingBadge} ${styles.ageingWarning}`}>
          {days}d (Warning)
        </span>
      );
    }
    if (days >= 7) {
      return (
        <span className={`${styles.ageingBadge} ${styles.ageingModerate}`}>
          {days}d old
        </span>
      );
    }
    return (
      <span className={`${styles.ageingBadge} ${styles.ageingNormal}`}>
        {days}d (Fresh)
      </span>
    );
  };

  const renderSortIndicator = (key) => {
    if (sortBy !== key) return <span className={styles.sortIcon} style={{ opacity: 0.35 }}>↕</span>;
    return <span className={styles.sortIcon}>{sortOrder === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeaderBar}>
        <div className={styles.tableTitleGroup}>
          <h3 className={styles.tableTitle}>Complaints Repository</h3>
          <span className={styles.tableSubtitle}>
            Showing {totalFilteredCount > 0 ? `${startIndex + 1}–${endIndex}` : '0'} of {totalFilteredCount} matching records
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
          <label htmlFor="pageSizeSelect" style={{ color: 'var(--text-muted)' }}>Per Page:</label>
          <select
            id="pageSizeSelect"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <option value={5}>5 records</option>
            <option value={10}>10 records</option>
            <option value={20}>20 records</option>
          </select>
        </div>
      </div>

      <div className={styles.tableResponsive}>
        {isLoading ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <LoadingSkeleton height={32} />
            <LoadingSkeleton height={46} />
            <LoadingSkeleton height={46} />
            <LoadingSkeleton height={46} />
            <LoadingSkeleton height={46} />
          </div>
        ) : totalFilteredCount === 0 ? (
          <EmptyState
            title="No Matching Complaints Found"
            description="No complaint cases match your search term, status, bureau, category or date range filters."
            action={
              <Button variant="outline" size="sm" onClick={onResetFilters}>
                Clear All Filters
              </Button>
            }
          />
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.th} ${styles.thSortable}`} onClick={() => onSortHeaderClick('id')}>
                  Case ID {renderSortIndicator('id')}
                </th>
                <th className={`${styles.th} ${styles.thSortable}`} onClick={() => onSortHeaderClick('institutionName')}>
                  Institution Profile {renderSortIndicator('institutionName')}
                </th>
                <th className={styles.th}>Category</th>
                <th className={`${styles.th} ${styles.thSortable}`} onClick={() => onSortHeaderClick('assignedBureau')}>
                  Assigned Bureau/Cell {renderSortIndicator('assignedBureau')}
                </th>
                <th className={`${styles.th} ${styles.thSortable}`} onClick={() => onSortHeaderClick('priority')}>
                  Priority {renderSortIndicator('priority')}
                </th>
                <th className={`${styles.th} ${styles.thSortable}`} onClick={() => onSortHeaderClick('status')}>
                  Status {renderSortIndicator('status')}
                </th>
                <th className={`${styles.th} ${styles.thSortable}`} onClick={() => onSortHeaderClick('ageingDays')}>
                  Case Ageing {renderSortIndicator('ageingDays')}
                </th>
                <th className={`${styles.th} ${styles.thSortable}`} onClick={() => onSortHeaderClick('receivedDate')}>
                  Received Date {renderSortIndicator('receivedDate')}
                </th>
                <th className={`${styles.th} ${styles.thSortable}`} onClick={() => onSortHeaderClick('lastUpdatedDate')}>
                  Last Updated {renderSortIndicator('lastUpdatedDate')}
                </th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((c) => (
                <tr key={c.id} className={styles.tr}>
                  {/* Case ID */}
                  <td className={styles.td}>
                    <div style={{ fontWeight: 700, color: 'var(--color-brand-primary)' }}>
                      {c.id}
                    </div>
                    {c.hasOverlap && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          color: '#7c3aed',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          marginTop: '2px',
                        }}
                      >
                        <AlertTriangleIcon size={11} /> {c.overlapSimilarity} Overlap
                      </span>
                    )}
                  </td>

                  {/* Institution */}
                  <td className={styles.td}>
                    <div className={styles.institutionCell}>
                      <button
                        type="button"
                        className={styles.institutionName}
                        onClick={() => onSelectCase(c)}
                        title="Click to view institution dossier"
                      >
                        {c.institutionName}
                      </button>
                      <div className={styles.institutionMeta}>
                        <span>PID: {c.institutionId}</span>
                        <span>•</span>
                        <span>{c.district}, {c.state}</span>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className={styles.td}>
                    <div className="text-truncate" style={{ maxWidth: '170px' }} title={c.category}>
                      {c.category}
                    </div>
                  </td>

                  {/* Assigned Bureau */}
                  <td className={styles.td}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {c.assignedBureau}
                    </div>
                    {c.secondaryBureaus && c.secondaryBureaus.length > 0 && (
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        + {c.secondaryBureaus.join(', ')}
                      </div>
                    )}
                  </td>

                  {/* Priority */}
                  <td className={styles.td}>
                    <Badge variant={getPriorityBadgeVariant(c.priority)} dot>
                      {c.priority}
                    </Badge>
                  </td>

                  {/* Status */}
                  <td className={styles.td}>
                    <Badge variant={getStatusBadgeVariant(c.status)}>
                      {c.status}
                    </Badge>
                  </td>

                  {/* Ageing */}
                  <td className={styles.td}>
                    {getAgeingBadge(c.ageingDays, c.status)}
                  </td>

                  {/* Received Date */}
                  <td className={styles.td} style={{ whiteSpace: 'nowrap' }}>
                    {c.receivedDate}
                  </td>

                  {/* Last Updated */}
                  <td className={styles.td} style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    {c.lastUpdatedDate}
                  </td>

                  {/* Action */}
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectCase(c)}
                        title="View comprehensive complaint dossier"
                      >
                        Inspect
                      </Button>
                      <a
                        href={`/complaints/${c.id}`}
                        style={{
                          padding: '5px 8px',
                          fontSize: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--bg-surface-secondary)',
                          color: 'var(--text-secondary)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          lineHeight: 1,
                        }}
                        title="Open in dedicated route URL"
                      >
                        ↗
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Bar */}
      {!isLoading && totalFilteredCount > 0 && (
        <div className={styles.paginationBar}>
          <span>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>

          <div className={styles.paginationControls}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Previous Page"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`${styles.pageBtn} ${page === currentPage ? styles.pageBtnActive : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Next Page"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
