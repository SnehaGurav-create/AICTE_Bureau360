# AICTE Bureau360 — Backend API

> **AICTE Bureau360: Integrated Complaint Tracking and Institution Monitoring Dashboard**  
> *Smart India Hackathon 2026 — Problem Statement SIH26264*

---

## 📌 Scope of this Backend Service

This repository houses the **Core Backend REST API service** for AICTE Bureau360. It delivers the core operational and business logic for grievance redressal, institutional profiles, workflow routing, and evidentiary document storage:

### What is implemented in this repository:
1. **Institutions Registry & Profiles**: AICTE ID conflict handling (409), fuzzy trigram search, fast autocomplete, diff-based audit history, and bulk CSV import.
2. **Complaints Core & Lifecycle**: Schema-enforced case registration, dynamic SLA target due date calculation, append-only immutable timeline actions, and comment/remarks management.
3. **State Machine & Status Transitions**: Strict transition rules between complaint states (`NEW`, `UNDER_REVIEW`, `ASSIGNED`, `IN_PROGRESS`, `PENDING_INFO`, `ESCALATED`, `RESOLVED`, `CLOSED`, `REJECTED`, `REOPENED`) with mandatory remark validations on terminal and escalation states.
4. **Bureaus & Officers Routing**:
   - **Assignment**: Assign cases to specific bureaus and/or authorized officers with single active flag enforcement (`is_current = true`).
   - **Inter-Bureau Transfers**: Secure transfers between bureaus with mandatory justification and automatic SLA recalculation.
   - **Handoff History**: Complete chronological history of assignments and transfers.
5. **Supporting Documents & ATRs**: Secure file upload handling (PDF, JPG, PNG up to 10 MB), randomized disk storage keys, **SHA-256 cryptographic checksum calculation**, and attachment streaming downloads.
6. **Role-Based Access Control (RBAC) & Scope Filtering**: Dynamic SQL query scoping (`applyScope`) enforcing 4 tiers of data visibility: `ALL`, `REGION`, `BUREAU`, and `ASSIGNED`.
7. **ACID Transaction Guarantees**: Mutation pattern utilizing PostgreSQL `SELECT ... FOR UPDATE` locks and `withTransaction` ensuring complete rollback on failure with zero partial data.

> **Team Collaboration Note:**  
> - **Frontend**: The user interface (Next.js / React) is maintained independently by the frontend teammate and interfaces with this API via `/api/v1`.  
> - **Companion Modules**: Overlap detection algorithms, real-time email notifications, dashboard aggregation workers, and SLA reminder cron jobs are handled by separate companion modules.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js 20+ LTS
- **Framework**: Express 5.x
- **Database**: PostgreSQL 14+ (pg / node-postgres pool)
- **Validation**: Zod schema validation
- **File Handling**: Multer with disk storage & file integrity checksums (`node:crypto` SHA-256)
- **Security**: Helmet, CORS, Express-Rate-Limit, bcrypt
- **Logging**: Pino & pino-http structured JSON logger
- **Testing**: Vitest + Supertest (58 automated integration and transaction tests)
- **Documentation**: OpenAPI 3.0 specification with Swagger UI (`/api/docs`)

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v20.x or higher
- **PostgreSQL** 14+ or **Docker Desktop**
- **npm** v10.x or higher

### 2. Installation
```bash
git clone <repository-url>
cd bureau360-backend
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Verify or configure your `.env` variables:
```env
PORT=3000
NODE_ENV=development

# Database connection
DATABASE_URL=postgresql://bureau360_user:bureau360_secret@localhost:5432/bureau360

# JWT Auth
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=1h

# File Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_BYTES=10485760
MAX_FILES_PER_REQUEST=5

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### 4. Database Setup (Docker or Local)
Using Docker Compose:
```bash
docker compose up db -d
```
*Note: If running PostgreSQL locally, execute `db/schema.sql` once on your `bureau360` database.*

### 5. Running the Application
```bash
# Development mode with hot-reload:
npm run dev

# Production mode:
npm start
```

The server starts on `http://localhost:3000`.

---

## 📖 API Documentation (Swagger / OpenAPI)

Once the application is running, the interactive Swagger UI documentation is accessible at:
```
http://localhost:3000/api/docs
```
Raw OpenAPI 3.0 YAML specification:
```
http://localhost:3000/api/docs/openapi.yaml
```

---

## 📡 API Endpoints Overview

All endpoints are prefixed with `/api/v1`. Authenticated endpoints require `Authorization: Bearer <token>`.

