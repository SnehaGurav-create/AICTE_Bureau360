-- =====================================================================
-- AICTE Bureau360 (SIH26264) -- PostgreSQL schema v1   (PostgreSQL 13+)
-- Run once:  psql -d bureau360 -f schema.sql
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid(), digest()
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- fuzzy search + overlap similarity
CREATE EXTENSION IF NOT EXISTS citext;    -- case-insensitive emails

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
CREATE TYPE complaint_status AS ENUM (
  'NEW', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_INFO',
  'ESCALATED', 'RESOLVED', 'CLOSED', 'REJECTED', 'REOPENED'
);
CREATE TYPE complaint_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE complaint_source   AS ENUM ('PORTAL', 'EMAIL', 'LETTER', 'PHONE', 'PG_PORTAL', 'OTHER');
CREATE TYPE bureau_type        AS ENUM ('BUREAU', 'CELL', 'REGIONAL_OFFICE', 'CENTRE');
CREATE TYPE data_scope         AS ENUM ('ALL', 'REGION', 'BUREAU', 'ASSIGNED');
CREATE TYPE action_type        AS ENUM (
  'CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'TRANSFERRED', 'ESCALATED',
  'REMARK', 'DOCUMENT_ADDED', 'FIELD_UPDATED', 'OVERLAP_LINKED', 'REOPENED'
);
CREATE TYPE assignment_kind    AS ENUM ('ASSIGNMENT', 'TRANSFER', 'ESCALATION');
CREATE TYPE link_type          AS ENUM ('DUPLICATE', 'OVERLAP', 'RELATED');
CREATE TYPE link_review_status AS ENUM ('PENDING_REVIEW', 'CONFIRMED', 'DISMISSED');
CREATE TYPE notif_channel      AS ENUM ('EMAIL', 'IN_APP');
CREATE TYPE notif_status       AS ENUM ('PENDING', 'SENT', 'FAILED');

