-- =====================================================================
-- Migration 004: Case relationships, duplicate disposition, and coordination
-- Adds:
--   1. complaints.disposition, primary_complaint_id, coordination_notes, linked_at
--   2. complaint_links extended columns (relationship_type, primary_complaint_id, coordination_decision, coordination_notes)
--   3. case_relationships table with strict enum-like types:
--      POTENTIAL_DUPLICATE, CONFIRMED_DUPLICATE, RELATED_CASE, UNRELATED
--   4. case_actions view mirroring complaint_actions for uniform naming
-- =====================================================================

-- 1. Extend complaints table for duplicate disposition and primary coordination tracking
ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS disposition VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS primary_complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coordination_notes TEXT,
  ADD COLUMN IF NOT EXISTS linked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_cmp_disposition ON complaints(disposition);
CREATE INDEX IF NOT EXISTS idx_cmp_primary_complaint ON complaints(primary_complaint_id);

-- 2. Extend complaint_links for relationship types and coordination
ALTER TABLE complaint_links
  ADD COLUMN IF NOT EXISTS relationship_type VARCHAR(50) DEFAULT 'POTENTIAL_DUPLICATE',
  ADD COLUMN IF NOT EXISTS primary_complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coordination_decision TEXT,
  ADD COLUMN IF NOT EXISTS coordination_notes TEXT;

-- 3. Create case_relationships table
CREATE TABLE IF NOT EXISTS case_relationships (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  case_id               UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  related_case_id       UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  relationship_type     TEXT NOT NULL CHECK (relationship_type IN (
                          'POTENTIAL_DUPLICATE',
                          'CONFIRMED_DUPLICATE',
                          'RELATED_CASE',
                          'UNRELATED'
                        )),
  similarity_score      NUMERIC(5,4),
  evidence              JSONB NOT NULL DEFAULT '[]',
  review_status         TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (review_status IN (
                          'PENDING_REVIEW',
                          'CONFIRMED',
                          'DISMISSED'
                        )),
  primary_case_id       UUID REFERENCES complaints(id) ON DELETE SET NULL,
  coordination_decision TEXT,
  coordination_notes    TEXT,
  reviewed_by           UUID REFERENCES users(id),
  reviewed_at           TIMESTAMPTZ,
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (case_id <> related_case_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_case_rel_pair
  ON case_relationships (LEAST(case_id, related_case_id), GREATEST(case_id, related_case_id));

CREATE INDEX IF NOT EXISTS idx_case_rel_case ON case_relationships(case_id);
CREATE INDEX IF NOT EXISTS idx_case_rel_related ON case_relationships(related_case_id);
CREATE INDEX IF NOT EXISTS idx_case_rel_type ON case_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_case_rel_review ON case_relationships(review_status);

-- 4. Update overlap_match_reasons constraint to support time period & official reference matches
ALTER TABLE overlap_match_reasons
  DROP CONSTRAINT IF EXISTS overlap_match_reasons_method_check;

ALTER TABLE overlap_match_reasons
  ADD CONSTRAINT overlap_match_reasons_method_check CHECK (method IN (
    'EXACT_INSTITUTION_ID',
    'NORMALIZED_NAME',
    'SAME_CATEGORY_BUREAU',
    'ML_DESCRIPTION_SIMILARITY',
    'SAME_TIME_PERIOD',
    'OFFICIAL_REFERENCE_MATCH'
  ));

-- 5. Create case_actions view mirroring complaint_actions
CREATE OR REPLACE VIEW case_actions AS
SELECT
  id,
  complaint_id AS case_id,
  complaint_id,
  action_type,
  from_status,
  to_status,
  remarks,
  is_internal,
  performed_by,
  performed_by_bureau,
  metadata,
  created_at
FROM complaint_actions;
