import type { Types } from "mongoose";
import { FormModel } from "./form.model.js";
import {
  SYSTEM_EMAIL_KEY,
  type IFieldDefinition,
  type IFieldValidation,
  type IFieldErrorMessages,
  type FormStatus,
} from "./form.types.js";
import type {
  CreateFormInput,
  AddFieldInput,
  UpdateFieldInput,
  UpdateFormMetaInput,
} from "./form.schema.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from "../../../errors/app.error.js";

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Converts a human label into a stable field key.
// Leading underscores are stripped — they are reserved for system fields (_email).
// "University ID" → "university_id"
// "_ email"       → "email"  (can never collide with SYSTEM_EMAIL_KEY)
function labelToKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+/, "");
}

// -----------------------------------------------------------------------
// State machine
// -----------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<FormStatus, FormStatus[]> = {
  draft: ["active"],
  active: ["closed"],
  closed: [],
};

// -----------------------------------------------------------------------
// System email field — injected at creation, immutable, always order: 0
// -----------------------------------------------------------------------

const SYSTEM_EMAIL_FIELD: IFieldDefinition = {
  key: SYSTEM_EMAIL_KEY,
  type: "email",
  label: "Email Address",
  required: true,
  order: 0,
  options: [],
  validation: {},
  errorMessages: {
    required: "Email address is required",
    pattern: "Please enter a valid email address",
  },
  isSystem: true,
};

// -----------------------------------------------------------------------
// Form management
// -----------------------------------------------------------------------

async function createForm(input: CreateFormInput, createdBy: Types.ObjectId) {
  const slug = slugify(input.title);

  if (!slug) {
    throw new UnprocessableEntityError(
      "Title must contain at least one letter or number",
    );
  }

  const existing = await FormModel.findOne({ slug }).lean();
  if (existing) {
    throw new ConflictError(
      `A form with slug "${slug}" already exists. Adjust the title to generate a unique slug.`,
    );
  }

  return FormModel.create({
    slug,
    createdBy,
    status: "draft",
    currentSubmissionCount: 0,
    // The system email field is always injected here.
    // Admin-provided fields at creation are not supported —
    // they add fields after creation via addField().
    fields: [SYSTEM_EMAIL_FIELD],
    title: input.title,
    // Conditional spreads keep Zod's explicit `| undefined` optionals out of
    // the Mongoose payload (exactOptionalPropertyTypes rejects them).
    ...(input.sanityEventId !== undefined && {
      sanityEventId: input.sanityEventId,
    }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.opensAt !== undefined && { opensAt: input.opensAt }),
    ...(input.closesAt !== undefined && { closesAt: input.closesAt }),
    ...(input.submissionLimit !== undefined && {
      submissionLimit: input.submissionLimit,
    }),
  });
}

async function getFormBySlug(slug: string) {
  // Read-through caching lives in the router (getCachedData on form:${slug}).
  // Mutations emit FORM_UPDATED / FORM_DELETED events from the router,
  // which invalidate the cached copy — this function stays a pure DB read.
  const form = await FormModel.findOne({ slug }).lean();
  if (!form) throw new NotFoundError("Form");
  return form;
}

async function listForms() {
  // Admin-only — returns all forms ordered by creation date, newest first.
  return FormModel.find().sort({ createdAt: -1 }).lean();
}

async function addField(slug: string, input: AddFieldInput) {
  const form = await FormModel.findOne({ slug });
  if (!form) throw new NotFoundError("Form");

  if (form.hasSubmissions) {
    throw new ConflictError(
      "Cannot add fields to a form that has already received submissions",
    );
  }

  const key = labelToKey(input.label);

  if (!key) {
    throw new UnprocessableEntityError(
      "Label must contain at least one letter or number",
    );
  }

  const keyExists = form.fields.some((f) => f.key === key);
  if (keyExists) {
    throw new ConflictError(
      `A field with key "${key}" already exists. Change the label to generate a different key.`,
    );
  }

  const newField: IFieldDefinition = {
    key,
    type: input.type,
    label: input.label,
    required: input.required ?? false,
    // Appended at end. Admin reorders separately via reorderFields().
    order: form.fields.length,
    options: input.options ?? [],
    // Zod-inferred optionals carry an explicit `| undefined`, which
    // exactOptionalPropertyTypes rejects against IFieldValidation.
    // Normalize to the clean optional shape the model expects.
    validation: (input.validation ?? {}) as IFieldValidation,
    errorMessages: (input.errorMessages ?? {}) as IFieldErrorMessages,
    isSystem: false,
    ...(input.placeholder !== undefined && { placeholder: input.placeholder }),
    ...(input.helpText !== undefined && { helpText: input.helpText }),
  };

  form.fields.push(newField);
  return form.save();
}

async function removeField(slug: string, fieldKey: string) {
  const form = await FormModel.findOne({ slug });
  if (!form) throw new NotFoundError("Form");

  const field = form.fields.find((f) => f.key === fieldKey);
  if (!field) throw new NotFoundError("Field");

  if (field.isSystem) {
    throw new ForbiddenError("System fields cannot be removed");
  }

  if (form.hasSubmissions) {
    throw new ConflictError(
      "Cannot remove fields from a form that has already received submissions",
    );
  }

  // Remove and re-sequence order values so they stay contiguous from 0.
  // System field stays at 0, user fields follow in their relative order.
  const remaining = form.fields.filter((f) => f.key !== fieldKey);
  form.fields = remaining.map((f, i) => ({
    ...f,
    order: i,
  })) as typeof form.fields;

  return form.save();
}

