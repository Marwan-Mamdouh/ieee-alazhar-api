import type { Types } from "mongoose";
import type {
  FormStatus,
  FieldType,
  IFieldDefinition,
  IForm,
} from "./form.types.js";

// -----------------------------------------------------------------------
// Public render DTO — everything the frontend needs to render a form.
// -----------------------------------------------------------------------

export interface PublicFormFieldDTO {
  key: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  order: number;
  options: string[];
  // true only for the system _email field — lets the UI style it distinctly.
  isSystem: boolean;
}

export interface PublicFormDTO {
  slug: string;
  title: string;
  description?: string;
  status: FormStatus;
  opensAt?: Date;
  closesAt?: Date;
  fields: PublicFormFieldDTO[];
  // Computed gates for the frontend. Raw currentSubmissionCount and
  // submissionLimit are never exposed — the server owns the capacity logic.
  submittable: boolean;
  capacityReached: boolean;
}

export const toPublicFormDTO = (
  // opensAt/closesAt are Date | string because the public GET serves the
  // Redis-cached copy, where JSON serialization has already turned them
  // into ISO strings. Coerce defensively so the time-window math is correct.
  form: {
    slug: string;
    title: string;
    description?: string;
    status: FormStatus;
    opensAt?: Date | string;
    closesAt?: Date | string;
    fields: PublicFormFieldDTO[];
    submissionLimit: number | null;
    currentSubmissionCount: number;
  },
): PublicFormDTO => {
  const now = new Date();
  const opensAt =
    form.opensAt !== undefined ? new Date(form.opensAt) : undefined;
  const closesAt =
    form.closesAt !== undefined ? new Date(form.closesAt) : undefined;

  const capacityReached =
    form.submissionLimit !== null &&
    form.currentSubmissionCount >= form.submissionLimit;

  const withinTimeWindow =
    (opensAt === undefined || opensAt <= now) &&
    (closesAt === undefined || closesAt >= now);

  const submittable =
    form.status === "active" && withinTimeWindow && !capacityReached;

  return {
    slug: form.slug,
    title: form.title,
    status: form.status,
    fields: [...form.fields].sort((a, b) => a.order - b.order),
    submittable,
    capacityReached,
    ...(form.description !== undefined && { description: form.description }),
    ...(opensAt !== undefined && { opensAt }),
    ...(closesAt !== undefined && { closesAt }),
  };
};

// -----------------------------------------------------------------------
// Admin DTO — full detail for the admin dashboard. Raw counts included.
// -----------------------------------------------------------------------

export interface AdminFormDTO {
  id: string;
  slug: string;
  sanityEventId?: string;
  title: string;
  description?: string;
  status: FormStatus;
  opensAt?: Date;
  closesAt?: Date;
  submissionLimit: number | null;
  currentSubmissionCount: number;
  fields: IFieldDefinition[];
  createdAt: Date;
  updatedAt: Date;
}

export const toAdminFormDTO = (
  form: IForm & { _id: Types.ObjectId },
): AdminFormDTO => ({
  id: form._id.toString(),
  slug: form.slug,
  title: form.title,
  status: form.status,
  submissionLimit: form.submissionLimit,
  currentSubmissionCount: form.currentSubmissionCount,
  fields: form.fields,
  createdAt: form.createdAt,
  updatedAt: form.updatedAt,
  ...(form.sanityEventId !== undefined && {
    sanityEventId: form.sanityEventId,
  }),
  ...(form.description !== undefined && { description: form.description }),
  ...(form.opensAt !== undefined && { opensAt: form.opensAt }),
  ...(form.closesAt !== undefined && { closesAt: form.closesAt }),
});
