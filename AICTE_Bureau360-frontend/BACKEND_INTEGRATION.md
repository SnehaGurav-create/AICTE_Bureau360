# AICTE Bureau360 — Backend API Integration Contract & TODOs

**SIH 2026 Problem Statement 26264**  
**Document Status:** Awaiting Backend Teammate Confirmation  
**Frontend Mode:** `DEMO_MODE: true` (Active by default; zero real HTTP calls executed)

---

## 1. Overview
The frontend architecture is prepared for backend integration through a decoupled service layer located in [`services/`](./services/). All UI components are transport-agnostic and interact exclusively via [`services/complaintService.js`](./services/complaintService.js).

Until backend schemas and endpoints are confirmed, the frontend operates in **Demonstration Mode**, preventing requests to non-existent endpoints.

---

## 2. Agreed Baseline Contract Mapping

The frontend currently uses this agreed JSON mapping layer ([`services/complaintModel.js`](./services/complaintModel.js)):

| UI Field / Concept | Frontend Form Key | Agreed API Contract Key | Type | Constraints & Values |
| :--- | :--- | :--- | :--- | :--- |
| Target Institution | `selectedAicteId` / `aicte_id` | `aicte_id` | `string` | **Required**. AICTE Permanent ID (e.g. `"1-3324501"`). |
| Grievance Category | `selectedCategoryId` / `category_id` | `category_id` | `string` / `number` | **Required**. Identifier from category list. |
| Grievance Title | `title` | `title` | `string` | **Required**. 5 to 200 characters. |
| Narrative Statement | `description` | `description` | `string` | **Required**. 20 to 4000 characters. |
| Triage Priority | `priority` | `priority` | `enum` | **Allowed:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. Default: `MEDIUM`. |
| Intake Channel | `source` | `source` | `enum` | **Allowed:** `PORTAL`, `EMAIL`, `LETTER`, `PHONE`, `PG_PORTAL`, `OTHER`. Default: `PORTAL`. |
| Whistleblower Toggle | `isAnonymous` / `is_anonymous` | `is_anonymous` | `boolean` | When `true`, personal contact fields are strictly `null`. |
| Complainant Name | `complainantName` / `complainant_name` | `complainant_name` | `string` \| `null` | Optional. Set to `null` if `is_anonymous: true`. |
| **Complainant Email** | `complainantEmail` | **PENDING** | `string` \| `null` | **Awaiting backend confirmation**. Configurable via env variable. |
| **Complainant Phone** | `complainantPhone` | **PENDING** | `string` \| `null` | **Awaiting backend confirmation**. Configurable via env variable. |
| External Reference | `externalRefNo` / `external_ref_no` | `external_ref_no` | `string` \| `null` | Optional external docket ID (e.g. CPGRAMS/PMO ref). |
| Receipt Date | `receivedOn` / `received_on` | `received_on` | `string` (YYYY-MM-DD) | Defaults to current local date (`today`). |
| **Attachments** | `attachments` | `files[]` | `multipart/form-data` | Kept **separate** from JSON model. Transmitted via multipart `files[]`. |

---

## 3. Integration Requirements & TODOs from Backend Teammate

To connect the frontend to the real backend, the following 9 specifications are required:

### TODO 1: Complaint Creation Endpoint & HTTP Method
- **Endpoint URL path**: (e.g. `POST /api/v1/complaints` or `POST /complaints`)
- **HTTP Method**: Confirm if `POST` is standard.
- **Content-Type**: Confirm if multipart upload should combine fields as form fields alongside `files[]`, or if JSON is sent in a separate field (e.g. `data: JSON_STRING` + `files[]`).

### TODO 2: Request & Response Schemas
- **Success Response Structure**:
  ```json
  {
    "success": true,
    "case_id": "AICTE-2026-XXXX",
    "status": "PENDING_REVIEW",
    "created_at": "2026-10-28T00:00:00Z"
  }
  ```
- Confirm field name for the generated complaint docket identifier (`case_id`, `id`, `complaint_id`, etc.).

### TODO 3: Exact Complainant Email and Phone Field Names
- Confirm exact property keys:
  - Email: `email` vs `complainant_email` vs `contact_email`?
  - Phone: `phone` vs `complainant_phone` vs `mobile`?
- *Frontend configuration placeholder:* `COMPLAINANT_FIELD_MAPPING` in [`services/apiConfig.js`](./services/apiConfig.js) will map directly once confirmed.

### TODO 4: `/meta` Response Structure
- Endpoint path (e.g. `GET /api/v1/meta`).
- Confirm schema for dynamic category dropdown options, allowed priority codes, source types, and bureau list.
  ```json
  {
    "categories": [{ "id": 1, "name": "Faculty Deficit", "code": "CAT-FAC" }],
    "priorities": ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    "sources": ["PORTAL", "EMAIL", "LETTER", "PHONE", "PG_PORTAL", "OTHER"]
  }
  ```

### TODO 5: Institution Search Endpoint & Response Structure
- Endpoint path (e.g. `GET /api/v1/institutions?search=...`).
- Query parameter name (e.g. `q`, `search`, or `name`).
- Return schema (e.g. list of `{ institution_id, aicte_id, name, district, state }`).

### TODO 6: Multipart Attachment Requirements & File Limits
- Parameter key: confirm `files[]`.
- Maximum file count per complaint (e.g., max 5 documents).
- Maximum individual file size in bytes (e.g., 10 MB).
- Allowed MIME types / file extensions (`.pdf`, `.png`, `.jpg`, `.docx`).

### TODO 7: Authentication & Permission Requirements
- Mechanism: Bearer JWT token in `Authorization` header, session cookie, or API key?
- Anonymous petition submission: Does complaint submission require an auth token, or is it an open public intake endpoint?

### TODO 8: Standardized Error Response Format
- Expected failure structure for HTTP 400, 422, 500:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Institution AICTE ID does not exist.",
      "fields": { "aicte_id": "Invalid ID" }
    }
  }
  ```

### TODO 9: Complaint Listing and Detail Endpoints
- Listing endpoint path & pagination query parameters (e.g. `GET /api/v1/complaints?page=1&limit=20&status=PENDING&bureau=...`).
- Single dossier endpoint path (e.g. `GET /api/v1/complaints/:id`).
- Schema for timeline events, inter-bureau transfer history, and overlap-review records.

---

## 4. How to Transition from Demo Mode to Real Backend

When the backend teammate supplies the answers to the above TODOs:

1. In `.env.local`:
   ```bash
   NEXT_PUBLIC_DEMO_MODE=false
   NEXT_PUBLIC_API_URL=https://api.yourbackend.domain.gov.in
   NEXT_PUBLIC_ENDPOINT_CREATE_COMPLAINT=/api/v1/complaints
   NEXT_PUBLIC_ENDPOINT_META=/api/v1/meta
   NEXT_PUBLIC_ENDPOINT_INSTITUTIONS=/api/v1/institutions
   NEXT_PUBLIC_API_COMPLAINANT_EMAIL_KEY=complainant_email
   NEXT_PUBLIC_API_COMPLAINANT_PHONE_KEY=complainant_phone
   ```
2. In [`services/httpComplaintService.js`](./services/httpComplaintService.js), uncomment and configure the `fetch` request handling matching the verified schema.
3. The UI components will automatically route submissions to the real backend with zero UI changes.
