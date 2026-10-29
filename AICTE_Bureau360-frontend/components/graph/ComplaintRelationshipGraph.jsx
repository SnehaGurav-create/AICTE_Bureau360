'use client';

import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  NetworkIcon,
  BuildingIcon,
  ShieldIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  LayersIcon,
  EyeIcon,
} from '../icons/Icons';
import { COMPLAINT_CASES } from '../../data/mockData';

// Multi-institution dataset specifically modeled for Central Institution ⇄ Multi-Bureau Cases
const INSTITUTION_GRAPH_DATASETS = {
  inst_apex: {
    institution: {
      id: 'inst_apex',
      name: 'Apex Institute of Technology',
      aicteId: '1-33248901',
      city: 'Pune',
      state: 'Maharashtra',
      region: 'Western Region (WRO)',
      address: 'Sector 24, Pradhikaran, Nigdi, Pune - 411044',
      type: 'institution',
      totalCases: 5,
      activeCases: 3,
      confirmedDuplicates: 1,
      escalatedCases: 1,
      resolvedCases: 1,
    },
    cases: [
      {
        id: 'c_rb_101',
        caseNo: 'RB-101',
        altId: 'CMP-2026-000891',
        bureau: 'Regulation Bureau (RB)',
        bureauCode: 'RB',
        bureauColor: '#1e40af', // Deep blue
        status: 'UNDER_REVIEW',
        priority: 'High',
        category: 'Infrastructure Deficiencies & Faculty Deficit',
        receivedDate: '12 Oct 2026',
        assignee: 'Dr. S. K. Nair (Deputy Director, RB)',
        lastAction: 'OVERLAP_LINKED',
        lastActionDate: '28 Oct 2026, 14:30',
        nextAction: 'Lead consolidated inquiry across bureaus',
        disposition: 'PRIMARY_COORDINATION',
        relationshipType: 'PRIMARY_COORDINATION',
        coordinationRole: 'Primary Coordination Case (Selected by Officers)',
        summary: 'Inspection report highlighting shortage of senior cadre professors in CSE and non-compliant CAD/CAM lab facilities.',
        coords: { x: 200, y: 180 },
      },
      {
        id: 'c_pgrc_205',
        caseNo: 'PGRC-205',
        altId: 'CMP-2026-000912',
        bureau: 'Public Grievance Redressal Cell (PGRC)',
        bureauCode: 'PGRC',
        bureauColor: '#7c3aed', // Royal purple
        status: 'DUPLICATE_LINKED',
        priority: 'Critical',
        category: 'Student Grievance: Shortage of Teaching Staff',
        receivedDate: '16 Oct 2026',
        assignee: 'P. Verma (Assistant Director, PGRC)',
        lastAction: 'OVERLAP_LINKED',
        lastActionDate: '28 Oct 2026, 14:30',
        nextAction: 'Action updates routed through RB-101 lead officer',
        disposition: 'DUPLICATE_LINKED',
        relationshipType: 'CONFIRMED_DUPLICATE',
        coordinationRole: 'Duplicate — Linked (Preserved Zero-Data-Loss)',
        summary: 'Mass student complaint alleging classes cancelled due to 40% vacant faculty positions in Computer Science.',
        coords: { x: 200, y: 440 },
      },
      {
        id: 'c_vig_304',
        caseNo: 'VIG-304',
        altId: 'CMP-2026-000742',
        bureau: 'Vigilance Cell (VC)',
        bureauCode: 'VC',
        bureauColor: '#dc2626', // Crimson red
        status: 'ESCALATED',
        priority: 'Critical',
        category: 'Financial Irregularities & Ghost Faculty Allegations',
        receivedDate: '02 Oct 2026',
        assignee: 'Rajiv Sharma, CVO (Vigilance)',
        lastAction: 'ESCALATED',
        lastActionDate: '24 Oct 2026, 11:15',
        nextAction: 'Bureau Head expedited hearing & audit team dispatch',
        disposition: 'INDEPENDENT',
        relationshipType: 'RELATED_CASE',
        coordinationRole: 'Cross-Cell Related Matter (Vigilance Coordination)',
        summary: 'Whistleblower petition alleging biometric attendance spoofing and ghost faculty on payroll rosters.',
        coords: { x: 450, y: 90 },
      },
      {
        id: 'c_sdc_412',
        caseNo: 'SDC-412',
        altId: 'CMP-2026-000865',
        bureau: 'Student Development Cell (SDC)',
        bureauCode: 'SDC',
        bureauColor: '#059669', // Emerald
        status: 'IN_PROGRESS',
        priority: 'Medium',
        category: 'Caution Money Withholding & Original Document Retention',
        receivedDate: '20 Oct 2026',
        assignee: 'Sunita Joshi (SDC Officer)',
        lastAction: 'NOTICE_ISSUED',
        lastActionDate: '25 Oct 2026, 16:45',
        nextAction: 'Awaiting institutional compliance affidavit',
        disposition: 'INDEPENDENT',
        relationshipType: 'RELATED_CASE',
        coordinationRole: 'Related Case (Student Rights Violation)',
        summary: 'Graduating students petition alleging security deposits not refunded and degree certificates withheld.',
        coords: { x: 700, y: 180 },
      },
      {
        id: 'c_ab_520',
        caseNo: 'AB-520',
        altId: 'CMP-2026-000620',
        bureau: 'Approval Bureau (AB)',
        bureauCode: 'AB',
        bureauColor: '#0284c7', // Sky blue
        status: 'RESOLVED',
        priority: 'Medium',
        category: 'Extension of Approval (EoA) Verification',
        receivedDate: '15 Sep 2026',
        assignee: 'Dr. M. K. Kulkarni (Regional Officer)',
        lastAction: 'RESOLVED',
        lastActionDate: '18 Oct 2026, 17:00',
        nextAction: 'None (Matter Disposed with Compliance Note)',
        disposition: 'INDEPENDENT',
        relationshipType: 'INDEPENDENT',
        coordinationRole: 'Independent Regulatory Docket',
        summary: 'Scrutiny of land title deeds and fire safety clearances for 2026-27 intake expansion.',
        coords: { x: 700, y: 440 },
      },
    ],
    crossLinks: [
      {
        from: 'c_rb_101',
        to: 'c_pgrc_205',
        type: 'CONFIRMED_DUPLICATE',
        score: '94%',
        label: 'Confirmed Duplicate (94%) • Synced Actions',
        direction: 'bidirectional',
        isPrimaryPair: true,
        reasons: ['Same Verified AICTE ID: 1-33248901', 'Matching Core Issue: CSE Faculty Shortage', 'Same 90-Day Window (Oct 2026)', 'ML Semantic Similarity: 0.94'],
        details: 'Officers reviewed both cases. RB-101 was designated primary coordination case. PGRC-205 preserved with all records intact. Action history mirrored.',
        color: '#f59e0b',
      },
      {
        from: 'c_rb_101',
        to: 'c_vig_304',
        type: 'RELATED_CASE',
        score: '76%',
        label: 'Related Case (76%) • Cross-Cell Coordination',
        direction: 'undirected',
        isPrimaryPair: false,
        reasons: ['Same Institution: Apex Institute', 'Faculty Allegations overlap with Ghost Faculty probe', 'Coordination recommended between RB & Vigilance'],
        details: 'Shared evidence: Faculty roster audited by RB serves as material evidence for Vigilance Cell inquiry.',
        color: '#38bdf8',
      },
      {
        from: 'c_pgrc_205',
        to: 'c_sdc_412',
        type: 'POTENTIAL_DUPLICATE',
        score: '62%',
        label: 'Potential Matter Overlap (62%)',
        direction: 'undirected',
        isPrimaryPair: false,
        reasons: ['Same Institution Profile', 'Multiple student welfare grievances filed in same semester'],
        details: 'Distinct issues (faculty shortage vs caution money withholding), flagged for contextual awareness.',
        color: '#f97316',
      },
    ],
  },
  inst_saraswati: {
    institution: {
      id: 'inst_saraswati',
      name: 'Saraswati College of Engineering',
      aicteId: '1-44910283',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      region: 'Western Region (WRO)',
      address: 'Plot No. 46, Sector 5, Kharghar, Navi Mumbai - 410210',
      type: 'institution',
      totalCases: 3,
      activeCases: 2,
      confirmedDuplicates: 1,
      escalatedCases: 0,
      resolvedCases: 1,
    },
    cases: [
      {
        id: 'c_rb_201',
        caseNo: 'RB-201',
        altId: 'CMP-2026-000884',
        bureau: 'Regulation Bureau (RB)',
        bureauCode: 'RB',
        bureauColor: '#1e40af',
        status: 'UNDER_REVIEW',
        priority: 'High',
        category: 'Unauthorized Fee Collection / Capitation Fee',
        receivedDate: '08 Oct 2026',
        assignee: 'A. K. Bansal (RB)',
        lastAction: 'NOTICE_ISSUED',
        lastActionDate: '26 Oct 2026',
        nextAction: 'Joint hearing with PGRC representatives',
        disposition: 'PRIMARY_COORDINATION',
        relationshipType: 'PRIMARY_COORDINATION',
        coordinationRole: 'Primary Coordination Case',
        summary: 'Levying non-mandated building fund charges during admission rounds.',
        coords: { x: 230, y: 220 },
      },
      {
        id: 'c_pgrc_288',
        caseNo: 'PGRC-288',
        altId: 'CMP-2026-000940',
        bureau: 'Public Grievance Redressal Cell (PGRC)',
        bureauCode: 'PGRC',
        bureauColor: '#7c3aed',
        status: 'DUPLICATE_LINKED',
        priority: 'High',
        category: 'Excess Fee Charged in Admission',
        receivedDate: '11 Oct 2026',
        assignee: 'K. S. Raman (PGRC)',
        lastAction: 'OVERLAP_LINKED',
        lastActionDate: '27 Oct 2026',
        nextAction: 'Action status mirrored from RB-201',
        disposition: 'DUPLICATE_LINKED',
        relationshipType: 'CONFIRMED_DUPLICATE',
        coordinationRole: 'Duplicate — Linked Case',
        summary: 'Parent complaint regarding mandatory uniform fee inflated above handbook rate.',
        coords: { x: 230, y: 400 },
      },
      {
        id: 'c_ab_310',
        caseNo: 'AB-310',
        altId: 'CMP-2026-000511',
        bureau: 'Approval Bureau (AB)',
        bureauCode: 'AB',
        bureauColor: '#0284c7',
        status: 'RESOLVED',
        priority: 'Medium',
        category: 'Annual Approval Compliance',
        receivedDate: '18 Aug 2026',
        assignee: 'R. N. Patil (AB)',
        lastAction: 'RESOLVED',
        lastActionDate: '15 Sep 2026',
        nextAction: 'None (Matter Closed)',
        disposition: 'INDEPENDENT',
        relationshipType: 'INDEPENDENT',
        coordinationRole: 'Independent Case',
        summary: 'Inspection completed for laboratory equipment verification.',
        coords: { x: 670, y: 310 },
      },
    ],
    crossLinks: [
      {
        from: 'c_rb_201',
        to: 'c_pgrc_288',
        type: 'CONFIRMED_DUPLICATE',
        score: '91%',
        label: 'Confirmed Duplicate (91%) • Synced Actions',
        direction: 'bidirectional',
        isPrimaryPair: true,
        reasons: ['Same Verified AICTE ID: 1-44910283', 'Overcharging / Admission Fee Violation', 'Coordinated Resolution'],
        details: 'Confirmed duplicate docket. Primary coordination assigned to RB-201.',
        color: '#f59e0b',
      },
    ],
  },
};

