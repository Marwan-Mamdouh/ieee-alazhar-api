import type { Types } from "mongoose";

// -----------------------------------------------------------------------
// Status & field type constants
// -----------------------------------------------------------------------

export const FORM_STATUSES = ["draft", "active", "closed"] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];

export const FIELD_TYPES = [
  "text",
  "email",
  "tel",
  "number",
  "textarea",
  "select",
  "radio",
  "checkbox",
  "date",
  "committeeSelector",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

// The system-managed email field key.
// Always injected by the service — admin never touches it.
export const SYSTEM_EMAIL_KEY = "_email" as const;

// -----------------------------------------------------------------------
// Field sub-types
// -----------------------------------------------------------------------

export interface IFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number; // for number fields
  max?: number; // for number fields
  pattern?: string; // regex string, compiled at validation time
}

export interface IFieldErrorMessages {
  required?: string;
  pattern?: string;
  minLength?: string;
  maxLength?: string;
  min?: string;
  max?: string;
}

export interface IFieldDefinition {
  // Auto-generated from label at creation. Immutable once submissions exist.
  // The service slugifies the label — admin never writes this directly.
  key: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  order: number; // render order, admin-controlled
  // Only meaningful for select | radio | checkbox types.
  // Removing an option after submissions exist is warned, not blocked.
  options: string[];
  validation: IFieldValidation;
  errorMessages: IFieldErrorMessages;
  // true only for the _email field. Blocks deletion and reordering in the service.
  isSystem: boolean;
}

// -----------------------------------------------------------------------
// Form document interface
// -----------------------------------------------------------------------

export interface IForm {
  slug: string; // URL-safe, query key. Immutable after creation.
  sanityEventId?: string; // loose coupling — Sanity stores the slug, not the ObjectId
  title: string;
  description?: string;
  status: FormStatus;
  opensAt?: Date;
  closesAt?: Date;
  // null means unlimited. The atomic findOneAndUpdate in the service
  // handles null explicitly via a $or filter — never update this field directly.
  submissionLimit: number | null;
  // Source of truth for capacity checks. Only touched via atomic increment.
  // Never derive capacity state from counting submission documents.
  currentSubmissionCount: number;
  fields: IFieldDefinition[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
