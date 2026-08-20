# Forms Module — Frontend Integration Guide

## What this feature is

The API now serves **dynamic, metadata-driven forms**. An admin builds a form (title, fields, options, validation rules) at runtime via admin endpoints. Visitors see a rendered form and submit answers. There is **no hardcoded form structure on the frontend** — you render whatever the API returns.

Data flow:

```
Admin builds form  ->  GET /forms/:slug (public DTO)  ->  render inputs from `fields`
Visitor submits    ->  POST /forms/:slug/submissions ->  value keyed by field.key
Admin views        ->  GET /forms/:slug/submissions   ->  table/CSV export
```

- Base URL for all endpoints: `/api/v1`.
- All responses are JSON. Errors always look like `{ "success": false, "message": "<reason>" }`.
- Admin endpoints require the **existing admin session** (same better-auth cookie the frontend already uses). They return `401`/`403` when not authenticated.
- Only `GET /forms/:slug` and `POST /forms/:slug/submissions` are public.

---

## Field types (how to render each input)

A form's `fields` array drives the UI. Each field has: `key`, `type`, `label`, `required`, `placeholder?`, `helpText?`, `options`, `order`, `isSystem`.

| `type`     | Render as                     | Submitted value                       |
| ---------- | ----------------------------- | ------------------------------------- |
| `text`     | text input                    | `string`                              |
| `email`    | email input                   | `string`                              |
| `tel`      | tel input                     | `string`                              |
| `textarea` | textarea                      | `string`                              |
| `number`   | number input                  | `number`                              |
| `select`   | dropdown from `options`       | `string` (one option)                 |
| `radio`    | radio group from `options`    | `string` (one option)                 |
| `checkbox` | checkbox group from `options` | `string[]` (selected options)         |
| `date`     | date input                    | ISO date string (e.g. `"2026-08-20"`) |

Notes:

- Sort fields by `order` when rendering (they are already sorted in the DTO).
- `required: false` → empty value allowed; `required: true` → must be provided.
- String types may carry `minLength`/`maxLength`/`pattern`; `number` may carry `min`/`max` — apply them as native HTML constraints (`minlength`, `maxlength`, `pattern`, `min`, `max`).
- `options` only exists for `select`/`radio`/`checkbox` and is non-empty.
- Field-specific error text lives in the API's validation errors — surface `message` from the error response.

---

## Public endpoints

### `GET /api/v1/forms/:slug` — get the public form definition

- **Auth:** none.
- **Response** `200`:
  ```json
  {
    "data": {
      "slug": "ieee-spring-2026",
      "title": "IEEE Spring 2026",
      "description": "…",
      "status": "draft" | "active" | "closed",
      "opensAt": "ISO date or null",
      "closesAt": "ISO date or null",
      "fields": [ { "key": "_email", "type": "email", "label": "Email", "required": true, "order": 0, "options": [], "isSystem": true }, { … } ],
      "submittable": true | false,
      "capacityReached": true | false
    }
  }
  ```
- **Frontend rules:**
  - Render the form **only when `status === "active"` AND `submittable === true`**. `submittable` already accounts for open/close window and capacity.
  - `submittable === false` → show a message ("closed", "registration hasn't opened", or "full" when `capacityReached === true`).
  - `404` → form doesn't exist. Handle gracefully.

### `POST /api/v1/forms/:slug/submissions` — submit the form

- **Auth:** none.
- **Body:** a flat object keyed by `field.key`. The system email field is always present and required — send it as `_email`:
  ```json
  {
    "_email": "user@example.com",
    "full_name": "…",
    "university_id": 12345,
    "interest": "ai",
    "interests": ["ai", "embedded"]
  }
  ```
- **Response** `201` `{ "data": { "formSlug": "...", "submitterEmail": "...", "data": { … }, "submittedAt": "…" } }`.
- **Errors to handle:**
  - `400` — invalid payload (missing/empty required fields, wrong types, values not in `options`). Show the `message`.
  - `403` — `"Registration has not opened yet"`.
  - `409` — `"Registration is full"` or `"You have already registered with this email address"` (duplicate email). Show "already registered" and disable resubmission.
  - `410` — form closed / not accepting submissions / deadline passed. Show the `message`; do not let the user submit.
  - `429` — rate limited. Retry later.
- Do **not** send extra keys beyond the form's `fields` — unknown keys are rejected (`400`).

---

## Admin endpoints

All admin endpoints: `401` if not logged in, `403` if the session is not an admin.

