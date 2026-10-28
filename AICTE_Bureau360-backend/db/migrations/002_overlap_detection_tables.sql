-- =====================================================================
-- Migration 002: Overlap detection supporting tables
-- Adds overlap_match_reasons to store explainable match results
-- and indexes for efficient overlap queries.
-- =====================================================================

-- Overlap match reasons — stores the *why* behind each complaint_link.
-- One link can have multiple reasons (e.g. same institution ID + similar name).
CREATE TABLE IF NOT EXISTS overlap_match_reasons (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  link_id           BIGINT NOT NULL REFERENCES complaint_links(id) ON DELETE CASCADE,
  method            TEXT NOT NULL CHECK (method IN (
                      'EXACT_INSTITUTION_ID',
                      'NORMALIZED_NAME',
                      'SAME_CATEGORY_BUREAU',
                      'ML_DESCRIPTION_SIMILARITY'
                    )),
  detail            TEXT NOT NULL,           -- human-readable explanation
  score             NUMERIC(5,4) DEFAULT 0,  -- 0.0000 - 1.0000
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_match_reasons_link ON overlap_match_reasons(link_id);

-- Index for fast "show me all pending-review links" queries
CREATE INDEX IF NOT EXISTS idx_cmp_link_review
  ON complaint_links(review_status)
  WHERE review_status = 'PENDING_REVIEW';

-- Index for overlap dashboard: institution-centric grouping
CREATE INDEX IF NOT EXISTS idx_cmp_link_institution
  ON complaint_links(complaint_id, related_complaint_id);

-- =====================================================================
-- DOWN migration (rollback)
-- =====================================================================
-- DROP INDEX IF EXISTS idx_cmp_link_institution;
-- DROP INDEX IF EXISTS idx_cmp_link_review;
-- DROP INDEX IF EXISTS idx_match_reasons_link;
-- DROP TABLE IF EXISTS overlap_match_reasons;
