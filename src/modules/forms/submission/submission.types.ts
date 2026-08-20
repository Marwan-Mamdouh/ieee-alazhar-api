import type { Types } from "mongoose";

export interface IFormSubmission {
  formId: Types.ObjectId;
  // Denormalized — lets the service query by slug without a populate.
  // Used primarily in admin export to get all submissions for a form
  // when you only have the slug from the URL, not the ObjectId.
  formSlug: string;
  // Always extracted from data[SYSTEM_EMAIL_KEY] at the service layer
  // before the document is written. Never trust the client to send this
  // separately — derive it from the validated submission payload.
  submitterEmail: string;
  // Schemaless by design. The form's fields array IS the schema.
  // Shape is enforced by the dynamic Zod compiler in the service,
  // not at the database layer. Keys match field.key values.
  data: Record<string, unknown>;
  submittedAt: Date;
}
