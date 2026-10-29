-- =====================================================================
-- Migration 005: Cross-Bureau Coordination Workspace
-- Supports multi-bureau coordination requests, follow-up actions,
-- response tracking, and joint binding decisions.
-- =====================================================================

CREATE SEQUENCE IF NOT EXISTS coordination_no_seq START 1;

CREATE TABLE IF NOT EXISTS bureau_coordination_requests (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_no               TEXT NOT NULL UNIQUE DEFAULT (
                            'COORD-' || to_char(now(), 'YYYY') || '-' ||
                            lpad(nextval('coordination_no_seq')::text, 6, '0')),
  initiating_bureau_id     INT NOT NULL REFERENCES bureaus(id),
  target_bureau_id         INT NOT NULL REFERENCES bureaus(id),
  complaint_id             UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  target_complaint_id      UUID REFERENCES complaints(id) ON DELETE SET NULL,
  institution_id           UUID REFERENCES institutions(id) ON DELETE SET NULL,
  coordination_type        TEXT NOT NULL,
  priority                 TEXT NOT NULL DEFAULT 'HIGH',
  status                   TEXT NOT NULL DEFAULT 'REQUESTED'
                           CHECK (status IN ('REQUESTED', 'ACKNOWLEDGED', 'IN_COORDINATION', 'DECISION_RECORDED', 'COMPLETED', 'DECLINED')),
  purpose                  TEXT NOT NULL,
  action_items             JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_response_status   TEXT NOT NULL DEFAULT 'AWAITING_RESPONSE'
                           CHECK (target_response_status IN ('AWAITING_RESPONSE', 'RESPONDED', 'DECLINED')),
  target_responded_at      TIMESTAMPTZ,
  target_responded_by      UUID REFERENCES users(id),
  target_response_remarks  TEXT,
  joint_decision           TEXT,
  joint_decision_by        UUID REFERENCES users(id),
  joint_decision_at        TIMESTAMPTZ,
  requested_by             UUID NOT NULL REFERENCES users(id),
  due_date                 DATE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coord_complaint ON bureau_coordination_requests(complaint_id);
CREATE INDEX IF NOT EXISTS idx_coord_target_complaint ON bureau_coordination_requests(target_complaint_id);
CREATE INDEX IF NOT EXISTS idx_coord_initiating_bureau ON bureau_coordination_requests(initiating_bureau_id);
CREATE INDEX IF NOT EXISTS idx_coord_target_bureau ON bureau_coordination_requests(target_bureau_id);
CREATE INDEX IF NOT EXISTS idx_coord_status ON bureau_coordination_requests(status);
CREATE INDEX IF NOT EXISTS idx_coord_target_resp ON bureau_coordination_requests(target_response_status);

-- Add notification types for coordination if needed
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'ASSIGNED',
    'TRANSFERRED',
    'STATUS_CHANGED',
    'SLA_REMINDER',
    'SLA_BREACH',
    'ESCALATION',
    'OVERLAP_ALERT',
    'OVERLAP_DETECTED',
    'SLA_WARNING',
    'COMPLAINT_ASSIGNED',
    'COMPLAINT_STATUS_CHANGED',
    'COMPLAINT_TRANSFERRED',
    'OVERLAP_REVIEW_UPDATE',
    'COORDINATION_REQUESTED',
    'COORDINATION_RESPONDED',
    'COORDINATION_DECISION'
  ));

