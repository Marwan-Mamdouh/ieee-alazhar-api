import { z } from "zod";
import type { IFieldDefinition } from "./form.types.js";
import { FIELD_TYPES } from "./form.types.js";

// -----------------------------------------------------------------------
// Reusable sub-schemas
// Defined once, composed into addFieldSchema and referenced by
// the dynamic compiler's fallback error messages.
// -----------------------------------------------------------------------

const fieldValidationSchema = z.object({
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().min(1, "Pattern cannot be empty if provided").optional(),
});

const fieldErrorMessagesSchema = z.object({
  required: z.string().max(200).optional(),
  pattern: z.string().max(200).optional(),
  minLength: z.string().max(200).optional(),
  maxLength: z.string().max(200).optional(),
  min: z.string().max(200).optional(),
  max: z.string().max(200).optional(),
});

// -----------------------------------------------------------------------
// Field type classification sets
// Used in addFieldSchema.superRefine to enforce type-specific constraints.
// -----------------------------------------------------------------------

/** Field types that require an options array. */
const CHOICE_TYPES = new Set(["select", "radio", "checkbox"]);

/** Field types that support minLength / maxLength / pattern. */
const STRING_TYPES = new Set(["text", "textarea", "tel", "email"]);

// -----------------------------------------------------------------------
// Static admin schemas
// -----------------------------------------------------------------------

/**
 * POST /forms — create a form (metadata only).
 *
 * `slug` is NOT accepted — the service derives it from `title` via slugify().
 * The admin is a non-technical user; the backend owns slug generation.
 * Fields are NOT accepted at creation time either.
 * The service injects the _email system field immediately after creation.
 * Additional fields are added via the addField endpoint.
 */
export const createFormSchema = z
  .object({
    sanityEventId: z.string().min(1).optional(),
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title cannot exceed 200 characters"),
    description: z
      .string()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),
    opensAt: z.coerce.date().optional(),
    closesAt: z.coerce.date().optional(),
    // null = unlimited. Absent = service defaults to null.
    // Atomic capacity enforcement lives in submission.service.ts.
    submissionLimit: z
      .number()
      .int("Submission limit must be a whole number")
      .positive("Submission limit must be a positive integer")
      .nullable()
      .optional(),
  })
  .refine(
    ({ opensAt, closesAt }) => {
      if (opensAt !== undefined && closesAt !== undefined) {
        return closesAt > opensAt;
      }
      return true;
    },
    { message: "closesAt must be after opensAt", path: ["closesAt"] },
  );

/**
 * PATCH /forms/:slug — update form metadata.
 *
 * Cannot update slug (immutable), status (use transitionStatus endpoint),
 * or fields (use field management endpoints).
 *
 * At least one field is required — the service rejects empty updates.
 * We enforce this here so the router returns a 400 before touching the DB.
 */
export const updateFormMetaSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    opensAt: z.coerce.date().optional(),
    closesAt: z.coerce.date().optional(),
    submissionLimit: z.number().int().positive().nullable().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.opensAt !== undefined ||
      data.closesAt !== undefined ||
      data.submissionLimit !== undefined,
    { message: "At least one field must be provided for update" },
  )
  .refine(
    ({ opensAt, closesAt }) => {
      if (opensAt !== undefined && closesAt !== undefined) {
        return closesAt > opensAt;
      }
      return true;
    },
    { message: "closesAt must be after opensAt", path: ["closesAt"] },
  );

/**
 * POST /forms/:slug/fields — add a field to a form.
 *
 * The service derives `key` from `label` via labelToKey() — admin never
 * provides it. `isSystem` is always false for admin-added fields.
 *
 * superRefine enforces:
 * - Choice types (select/radio/checkbox) must have at least one option.
 * - Non-choice types must not carry options.
 * - minLength/maxLength only apply to string-based types.
 * - min/max only apply to number fields.
 * - Cross-constraints: minLength ≤ maxLength, min ≤ max.
 */
