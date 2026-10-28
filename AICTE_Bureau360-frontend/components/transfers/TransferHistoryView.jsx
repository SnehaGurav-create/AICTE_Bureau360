'use client';

import React, { useState, useMemo } from 'react';
import styles from '../../app/dashboard.module.css';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { ClockIcon, SearchIcon, FilterIcon, CheckCircleIcon } from '../icons/Icons';
import { TRANSFERS_LOG, COMPLAINT_CASES, BUREAUS } from '../../data/mockData';

export function TransferHistoryView({ onInspectCase }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [bureauFilter, setBureauFilter] = useState('ALL');

  const filteredTransfers = useMemo(() => {
    return TRANSFERS_LOG.filter((tr) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          tr.caseId.toLowerCase().includes(q) ||
          tr.institutionName.toLowerCase().includes(q) ||
          tr.reason.toLowerCase().includes(q) ||
          tr.authorizedBy.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (bureauFilter !== 'ALL') {
        if (!tr.fromBureau.includes(bureauFilter) && !tr.toBureau.includes(bureauFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, bureauFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header Banner */}
      <div className={styles.filterToolbar}>
        <div className={styles.filterHeading}>
          <ClockIcon size={18} />
          <span>Inter-Bureau Case Jurisdiction Transfer Register</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Audit log of cases re-routed between AICTE Bureaus, Regional Offices, and Specialized Cells to maintain transparency and statutory jurisdiction.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterInputsGrid}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <SearchIcon size={14} />
          </span>
          <input
            type="search"
            placeholder="Search Case ID, College, Authorizing Officer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 32px',
              fontSize: '0.8125rem',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              outline: 'none',
            }}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={bureauFilter}
          onChange={(e) => setBureauFilter(e.target.value)}
          aria-label="Filter by Cell Involved"
        >
          <option value="ALL">All Bureaus Involved</option>
          <option value="Approval">Approval Bureau</option>
          <option value="Policy">Policy & Academic Planning Bureau</option>
          <option value="Student">Student Development Cell</option>
          <option value="Grievance">Grievance Redressal Cell</option>
          <option value="Vigilance">Vigilance & Inspection Cell</option>
          <option value="Regional">Regional Offices</option>
        </select>
      </div>

      {/* Transfers Table */}
      <div className={styles.tableContainer}>
        {filteredTransfers.length === 0 ? (
          <EmptyState
            title="No Transfer Records Found"
            description="No jurisdiction re-assignments match your search filter."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setBureauFilter('ALL');
                }}
              >
                Clear Search
              </Button>
            }
          />
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Transfer ID & Date</th>
                <th className={styles.th}>Docket & Target Institution</th>
                <th className={styles.th}>Jurisdiction Flow (From → To)</th>
                <th className={styles.th}>Administrative Justification</th>
                <th className={styles.th}>Authorizing Authority</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.map((tr) => {
                const caseObj = COMPLAINT_CASES.find((c) => c.id === tr.caseId);

                return (
                  <tr key={tr.id} className={styles.tr}>
                    <td className={styles.td}>
                      <span style={{ fontWeight: 700, color: 'var(--color-brand-primary)' }}>{tr.id}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tr.date}</div>
                    </td>

                    <td className={styles.td}>
                      <div style={{ fontWeight: 600, color: 'var(--color-brand-primary)' }}>{tr.caseId}</div>
                      <div style={{ fontSize: '0.8125rem' }}>{tr.institutionName}</div>
                    </td>

                    <td className={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
                        <Badge variant="neutral">{tr.fromBureau}</Badge>
                        <span>→</span>
                        <Badge variant="info">{tr.toBureau}</Badge>
                      </div>
                    </td>

                    <td className={styles.td}>
                      <div style={{ fontSize: '0.8125rem', maxWidth: '240px' }} title={tr.reason}>
                        {tr.reason}
                      </div>
                    </td>

                    <td className={styles.td}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{tr.authorizedBy}</div>
                    </td>

                    <td className={styles.td}>
                      <Badge variant={tr.status === 'Completed' ? 'success' : 'warning'}>
                        {tr.status}
                      </Badge>
                    </td>

                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => caseObj && onInspectCase(caseObj)}
                      >
                        Inspect Docket
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