-- ---------------------------------------------------------------------
-- HELPER TRIGGER FUNCTIONS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION block_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only: UPDATE/DELETE/TRUNCATE not allowed', TG_TABLE_NAME;
END $$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 1. ORGANISATION: regions, bureaus
-- ---------------------------------------------------------------------
CREATE TABLE regions (
  id    SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE bureaus (
  id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,              -- e.g. REG_BUREAU, PGRC
  name       TEXT NOT NULL,
  type       bureau_type NOT NULL,
  parent_id  INT REFERENCES bureaus(id),
  region_id  SMALLINT REFERENCES regions(id),
  email      CITEXT,                            -- used for notifications
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2. RBAC: roles, permissions, users, refresh tokens
-- ---------------------------------------------------------------------
CREATE TABLE roles (
  id    SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL,
  scope data_scope NOT NULL DEFAULT 'ASSIGNED'  -- how much case data this role can see
);

CREATE TABLE permissions (
  id          SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,             -- e.g. complaint:assign
  description TEXT
);

CREATE TABLE role_permissions (
  role_id       SMALLINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id SMALLINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name          TEXT NOT NULL,
  email              CITEXT NOT NULL UNIQUE,
  password_hash      TEXT NOT NULL,             -- bcrypt/argon2, never plain text
  phone              TEXT,
  designation        TEXT,
  role_id            SMALLINT NOT NULL REFERENCES roles(id),
  bureau_id          INT REFERENCES bureaus(id),
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  failed_login_count INT NOT NULL DEFAULT 0,
  locked_until       TIMESTAMPTZ,
  last_login_at      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_role   ON users(role_id);
CREATE INDEX idx_users_bureau ON users(bureau_id);

CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,              -- store a hash, not the token
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  ip         INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

-- ---------------------------------------------------------------------
-- 3. INSTITUTIONS
-- ---------------------------------------------------------------------
CREATE TABLE institutions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aicte_id         TEXT NOT NULL UNIQUE,        -- the unique AICTE ID
  name             TEXT NOT NULL,
  institution_type TEXT,                        -- Engineering / Management / Pharmacy ...
  status           TEXT NOT NULL DEFAULT 'ACTIVE'
                   CHECK (status IN ('ACTIVE', 'CLOSED', 'SUSPENDED', 'WITHDRAWN')),
  address_line     TEXT,
  city             TEXT,
  district         TEXT,
  state            TEXT,
  pincode          TEXT,
  region_id        SMALLINT REFERENCES regions(id),
  head_name        TEXT,
  email            CITEXT,
  phone            TEXT,
  website          TEXT,
  established_year SMALLINT,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_inst_name_trgm ON institutions USING gin (name gin_trgm_ops);
CREATE INDEX idx_inst_state     ON institutions(state);
CREATE INDEX idx_inst_region    ON institutions(region_id);

CREATE TABLE institution_history (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  change_type    TEXT NOT NULL,                 -- CREATED / UPDATED / STATUS_CHANGED
  old_data       JSONB,
  new_data       JSONB,
  changed_by     UUID REFERENCES users(id),
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_inst_hist ON institution_history(institution_id, changed_at DESC);

-- ---------------------------------------------------------------------
-- 4. COMPLAINTS
-- ---------------------------------------------------------------------
CREATE TABLE complaint_categories (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE SEQUENCE complaint_no_seq START 1;

CREATE TABLE complaints (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_no        TEXT NOT NULL UNIQUE DEFAULT (
                        'CMP-' || to_char(now(), 'YYYY') || '-' ||
                        lpad(nextval('complaint_no_seq')::text, 6, '0')),
  institution_id      UUID NOT NULL REFERENCES institutions(id),
  category_id         INT  NOT NULL REFERENCES complaint_categories(id),
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  priority            complaint_priority NOT NULL DEFAULT 'MEDIUM',
  status              complaint_status   NOT NULL DEFAULT 'NEW',
  source              complaint_source   NOT NULL DEFAULT 'PORTAL',
  external_ref_no     TEXT,                     -- e.g. PG portal / diary number
  complainant_name    TEXT,
  complainant_email   CITEXT,
  complainant_phone   TEXT,
  is_anonymous        BOOLEAN NOT NULL DEFAULT FALSE,
  received_on         DATE NOT NULL DEFAULT CURRENT_DATE,
  current_bureau_id   INT  REFERENCES bureaus(id),
  current_assignee_id UUID REFERENCES users(id),
  created_by          UUID NOT NULL REFERENCES users(id),
  sla_due_at          TIMESTAMPTZ,
  first_response_at   TIMESTAMPTZ,
  resolved_at         TIMESTAMPTZ,
  closed_at           TIMESTAMPTZ,
  has_overlap         BOOLEAN NOT NULL DEFAULT FALSE,
  search_tsv          TSVECTOR GENERATED ALWAYS AS (
                        to_tsvector('english',
                          coalesce(title, '') || ' ' || coalesce(description, ''))) STORED,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cmp_institution ON complaints(institution_id);
CREATE INDEX idx_cmp_status      ON complaints(status);
CREATE INDEX idx_cmp_category    ON complaints(category_id);
CREATE INDEX idx_cmp_priority    ON complaints(priority);
CREATE INDEX idx_cmp_bureau      ON complaints(current_bureau_id);
CREATE INDEX idx_cmp_assignee    ON complaints(current_assignee_id);
CREATE INDEX idx_cmp_created     ON complaints(created_at DESC);
CREATE INDEX idx_cmp_sla_open    ON complaints(sla_due_at)
  WHERE status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED');
CREATE INDEX idx_cmp_tsv         ON complaints USING gin (search_tsv);
CREATE INDEX idx_cmp_title_trgm  ON complaints USING gin (title gin_trgm_ops);

-- Assignment + transfer history (exactly one row per complaint is_current)
CREATE TABLE complaint_assignments (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  complaint_id   UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  kind           assignment_kind NOT NULL,
  from_bureau_id INT  REFERENCES bureaus(id),
  to_bureau_id   INT  REFERENCES bureaus(id),
  from_user_id   UUID REFERENCES users(id),
  to_user_id     UUID REFERENCES users(id),
  assigned_by    UUID NOT NULL REFERENCES users(id),
  reason         TEXT,
  is_current     BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (to_bureau_id IS NOT NULL OR to_user_id IS NOT NULL)
);
CREATE UNIQUE INDEX uq_assign_current ON complaint_assignments(complaint_id) WHERE is_current;
CREATE INDEX idx_assign_complaint ON complaint_assignments(complaint_id, assigned_at DESC);
CREATE INDEX idx_assign_to_user   ON complaint_assignments(to_user_id) WHERE is_current;

-- Action history: the timeline of a case (append-only)
CREATE TABLE complaint_actions (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  complaint_id        UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  action_type         action_type NOT NULL,
  from_status         complaint_status,
  to_status           complaint_status,
  remarks             TEXT,
  is_internal         BOOLEAN NOT NULL DEFAULT FALSE,   -- hide from non-owning bureaus
  performed_by        UUID NOT NULL REFERENCES users(id),
  performed_by_bureau INT REFERENCES bureaus(id),
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_actions_complaint ON complaint_actions(complaint_id, created_at);

-- Supporting documents (file bytes live on disk / S3, only metadata here)
CREATE TABLE documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id   UUID REFERENCES complaints(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  action_id      BIGINT REFERENCES complaint_actions(id),
  doc_category   TEXT NOT NULL DEFAULT 'SUPPORTING'
                 CHECK (doc_category IN ('SUPPORTING', 'ACTION_TAKEN_REPORT', 'INSTITUTION_DOC', 'OTHER')),
  file_name      TEXT NOT NULL,                 -- original name shown to users
  storage_key    TEXT NOT NULL UNIQUE,          -- random name on disk / S3 key
  mime_type      TEXT NOT NULL,
  size_bytes     BIGINT NOT NULL,
  sha256         TEXT,
  uploaded_by    UUID NOT NULL REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (complaint_id IS NOT NULL OR institution_id IS NOT NULL)
);
CREATE INDEX idx_docs_complaint   ON documents(complaint_id);
CREATE INDEX idx_docs_institution ON documents(institution_id);

-- Overlap / duplicate links between complaints (feeds "Overlap Alerts & Review")
CREATE TABLE complaint_links (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  complaint_id       UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  related_complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  link               link_type NOT NULL DEFAULT 'OVERLAP',
  similarity_score   NUMERIC(4,3),              -- 0.000 - 1.000
  review_status      link_review_status NOT NULL DEFAULT 'PENDING_REVIEW',
  reviewed_by        UUID REFERENCES users(id),
  reviewed_at        TIMESTAMPTZ,
  created_by         UUID REFERENCES users(id), -- NULL = detected automatically
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (complaint_id <> related_complaint_id)
);
CREATE UNIQUE INDEX uq_cmp_link_pair
  ON complaint_links (LEAST(complaint_id, related_complaint_id),
                      GREATEST(complaint_id, related_complaint_id));
CREATE INDEX idx_cmp_link_related ON complaint_links(related_complaint_id);
CREATE INDEX IF NOT EXISTS idx_cmp_link_review ON complaint_links(review_status) WHERE review_status = 'PENDING_REVIEW';

CREATE TABLE IF NOT EXISTS overlap_match_reasons (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  link_id           BIGINT NOT NULL REFERENCES complaint_links(id) ON DELETE CASCADE,
  method            TEXT NOT NULL CHECK (method IN (
                      'EXACT_INSTITUTION_ID',
                      'NORMALIZED_NAME',
                      'SAME_CATEGORY_BUREAU',
                      'ML_DESCRIPTION_SIMILARITY'
                    )),
  detail            TEXT NOT NULL,
  score             NUMERIC(5,4) DEFAULT 0,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_match_reasons_link ON overlap_match_reasons(link_id);

-- ---------------------------------------------------------------------
-- 5. SLA RULES (configurable)  -- most specific matching rule wins
-- ---------------------------------------------------------------------
CREATE TABLE sla_rules (
  id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name                  TEXT NOT NULL,
  category_id           INT REFERENCES complaint_categories(id),  -- NULL = any
  priority              complaint_priority,                       -- NULL = any
  bureau_id             INT REFERENCES bureaus(id),               -- NULL = any
  first_response_hours  INT,
  resolution_hours      INT NOT NULL CHECK (resolution_hours > 0),
  reminder_before_hours INT NOT NULL DEFAULT 24,
  escalate_after_hours  INT,                    -- hours past due before auto-escalation
  escalate_to_bureau_id INT REFERENCES bureaus(id),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 6. NOTIFICATIONS (outbox read by the Nodemailer worker)
-- ---------------------------------------------------------------------
CREATE TABLE notifications (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  to_email     CITEXT,
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN
                 ('ASSIGNED', 'TRANSFERRED', 'STATUS_CHANGED', 'SLA_REMINDER',
                  'SLA_BREACH', 'ESCALATION', 'OVERLAP_ALERT',
                  'OVERLAP_DETECTED', 'SLA_WARNING', 'COMPLAINT_ASSIGNED',
                  'COMPLAINT_STATUS_CHANGED', 'COMPLAINT_TRANSFERRED', 'OVERLAP_REVIEW_UPDATE')),
  channel      notif_channel NOT NULL DEFAULT 'EMAIL',
  subject      TEXT,
  body         TEXT,
  status       notif_status NOT NULL DEFAULT 'PENDING',
  metadata     JSONB NOT NULL DEFAULT '{}',
  attempts     INT NOT NULL DEFAULT 0,
  last_error   TEXT,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,  -- for IN_APP bell icon
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at      TIMESTAMPTZ
);
CREATE INDEX idx_notif_queue ON notifications(status, created_at) WHERE status = 'PENDING';
CREATE INDEX idx_notif_user  ON notifications(user_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 7. SECURE AUDIT LOG (append-only + hash chain, tamper-evident)
-- ---------------------------------------------------------------------
CREATE SEQUENCE audit_logs_id_seq;

CREATE TABLE audit_logs (
  id          BIGINT NOT NULL PRIMARY KEY,      -- assigned by trigger, do not insert
  actor_id    UUID,                             -- no FK: logs must outlive users
  actor_role  TEXT,
  action      TEXT NOT NULL,                    -- e.g. LOGIN, COMPLAINT_TRANSFER
  entity_type TEXT,
  entity_id   TEXT,
  old_data    JSONB,                            -- never put passwords/tokens here
  new_data    JSONB,
  ip          INET,
  user_agent  TEXT,
  request_id  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  prev_hash   TEXT,
  hash        TEXT
);
CREATE INDEX idx_audit_entity  ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor   ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

CREATE OR REPLACE FUNCTION audit_chain() RETURNS trigger AS $$
DECLARE
  prev TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(727001);        -- one writer at a time keeps the chain ordered
  NEW.id := nextval('audit_logs_id_seq');
  SELECT hash INTO prev FROM audit_logs ORDER BY id DESC LIMIT 1;
  NEW.prev_hash := prev;
  NEW.hash := encode(digest(concat_ws('|',
      coalesce(prev, ''), NEW.id, coalesce(NEW.actor_id::text, ''), NEW.action,
      coalesce(NEW.entity_type, ''), coalesce(NEW.entity_id, ''),
      NEW.created_at::text, coalesce(NEW.new_data::text, '')
    ), 'sha256'), 'hex');
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_chain BEFORE INSERT ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_chain();

-- ---------------------------------------------------------------------
-- 8. TRIGGERS: updated_at + append-only protection
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_users_upd        BEFORE UPDATE ON users        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_institutions_upd BEFORE UPDATE ON institutions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_complaints_upd   BEFORE UPDATE ON complaints   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sla_rules_upd    BEFORE UPDATE ON sla_rules    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_audit_immutable   BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION block_mutation();
CREATE TRIGGER trg_audit_no_truncate BEFORE TRUNCATE ON audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION block_mutation();
CREATE TRIGGER trg_actions_immutable BEFORE UPDATE OR DELETE ON complaint_actions
  FOR EACH ROW EXECUTE FUNCTION block_mutation();

-- ---------------------------------------------------------------------
-- 9. SEED DATA (edit freely; names come from the architecture diagram)
-- ---------------------------------------------------------------------
INSERT INTO roles (code, name, scope) VALUES
  ('ADMIN',              'AICTE Administration',          'ALL'),
  ('REGULATION_BUREAU',  'Regulation Bureau (RB)',        'ALL'),
  ('PGRC',               'Public Grievance Redressal Cell','ALL'),
  ('OTHER_BUREAU',       'Other Bureaus / Cells',         'BUREAU'),
  ('REGIONAL_OFFICE',    'Regional Offices / Centres',    'REGION'),
  ('AUTHORIZED_OFFICER', 'Authorized Officer',            'ASSIGNED');

INSERT INTO permissions (code, description) VALUES
  ('institution:read',   'View institutions'),
  ('institution:write',  'Create / update institutions'),
  ('complaint:read',     'View complaints'),
  ('complaint:create',   'Register complaints'),
  ('complaint:update',   'Edit complaint details'),
  ('complaint:status',   'Change complaint status'),
  ('complaint:assign',   'Assign to bureau / officer'),
  ('complaint:transfer', 'Transfer between bureaus'),
  ('complaint:remark',   'Add remarks / actions'),
  ('document:upload',    'Upload documents'),
  ('overlap:review',     'Review overlap alerts'),
  ('report:view',        'Dashboard and reports'),
  ('user:manage',        'Manage users and roles'),
  ('sla:manage',         'Configure SLA rules'),
  ('audit:read',         'View audit logs');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON
     r.code = 'ADMIN'
  OR (r.code IN ('REGULATION_BUREAU', 'PGRC', 'OTHER_BUREAU', 'REGIONAL_OFFICE')
      AND p.code IN ('institution:read', 'complaint:read', 'complaint:create',
                     'complaint:update', 'complaint:status', 'complaint:assign',
                     'complaint:transfer', 'complaint:remark', 'document:upload',
                     'overlap:review', 'report:view'))
  OR (r.code = 'REGULATION_BUREAU' AND p.code = 'institution:write')
  OR (r.code = 'AUTHORIZED_OFFICER'
      AND p.code IN ('institution:read', 'complaint:read', 'complaint:status',
                     'complaint:remark', 'document:upload'));

INSERT INTO bureaus (code, name, type) VALUES
  ('REG_BUREAU', 'Regulation Bureau', 'BUREAU'),
  ('PGRC',       'Public Grievance Redressal Cell', 'CELL');

-- Sample categories: replace with the real list from the problem statement
INSERT INTO complaint_categories (code, name) VALUES
  ('APPROVAL',   'Approval / Extension of Approval'),
  ('FEES',       'Fees and Refunds'),
  ('FACULTY',    'Faculty and Staffing'),
  ('INFRA',      'Infrastructure and Facilities'),
  ('ADMISSION',  'Admission Irregularities'),
  ('FAKE_INST',  'Fake / Unapproved Institution'),
  ('OTHER',      'Other');

-- Default SLA: 7 days to resolve, 1 day reminder. Add specific rules via the admin API.
INSERT INTO sla_rules (name, resolution_hours, first_response_hours, reminder_before_hours)
VALUES ('Default SLA', 168, 24, 24);

-- NOTE: create the first ADMIN user from a Node seed script (hash the password with bcrypt).
