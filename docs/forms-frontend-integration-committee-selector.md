# Committee Selector Field Type — Frontend Integration Guide

This document covers the new `committeeSelector` field type for dynamic forms. It is a companion to the existing [Forms Frontend Integration Guide](./forms-frontend-integration.md) — that document is **not** changed.

---

## What it solves

A single person can hold **multiple committee affiliations** (e.g., Vice in Back End + Member in Problem Solving + Code Backer Instructor in Problem Solving). Each affiliation generates a separate certificate. The `committeeSelector` field captures a list of `(section, committee, role)` entries in one field.

---

## How it works

### Field definition (from the API)

A form field with `type: "committeeSelector"` looks like:

```json
{
  "key": "committee_registrations",
  "type": "committeeSelector",
  "label": "Committee Registrations",
  "required": true,
  "order": 2,
  "options": ["Head", "Vice", "Member", "Code Backer Instructor"],
  "isSystem": false
}
```

- `options` = the **role** choices (admin-configured when creating the field)
- Sections and committees come from `GET /api/v1/board/meta` (see below)

### Submission value

The value is an **array of objects**, each with three properties:

```json
{
  "committee_registrations": [
    { "section": "technical", "committee": "back end", "role": "vice" },
    { "section": "technical", "committee": "problem solving", "role": "member" },
    { "section": "technical", "committee": "problem solving", "role": "code backer instructor" }
  ]
}
```

| Property    | Type     | Allowed values                                                     |
| ----------- | -------- | ------------------------------------------------------------------ |
| `section`   | `string` | `"officer"`, `"technical"`, `"branding"`, `"operation"`            |
| `committee` | `string` | Any valid committee/track for that section (see `/board/meta`)     |
| `role`      | `string` | One of the field's `options` values (admin-configured)             |

---

## Rendering: cascading selects

The field requires **three linked dropdowns** per entry, plus an **"Add affiliation"** button.

### Step 1: Fetch board metadata

Call `GET /api/v1/board/meta` to get the section-to-committee hierarchy:

```json
{
  "data": {
    "memberTypes": ["officer", "technical", "branding", "operation"],
    "allowedPositionsByType": {
      "officer": ["chair", "vice technical", "vice branding", "secretary", "treasurer"],
      "technical": ["head", "vice"],
      "branding": ["head", "vice"],
      "operation": ["head", "vice"]
    },
    "allowedTracksByType": {
      "technical": ["advanced programming", "ai", "back end", ...],
      "branding": ["graphic design", "video editing", "social media marketing", "photography"],
      "operation": ["pr&fr", "logistic", "hr", "operation management"]
    }
  }
}
```

Use this data to build the cascading selects:

| Section selected | Committee dropdown options come from       |
| ---------------- | ------------------------------------------ |
| `"officer"`      | `allowedPositionsByType.officer`           |
| `"technical"`    | `allowedTracksByType.technical`            |
| `"branding"`     | `allowedTracksByType.branding`             |
| `"operation"`    | `allowedTracksByType.operation`            |

The **role** dropdown always comes from the field's `options` array.

### Step 2: Render each entry

Each entry is a row with three dropdowns:

```
[ Section v ]  [ Committee v ]  [ Role v ]  [x]
```

- When the **section** changes, clear the committee selection and repopulate the committee dropdown.
- When **"Add affiliation"** is clicked, append a new empty row.
- When **[x]** is clicked, remove that row.
- If `required: true` on the field, enforce at least one entry before allowing submission.

### Step 3: Collect submission data

Gather all entries into a flat array:

```json
"committee_registrations": [
  { "section": "technical", "committee": "back end", "role": "vice" },
  { "section": "technical", "committee": "problem solving", "role": "member" }
]
```

---

## Validation rules

These are enforced server-side. The frontend should mirror them for instant feedback:

1. At least one entry is required (if `required: true`).
2. `section` must be one of: `"officer"`, `"technical"`, `"branding"`, `"operation"`.
3. `committee` must be a non-empty string.
4. `role` must be one of the field's `options` values.
5. Each entry is independent — a person can have multiple entries with the same section+committee but different roles.

---

## Example: Ahmed Hegazy

Ahmed is Vice in Back End, Member in Problem Solving, and Code Backer Instructor in Problem Solving. His submission:

```json
{
  "_email": "ahmed@university.edu",
  "full_name": "Ahmed Hegazy",
  "committee_registrations": [
    { "section": "technical", "committee": "back end", "role": "vice" },
    { "section": "technical", "committee": "problem solving", "role": "member" },
    { "section": "technical", "committee": "problem solving", "role": "code backer instructor" }
  ]
}
```

This generates **3 certificates** — one per entry.

---

## Admin setup

To add a `committeeSelector` field to a form:

1. `POST /api/v1/admin/forms/:slug/fields`
2. Body:
   ```json
   {
     "type": "committeeSelector",
     "label": "Committee Registrations",
     "required": true,
     "options": ["Head", "Vice", "Member", "Code Backer Instructor"]
   }
   ```
3. The admin configures the **role** options. Sections and committees are always derived from the board constants — they are not configurable per form.

---

## Summary

- **New field type:** `committeeSelector`
- **Submission data:** `Array<{ section, committee, role }>`
- **Cascading selects:** Section -> Committee (from `/board/meta`) -> Role (from `field.options`)
- **No breaking changes:** existing forms and field types are unaffected
- **Backward compatible:** the frontend only encounters this type if an admin creates a field with `type: "committeeSelector"`