export function ComplaintRelationshipGraph({ onInspectCase }) {
  const [selectedInstKey, setSelectedInstKey] = useState('inst_apex');
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [filterCoordinationOnly, setFilterCoordinationOnly] = useState(false);
  const [highlightCluster, setHighlightCluster] = useState(false);

  const currentDataset = INSTITUTION_GRAPH_DATASETS[selectedInstKey] || INSTITUTION_GRAPH_DATASETS.inst_apex;
  const { institution, cases, crossLinks } = currentDataset;

  // Institution Centre Position
  const centerPos = { x: 450, y: 310 };

  // Filter cross links
  const visibleCrossLinks = crossLinks.filter((link) => {
    if (filterCoordinationOnly && link.type !== 'CONFIRMED_DUPLICATE' && link.type !== 'RELATED_CASE') {
      return false;
    }
    return true;
  });

  const isCaseHighlighted = (c) => {
    if (highlightCluster) {
      return c.caseNo === 'RB-101' || c.caseNo === 'PGRC-205' || c.caseNo === 'RB-201' || c.caseNo === 'PGRC-288';
    }
    if (!selectedNode && !selectedEdge) return true;
    if (selectedNode?.type === 'institution') return true;
    if (selectedNode?.id === c.id) return true;
    if (selectedEdge) {
      return selectedEdge.from === c.id || selectedEdge.to === c.id;
    }
    // Check connection to selected case node
    return crossLinks.some(
      (link) => (link.from === selectedNode?.id && link.to === c.id) || (link.to === selectedNode?.id && link.from === c.id)
    );
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'UNDER_REVIEW':
        return 'warning';
      case 'DUPLICATE_LINKED':
        return 'info';
      case 'ESCALATED':
        return 'critical';
      case 'IN_PROGRESS':
        return 'warning';
      case 'RESOLVED':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Top Header & Context Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 18px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: 'rgba(13, 41, 70, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-brand-primary)',
            }}
          >
            <NetworkIcon size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Institution Case Relationship Topology
              </h3>
              <Badge variant="info">Module 1 & 3 Unified</Badge>
            </div>
            <p style={{ margin: 0, fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
              Central institution node connected to RB, PGRC & cross-bureau cases with confirmed duplicate coordination links
            </p>
          </div>
        </div>

        {/* Institution Switcher & Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Select Institution:
            </span>
            <select
              value={selectedInstKey}
              onChange={(e) => {
                setSelectedInstKey(e.target.value);
                setSelectedNode(null);
                setSelectedEdge(null);
              }}
              style={{
                fontSize: '0.8125rem',
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="inst_apex">Apex Institute of Technology (PID: 1-33248901)</option>
              <option value="inst_saraswati">Saraswati College of Eng. (PID: 1-44910283)</option>
            </select>
          </div>

          <Button
            variant={highlightCluster ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setHighlightCluster(!highlightCluster);
              setSelectedEdge(null);
              setSelectedNode(null);
            }}
          >
            {highlightCluster ? '★ Highlighting RB ⇄ PGRC Pair' : 'Focus Confirmed Duplicate Pair'}
          </Button>

          <Button
            variant={filterCoordinationOnly ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterCoordinationOnly(!filterCoordinationOnly)}
          >
            {filterCoordinationOnly ? 'Coordination Links Only' : 'Show All Links'}
          </Button>

          {(selectedNode || selectedEdge || highlightCluster) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedNode(null);
                setSelectedEdge(null);
                setHighlightCluster(false);
              }}
            >
              Reset View
            </Button>
          )}
        </div>
      </div>

      {/* Main Graph Canvas and Inspector Drawer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedNode || selectedEdge ? '1fr 360px' : '1fr',
          gap: 'var(--space-4)',
          transition: 'grid-template-columns 0.25s ease',
        }}
      >
        {/* SVG Viewport */}
        <div
          style={{
            backgroundColor: '#071727',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #1e293b',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.4)',
          }}
        >
          <svg
            viewBox="0 0 900 620"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              minHeight: '480px',
            }}
          >
            <defs>
              {/* Radial glow filter */}
              <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="strongGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Duplicate Arc Gradient */}
              <linearGradient id="duplicateGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e40af" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>

              {/* Institution Center Gradient */}
              <radialGradient id="instCenterGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </radialGradient>

              {/* Arrowhead marker */}
              <marker id="arrowPrimary" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" />
              </marker>
            </defs>

            {/* Background Radial Coordinate Guides */}
            <circle cx={centerPos.x} cy={centerPos.y} r="140" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={centerPos.x} cy={centerPos.y} r="235" fill="none" stroke="#1e293b" strokeWidth="1.2" strokeDasharray="4 4" />
            <circle cx={centerPos.x} cy={centerPos.y} r="80" fill="url(#instCenterGlow)" />

            {/* Orbit Label */}
            <text x={centerPos.x} y={centerPos.y - 245} fill="#475569" fontSize="10" textAnchor="middle" letterSpacing="0.08em" fontWeight="600">
              MULTI-BUREAU CASE JURISDICTION ORBIT
            </text>

            {/* 1. Spoke Edges: Central Institution to All Cases */}
            {cases.map((c) => {
              const highlighted = isCaseHighlighted(c);
              return (
                <g key={`spoke-${c.id}`}>
                  <line
                    x1={centerPos.x}
                    y1={centerPos.y}
                    x2={c.coords.x}
                    y2={c.coords.y}
                    stroke="#334155"
                    strokeWidth={highlighted ? 1.75 : 1}
                    strokeDasharray={c.disposition === 'DUPLICATE_LINKED' ? '4 3' : 'none'}
                    opacity={highlighted ? 0.8 : 0.2}
                  />
                  {/* Mid-spoke relationship indicator */}
                  <circle
                    cx={(centerPos.x * 2 + c.coords.x) / 3}
                    cy={(centerPos.y * 2 + c.coords.y) / 3}
                    r="3"
                    fill="#64748b"
                    opacity={highlighted ? 0.9 : 0.3}
                  />
                </g>
              );
            })}

            {/* 2. Cross-Bureau Coordination & Overlap Links */}
            {visibleCrossLinks.map((link, idx) => {
              const sourceCase = cases.find((c) => c.id === link.from);
              const targetCase = cases.find((c) => c.id === link.to);
              if (!sourceCase || !targetCase) return null;

              const isLinkSelected = selectedEdge === link;
              const isPairHighlighted =
                highlightCluster && (link.type === 'CONFIRMED_DUPLICATE' || link.isPrimaryPair);

              // Curved arc control point for flank links
              const midX = (sourceCase.coords.x + targetCase.coords.x) / 2 - 55;
              const midY = (sourceCase.coords.y + targetCase.coords.y) / 2;
              const pathD = `M ${sourceCase.coords.x} ${sourceCase.coords.y} Q ${midX} ${midY} ${targetCase.coords.x} ${targetCase.coords.y}`;

              return (
                <g
                  key={`cross-${idx}`}
                  onClick={() => {
                    setSelectedEdge(link);
                    setSelectedNode(null);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer glow stroke for confirmed duplicates */}
                  {(link.type === 'CONFIRMED_DUPLICATE' || isPairHighlighted) && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={isLinkSelected || isPairHighlighted ? 7 : 5}
                      strokeOpacity="0.25"
                      filter="url(#strongGlow)"
                    />
                  )}

                  {/* Active Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={link.color || '#f59e0b'}
                    strokeWidth={isLinkSelected || isPairHighlighted ? 3.5 : 2.5}
                    strokeDasharray={link.type === 'CONFIRMED_DUPLICATE' ? '6 4' : '4 3'}
                    opacity={isPairHighlighted || isLinkSelected ? 1 : 0.85}
                  />

                  {/* Edge Midpoint Badge */}
                  <g transform={`translate(${midX + 25}, ${midY})`}>
                    <rect
                      x="-85"
                      y="-12"
                      width="170"
                      height="24"
                      rx="12"
                      fill={link.type === 'CONFIRMED_DUPLICATE' ? '#78350f' : '#0f172a'}
                      stroke={link.color}
                      strokeWidth={isLinkSelected ? 2 : 1}
                      filter={link.type === 'CONFIRMED_DUPLICATE' ? 'url(#neonGlow)' : undefined}
                    />
                    <text
                      y="4"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="700"
                      textAnchor="middle"
                      letterSpacing="0.02em"
                    >
                      {link.label}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* 3. Central Node: Institution Hub */}
            <g
              transform={`translate(${centerPos.x}, ${centerPos.y})`}
              onClick={() => {
                setSelectedNode(institution);
                setSelectedEdge(null);
              }}
              style={{ cursor: 'pointer' }}
            >
              {/* Pulsing halo */}
              <circle
                r="46"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="4 2"
                opacity="0.8"
                filter="url(#neonGlow)"
              />
              <circle
                r="38"
                fill="#0f2b48"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
              <circle
                r="32"
                fill="#0284c7"
                opacity="0.9"
              />

              {/* Institution Icon */}
              <g transform="translate(-10, -16)" fill="#ffffff">
                <path d="M2 18h16v-2H2v2zm8-16L1 7v2h18V7l-9-5zm-5 7v5h2v-5H5zm4 0v5h2v-5H9zm4 0v5h2v-5h-2z" transform="scale(1.1)" />
              </g>

              {/* Node text */}
              <text y="14" fill="#ffffff" fontSize="9.5" fontWeight="800" textAnchor="middle">
                INSTITUTION HUB
              </text>
              <text y="24" fill="#bae6fd" fontSize="8" fontWeight="600" textAnchor="middle">
                {institution.aicteId}
              </text>

              {/* Node Title Below */}
              <text y="60" fill="#f8fafc" fontSize="12" fontWeight="700" textAnchor="middle">
                {institution.name}
              </text>
              <text y="74" fill="#94a3b8" fontSize="9.5" textAnchor="middle">
                {institution.city}, {institution.state} • {institution.region}
              </text>
            </g>

            {/* 4. Connected Case Nodes */}
            {cases.map((c) => {
              const isSelected = selectedNode?.id === c.id;
              const highlighted = isCaseHighlighted(c);
              const isPrimary = c.disposition === 'PRIMARY_COORDINATION';
              const isDuplicate = c.disposition === 'DUPLICATE_LINKED';

              return (
                <g
                  key={c.id}
                  transform={`translate(${c.coords.x}, ${c.coords.y})`}
                  onClick={() => {
                    setSelectedNode(c);
                    setSelectedEdge(null);
                  }}
                  style={{ cursor: 'pointer' }}
                  opacity={highlighted ? 1 : 0.22}
                >
                  {/* Outer selection or primary highlight ring */}
                  {(isSelected || isPrimary || isDuplicate) && (
                    <circle
                      r={isPrimary || isDuplicate ? 33 : 30}
                      fill="none"
                      stroke={isPrimary ? '#38bdf8' : isDuplicate ? '#a855f7' : '#ffffff'}
                      strokeWidth={isSelected ? 3 : 2}
                      strokeDasharray={isDuplicate ? '4 2' : 'none'}
                      filter="url(#neonGlow)"
                    />
                  )}

                  {/* Main case node body */}
                  <circle
                    r="25"
                    fill={c.bureauColor}
                    stroke={isSelected ? '#ffffff' : '#e2e8f0'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />

                  {/* Case Number & Bureau Initials */}
                  <text y="-2" fill="#ffffff" fontSize="11" fontWeight="800" textAnchor="middle">
                    {c.caseNo}
                  </text>
                  <text y="11" fill="rgba(255, 255, 255, 0.85)" fontSize="8.5" fontWeight="600" textAnchor="middle">
                    {c.bureauCode}
                  </text>

                  {/* Role Flag Badge */}
                  {isPrimary && (
                    <g transform="translate(0, -32)">
                      <rect x="-42" y="-10" width="84" height="18" rx="9" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
                      <text y="3" fill="#ffffff" fontSize="7.5" fontWeight="800" textAnchor="middle">
                        ★ LEAD CASE
                      </text>
                    </g>
                  )}
                  {isDuplicate && (
                    <g transform="translate(0, -32)">
                      <rect x="-48" y="-10" width="96" height="18" rx="9" fill="#581c87" stroke="#c084fc" strokeWidth="1" />
                      <text y="3" fill="#ffffff" fontSize="7.5" fontWeight="800" textAnchor="middle">
                        🔗 DUPLICATE LINKED
                      </text>
                    </g>
                  )}

                  {/* Status & Category Text Below */}
                  <g transform="translate(0, 36)">
                    <rect
                      x="-45"
                      y="-7"
                      width="90"
                      height="16"
                      rx="4"
                      fill={
                        c.status === 'UNDER_REVIEW'
                          ? 'rgba(245, 158, 11, 0.25)'
                          : c.status === 'DUPLICATE_LINKED'
                          ? 'rgba(124, 58, 237, 0.3)'
                          : c.status === 'ESCALATED'
                          ? 'rgba(220, 38, 38, 0.3)'
                          : c.status === 'IN_PROGRESS'
                          ? 'rgba(5, 150, 105, 0.25)'
                          : 'rgba(2, 132, 199, 0.25)'
                      }
                      stroke="rgba(255, 255, 255, 0.2)"
                    />
                    <text y="5" fill="#f8fafc" fontSize="8" fontWeight="700" textAnchor="middle">
                      {c.status.replace('_', ' ')}
                    </text>
                  </g>

                  {/* Truncated Category */}
                  <text y="56" fill="#cbd5e1" fontSize="9" fontWeight="600" textAnchor="middle">
                    {c.category.length > 22 ? c.category.slice(0, 20) + '…' : c.category}
                  </text>
                  <text y="68" fill="#94a3b8" fontSize="8" textAnchor="middle">
                    {c.bureau}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Bottom Floating Legend */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '14px',
              right: '14px',
              backgroundColor: 'rgba(7, 23, 39, 0.92)',
              backdropFilter: 'blur(8px)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.71875rem',
              color: '#e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0284c7', border: '1px solid #38bdf8' }} />
                <strong>Institution Hub</strong> (Center)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#1e40af' }} />
                Regulation Bureau (RB)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#7c3aed' }} />
                Grievance Cell (PGRC)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
                Vigilance (VC)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#059669' }} />
                Student Dev (SDC)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
                <span style={{ width: '18px', height: '3px', backgroundColor: '#f59e0b', borderRadius: '2px', display: 'inline-block' }} />
                Confirmed Duplicate & Action Routing Link
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
                <span style={{ width: '18px', height: '2px', borderTop: '2px dashed #38bdf8', display: 'inline-block' }} />
                Cross-Cell Related Link
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Side Inspector Drawer */}
        {(selectedNode || selectedEdge) && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: 'var(--shadow-md)',
              maxHeight: '620px',
              overflowY: 'auto',
            }}
          >
            {/* Header with Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge
                variant={
                  selectedEdge
                    ? 'warning'
                    : selectedNode.type === 'institution'
                    ? 'neutral'
                    : getStatusBadgeVariant(selectedNode.status)
                }
              >
                {selectedEdge
                  ? 'COORDINATION RELATIONSHIP'
                  : selectedNode.type === 'institution'
                  ? 'CENTRAL INSTITUTION'
                  : `CASE: ${selectedNode.caseNo}`}
              </Badge>
              <button
                type="button"
                onClick={() => {
                  setSelectedNode(null);
                  setSelectedEdge(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  color: 'var(--text-muted)',
                }}
              >
                ✕
              </button>
            </div>

            {/* Case Node Details */}
            {selectedNode && selectedNode.type !== 'institution' && (
              <>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>
                      {selectedNode.caseNo}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({selectedNode.altId})</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedNode.category}
                  </div>
                </div>

                {/* Coordination Role Banner */}
                {selectedNode.coordinationRole && (
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor:
                        selectedNode.disposition === 'PRIMARY_COORDINATION'
                          ? 'rgba(3, 105, 161, 0.1)'
                          : selectedNode.disposition === 'DUPLICATE_LINKED'
                          ? 'rgba(124, 58, 237, 0.1)'
                          : 'rgba(15, 23, 42, 0.05)',
                      border:
                        selectedNode.disposition === 'PRIMARY_COORDINATION'
                          ? '1px solid rgba(3, 105, 161, 0.3)'
                          : selectedNode.disposition === 'DUPLICATE_LINKED'
                          ? '1px solid rgba(124, 58, 237, 0.3)'
                          : '1px solid var(--border-subtle)',
                      fontSize: '0.78125rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: selectedNode.disposition === 'PRIMARY_COORDINATION' ? '#0284c7' : '#7c3aed' }}>
                      {selectedNode.disposition === 'PRIMARY_COORDINATION'
                        ? '★ Designated Primary Coordination Case'
                        : selectedNode.disposition === 'DUPLICATE_LINKED'
                        ? '🔗 Duplicate — Linked Case'
                        : 'Independent Administrative Case'}
                    </div>
                    <div style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {selectedNode.coordinationRole}
                    </div>
                  </div>
                )}

                {/* Key Case Meta Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78125rem' }}>
                  <div style={{ padding: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Responsible Bureau</div>
                    <div style={{ fontWeight: 700, color: selectedNode.bureauColor }}>{selectedNode.bureau}</div>
                  </div>
                  <div style={{ padding: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Current Status</div>
                    <div style={{ fontWeight: 700 }}>{selectedNode.status.replace('_', ' ')}</div>
                  </div>
                  <div style={{ padding: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Received Date</div>
                    <div style={{ fontWeight: 600 }}>{selectedNode.receivedDate}</div>
                  </div>
                  <div style={{ padding: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Assigned Officer</div>
                    <div style={{ fontWeight: 600 }}>{selectedNode.assignee}</div>
                  </div>
                </div>

                {/* Module 2 Workflow Compliance */}
                <div style={{ fontSize: '0.78125rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Last Action: </span>
                    <strong>{selectedNode.lastAction}</strong>{' '}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.71875rem' }}>({selectedNode.lastActionDate})</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Next Action: </span>
                    <strong style={{ color: '#0284c7' }}>{selectedNode.nextAction}</strong>
                  </div>
                  <div style={{ marginTop: '4px', color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    {selectedNode.summary}
                  </div>
                </div>

                {/* Inspect Action */}
                <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    style={{ width: '100%' }}
                    onClick={() => {
                      const match = COMPLAINT_CASES.find(
                        (c) => c.id.includes(selectedNode.caseNo) || c.id.includes(selectedNode.altId.replace('CMP-2026-', ''))
                      );
                      if (match && onInspectCase) {
                        onInspectCase(match);
                      } else if (onInspectCase) {
                        onInspectCase(COMPLAINT_CASES[0]);
                      }
                    }}
                  >
                    <EyeIcon size={16} /> Open Case Dossier
                  </Button>
                </div>
              </>
            )}

            {/* Central Institution Hub Details */}
            {selectedNode && selectedNode.type === 'institution' && (
              <>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>
                    {selectedNode.name}
                  </h4>
                  <div style={{ fontSize: '0.8125rem', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                    AICTE Permanent ID: {selectedNode.aicteId}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {selectedNode.address}
                  </div>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                    Module 1 Centralized Directory Profile
                  </div>
                  <div style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    All complaints from Regulation, Grievance, Approval and Vigilance bureaus are permanently indexed to this single institutional profile.
                  </div>
                </div>

                {/* Consolidated Complaint Count Across Bureaus */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.78125rem' }}>
                  <div style={{ padding: '8px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Total Complaints</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>{selectedNode.totalCases}</div>
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ color: '#f59e0b', fontSize: '0.6875rem' }}>Confirmed Duplicates</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f59e0b' }}>
                      {selectedNode.confirmedDuplicates} pair
                    </div>
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Active / In Review</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0284c7' }}>
                      {selectedNode.activeCases}
                    </div>
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Escalated Cases</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#dc2626' }}>
                      {selectedNode.escalatedCases}
                    </div>
                  </div>
                </div>

                {/* Connected Bureaus Breakdown */}
                <div style={{ fontSize: '0.78125rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>Connected Bureau Cells:</div>
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
                    <li><strong>Regulation Bureau (RB):</strong> 1 active case (RB-101)</li>
                    <li><strong>Public Grievance Cell (PGRC):</strong> 1 linked duplicate (PGRC-205)</li>
                    <li><strong>Vigilance Cell (VC):</strong> 1 escalated matter (VIG-304)</li>
                    <li><strong>Student Development Cell (SDC):</strong> 1 active inquiry (SDC-412)</li>
                    <li><strong>Approval Bureau (AB):</strong> 1 disposed EoA check (AB-520)</li>
                  </ul>
                </div>
              </>
            )}

            {/* Cross-Link Edge Inspector */}
            {selectedEdge && (
              <>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>
                      {selectedEdge.type.replace('_', ' ')}
                    </h4>
                    <Badge variant="warning">{selectedEdge.score} Match</Badge>
                  </div>
                  <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Cross-Bureau Coordination Link
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontSize: '0.78125rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#b45309' }}>Authorized Decision Record</div>
                  <div style={{ fontSize: '0.71875rem', color: 'var(--text-primary)', marginTop: '3px', lineHeight: '1.4' }}>
                    {selectedEdge.details}
                  </div>
                </div>

                {/* Connected Cases */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78125rem' }}>
                  <div style={{ fontWeight: 700 }}>Connected Dockets:</div>
                  <div style={{ padding: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>Case A: RB-101</strong>
                      <span style={{ color: '#0284c7', fontWeight: 700 }}>Primary Lead</span>
                    </div>
                    <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>Regulation Bureau • Infrastructure & Faculty Deficit</div>
                  </div>
                  <div style={{ padding: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>Case B: PGRC-205</strong>
                      <span style={{ color: '#7c3aed', fontWeight: 700 }}>Duplicate Linked</span>
                    </div>
                    <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>Public Grievance Cell • Student Faculty Complaint</div>
                  </div>
                </div>

                {/* Overlap Evidence Reasons */}
                <div style={{ fontSize: '0.78125rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>Explainable Overlap Evidence:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedEdge.reasons.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: '#10b981' }}>✓</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
