'use client';

import React, { useState, useEffect } from 'react';
import styles from '../../app/dashboard.module.css';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  ShieldIcon,
  NetworkIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  BuildingIcon,
  ExternalLinkIcon,
  FileTextIcon,
  UserIcon,
} from '../icons/Icons';
import { BUREAUS, COMPLAINT_CASES } from '../../data/mockData';
import { useAuth } from '../../services/authContext.js';
import { ACTIONS } from '../../services/authConfig.js';
import { AnimatedCounter } from '../ui/AnimatedCounter';

// Initial realistic coordination requests matching SIH Problem Statement scenarios
const INITIAL_COORDINATION_REQUESTS = [
  {
    id: 'coord_01',
    request_no: 'COORD-2026-000108',
    initiating_bureau: 'Regulation Bureau (RB)',
    initiating_bureau_code: 'RB',
    initiating_bureau_color: '#1e40af',
    target_bureau: 'Public Grievance Redressal Cell (PGRC)',
    target_bureau_code: 'PGRC',
    target_bureau_color: '#7c3aed',
    complaint_no: 'RB-101',
    target_complaint_no: 'PGRC-205',
    institution_name: 'Apex Institute of Technology',
    aicte_id: '1-33248901',
    coordination_type: 'DUPLICATE_COORDINATION',
    priority: 'CRITICAL',
    status: 'IN_COORDINATION',
    purpose: 'Harmonize investigation on CSE faculty shortage and laboratory non-compliance. RB-101 designated primary coordination case.',
    target_response_status: 'RESPONDED',
    target_responded_at: '28 Oct 2026, 14:15',
    target_responded_by: 'P. Verma (Assistant Director, PGRC)',
    target_response_remarks: 'PGRC acknowledges duplicate relationship. Student grievance dossier transferred to RB-101 lead officer. Action sync approved.',
    joint_decision: null,
    joint_decision_by: null,
    joint_decision_at: null,
    requested_by: 'Dr. S. K. Nair (Deputy Director, RB)',
    requested_at: '27 Oct 2026, 11:30',
    due_date: '05 Nov 2026',
    action_items: [
      {
        id: 'act_101_1',
        description: 'Synchronize student grievance petition exhibits into RB-101 inspection dossier',
        assigned_to_bureau: 'PGRC',
        due_date: '31 Oct 2026',
        status: 'COMPLETED',
        completed_at: '28 Oct 2026, 16:00',
      },
      {
        id: 'act_101_2',
        description: 'Conduct joint on-site inspection of CAD/CAM laboratory and biometric faculty attendance logs',
        assigned_to_bureau: 'RB',
        due_date: '03 Nov 2026',
        status: 'IN_PROGRESS',
        completed_at: null,
      },
      {
        id: 'act_101_3',
        description: 'Formulate consolidated 30-day compliance notice covering faculty cadre and student grievances',
        assigned_to_bureau: 'RB & PGRC',
        due_date: '05 Nov 2026',
        status: 'PENDING',
        completed_at: null,
      },
    ],
  },
  {
    id: 'coord_02',
    request_no: 'COORD-2026-000109',
    initiating_bureau: 'Regulation Bureau (RB)',
    initiating_bureau_code: 'RB',
    initiating_bureau_color: '#1e40af',
    target_bureau: 'Vigilance Cell (VC)',
    target_bureau_code: 'VC',
    target_bureau_color: '#dc2626',
    complaint_no: 'RB-101',
    target_complaint_no: 'VIG-304',
    institution_name: 'Apex Institute of Technology',
    aicte_id: '1-33248901',
    coordination_type: 'JOINT_INQUIRY',
    priority: 'HIGH',
    status: 'REQUESTED',
    purpose: 'Cross-verify audited faculty rosters against whistleblower allegations of ghost faculty and payroll siphoning in VIG-304.',
    target_response_status: 'AWAITING_RESPONSE',
    target_responded_at: null,
    target_responded_by: null,
    target_response_remarks: null,
    joint_decision: null,
    joint_decision_by: null,
    joint_decision_at: null,
    requested_by: 'Dr. S. K. Nair (Deputy Director, RB)',
    requested_at: '29 Oct 2026, 09:45',
    due_date: '08 Nov 2026',
    action_items: [
      {
        id: 'act_102_1',
        description: 'Transmit certified biometric attendance logs and bank salary disbursement statements to Vigilance Cell',
        assigned_to_bureau: 'RB',
        due_date: '02 Nov 2026',
        status: 'IN_PROGRESS',
        completed_at: null,
      },
      {
        id: 'act_102_2',
        description: 'Vigilance forensic team verification of professor PAN/Aadhaar credentials',
        assigned_to_bureau: 'VC',
        due_date: '06 Nov 2026',
        status: 'PENDING',
        completed_at: null,
      },
    ],
  },
  {
    id: 'coord_03',
    request_no: 'COORD-2026-000095',
    initiating_bureau: 'Regulation Bureau (RB)',
    initiating_bureau_code: 'RB',
    initiating_bureau_color: '#1e40af',
    target_bureau: 'Public Grievance Redressal Cell (PGRC)',
    target_bureau_code: 'PGRC',
    target_bureau_color: '#7c3aed',
    complaint_no: 'RB-201',
    target_complaint_no: 'PGRC-288',
    institution_name: 'Saraswati College of Engineering',
    aicte_id: '1-44910283',
    coordination_type: 'SANCTION_HARMONIZATION',
    priority: 'HIGH',
    status: 'DECISION_RECORDED',
    purpose: 'Harmonize fee refund directive and capitation fee penalty across student grievances and regulation guidelines.',
    target_response_status: 'RESPONDED',
    target_responded_at: '25 Oct 2026, 10:20',
    target_responded_by: 'K. S. Raman (Director, PGRC)',
    target_response_remarks: 'PGRC attended joint coordination session. Verified 142 parent fee slips exceeding approved ceiling.',
    joint_decision: 'Binding Joint Decision: Institution directed to refund excess capitation fee of ₹35,000 per student within 15 days under AICTE Penalty Regulations. 10% intake reduction recommended for subsequent academic year.',
    joint_decision_by: 'Joint Committee (RB Director Bansal & PGRC Director Raman)',
    joint_decision_at: '27 Oct 2026, 16:30',
    requested_by: 'A. K. Bansal (RB)',
    requested_at: '22 Oct 2026, 14:00',
    due_date: '28 Oct 2026',
    action_items: [
      {
        id: 'act_103_1',
        description: 'Compile verified receipt ledger of inflated uniform and caution charges',
        assigned_to_bureau: 'PGRC',
        due_date: '24 Oct 2026',
        status: 'COMPLETED',
        completed_at: '24 Oct 2026, 17:00',
      },
      {
        id: 'act_103_2',
        description: 'Issue combined statutory show-cause notice under AICTE Regulations',
        assigned_to_bureau: 'RB',
        due_date: '27 Oct 2026',
        status: 'COMPLETED',
        completed_at: '27 Oct 2026, 16:30',
      },
    ],
  },
  {
    id: 'coord_04',
    request_no: 'COORD-2026-000088',
    initiating_bureau: 'Student Development Cell (SDC)',
    initiating_bureau_code: 'SDC',
    initiating_bureau_color: '#059669',
    target_bureau: 'Approval Bureau (AB)',
    target_bureau_code: 'AB',
    target_bureau_code: 'AB',
    target_bureau_color: '#0284c7',
    complaint_no: 'SDC-412',
    target_complaint_no: 'AB-520',
    institution_name: 'Greenfield Institute of Pharmacy',
    aicte_id: '1-55829104',
    coordination_type: 'DOCUMENT_VERIFICATION',
    priority: 'MEDIUM',
    status: 'IN_COORDINATION',
    purpose: 'Examine certificate withholding complaints during upcoming annual Extension of Approval (EoA) verification scrutiny.',
    target_response_status: 'RESPONDED',
    target_responded_at: '24 Oct 2026, 15:45',
    target_responded_by: 'Dr. M. K. Kulkarni (AB)',
    target_response_remarks: 'AB inspection scrutiny team notified. Certificate release affidavit added to mandatory EoA checklist.',
    joint_decision: null,
    joint_decision_by: null,
    joint_decision_at: null,
    requested_by: 'Sunita Joshi (SDC)',
    requested_at: '23 Oct 2026, 11:00',
    due_date: '10 Nov 2026',
    action_items: [
      {
        id: 'act_104_1',
        description: 'Attach pending certificate grievance list to AICTE Approval Portal institution docket',
        assigned_to_bureau: 'AB',
        due_date: '30 Oct 2026',
        status: 'COMPLETED',
        completed_at: '26 Oct 2026, 12:00',
      },
      {
        id: 'act_104_2',
        description: 'Collect compliance undertaking from college principal prior to EoA renewal sign-off',
        assigned_to_bureau: 'AB',
        due_date: '08 Nov 2026',
        status: 'IN_PROGRESS',
        completed_at: null,
      },
    ],
  },
];

