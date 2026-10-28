-- =====================================================================
-- Migration 003: Notifications schema update
-- Adds metadata and read_at columns to notifications table,
-- and updates type check constraint to support all notification types.
-- =====================================================================

-- 1. Add missing metadata column
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

-- 2. Add missing read_at column
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 3. Update type CHECK constraint to support new notification types
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
    'OVERLAP_REVIEW_UPDATE'
  ));

