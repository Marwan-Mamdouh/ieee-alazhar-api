import { Schema, model, type HydratedDocument } from "mongoose";
import {
  FORM_STATUSES,
  FIELD_TYPES,
  type IForm,
  type IFieldDefinition,
  type IFieldValidation,
  type IFieldErrorMessages,
} from "../form/form.types.js";

export interface IFormVirtuals {
  hasSubmissions: boolean;
}

export type FormDocument = HydratedDocument<IForm, IFormVirtuals>;
// -----------------------------------------------------------------------
// Sub-schemas — all have _id: false.
// Field identity is the `key` string, not an ObjectId.
// This also keeps the document lighter and index lookups cleaner.
// -----------------------------------------------------------------------

const fieldValidationSchema = new Schema<IFieldValidation>(
  {
    minLength: { type: Number },
    maxLength: { type: Number },
    min: { type: Number },
    max: { type: Number },
    pattern: { type: String },
  },
  { _id: false },
);

const fieldErrorMessagesSchema = new Schema<IFieldErrorMessages>(
  {
    required: { type: String },
    pattern: { type: String },
    minLength: { type: String },
    maxLength: { type: String },
    min: { type: String },
    max: { type: String },
  },
  { _id: false },
);

const fieldDefinitionSchema = new Schema<IFieldDefinition>(
  {
    key: { type: String, required: true },
    type: { type: String, enum: FIELD_TYPES, required: true },
    label: { type: String, required: true, trim: true },
    placeholder: { type: String, trim: true },
    helpText: { type: String, trim: true },
    required: { type: Boolean, required: true, default: false },
    order: { type: Number, required: true },
    // Default [] so select/radio/checkbox start empty, not absent.
    options: { type: [String], default: [] },
    // Factory defaults so these sub-docs are always present, never null.
    validation: { type: fieldValidationSchema, default: () => ({}) },
    errorMessages: { type: fieldErrorMessagesSchema, default: () => ({}) },
    isSystem: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

// -----------------------------------------------------------------------
// Main form schema
// -----------------------------------------------------------------------

const formSchema = new Schema<FormDocument>(
  {
    slug: {
      type: String,
      required: true,
      unique: true, // also creates the index
      trim: true,
      lowercase: true,
    },
    // Loose coupling to Sanity — the Sanity event stores the slug,
    // the form stores the Sanity document ID for reverse lookup only.
    sanityEventId: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: FORM_STATUSES,
      required: true,
      default: "draft",
    },
    opensAt: { type: Date },
    closesAt: { type: Date },
    // null = unlimited. Never query this with a bare $lt —
    // the service uses a $or to guard against the null comparison bug.
    submissionLimit: { type: Number, default: null },
    // Atomic source of truth for capacity.
    // Only ever touched via findOneAndUpdate with $inc in the service.
    // Do not read-modify-write this field.
    currentSubmissionCount: { type: Number, required: true, default: 0 },
    // The _email field is always index 0 and has isSystem: true.
    // The service injects it on form creation — the admin never adds it manually.
    fields: { type: [fieldDefinitionSchema], required: true, default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true, // createdAt + updatedAt
    // -----------------------------------------------------------------------
    // Virtual
    // -----------------------------------------------------------------------

    // Used in the service layer to gate structural schema mutations.
    // A form with submissions cannot have fields added, removed, or have their
    // type or key changed. Label/placeholder/helpText/errorMessages are still mutable.
    virtuals: {
      hasSubmissions: {
        get(this: FormDocument) {
          return this.currentSubmissionCount > 0;
        },
      },
    },
  },
);

// -----------------------------------------------------------------------
// Indexes
// -----------------------------------------------------------------------

// Admin dashboard: filter forms by status
formSchema.index({ status: 1 });

// Reverse lookup: given a Sanity event ID, find its form
// sparse: true so forms without a sanityEventId don't waste index space with nulls
formSchema.index({ sanityEventId: 1 }, { sparse: true });

export const FormModel = model<FormDocument>("Form", formSchema);