async function reorderFields(slug: string, orderedKeys: string[]) {
  const form = await FormModel.findOne({ slug });
  if (!form) throw new NotFoundError("Form");

  // _email must always be position 0 — it is both UI convention and
  // the assumption the submission service relies on for email extraction.
  if (orderedKeys[0] !== SYSTEM_EMAIL_KEY) {
    throw new UnprocessableEntityError(
      "The email field must remain the first field",
    );
  }

  // Validate that the input contains exactly the current non-system field keys.
  const existingNonSystemKeys = form.fields
    .filter((f) => !f.isSystem)
    .map((f) => f.key)
    .sort();

  const inputNonSystemKeys = orderedKeys
    .filter((k) => k !== SYSTEM_EMAIL_KEY)
    .sort();

  const match =
    existingNonSystemKeys.length === inputNonSystemKeys.length &&
    existingNonSystemKeys.every((k, i) => k === inputNonSystemKeys[i]);

  if (!match) {
    throw new UnprocessableEntityError(
      "Reorder payload must contain exactly the current set of field keys — no extras, no omissions",
    );
  }

  const fieldMap = new Map(form.fields.map((f) => [f.key, f]));

  form.fields = orderedKeys.map((key, index) => {
    const field = fieldMap.get(key);
    if (!field) throw new UnprocessableEntityError(`Unknown field key: "${key}"`);
    return { ...field, order: index };
  }) as typeof form.fields;

  return form.save();
}

// Display-only updates — always allowed even after submissions exist.
// Structural mutations (type, key, required toggling true→false) are not permitted here.
async function updateField(
  slug: string,
  fieldKey: string,
  input: UpdateFieldInput,
) {
  const form = await FormModel.findOne({ slug });
  if (!form) throw new NotFoundError("Form");

  const fieldIndex = form.fields.findIndex((f) => f.key === fieldKey);
  if (fieldIndex === -1) throw new NotFoundError("Field");

  const field = form.fields[fieldIndex];
  // noUncheckedIndexedAccess: findIndex guarantees the slot exists, but we still check.
  if (!field) throw new NotFoundError("Field");

  if (field.isSystem) {
    throw new ForbiddenError("System fields cannot be modified");
  }

  if (input.label !== undefined) field.label = input.label;
  if (input.placeholder !== undefined) field.placeholder = input.placeholder;
  if (input.helpText !== undefined) field.helpText = input.helpText;
  if (input.options !== undefined) field.options = input.options;
  if (input.order !== undefined) field.order = input.order;
  if (input.errorMessages !== undefined) {
    field.errorMessages = {
      ...field.errorMessages,
      ...input.errorMessages,
      // Normalize — same exactOptionalPropertyTypes rationale as addField.
    } as IFieldErrorMessages;
  }

  // Mongoose can't detect mutations on subdocument array elements.
  form.markModified("fields");

  const saved = await form.save();

  // Warn (don't block) if options were changed after submissions exist.
  // The DTO layer surfaces this warning to the admin.
  const warnings: string[] =
    input.options !== undefined && form.hasSubmissions
      ? [
          "Removing options from a field that has existing submissions may make past answers unrepresentable in the export view",
        ]
      : [];

  return { form: saved, warnings };
}

async function updateFormMeta(slug: string, input: UpdateFormMetaInput) {
  const form = await FormModel.findOne({ slug });
  if (!form) throw new NotFoundError("Form");

  // Prevent setting a limit lower than the current count.
  // It would make the form appear full retroactively and lock out valid submitters.
  if (
    input.submissionLimit !== undefined &&
    input.submissionLimit !== null &&
    input.submissionLimit < form.currentSubmissionCount
  ) {
    throw new UnprocessableEntityError(
      `Submission limit cannot be set below the current submission count (${form.currentSubmissionCount})`,
    );
  }

  if (input.title !== undefined) form.title = input.title;
  if (input.description !== undefined) form.description = input.description;
  if (input.submissionLimit !== undefined) {
    form.submissionLimit = input.submissionLimit;
  }

  // null clears the date. undefined means "not provided, leave it alone".
  // exactOptionalPropertyTypes forces this to be explicit.
  if (input.opensAt) {
    form.opensAt = input.opensAt;
  }
  if (input.closesAt) {
    form.closesAt = input.closesAt;
  }

  return form.save();
}

async function transitionStatus(slug: string, targetStatus: FormStatus) {
  const form = await FormModel.findOne({ slug });
  if (!form) throw new NotFoundError("Form");

  const allowed = ALLOWED_TRANSITIONS[form.status];

  if (!allowed.includes(targetStatus)) {
    throw new UnprocessableEntityError(
      `Cannot transition from "${form.status}" to "${targetStatus}". ` +
        (allowed.length
          ? `Allowed next states: ${allowed.join(", ")}`
          : `"${form.status}" is a terminal state`),
    );
  }

  // A form with no user-defined fields makes no sense to activate.
  if (
    targetStatus === "active" &&
    form.fields.filter((f) => !f.isSystem).length === 0
  ) {
    throw new UnprocessableEntityError(
      "Cannot activate a form with no fields — add at least one field beyond the system email field first.",
    );
  }

  form.status = targetStatus;

  return form.save();
}

async function deleteForm(slug: string) {
  const form = await FormModel.findOne({ slug });
  if (!form) throw new NotFoundError("Form");

  // Deleting a form with submissions would orphan the submission documents.
  // The admin closes the form instead — data is retained.
  if (form.hasSubmissions) {
    throw new ConflictError(
      "Cannot delete a form that has received submissions. Close it instead — the data will be preserved.",
    );
  }

  await form.deleteOne();
}

// -----------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------

export const FormService = {
  create: createForm,
  getBySlug: getFormBySlug,
  list: listForms,
  addField,
  removeField,
  reorderFields,
  updateField,
  updateMeta: updateFormMeta,
  transitionStatus,
  remove: deleteForm,
} as const;