### Form lifecycle

| Method & path                      | Purpose                       | Notes                                                                                                                                                                                                                                                      |
| ---------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/forms`                | List all forms (newest first) | `{ "data": [AdminFormDTO…] }`                                                                                                                                                                                                                              |
| `POST /api/v1/forms`               | Create a form                 | Body: `{ "title": "…", "description"?, "opensAt"?, "closesAt"?, "submissionLimit"?, "sanityEventId"? }`. **Do not send `slug`** — the backend derives it from `title`. Fields are not accepted here; a system `_email` field is auto-added. Returns `201`. |
| `GET /api/v1/forms/:slug`          | Admin detail                  | Full `AdminFormDTO` (includes `submissionLimit`, `currentSubmissionCount`, `fields`, timestamps).                                                                                                                                                          |
| `PATCH /api/v1/forms/:slug`        | Update metadata               | Body: any of `title`, `description`, `opensAt`, `closesAt`, `submissionLimit`. Send at least one.                                                                                                                                                          |
| `PATCH /api/v1/forms/:slug/status` | Change status                 | Body: `{ "status": "active" }` or `{ "status": "closed" }`. State machine is `draft → active → closed` (terminal). Activating a form with **zero non-system fields** returns `422`.                                                                        |
| `DELETE /api/v1/forms/:slug`       | Delete a form                 | Returns `204`. Returns `409` if the form already has submissions — tell the admin to close it instead.                                                                                                                                                     |

### Field management (`POST /api/v1/forms/:slug/fields` adds; `PATCH …/fields/:fieldKey` and `DELETE …/fields/:fieldKey` mutate/remove)

- **Add field** body:
  ```json
  {
    "type": "select",
    "label": "Department",
    "required": true,
    "placeholder": "…",
    "helpText": "…",
    "options": ["AI", "Embedded"],
    "validation": { "minLength"?: 2, "maxLength"?: 50, "pattern"?: "…", "min"?: 0, "max"?: 100 },
    "errorMessages": { "required": "…", "pattern": "…" }
  }
  ```
  - The backend generates `key` from `label` — do **not** send `key` or `isSystem`.
  - `select`/`radio`/`checkbox` **must** include non-empty `options`; other types must not.
  - `minLength`/`maxLength`/`pattern` only for text types; `min`/`max` only for `number`.
  - Returns `409` if the form already has submissions.
- **Update field** (`PATCH /forms/:slug/fields/:fieldKey`): only display props — `label`, `placeholder`, `helpText`, `options`, `order`, `errorMessages`. **Never `type`, `required`, or `key`** (rejected/rejected silently — structural changes are blocked).
- **Delete field** (`DELETE …/fields/:fieldKey`): returns `409` if the form has submissions; system `_email` cannot be removed (`403`).
- **Reorder** (`POST /api/v1/forms/:slug/fields/reorder`): body `{ "orderedKeys": ["_email", "full_name", "university_id"] }` — must contain **exactly the current field keys** (no extras/omissions) and `_email` must be first.

### Submissions (admin)

| Method & path                                         | Purpose                      | Response                                                                                             |
| ----------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| `GET /api/v1/forms/:slug/submissions?page=1&limit=50` | Paginated list, newest first | `{ "submissions": […], "total": 0, "page": 1, "limit": 50, "totalPages": 0 }`                        |
| `GET /api/v1/forms/:slug/submissions/export`          | Full export (for table/CSV)  | `{ "formTitle": "…", "columns": [{ "key", "label", "isSystem" }…], "submissions": […], "total": 0 }` |

- Each submission: `{ "formSlug", "submitterEmail", "data": { <field.key>: value }, "submittedAt" }`.
- For a CSV/table: iterate `columns`; read each row's value from `submission.data[column.key]`. `isSystem` marks the email column.
- `404` for an unknown slug.

---

## Rules the UI must respect (summary)

1. **Render from data, never hardcode** a form's fields.
2. **The `_email` field is always first, always required** — submit it as `_email` like any other field.
3. **Only `status === "active"` and `submittable === true` forms accept submissions.** Everything else is read-only/blocked.
4. **`currentSubmissionCount > 0`** (in the admin DTO) means the form has submissions → hide/disable structural edits (add/remove/reorder fields, changing `type`/`required`), which the API rejects with `409`.
5. **Show the API's `message` on errors** — they are already human-readable and localized to the field/action.
6. **Duplicate email submissions are rejected with `409`** — treat it as "already registered", not a generic failure.