### 1. System & Meta
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/health` | Public | Service health & PostgreSQL connectivity status |
| `GET` | `/meta` | Authenticated | Reference data: categories, statuses, priorities, sources, bureaus, regions, roles, status transitions map |

### 2. Institutions (`/institutions`)
| Method | Endpoint | Permission | Description |
|:---|:---|:---|:---|
| `GET` | `/institutions` | `institution:read` | List institutions with filters (`state`, `region_id`, `status`), sorting, and pagination |
| `POST` | `/institutions` | `institution:write` | Register new institution (enforces unique AICTE ID, returns 409 on duplicate) |
| `GET` | `/institutions/search?q=` | `institution:read` | Fast autocomplete matching by name or AICTE ID |
| `GET` | `/institutions/:aicteId` | `institution:read` | Single institution profile with joined region and statistics |
| `PATCH` | `/institutions/:aicteId` | `institution:write` | Update institution details (AICTE ID is immutable). Records diff in `institution_history` |
| `GET` | `/institutions/:aicteId/history` | `institution:read` | Full chronological audit trail of all changes made to an institution |
| `POST` | `/institutions/:aicteId/documents` | `institution:write` | Upload institutional documents |
| `GET` | `/institutions/:aicteId/documents` | `institution:read` | List institutional documents |
| `POST` | `/institutions/import` | `institution:write` | Bulk import institutions from CSV |

### 3. Complaints Core (`/complaints`)
| Method | Endpoint | Permission | Description |
|:---|:---|:---|:---|
| `GET` | `/complaints` | `complaint:read` | List complaints scoped to caller's role (`ALL`, `REGION`, `BUREAU`, `ASSIGNED`) with filters, overdue flag, and pagination |
| `POST` | `/complaints` | `complaint:create` | Register complaint, resolve AICTE ID, calculate SLA target date, record `CREATED` action, optional initial bureau assignment |
| `GET` | `/complaints/:id` | `complaint:read` | Detailed complaint profile with joined display names, document count, and `allowed_next_statuses` |
| `PATCH` | `/complaints/:id` | `complaint:update` | Update complaint fields (`title`, `description`, `category_id`, `priority`, complainant info). Recomputes SLA if category/priority changed |
| `PATCH` | `/complaints/:id/status` | `complaint:status` | Transition complaint status. Enforces transition matrix and remarks requirement. Sets resolution/closure timestamps |
| `POST` | `/complaints/:id/remarks` | `complaint:remark` | Add commentary/remark. Supports `is_internal: true` to restrict visibility to caller's bureau |
| `GET` | `/complaints/:id/timeline` | `complaint:read` | Chronological immutable action history. Automatically filters internal remarks for non-owning bureaus |

### 4. Assignments & Transfers (`/complaints/:id`)
| Method | Endpoint | Permission | Description |
|:---|:---|:---|:---|
| `POST` | `/complaints/:id/assign` | `complaint:assign` | Assign case to bureau and/or officer. Deactivates previous assignment (`is_current = false`). Transitions status from `NEW`/`UNDER_REVIEW` to `ASSIGNED` |
| `POST` | `/complaints/:id/transfer` | `complaint:transfer` | Transfer case between bureaus with required justification `reason`. Automatically recalculates SLA if destination bureau has custom rule |
| `GET` | `/complaints/:id/assignments` | `complaint:read` | Chronological assignment history with joined bureau and officer names |

### 5. Complaint Documents (`/complaints/:id/documents`)
| Method | Endpoint | Permission | Description |
|:---|:---|:---|:---|
| `POST` | `/complaints/:id/documents` | `document:upload` | Multipart file upload (PDF/JPG/PNG up to 10 MB, max 5 files). Calculates SHA-256 hash, links to timeline via `action_id` |
| `GET` | `/complaints/:id/documents` | `complaint:read` | List documents attached to a complaint with metadata, uploader name, and SHA-256 checksums |
| `GET` | `/complaints/:id/documents/:documentId` | `complaint:read` | Get single document metadata |
| `GET` | `/complaints/:id/documents/:documentId/download` | `complaint:read` | Download file with `Content-Disposition: attachment` stream |

---

## 🔄 Complaint Status Lifecycle

The state machine is strictly enforced by the backend (`src/constants/statuses.js`):

```
                       ┌─────────────────────────┐
                       │           NEW           │
                       └───────────┬─────────────┘
                                   │
              ┌────────────────────┼───────────────────┐
              ▼                    ▼                   ▼
      ┌───────────────┐    ┌───────────────┐   ┌───────────────┐
      │ UNDER_REVIEW  │    │   ASSIGNED    │   │  REJECTED *   │
      └───────┬───────┘    └───────┬───────┘   └───────┬───────┘
              │                    │                   │
              │            ┌───────┴───────┐           │
              ▼            ▼               ▼           ▼
      ┌───────────────┐ ┌───────────────┐ ┌────────────────┐
      │ PENDING_INFO  │ │  IN_PROGRESS  │ │  REOPENED *    │
      └───────┬───────┘ └───────┬───────┘ └────────┬───────┘
              │                 │                  │
              └────────┬────────┘                  ▼
                       ▼                   (Returns to Review)
               ┌───────────────┐
               │  ESCALATED *  │
               └───────┬───────┘
                       │
                       ▼
               ┌───────────────┐
               │  RESOLVED *   │
               └───────┬───────┘
                       │
                       ▼
               ┌───────────────┐
               │   CLOSED *    │
               └───────────────┘