export const addFieldSchema = z
  .object({
    type: z.enum(FIELD_TYPES, {
      error: `Field type must be one of: ${FIELD_TYPES.join(", ")}`,
    }),
    label: z
      .string()
      .min(1, "Label is required")
      .max(100, "Label cannot exceed 100 characters"),
    placeholder: z.string().max(200).optional(),
    helpText: z.string().max(500).optional(),
    required: z.boolean({
      error: "'required' flag must be a boolean",
    }),
    // If absent, the service appends the field at the end.
    order: z.number().int().min(0).optional(),
    options: z
      .array(z.string().min(1, "Option values cannot be empty"))
      .optional(),
    validation: fieldValidationSchema.optional(),
    errorMessages: fieldErrorMessagesSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const isChoice = CHOICE_TYPES.has(data.type);
    const isString = STRING_TYPES.has(data.type);
    const isNumber = data.type === "number";
    const opts = data.options;
    const v = data.validation;

    // Choice types must have at least one option
    if (isChoice && (!opts || opts.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Fields of type '${data.type}' require at least one option`,
        path: ["options"],
      });
    }

    // Non-choice types must not carry options — catches accidental payloads
    if (!isChoice && opts && opts.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Fields of type '${data.type}' do not support options`,
        path: ["options"],
      });
    }

    if (v) {
      // minLength/maxLength only apply to string types
      if (
        !isString &&
        (v.minLength !== undefined || v.maxLength !== undefined)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "minLength and maxLength only apply to text-based field types",
          path: ["validation"],
        });
      }

      // min/max only apply to number fields
      if (!isNumber && (v.min !== undefined || v.max !== undefined)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "min and max only apply to number fields",
          path: ["validation"],
        });
      }

      // Cross-constraint: minLength ≤ maxLength
      if (
        v.minLength !== undefined &&
        v.maxLength !== undefined &&
        v.minLength > v.maxLength
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "minLength cannot exceed maxLength",
          path: ["validation", "minLength"],
        });
      }

      // Cross-constraint: min ≤ max
      if (v.min !== undefined && v.max !== undefined && v.min > v.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "min cannot exceed max",
          path: ["validation", "min"],
        });
      }
    }
  });

/**
 * PATCH /forms/:slug/fields/:fieldKey — update a field's display properties.
 *
 * Intentionally excluded:
 * - `type`:     structural — changing type on a live form corrupts stored data shapes
 * - `required`: structural — false→true retroactively invalidates existing submissions
 * - `key`:      immutable after creation, auto-generated from label
 * - `isSystem`: internal flag, never admin-writable
 *
 * `order` is included — reordering affects render only, not stored data.
 *
 * options changes after submissions exist emit a service-layer warning, not
 * a validation error. Schema enforces shape; service enforces lifecycle.
 */
export const updateFieldSchema = z
  .object({
    label: z.string().min(1).max(100).optional(),
    placeholder: z.string().max(200).optional(),
    helpText: z.string().max(500).optional(),
    options: z.array(z.string().min(1)).optional(),
    errorMessages: fieldErrorMessagesSchema.optional(),
    order: z.number().int().min(0).optional(),
  })
  .refine(
    (data) =>
      data.label !== undefined ||
      data.placeholder !== undefined ||
      data.helpText !== undefined ||
      data.options !== undefined ||
      data.errorMessages !== undefined ||
      data.order !== undefined,
    { message: "At least one field must be provided for update" },
  );

/**
 * PATCH /forms/:slug/status — state machine transition.
 *
 * Validates the target status value only.
 * Transition legality (e.g. closed → active is blocked) is enforced in
 * form.service.ts, which has access to the current document state.
 *
 * `draft` is intentionally excluded as a target — you can never transition TO draft.
 * The state machine is: draft → active → closed (terminal).
 */
export const transitionStatusSchema = z.object({
  status: z.enum(["active", "closed"], {
    error: "status must be 'active' or 'closed'",
  }),
});

/**
 * Route params — /forms/:slug and /forms/:slug/fields/:fieldKey.
 * Shared by both the form router and the submission router.
 */
export const slugParamsSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
});

export const fieldKeyParamsSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  fieldKey: z.string().min(1, "Field key is required"),
});

/**
 * POST /forms/:slug/fields/reorder — reorder all fields.
 * Must contain exactly the current set of non-system field keys.
 * The service validates completeness; this schema only checks shape.
 */
export const reorderFieldsSchema = z.object({
  orderedKeys: z.array(z.string().min(1, "Field keys cannot be empty")),
});

// -----------------------------------------------------------------------
// Dynamic submission schema compiler
// -----------------------------------------------------------------------

/**
 * Compiles a single IFieldDefinition into a Zod type.
 *
 * Contract:
 * - field.errorMessages take priority over generic fallback strings.
 * - For select/radio: value must be one of the defined options (z.enum).
 * - For checkbox: value must be string[] where each element is a defined option.
 * - For date: coerced from ISO string (JSON transport doesn't have a Date type).
 * - For number: z.number(), NOT z.coerce.number() — JSON delivers real numbers.
 *   If a string arrives, Zod rejects it with invalid_type_error. Correct.
 * - Non-required fields: .optional() — absent keys are valid, empty strings are not.
 *
 * Guard against empty options arrays on select/radio/checkbox:
 * addFieldSchema.superRefine enforces non-empty options at write time, so
 * an empty array here means corrupted data. We fall back to z.string() and
 * let the submission pass — better than crashing the compiler.
 */
