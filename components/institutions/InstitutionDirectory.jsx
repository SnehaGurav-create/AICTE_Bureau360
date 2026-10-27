'use client';

import React, { useState, useMemo } from 'react';
import styles from '../../app/dashboard.module.css';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { BuildingIcon, SearchIcon, FilterIcon, AlertTriangleIcon, CheckCircleIcon } from '../icons/Icons';
import { INSTITUTIONS, COMPLAINT_CASES } from '../../data/mockData';

export function InstitutionDirectory({ onSelectInstitution, onInspectCase }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const filteredInstitutions = useMemo(() => {
    return INSTITUTIONS.filter((inst) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          inst.name.toLowerCase().includes(q) ||
          inst.id.toLowerCase().includes(q) ||
          inst.state.toLowerCase().includes(q) ||
          inst.district.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (regionFilter !== 'ALL' && !inst.region.includes(regionFilter)) {
        return false;
      }

      if (riskFilter !== 'ALL') {
        if (riskFilter === 'High' && !inst.riskLevel.includes('High Risk')) return false;
        if (riskFilter === 'Medium' && !inst.riskLevel.includes('Medium')) return false;
        if (riskFilter === 'Low' && !inst.riskLevel.includes('Low')) return false;
      }

      return true;
    });
  }, [searchQuery, regionFilter, riskFilter]);

  const highRiskCount = INSTITUTIONS.filter((i) => i.riskLevel.includes('High Risk')).length;
  const underScrutinyCount = INSTITUTIONS.filter((i) => i.approvalStatus.includes('Scrutiny') || i.approvalStatus.includes('Show-Cause') || i.approvalStatus.includes('Frozen')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Directory Summary Ribbon */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard} style={{ borderTopColor: 'var(--color-brand-primary)' }}>
          <div className={styles.summaryLabel}>
            <span>Approved Institutions Registered</span>
            <BuildingIcon size={18} />
          </div>
          <div className={styles.summaryValue}>{INSTITUTIONS.length}</div>
          <div className={styles.summaryFooter}>Monitored across 5 AICTE regions</div>
        </div>

        <div className={styles.summaryCard} style={{ borderTopColor: '#dc2626' }}>
          <div className={styles.summaryLabel}>
            <span>Multi-Overlap High Risk</span>
            <AlertTriangleIcon size={18} />
          </div>
          <div className={styles.summaryValue} style={{ color: '#dc2626' }}>{highRiskCount}</div>
          <div className={styles.summaryFooter}>Concurrent complaints in multiple bureaus</div>
        </div>

        <div className={styles.summaryCard} style={{ borderTopColor: '#d97706' }}>
          <div className={styles.summaryLabel}>
            <span>Under Scrutiny / Show-Cause</span>
            <FilterIcon size={18} />
          </div>
          <div className={styles.summaryValue} style={{ color: '#d97706' }}>{underScrutinyCount}</div>
          <div className={styles.summaryFooter}>Active compliance inquiries underway</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterToolbar}>
        <div className={styles.filterHeaderRow}>
          <div className={styles.filterHeading}>
            <BuildingIcon size={18} />
            <span>Institution Directory & Search</span>
          </div>

          {(searchQuery || regionFilter !== 'ALL' || riskFilter !== 'ALL') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setRegionFilter('ALL');
                setRiskFilter('ALL');
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>

        <div className={styles.filterInputsGrid}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <SearchIcon size={14} />
            </span>
            <input
              type="search"
              placeholder="Search by Institution, PID, State..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          <select
            className={styles.filterSelect}
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            aria-label="Filter by AICTE Region"
          >
            <option value="ALL">All AICTE Regions</option>
            <option value="Western">Western Region (WRO)</option>
            <option value="Northern">Northern Region (NRO)</option>
            <option value="South-Western">South-Western Region (SWRO)</option>
            <option value="South-Central">South-Central Region (SCRO)</option>
            <option value="Eastern">Eastern Region (ERO)</option>
          </select>

          <select
            className={styles.filterSelect}
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            aria-label="Filter by Risk Profile"
          >
            <option value="ALL">All Risk Profiles</option>
            <option value="High">High Risk (Multi-Overlap)</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low / Compliant</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className={styles.tableContainer}>
        {filteredInstitutions.length === 0 ? (
          <EmptyState
            title="No Institutions Found"
            description="No institutions match your search parameters. Try expanding your search or clearing filters."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setRegionFilter('ALL');
                  setRiskFilter('ALL');
                }}
              >
                Clear Filters
              </Button>
            }
          />
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>AICTE Permanent ID (PID)</th>
                <th className={styles.th}>Institution Name & Type</th>
                <th className={styles.th}>Region & Location</th>
                <th className={styles.th}>Approval Status</th>
                <th className={styles.th}>Risk Level</th>
                <th className={styles.th}>Associated Cases</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstitutions.map((inst) => {
                const casesCount = inst.associatedComplaintIds.length;
                const isHighRisk = inst.riskLevel.includes('High Risk');

                return (
                  <tr key={inst.id} className={styles.tr}>
                    <td className={styles.td}>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-brand-primary)' }}>
                        {inst.id}
                      </span>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Est. {inst.establishedYear}</div>
                    </td>

                    <td className={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <button
                          type="button"
                          className={styles.institutionName}
                          onClick={() => onSelectInstitution(inst)}
                          style={{ textAlign: 'left' }}
                        >
                          {inst.name}
                        </button>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inst.type}</span>
                      </div>
                    </td>

                    <td className={styles.td}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{inst.district}, {inst.state}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{inst.region}</div>
                    </td>

                    <td className={styles.td}>
                      <Badge variant={inst.approvalStatus.includes('Approved') ? 'success' : inst.approvalStatus.includes('Show-Cause') || inst.approvalStatus.includes('Frozen') ? 'critical' : 'warning'}>
                        {inst.approvalStatus}
                      </Badge>
                    </td>

                    <td className={styles.td}>
                      <Badge variant={isHighRisk ? 'critical' : inst.riskLevel.includes('Medium') ? 'warning' : 'neutral'} dot>
                        {inst.riskLevel}
                      </Badge>
                    </td>

                    <td className={styles.td}>
                      <span style={{ fontWeight: 700, color: casesCount > 1 ? '#dc2626' : 'var(--text-primary)' }}>
                        {casesCount} {casesCount === 1 ? 'Docket' : 'Dockets'}
                      </span>
                    </td>

                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onSelectInstitution(inst)}
                      >
                        View 360° Profile
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