```
*\* Asterisk indicates status transitions where a justification remark is **mandatory**.*

---

## 🔒 Data Scope & Role-Based Access Control (RBAC)

The backend implements automated scope filtering at the database layer via `src/utils/applyScope.js`. Authorized queries automatically enforce data isolation:

| Scope | Assigned Roles | Data Visibility |
|:---|:---|:---|
| **`ALL`** | `ADMIN`, `REGULATION_BUREAU`, `PGRC` | Can view and search all complaints and institutions nationally |
| **`REGION`** | `REGIONAL_OFFICE` | Restricted to complaints belonging to institutions within their geographical region |
| **`BUREAU`** | `OTHER_BUREAU` | Restricted to complaints currently assigned to or transferred to their bureau |
| **`ASSIGNED`** | `AUTHORIZED_OFFICER` | Restricted strictly to complaints directly assigned to that specific officer ID |

---

## 🧪 Testing & Quality Assurance

The test suite runs with **Vitest** and **Supertest**, verifying all business rules, permissions, edge cases, and transaction safety against a PostgreSQL instance.

```bash
# Run all tests
npm test
```

### Test Coverage Highlights (58 Tests across 4 suites)
1. **`tests/system_meta.test.js`** (5 tests):
   - Health check database ping verification.
   - Global 404 handler with standard error contract.
   - Helmet security headers verification.
   - Metadata reference data and state machine matrix delivery.
2. **`tests/institutions.test.js`** (12 tests):
   - AICTE ID uniqueness enforcement (409 Conflict).
   - Change history audit logging for updates.
   - Trigram search and prefix autocomplete.
   - Scope authorization and input validation.
3. **`tests/complaints.test.js`** (28 tests):
   - Registration with dynamic SLA rule matching.
   - State transition validation (allowing legal transitions, rejecting illegal ones).
   - Remarks enforcement on terminal states.
   - Scope filtering across `ALL`, `BUREAU`, and `ASSIGNED` roles.
   - Chronological action timeline and internal remarks privacy.
4. **`tests/assignments_documents.test.js`** (13 tests):
   - Case assignment to bureau and officer.
   - Single active assignment enforcement (`is_current = true`).
   - Case transfer between bureaus with reason validation and old assignee clearing.
   - Chronological assignment handoff history.
   - Multipart document upload, file validation, SHA-256 checksum generation, and streaming download.
   - **Transaction Rollback Test**: Proves that a mid-transaction failure during transfer rolls back all updates atomically, leaving zero partial data in the database.

---

## 📂 Project Structure

```
bureau360-backend/
├── db/
│   ├── schema.sql              # Source of truth for database schema & triggers
│   ├── migrations/             # SQL baseline migrations
│   └── seeds/                  # Seed scripts
├── src/
│   ├── config/                 # Environment validation, database pool, logger, mailer
│   ├── constants/              # Statuses, roles, permissions, action types, limits
│   ├── middleware/             # Authenticate, authorize, validate, upload, requestId, errorHandler
│   ├── modules/
│   │   ├── complaints/         # Complaints CRUD, assign, transfer, documents, timeline
│   │   ├── institutions/       # Institutions registry, history, documents, CSV import
│   │   └── meta/               # Metadata reference endpoints
│   ├── utils/                  # AppError, withTransaction, applyScope, slaLookup, pagination
│   ├── app.js                  # Express app factory (middleware, routes, error handling)
│   └── server.js               # Entry point (HTTP server startup & graceful shutdown)
├── tests/                      # Automated Vitest integration test suites
│   ├── system_meta.test.js
│   ├── institutions.test.js
│   ├── complaints.test.js
│   └── assignments_documents.test.js
├── uploads/                    # Local storage directory for user documents (git-ignored)
├── openapi.yaml                # Hand-written OpenAPI 3.0 specification
├── docker-compose.yml          # Container configuration for PostgreSQL
└── Dockerfile                  # Container build recipe
```

---

## 📄 License
Smart India Hackathon 2026 — AICTE Bureau360 Project. All rights reserved.