export function BureauWorkloadView({ onInspectCase }) {
  const { can, currentUser } = useAuth();
  const canCoordinate = can(ACTIONS.ASSIGN_COMPLAINT) || can(ACTIONS.TRANSFER_COMPLAINT);

  // Sub-tab selection: Workspace vs Workload Analytics
  const [activeSubTab, setActiveSubTab] = useState('workspace'); // 'workspace' | 'workload'

  // Coordination dataset state
  const [coordinationRequests, setCoordinationRequests] = useState(INITIAL_COORDINATION_REQUESTS);
  const [filterResponseStatus, setFilterResponseStatus] = useState('ALL');
  const [filterCoordType, setFilterCoordType] = useState('ALL');
  const [selectedBureauId, setSelectedBureauId] = useState('all');

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [respondingCoord, setRespondingCoord] = useState(null);
  const [actionCoord, setActionCoord] = useState(null);
  const [decisionCoord, setDecisionCoord] = useState(null);

  // Form states
  const [newRequestForm, setNewRequestForm] = useState({
    initiating_bureau_id: 1,
    target_bureau_id: 2,
    complaint_no: 'RB-101',
    target_complaint_no: 'PGRC-205',
    institution_name: 'Apex Institute of Technology',
    aicte_id: '1-33248901',
    coordination_type: 'JOINT_INQUIRY',
    priority: 'HIGH',
    purpose: '',
    due_date: '2026-11-20',
    initial_action: '',
  });

  const [responseRemarks, setResponseRemarks] = useState('');
  const [responseDecisionType, setResponseDecisionType] = useState('RESPONDED'); // 'RESPONDED' | 'DECLINED'
  const [newActionDescription, setNewActionDescription] = useState('');
  const [newActionBureau, setNewActionBureau] = useState('PGRC');
  const [newActionDueDate, setNewActionDueDate] = useState('');
  const [jointDecisionText, setJointDecisionText] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 6000);
  };

  // Derive coordination KPIs
  const totalRequests = coordinationRequests.length;
  const awaitingResponseCount = coordinationRequests.filter((r) => r.target_response_status === 'AWAITING_RESPONSE').length;
  const inCoordinationCount = coordinationRequests.filter((r) => r.status === 'IN_COORDINATION').length;
  const decisionsRecordedCount = coordinationRequests.filter((r) => r.status === 'DECISION_RECORDED').length;

  // Filtered coordination requests
  const filteredRequests = coordinationRequests.filter((req) => {
    if (filterResponseStatus !== 'ALL') {
      if (filterResponseStatus === 'AWAITING' && req.target_response_status !== 'AWAITING_RESPONSE') return false;
      if (filterResponseStatus === 'RESPONDED' && req.target_response_status !== 'RESPONDED') return false;
      if (filterResponseStatus === 'DECIDED' && req.status !== 'DECISION_RECORDED') return false;
    }
    if (filterCoordType !== 'ALL' && req.coordination_type !== filterCoordType) {
      return false;
    }
    return true;
  });

  // Handler: Submit New Coordination Request
  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (!newRequestForm.purpose.trim()) return;

    const newReq = {
      id: `coord_${Date.now()}`,
      request_no: `COORD-2026-${String(Math.floor(Math.random() * 900000) + 100000)}`,
      initiating_bureau: 'Regulation Bureau (RB)',
      initiating_bureau_code: 'RB',
      initiating_bureau_color: '#1e40af',
      target_bureau: newRequestForm.target_bureau_id === 2 ? 'Public Grievance Redressal Cell (PGRC)' : 'Vigilance Cell (VC)',
      target_bureau_code: newRequestForm.target_bureau_id === 2 ? 'PGRC' : 'VC',
      target_bureau_color: newRequestForm.target_bureau_id === 2 ? '#7c3aed' : '#dc2626',
      complaint_no: newRequestForm.complaint_no,
      target_complaint_no: newRequestForm.target_complaint_no || null,
      institution_name: newRequestForm.institution_name,
      aicte_id: newRequestForm.aicte_id,
      coordination_type: newRequestForm.coordination_type,
      priority: newRequestForm.priority,
      status: 'REQUESTED',
      purpose: newRequestForm.purpose,
      target_response_status: 'AWAITING_RESPONSE',
      target_responded_at: null,
      target_responded_by: null,
      target_response_remarks: null,
      joint_decision: null,
      joint_decision_by: null,
      joint_decision_at: null,
      requested_by: currentUser?.name || 'Dr. S. K. Nair (Deputy Director, RB)',
      requested_at: 'Just now',
      due_date: newRequestForm.due_date,
      action_items: newRequestForm.initial_action
        ? [
            {
              id: `act_${Date.now()}`,
              description: newRequestForm.initial_action,
              assigned_to_bureau: newRequestForm.target_bureau_id === 2 ? 'PGRC' : 'VC',
              due_date: newRequestForm.due_date,
              status: 'PENDING',
              completed_at: null,
            },
          ]
        : [],
    };

    setCoordinationRequests([newReq, ...coordinationRequests]);
    setIsRequestModalOpen(false);
    setNewRequestForm({
      initiating_bureau_id: 1,
      target_bureau_id: 2,
      complaint_no: 'RB-101',
      target_complaint_no: 'PGRC-205',
      institution_name: 'Apex Institute of Technology',
      aicte_id: '1-33248901',
      coordination_type: 'JOINT_INQUIRY',
      priority: 'HIGH',
      purpose: '',
      due_date: '2026-11-20',
      initial_action: '',
    });

    showToast(`✓ Coordination Request ${newReq.request_no} created and dispatched to ${newReq.target_bureau}. Notification alert sent.`);
  };

  // Handler: Target Bureau Responds
  const handleRecordResponse = (e) => {
    e.preventDefault();
    if (!respondingCoord || !responseRemarks.trim()) return;

    setCoordinationRequests((prev) =>
      prev.map((item) => {
        if (item.id === respondingCoord.id) {
          return {
            ...item,
            target_response_status: responseDecisionType,
            status: responseDecisionType === 'DECLINED' ? 'DECLINED' : 'IN_COORDINATION',
            target_responded_at: 'Just now',
            target_responded_by: currentUser?.name || 'Authorized Officer',
            target_response_remarks: responseRemarks,
          };
        }
        return item;
      })
    );

    showToast(`✓ Response recorded on ${respondingCoord.request_no}. Status updated to ${responseDecisionType === 'DECLINED' ? 'DECLINED' : 'IN_COORDINATION'}.`);
    setRespondingCoord(null);
    setResponseRemarks('');
  };

  // Handler: Add Follow-up Action
  const handleAddAction = (e) => {
    e.preventDefault();
    if (!actionCoord || !newActionDescription.trim()) return;

    const newAction = {
      id: `act_${Date.now()}`,
      description: newActionDescription,
      assigned_to_bureau: newActionBureau,
      due_date: newActionDueDate || '2026-11-15',
      status: 'PENDING',
      completed_at: null,
    };

    setCoordinationRequests((prev) =>
      prev.map((item) => {
        if (item.id === actionCoord.id) {
          return {
            ...item,
            action_items: [...(item.action_items || []), newAction],
          };
        }
        return item;
      })
    );

    showToast(`✓ Follow-up action assigned to ${newActionBureau} on docket ${actionCoord.request_no}.`);
    setActionCoord(null);
    setNewActionDescription('');
    setNewActionDueDate('');
  };

  // Handler: Toggle Action Item Status
  const handleToggleActionStatus = (coordId, actionId) => {
    setCoordinationRequests((prev) =>
      prev.map((item) => {
        if (item.id === coordId) {
          const updatedItems = (item.action_items || []).map((act) => {
            if (act.id === actionId) {
              const nextStatus = act.status === 'COMPLETED' ? 'PENDING' : act.status === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED';
              return {
                ...act,
                status: nextStatus,
                completed_at: nextStatus === 'COMPLETED' ? new Date().toLocaleDateString('en-GB') : null,
              };
            }
            return act;
          });
          return { ...item, action_items: updatedItems };
        }
        return item;
      })
    );
  };

  // Handler: Record Joint Binding Decision
  const handleRecordDecision = (e) => {
    e.preventDefault();
    if (!decisionCoord || !jointDecisionText.trim()) return;

    setCoordinationRequests((prev) =>
      prev.map((item) => {
        if (item.id === decisionCoord.id) {
          return {
            ...item,
            status: 'DECISION_RECORDED',
            joint_decision: jointDecisionText,
            joint_decision_by: currentUser?.name || 'Joint Bureau Committee',
            joint_decision_at: 'Just now',
          };
        }
        return item;
      })
    );

    showToast(`✓ Joint Coordination Decision recorded on ${decisionCoord.request_no}. Mirrored in timeline history of linked cases.`);
    setDecisionCoord(null);
    setJointDecisionText('');
  };

  // Workload analytics data (tab 2)
  const bureauStats = BUREAUS.filter((b) => b.id !== 'all').map((bureau) => {
    const assignedCases = COMPLAINT_CASES.filter((c) => c.assignedBureau === bureau.name);
    const active = assignedCases.filter((c) => c.status === 'Under Review' || c.status === 'Pending').length;
    const resolved = assignedCases.filter((c) => c.status === 'Resolved').length;
    const overdue = assignedCases.filter((c) => c.status === 'Overdue' || c.ageingDays > 30).length;
    const multiCount = assignedCases.filter((c) => c.secondaryBureaus?.length > 0).length;

    return {
      ...bureau,
      totalAssigned: assignedCases.length,
      active,
      resolved,
      overdue,
      multiCount,
      slaRate: assignedCases.length > 0 ? Math.round(((assignedCases.length - overdue) / assignedCases.length) * 100) : 100,
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 'var(--radius-md)',
            color: '#15803d',
            fontSize: '0.84375rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace Header & Sub-Tab Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(30, 64, 175, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1e40af',
            }}
          >
            <NetworkIcon size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Cross-Bureau Coordination Workspace
              </h2>
              <Badge variant="info">Active Work Environment</Badge>
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Request inter-cell inquiries, assign follow-up action items, track target bureau responses & record joint decisions
            </p>
          </div>
        </div>

        {/* Sub-tab Switcher & Request Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-card)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveSubTab('workspace')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: activeSubTab === 'workspace' ? 'var(--color-brand-primary)' : 'transparent',
                color: activeSubTab === 'workspace' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Coordination Workspace ({coordinationRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('workload')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: activeSubTab === 'workload' ? 'var(--color-brand-primary)' : 'transparent',
                color: activeSubTab === 'workload' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Cell Workload Analytics
            </button>
          </div>

          {canCoordinate && (
            <Button variant="primary" size="sm" onClick={() => setIsRequestModalOpen(true)}>
              + Request Cross-Bureau Coordination
            </Button>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          SUB-TAB 1: CROSS-BUREAU COORDINATION WORKSPACE
          ────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'workspace' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Real-time Workspace KPI Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
            <div
              className={styles.summaryCard}
              style={{ borderTopColor: '#1e40af', padding: '12px 16px', gap: '4px' }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                TOTAL ACTIVE DOCKETS
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e40af' }}>
                <AnimatedCounter value={totalRequests} duration={800} />
              </div>
              <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                Multi-bureau collaborative files
              </div>
            </div>

            <div
              className={styles.summaryCard}
              style={{
                borderTopColor: '#f59e0b',
                padding: '12px 16px',
                gap: '4px',
                backgroundColor: awaitingResponseCount > 0 ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-surface)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>
                  ⏳ AWAITING BUREAU RESPONSE
                </span>
                {awaitingResponseCount > 0 && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }}>
                <AnimatedCounter value={awaitingResponseCount} duration={800} />
              </div>
              <div style={{ fontSize: '0.71875rem', color: '#b45309', fontWeight: 600 }}>
                Pending target cell acknowledgment
              </div>
            </div>

            <div
              className={styles.summaryCard}
              style={{ borderTopColor: '#0284c7', padding: '12px 16px', gap: '4px' }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                🔄 IN ACTIVE COORDINATION
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7' }}>
                <AnimatedCounter value={inCoordinationCount} duration={800} />
              </div>
              <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                Inquiry & action tasks underway
              </div>
            </div>

            <div
              className={styles.summaryCard}
              style={{ borderTopColor: '#10b981', padding: '12px 16px', gap: '4px' }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                🏛️ JOINT DECISIONS RECORDED
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                <AnimatedCounter value={decisionsRecordedCount} duration={800} />
              </div>
              <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                Binding resolution finalized
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Response Status Filter:
              </span>
              {[
                { id: 'ALL', label: 'All Dockets' },
                { id: 'AWAITING', label: '⏳ Awaiting Response' },
                { id: 'RESPONDED', label: '✅ Responded / Active' },
                { id: 'DECIDED', label: '🏛️ Decision Finalized' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterResponseStatus(tab.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: filterResponseStatus === tab.id ? 'var(--color-brand-primary)' : 'var(--border-subtle)',
                    backgroundColor: filterResponseStatus === tab.id ? 'var(--color-brand-primary)' : 'var(--bg-card)',
                    color: filterResponseStatus === tab.id ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>Type:</span>
              <select
                value={filterCoordType}
                onChange={(e) => setFilterCoordType(e.target.value)}
                style={{
                  fontSize: '0.78125rem',
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="ALL">All Coordination Types</option>
                <option value="DUPLICATE_COORDINATION">Duplicate Coordination</option>
                <option value="JOINT_INQUIRY">Joint Inquiry</option>
                <option value="SANCTION_HARMONIZATION">Sanction Harmonization</option>
                <option value="DOCUMENT_VERIFICATION">Document Verification</option>
              </select>
            </div>
          </div>

          {/* Coordination Dockets List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {filteredRequests.map((req) => {
              const isAwaiting = req.target_response_status === 'AWAITING_RESPONSE';
              const isResponded = req.target_response_status === 'RESPONDED';
              const isDecided = req.status === 'DECISION_RECORDED';

              const completedTasks = (req.action_items || []).filter((a) => a.status === 'COMPLETED').length;
              const totalTasks = (req.action_items || []).length;

              return (
                <div
                  key={req.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: 'var(--shadow-sm)',
                    borderLeft: `4px solid ${
                      isDecided ? '#10b981' : isAwaiting ? '#f59e0b' : '#1e40af'
                    }`,
                  }}
                >
                  {/* Docket Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '1.0625rem', color: 'var(--color-brand-primary)' }}>
                          {req.request_no}
                        </strong>
                        <Badge variant={req.priority === 'CRITICAL' ? 'critical' : 'warning'}>
                          {req.priority}
                        </Badge>
                        <Badge variant={isDecided ? 'success' : isAwaiting ? 'warning' : 'info'}>
                          {req.status.replace('_', ' ')}
                        </Badge>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Initiated by: <strong>{req.requested_by}</strong> ({req.requested_at})
                        </span>
                      </div>

                      {/* Path & Institution */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(30, 64, 175, 0.1)',
                            color: req.initiating_bureau_color,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        >
                          {req.initiating_bureau}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>➔</span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(124, 58, 237, 0.1)',
                            color: req.target_bureau_color,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        >
                          {req.target_bureau}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• Target SLA:</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {req.due_date}
                        </span>
                      </div>
                    </div>

                    {/* Linked Cases Badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected Cases:</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Badge variant="neutral">Case A: {req.complaint_no}</Badge>
                        {req.target_complaint_no && (
                          <Badge variant="neutral">Case B: {req.target_complaint_no}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Purpose & Subject */}
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-surface-secondary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8125rem',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <strong>Subject & Coordination Mandate:</strong> {req.purpose}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Institution: <strong>{req.institution_name}</strong> (AICTE PID: {req.aicte_id})
                    </div>
                  </div>

                  {/* ──────────────────────────────────────────────────────────
                      RESPONSE TRACKER PANEL (Track whether target bureau responded)
                      ────────────────────────────────────────────────────────── */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isAwaiting
                        ? '#fffbeb'
                        : isDecided
                        ? '#f0fdf4'
                        : '#f8fafc',
                      border: `1px solid ${
                        isAwaiting ? '#fde68a' : isDecided ? '#bbf7d0' : '#e2e8f0'
                      }`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1rem' }}>
                          {isAwaiting ? '⏳' : isDecided ? '🏛️' : '✅'}
                        </span>
                        <strong
                          style={{
                            fontSize: '0.8125rem',
                            color: isAwaiting ? '#b45309' : isDecided ? '#15803d' : '#0369a1',
                          }}
                        >
                          {isAwaiting
                            ? `AWAITING RESPONSE FROM ${req.target_bureau_code}`
                            : isDecided
                            ? 'BINDING JOINT COORDINATION DECISION FINALIZED'
                            : `ACKNOWLEDGED & RESPONDED BY ${req.target_bureau_code}`}
                        </strong>
                      </div>

                      {/* Action to respond if still awaiting */}
                      {isAwaiting && canCoordinate && (
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => setRespondingCoord(req)}
                        >
                          Record {req.target_bureau_code} Response
                        </Button>
                      )}
                    </div>

                    {isAwaiting ? (
                      <div style={{ fontSize: '0.78125rem', color: '#92400e' }}>
                        Formal inquiry notice dispatched. Waiting for officer from {req.target_bureau} to confirm participation and evidence sharing before deadline ({req.due_date}).
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
                        <div>
                          <strong>Responding Officer:</strong> {req.target_responded_by}{' '}
                          <span style={{ color: 'var(--text-muted)' }}>({req.target_responded_at})</span>
                        </div>
                        <div style={{ marginTop: '3px', fontStyle: 'italic', color: 'var(--text-primary)' }}>
                          "{req.target_response_remarks}"
                        </div>
                      </div>
                    )}

                    {/* Joint Binding Decision Box */}
                    {isDecided && req.joint_decision && (
                      <div
                        style={{
                          marginTop: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#ffffff',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #86efac',
                          fontSize: '0.78125rem',
                          color: '#166534',
                        }}
                      >
                        <strong>Joint Binding Order:</strong> {req.joint_decision}
                        <div style={{ fontSize: '0.71875rem', color: '#15803d', marginTop: '2px' }}>
                          Signed by: {req.joint_decision_by} • Recorded at {req.joint_decision_at}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ──────────────────────────────────────────────────────────
                      FOLLOW-UP ACTION ITEMS CHECKLIST
                      ────────────────────────────────────────────────────────── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Follow-up Action Items</span>
                        <Badge variant="neutral">
                          {completedTasks}/{totalTasks} Completed
                        </Badge>
                      </div>

                      {canCoordinate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActionCoord(req)}
                          style={{ fontSize: '0.75rem' }}
                        >
                          + Assign New Action
                        </Button>
                      )}
                    </div>

                    {/* Actions List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(req.action_items || []).map((action) => (
                        <div
                          key={action.id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: action.status === 'COMPLETED' ? '#f0fdf4' : 'var(--bg-card)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                            fontSize: '0.78125rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 300px' }}>
                            <input
                              type="checkbox"
                              checked={action.status === 'COMPLETED'}
                              onChange={() => handleToggleActionStatus(req.id, action.id)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span
                              style={{
                                textDecoration: action.status === 'COMPLETED' ? 'line-through' : 'none',
                                color: action.status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--text-primary)',
                                fontWeight: action.status === 'IN_PROGRESS' ? 600 : 400,
                              }}
                            >
                              {action.description}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Badge variant="neutral">Assigned: {action.assigned_to_bureau || 'Bureau'}</Badge>
                            <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>Due: {action.due_date}</span>
                            <Badge
                              variant={
                                action.status === 'COMPLETED'
                                  ? 'success'
                                  : action.status === 'IN_PROGRESS'
                                  ? 'warning'
                                  : 'neutral'
                              }
                            >
                              {action.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const match = COMPLAINT_CASES.find((c) => c.id.includes(req.complaint_no));
                        if (match && onInspectCase) onInspectCase(match);
                      }}
                    >
                      Inspect Case Dossier
                    </Button>

                    {!isDecided && canCoordinate && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setDecisionCoord(req)}
                      >
                        🏛️ Record Joint Binding Decision
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────
          SUB-TAB 2: CELL WORKLOAD ANALYTICS
          ────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'workload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            {bureauStats.map((b) => (
              <div
                key={b.id}
                className={styles.summaryCard}
                style={{
                  borderTopColor: b.color,
                  cursor: 'pointer',
                  backgroundColor: selectedBureauId === b.id ? 'var(--bg-surface-secondary)' : 'var(--bg-surface)',
                  outline: selectedBureauId === b.id ? `2px solid ${b.color}` : 'none',
                }}
                onClick={() => setSelectedBureauId(selectedBureauId === b.id ? 'all' : b.id)}
              >
                <div className={styles.summaryLabel}>
                  <span>{b.code} • {b.name}</span>
                  <ShieldIcon size={16} />
                </div>
                <div className={styles.summaryValueGroup}>
                  <span className={styles.summaryValue} style={{ color: b.color }}>
                    <AnimatedCounter value={b.totalAssigned} delay={bureauStats.indexOf(b) * 80} duration={1000} /> Cases
                  </span>
                  <Badge variant={b.overdue > 0 ? 'critical' : 'success'}>
                    <AnimatedCounter value={b.slaRate} suffix="% SLA" delay={bureauStats.indexOf(b) * 80 + 40} duration={900} />
                  </Badge>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                  <div>Active Inquiries: <strong><AnimatedCounter value={b.active} delay={100} duration={900} /></strong></div>
                  <div>Joint Cell Cases: <strong><AnimatedCounter value={b.multiCount} delay={150} duration={900} /></strong></div>
                  <div>Overdue SLA: <strong style={{ color: b.overdue > 0 ? '#dc2626' : 'inherit' }}><AnimatedCounter value={b.overdue} delay={200} duration={900} /></strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────
          MODAL 1: REQUEST CROSS-BUREAU COORDINATION
          ────────────────────────────────────────────────────────────────── */}
      {isRequestModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', maxWidth: '580px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>
                Request Cross-Bureau Coordination
              </h3>
              <button type="button" onClick={() => setIsRequestModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Target Bureau *</label>
                  <select
                    value={newRequestForm.target_bureau_id}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, target_bureau_id: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  >
                    <option value={2}>Public Grievance Redressal Cell (PGRC)</option>
                    <option value={3}>Vigilance Cell (VC)</option>
                    <option value={4}>Approval Bureau (AB)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Coordination Type</label>
                  <select
                    value={newRequestForm.coordination_type}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, coordination_type: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  >
                    <option value="JOINT_INQUIRY">Joint Inquiry</option>
                    <option value="DUPLICATE_COORDINATION">Duplicate Coordination</option>
                    <option value="DOCUMENT_VERIFICATION">Document Verification</option>
                    <option value="SANCTION_HARMONIZATION">Sanction Harmonization</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Primary Case No</label>
                  <input
                    type="text"
                    value={newRequestForm.complaint_no}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, complaint_no: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Target Case No (Optional)</label>
                  <input
                    type="text"
                    value={newRequestForm.target_complaint_no}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, target_complaint_no: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Coordination Purpose & Objectives *</label>
                <textarea
                  rows={3}
                  value={newRequestForm.purpose}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, purpose: e.target.value })}
                  placeholder="State the cross-cell issue, evidence to be shared, and expected joint resolution outcome..."
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Initial Follow-Up Action</label>
                <input
                  type="text"
                  value={newRequestForm.initial_action}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, initial_action: e.target.value })}
                  placeholder="e.g. Schedule preliminary evidence review with nominated officer"
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsRequestModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Dispatch Coordination Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────
          MODAL 2: RECORD TARGET BUREAU RESPONSE
          ────────────────────────────────────────────────────────────────── */}
      {respondingCoord && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', maxWidth: '520px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>
                Record Response: {respondingCoord.request_no}
              </h3>
              <button type="button" onClick={() => setRespondingCoord(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Responding as <strong>{respondingCoord.target_bureau}</strong> officer to request from {respondingCoord.initiating_bureau}.
            </div>

            <form onSubmit={handleRecordResponse} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Response Decision</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="respType"
                      checked={responseDecisionType === 'RESPONDED'}
                      onChange={() => setResponseDecisionType('RESPONDED')}
                    />
                    Accept & Participate in Joint Coordination
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="respType"
                      checked={responseDecisionType === 'DECLINED'}
                      onChange={() => setResponseDecisionType('DECLINED')}
                    />
                    Decline (Outside Bureau Scope)
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Response Remarks & Nominated Officer *</label>
                <textarea
                  rows={3}
                  value={responseRemarks}
                  onChange={(e) => setResponseRemarks(e.target.value)}
                  placeholder="Record formal acknowledgement, nominated representative, or reason for decline..."
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setRespondingCoord(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Confirm & Submit Response
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────
          MODAL 3: ASSIGN FOLLOW-UP ACTION
          ────────────────────────────────────────────────────────────────── */}
      {actionCoord && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', maxWidth: '500px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>
                Assign Follow-Up Action Item
              </h3>
              <button type="button" onClick={() => setActionCoord(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleAddAction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Action Description *</label>
                <textarea
                  rows={2}
                  value={newActionDescription}
                  onChange={(e) => setNewActionDescription(e.target.value)}
                  placeholder="Specify task (e.g. Conduct biometric audit, issue joint inspection order)..."
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Assigned To Bureau</label>
                  <select
                    value={newActionBureau}
                    onChange={(e) => setNewActionBureau(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  >
                    <option value="RB">Regulation Bureau (RB)</option>
                    <option value="PGRC">Public Grievance Redressal Cell (PGRC)</option>
                    <option value="VC">Vigilance Cell (VC)</option>
                    <option value="Joint">Joint RB & PGRC Team</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Due Date</label>
                  <input
                    type="date"
                    value={newActionDueDate}
                    onChange={(e) => setNewActionDueDate(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setActionCoord(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save & Assign Action
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────
          MODAL 4: RECORD JOINT BINDING DECISION
          ────────────────────────────────────────────────────────────────── */}
      {decisionCoord && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', maxWidth: '560px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>
                Record Joint Binding Coordination Decision
              </h3>
              <button type="button" onClick={() => setDecisionCoord(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Docket: <strong>{decisionCoord.request_no}</strong> ({decisionCoord.initiating_bureau_code} ⇄ {decisionCoord.target_bureau_code})<br />
              Institution: {decisionCoord.institution_name}
            </div>

            <form onSubmit={handleRecordDecision} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Joint Decision & Directive Text *</label>
                <textarea
                  rows={4}
                  value={jointDecisionText}
                  onChange={(e) => setJointDecisionText(e.target.value)}
                  placeholder="Record formal binding order agreed by participating bureau officers (e.g. lead bureau issues unified show-cause notice, penalty imposed, secondary hearings stayed)..."
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  required
                />
              </div>

              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: '#f0fdf4', border: '1px solid #86efac', fontSize: '0.75rem', color: '#166534' }}>
                ⚖️ <strong>Zero Data Loss & Synchronization:</strong> Recording this decision will permanently mirror the findings into the immutable audit trail of both cases ({decisionCoord.complaint_no} & {decisionCoord.target_complaint_no || 'Target Case'}) without deleting any grievance records.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setDecisionCoord(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Record Binding Decision
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