function buildFieldZodSchema(field: IFieldDefinition): z.ZodTypeAny {
  const { type, validation: v, errorMessages: em, options, required } = field;

  let schema: z.ZodTypeAny;

  switch (type) {
    case "text":
    case "textarea":
    case "tel": {
      let s = z.string({
        error: em.required ?? "This field is required",
      });
      if (v.minLength !== undefined) {
        s = s.min(
          v.minLength,
          em.minLength ?? `Minimum ${v.minLength} characters`,
        );
      }
      if (v.maxLength !== undefined) {
        s = s.max(
          v.maxLength,
          em.maxLength ?? `Maximum ${v.maxLength} characters`,
        );
      }
      if (v.pattern !== undefined) {
        s = s.regex(new RegExp(v.pattern), em.pattern ?? "Invalid format");
      }
      schema = s;
      break;
    }

    case "email": {
      let s = z
        .string({
          error: em.required ?? "Email is required",
        })
        .email(em.pattern ?? "Invalid email address");
      if (v.minLength !== undefined) {
        s = s.min(
          v.minLength,
          em.minLength ?? `Minimum ${v.minLength} characters`,
        );
      }
      if (v.maxLength !== undefined) {
        s = s.max(
          v.maxLength,
          em.maxLength ?? `Maximum ${v.maxLength} characters`,
        );
      }
      schema = s;
      break;
    }

    case "number": {
      let s = z.number({
        error: em.required ?? "This field is required",
      });
      if (v.min !== undefined) {
        s = s.min(v.min, em.min ?? `Value must be at least ${v.min}`);
      }
      if (v.max !== undefined) {
        s = s.max(v.max, em.max ?? `Value must be at most ${v.max}`);
      }
      schema = s;
      break;
    }

    case "select":
    case "radio": {
      const first = options[0];
      if (first === undefined) {
        // Defensive fallback — corrupted field definition, options should never be empty here.
        schema = z.string({
          error: em.required ?? "Please select an option",
        });
      } else {
        schema = z.enum([first, ...options.slice(1)] as [string, ...string[]], {
          error: em.required ?? "Please select an option",
        });
      }
      break;
    }

    case "checkbox": {
      // Submission value is string[] — array of selected option values.
      const first = options[0];
      const itemSchema =
        first !== undefined
          ? z.enum([first, ...options.slice(1)] as [string, ...string[]])
          : z.string();
      schema = z.array(itemSchema, {
        error: em.required ?? "Please select at least one option",
      });
      break;
    }

    case "date": {
      schema = z.coerce.date({
        error: em.required ?? "This field is required",
      });
      break;
    }

    default: {
      // Exhaustive check — TypeScript will produce a compile error here if
      // a new FieldType is added to the union without a corresponding case.
      const _exhaustive: never = type;
      void _exhaustive;
      schema = z.unknown();
      break;
    }
  }

  return required ? schema : schema.optional();
}

/**
 * Compiles a form's fields array into a Zod object schema at runtime.
 *
 * Called once per submission request, after the form document is fetched
 * (from DB or Redis cache). The schema is NOT cached separately — it's
 * derived from the fields array which you're already caching. Recompilation
 * cost is O(n fields), negligible vs. the network round-trip you just paid.
 *
 * .strict() rejects unknown keys in the submitted payload.
 * Rationale: the frontend knows exactly which fields exist — it fetched the
 * form schema to render the form. Extra keys are either a bug or an injection
 * attempt. Neither should reach submission.data in MongoDB.
 * If you ever need client-side metadata alongside the form payload, the
 * router should strip it before passing input.data to the service.
 *
 * The _email field (SYSTEM_EMAIL_KEY) is always present in fields[] because
 * the service injects it at form creation. Its schema compiles as a required
 * email field — no special handling needed here.
 *
 * Usage in submission.service.ts:
 *   const validatedData = buildFormZodSchema(form.fields).parse(input.data);
 *
 * ZodError from .parse() surfaces field-level errorMessages to the caller.
 * The router should catch ZodError and return 422 with the formatted issues.
 */
export function buildFormZodSchema(
  fields: IFieldDefinition[],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    shape[field.key] = buildFieldZodSchema(field);
  }

  return z.object(shape).strict();
}

// -----------------------------------------------------------------------
// Inferred types — import these in service and router layers
// -----------------------------------------------------------------------

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormMetaInput = z.infer<typeof updateFormMetaSchema>;
export type AddFieldInput = z.infer<typeof addFieldSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;
export type TransitionStatusInput = z.infer<typeof transitionStatusSchema>;
export type SlugParams = z.infer<typeof slugParamsSchema>;
export type FieldKeyParams = z.infer<typeof fieldKeyParamsSchema>;
export type ReorderFieldsInput = z.infer<typeof reorderFieldsSchema>;
