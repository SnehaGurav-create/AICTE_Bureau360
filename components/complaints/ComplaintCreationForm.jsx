'use client';

import React, { useState, useRef } from 'react';
import styles from './creationForm.module.css';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  FileTextIcon,
  BuildingIcon,
  ShieldIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XIcon,
} from '../icons/Icons';
import { INSTITUTIONS } from '../../data/mockData';
import {
  APP_CONFIG,
  PERMITTED_PRIORITIES,
  PERMITTED_SOURCES,
  DEMO_CATEGORIES,
  mapFormToApiPayload,
  submitComplaint,
  submitComplaintDemo,
} from '../../services/api';
import { useAuth } from '../../services/authContext.js';
import { ACTIONS } from '../../services/authConfig.js';
import { AccessDenied } from '../auth/AccessDenied';

export function ComplaintCreationForm({ onCancel, onDemoSubmissionComplete }) {
  const { can } = useAuth();
  if (!can(ACTIONS.CREATE_COMPLAINT)) {
    return (
      <AccessDenied
        attemptedTab="Register Complaint"
        onGoToDashboard={onCancel}
      />
    );
  }
  // Central Form State Model
  const [formState, setFormState] = useState({
    selectedAicteId: '',
    selectedCategoryId: String(DEMO_CATEGORIES[0].category_id),
    title: '',
    description: '',
    priority: 'MEDIUM',
    source: 'PORTAL',
    isAnonymous: false,
    complainantName: '',
    complainantEmail: '',
    complainantPhone: '',
    externalRefNo: '',
    receivedOn: new Date().toISOString().slice(0, 10),
  });

  // Autocomplete & Search State
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [isSearchingInst, setIsSearchingInst] = useState(false);

  // Attachments State (Native File objects for multipart files[] expectation)
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  // Processing & UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [demoOutcome, setDemoOutcome] = useState(null);
  const [showPayloadInspector, setShowPayloadInspector] = useState(false);

  // Filter demonstration institutions for autocomplete
  const matchedInstitutions = institutionSearch.trim()
    ? INSTITUTIONS.filter((inst) => {
        const q = institutionSearch.toLowerCase();
        return (
          inst.name.toLowerCase().includes(q) ||
          inst.id.toLowerCase().includes(q) ||
          inst.district.toLowerCase().includes(q) ||
          inst.state.toLowerCase().includes(q)
        );
      }).slice(0, 5)
    : [];

  const handleSelectInstitution = (inst) => {
    setSelectedInstitution(inst);
    setFormState((prev) => ({ ...prev, selectedAicteId: inst.id }));
    setInstitutionSearch(inst.name);
    setIsSearchingInst(false);
    if (validationErrors.selectedAicteId) {
      setValidationErrors((prev) => ({ ...prev, selectedAicteId: null }));
    }
  };

  const handleClearInstitution = () => {
    setSelectedInstitution(null);
    setInstitutionSearch('');
    setFormState((prev) => ({ ...prev, selectedAicteId: '' }));
  };

  // Attachments Handling
  const handleFileSelection = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Client-Side Validation
  const validateForm = () => {
    const errs = {};

    if (!formState.selectedAicteId.trim()) {
      errs.selectedAicteId = 'Target institution AICTE ID (aicte_id) is required.';
    }

    if (!formState.selectedCategoryId) {
      errs.selectedCategoryId = 'Grievance category selection (category_id) is required.';
    }

    if (!formState.title.trim()) {
      errs.title = 'Title (title) is required.';
    } else if (formState.title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters.';
    }

    if (!formState.description.trim()) {
      errs.description = 'Description narrative (description) is required.';
    } else if (formState.description.trim().length < 20) {
      errs.description = 'Description narrative must be at least 20 characters.';
    }

    if (!PERMITTED_PRIORITIES.includes(formState.priority)) {
      errs.priority = `Priority must be one of: ${PERMITTED_PRIORITIES.join(', ')}`;
    }

    if (!PERMITTED_SOURCES.includes(formState.source)) {
      errs.source = `Source must be one of: ${PERMITTED_SOURCES.join(', ')}`;
    }

    if (!formState.isAnonymous && formState.complainantEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formState.complainantEmail.trim())) {
        errs.complainantEmail = 'Please provide a valid email format.';
      }
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submission handler in DEMONSTRATION MODE
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Form values are preserved in state for correction
      return;
    }

    setIsSubmitting(true);
    setDemoOutcome(null);

    // Call unified complaint service facade (decoupled from transport)
    const outcome = await submitComplaint(formState, attachments);

    setIsSubmitting(false);
    setDemoOutcome(outcome);

    if (onDemoSubmissionComplete) {
      onDemoSubmissionComplete(outcome);
    }
  };

  // Compute live mapped payload for transparency inspection
  const liveMappedPayload = mapFormToApiPayload({ ...formState, attachments });

  return (
    <form className={styles.formContainer} onSubmit={handleFormSubmit} noValidate>
      {/* 1. Demonstration Mode Advisory Banner */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-lg)',
          color: '#1e40af',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
        role="status"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldIcon size={18} />
          <span style={{ fontSize: '0.8125rem' }}>
            <strong>DEMONSTRATION MODE ACTIVE:</strong> Submissions are simulated locally for SIH PS 26264 evaluation and are <strong>NOT SAVED TO THE BACKEND</strong>. No network calls to invented endpoints are made.
          </span>
        </div>
        <Badge variant="info">Configuration: DEMO_MODE = {APP_CONFIG.DEMO_MODE ? 'TRUE' : 'FALSE'}</Badge>
      </div>

      {/* 2. Form Header */}
      <div className={styles.formHeader}>
        <div className={styles.headerTitleGroup}>
          <h2 className={styles.mainTitle}>
            <FileTextIcon size={22} />
            Institutional Grievance Registration & Intake Docket
          </h2>
          <p className={styles.subtitle}>
            Standardized complaint intake model adhering to the agreed cross-bureau API contract.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setShowPayloadInspector(!showPayloadInspector)}
          >
            {showPayloadInspector ? 'Hide Payload Inspector' : '🔍 Inspect Mapped API Payload'}
          </Button>
          <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      {/* 3. Mapped Payload Inspector (Transparent Contract Verification) */}
      {showPayloadInspector && (
        <div
          style={{
            padding: '14px',
            backgroundColor: '#0f172a',
            color: '#38bdf8',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            overflowX: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}>
            <span>EXPLICIT API MAPPING LAYER OUTPUT:</span>
            <span>(Complainant email & phone explicitly marked as unconfirmed)</span>
          </div>
          <pre style={{ margin: 0 }}>{JSON.stringify(liveMappedPayload, null, 2)}</pre>
        </div>
      )}

      {/* 4. Demonstration Outcome Result (Clearly Labelled NOT SAVED TO BACKEND) */}
      {demoOutcome && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
          role="status"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircleIcon size={20} />
              <strong style={{ color: '#92400e', fontSize: '0.9375rem' }}>
                DEMONSTRATION OUTCOME: LOCAL PREVIEW PROCESSED
              </strong>
            </div>
            <Badge variant="critical">STATUS: NOT SAVED TO THE BACKEND</Badge>
          </div>

          <p style={{ fontSize: '0.8125rem', color: '#78350f', margin: 0 }}>
            {demoOutcome.message}
          </p>

          <div style={{ padding: '8px 12px', backgroundColor: '#fef3c7', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: '#92400e' }}>
            <div>Local Preview Docket ID: <strong>{demoOutcome.demoDocketLabel}</strong> (Not a backend-generated record)</div>
            <div>Attachments queued for multipart transmission: <strong>{demoOutcome.attachmentCount} document(s)</strong></div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <Button variant="primary" size="sm" type="button" onClick={onCancel}>
              ← Return to Complaints Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setDemoOutcome(null)}
            >
              Continue Editing Intake
            </Button>
          </div>
        </div>
      )}

      {/* Section 1: Target Technical Institution (aicte_id) */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <BuildingIcon size={18} />
            1. Target Technical Institution
          </h3>
          <span className={styles.sectionHelp}>Mapped to API property: <code>aicte_id</code></span>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="inst-search-field">
            Search Approved Institution (Demo Dataset) <span className={styles.requiredAsterisk}>*</span>
          </label>
          <div className={styles.autocompleteWrapper}>
            <input
              id="inst-search-field"
              type="search"
              className={`${styles.input} ${validationErrors.selectedAicteId ? styles.inputError : ''}`}
              placeholder="Type institution name or Permanent ID (e.g. Apex Institute or 1-3324501)..."
              value={institutionSearch}
              onChange={(e) => {
                setInstitutionSearch(e.target.value);
                setFormState((prev) => ({ ...prev, selectedAicteId: e.target.value }));
                setIsSearchingInst(true);
              }}
              onFocus={() => setIsSearchingInst(true)}
              autoComplete="off"
            />

            {/* Autocomplete list */}
            {isSearchingInst && matchedInstitutions.length > 0 && (
              <ul className={styles.dropdownList}>
                {matchedInstitutions.map((inst) => (
                  <li
                    key={inst.id}
                    className={styles.dropdownItem}
                    onClick={() => handleSelectInstitution(inst)}
                  >
                    <span className={styles.dropdownItemTitle}>{inst.name} [Demo Fixture]</span>
                    <span className={styles.dropdownItemMeta}>
                      AICTE PID: <strong>{inst.id}</strong> • {inst.district}, {inst.state}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedInstitution && (
            <div className={styles.selectedInstitutionBadge}>
              <div>
                <strong>Selected College:</strong> {selectedInstitution.name} — PID: <code>{selectedInstitution.id}</code>
              </div>
              <button
                type="button"
                onClick={handleClearInstitution}
                style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontWeight: 600 }}
              >
                Change ✕
              </button>
            </div>
          )}

          {validationErrors.selectedAicteId && (
            <span className={styles.errorText}>⚠ {validationErrors.selectedAicteId}</span>
          )}
        </div>
      </div>

      {/* Section 2: Grievance Classification & Agreed Enums */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <ShieldIcon size={18} />
            2. Grievance Particulars & Regulatory Classification
          </h3>
          <span className={styles.sectionHelp}>Mapped to: <code>category_id</code>, <code>priority</code>, <code>source</code></span>
        </div>

        <div className={styles.formGrid2}>
          {/* Category Dropdown (Demonstration Dataset) */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="category-select-field">
              Grievance Category <span className={styles.requiredAsterisk}>*</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>(API: <code>category_id</code>)</span>
            </label>
            <select
              id="category-select-field"
              className={`${styles.select} ${validationErrors.selectedCategoryId ? styles.inputError : ''}`}
              value={formState.selectedCategoryId}
              onChange={(e) => {
                const val = e.target.value;
                setFormState((prev) => ({ ...prev, selectedCategoryId: val }));
                if (validationErrors.selectedCategoryId) {
                  setValidationErrors((prev) => ({ ...prev, selectedCategoryId: null }));
                }
              }}
            >
              {DEMO_CATEGORIES.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.label} (ID: {cat.category_id})
                </option>
              ))}
            </select>
            {validationErrors.selectedCategoryId && (
              <span className={styles.errorText}>⚠ {validationErrors.selectedCategoryId}</span>
            )}
          </div>

          {/* Intake Origin Source Enum */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="source-select-field">
              Intake Origin Channel <span className={styles.requiredAsterisk}>*</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>(API: <code>source</code>)</span>
            </label>
            <select
              id="source-select-field"
              className={styles.select}
              value={formState.source}
              onChange={(e) => {
                const val = e.target.value;
                setFormState((prev) => ({ ...prev, source: val }));
              }}
            >
              {PERMITTED_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src} — {src === 'PORTAL' ? 'Official Webform' : src === 'PG_PORTAL' ? 'CPGRAMS / PMO Escalation' : src === 'EMAIL' ? 'Official Ministry Email' : src === 'LETTER' ? 'Physical Representation' : src}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Priority Enum Selection */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Triage Priority <span className={styles.requiredAsterisk}>*</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>(API: <code>priority</code> — Default: <code>MEDIUM</code>)</span>
          </label>
          <div className={styles.priorityGrid}>
            {PERMITTED_PRIORITIES.map((p) => {
              const isSelected = formState.priority === p;
              return (
                <div
                  key={p}
                  className={`${styles.priorityOption} ${isSelected ? styles[`priorityOptionSelected_${p}`] : ''}`}
                  onClick={() => setFormState((prev) => ({ ...prev, priority: p }))}
                >
                  <span>{p}</span>
                </div>
              );
            })}
          </div>
          {validationErrors.priority && (
            <span className={styles.errorText}>⚠ {validationErrors.priority}</span>
          )}
        </div>

        {/* Title */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="title-field">
            Grievance Title / Subject Line <span className={styles.requiredAsterisk}>*</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>(API: <code>title</code>)</span>
          </label>
          <input
            id="title-field"
            type="text"
            className={`${styles.input} ${validationErrors.title ? styles.inputError : ''}`}
            placeholder="Concise summary of the grievance..."
            value={formState.title}
            onChange={(e) => {
              const val = e.target.value;
              setFormState((prev) => ({ ...prev, title: val }));
              if (validationErrors.title) {
                setValidationErrors((prev) => ({ ...prev, title: null }));
              }
            }}
            maxLength={200}
          />
          <div className={styles.charCounter}>{formState.title.length}/200 characters</div>
          {validationErrors.title && (
            <span className={styles.errorText}>⚠ {validationErrors.title}</span>
          )}
        </div>

        {/* Description */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="desc-field">
            Detailed Narrative & Evidentiary Statement <span className={styles.requiredAsterisk}>*</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>(API: <code>description</code>)</span>
          </label>
          <textarea
            id="desc-field"
            className={`${styles.textarea} ${validationErrors.description ? styles.inputError : ''}`}
            placeholder="Comprehensive description of the alleged non-compliance, affected academic sessions, faculty deficit, or financial irregularity..."
            rows={5}
            value={formState.description}
            onChange={(e) => {
              const val = e.target.value;
              setFormState((prev) => ({ ...prev, description: val }));
              if (validationErrors.description) {
                setValidationErrors((prev) => ({ ...prev, description: null }));
              }
            }}
            maxLength={4000}
          />
          <div className={styles.charCounter}>{formState.description.length}/4000 characters (min. 20)</div>
          {validationErrors.description && (
            <span className={styles.errorText}>⚠ {validationErrors.description}</span>
          )}
        </div>

        {/* Secondary Metadata: external_ref_no & received_on */}
        <div className={styles.formGrid2}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="ext-ref-field">
              External Reference Docket No.
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>(API: <code>external_ref_no</code>)</span>
            </label>
            <input
              id="ext-ref-field"
              type="text"
              className={styles.input}
              placeholder="e.g. CPGRAMS/2026/0891 or MHRD/DIR/44"
              value={formState.externalRefNo}
              onChange={(e) => {
                const val = e.target.value;
                setFormState((prev) => ({ ...prev, externalRefNo: val }));
              }}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="received-on-field">
              Intake Receipt Date
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>(API: <code>received_on</code> — Defaults to Today)</span>
            </label>
            <input
              id="received-on-field"
              type="date"
              className={styles.input}
              value={formState.receivedOn}
              onChange={(e) => {
                const val = e.target.value;
                setFormState((prev) => ({ ...prev, receivedOn: val }));
              }}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Complainant Information & Anonymous Whistleblower Guard */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            3. Complainant Identity & Whistleblower Protection
          </h3>
          <span className={styles.sectionHelp}>Mapped to: <code>is_anonymous</code>, <code>complainant_name</code></span>
        </div>

        {/* Anonymous Checkbox */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 14px',
            backgroundColor: formState.isAnonymous ? '#f0fdf4' : 'var(--bg-surface-secondary)',
            border: formState.isAnonymous ? '1px solid #bbf7d0' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <input
            id="anonymous-toggle"
            type="checkbox"
            checked={formState.isAnonymous}
            onChange={(e) => {
              const checked = e.target.checked;
              setFormState((prev) => ({
                ...prev,
                isAnonymous: checked,
                // Immediately clear personal fields to prevent accidental transmission
                complainantName: checked ? '' : prev.complainantName,
                complainantEmail: checked ? '' : prev.complainantEmail,
                complainantPhone: checked ? '' : prev.complainantPhone,
              }));
              setValidationErrors((prev) => ({ ...prev, complainantEmail: null }));
            }}
            style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
          />
          <label htmlFor="anonymous-toggle" style={{ fontSize: '0.8125rem', cursor: 'pointer', lineHeight: 1.4 }}>
            <strong>Register as Anonymous / Confidential Whistleblower (API: <code>is_anonymous: true</code>)</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              When enabled, complainant personal fields are disabled, cleared, and guaranteed to be omitted from the mapped submission payload.
            </div>
          </label>
        </div>

        {/* Complainant Personal Fields (Disabled & Wiped when Anonymous) */}
        <div
          className={styles.formGrid3}
          style={{
            opacity: formState.isAnonymous ? 0.45 : 1,
            pointerEvents: formState.isAnonymous ? 'none' : 'auto',
            transition: 'opacity var(--transition-fast)',
          }}
        >
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="complainant-name-field">
              Complainant Full Name
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>(API: <code>complainant_name</code>)</span>
            </label>
            <input
              id="complainant-name-field"
              type="text"
              className={styles.input}
              placeholder="e.g. Dr. A. K. Sharma"
              value={formState.complainantName}
              onChange={(e) => {
                const val = e.target.value;
                setFormState((prev) => ({ ...prev, complainantName: val }));
              }}
              disabled={formState.isAnonymous}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="complainant-email-field">
              Complainant Email
              <span style={{ fontSize: '0.6875rem', color: '#b45309', fontWeight: 700 }}>
                [API Property: Awaiting Backend Confirmation]
              </span>
            </label>
            <input
              id="complainant-email-field"
              type="email"
              className={`${styles.input} ${validationErrors.complainantEmail ? styles.inputError : ''}`}
              placeholder="contact@domain.edu"
              value={formState.complainantEmail}
              onChange={(e) => {
                const val = e.target.value;
                setFormState((prev) => ({ ...prev, complainantEmail: val }));
                if (validationErrors.complainantEmail) {
                  setValidationErrors((prev) => ({ ...prev, complainantEmail: null }));
                }
              }}
              disabled={formState.isAnonymous}
            />
            {validationErrors.complainantEmail && (
              <span className={styles.errorText}>⚠ {validationErrors.complainantEmail}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="complainant-phone-field">
              Complainant Phone / Mobile
              <span style={{ fontSize: '0.6875rem', color: '#b45309', fontWeight: 700 }}>
                [API Property: Awaiting Backend Confirmation]
              </span>
            </label>
            <input
              id="complainant-phone-field"
              type="tel"
              className={styles.input}
              placeholder="+91 XXXXX XXXXX"
              value={formState.complainantPhone}
              onChange={(e) => {
                const val = e.target.value;
                setFormState((prev) => ({ ...prev, complainantPhone: val }));
              }}
              disabled={formState.isAnonymous}
            />
          </div>
        </div>
      </div>

      {/* Section 4: Evidentiary Attachments (Multipart files[]) */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            4. Evidentiary Attachments
          </h3>
          <span className={styles.sectionHelp}>Expected backend format: Multipart <code>files[]</code></span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelection}
          style={{ display: 'none' }}
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        />

        <div
          className={styles.uploadZone}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ fontSize: '1.5rem' }}>📁</div>
          <div style={{ fontWeight: 600, color: 'var(--color-brand-primary)' }}>
            Click to Browse or Attach Supporting Documents
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Files will be structured as multipart upload entries under property <code>files[]</code>.
          </div>
        </div>

        {/* Selected Files List with Removal */}
        {attachments.length > 0 && (
          <div className={styles.fileList}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Selected Attachments ({attachments.length}):
            </div>
            {attachments.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className={styles.fileChip}>
                <div className={styles.fileChipLeft}>
                  <span>📄</span>
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={styles.fileSize}>({formatFileSize(file.size)})</span>
                </div>
                <button
                  type="button"
                  className={styles.fileRemoveBtn}
                  onClick={() => handleRemoveAttachment(idx)}
                  title="Remove this document"
                >
                  <XIcon size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className={styles.actionBar}>
        <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Simulating Local Demo Intake...' : 'Submit Demonstration Grievance Docket'}
        </Button>
      </div>
    </form>
  );
}
