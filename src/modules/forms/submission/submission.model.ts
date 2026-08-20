import { Schema, model, type Document } from "mongoose";
import type { IFormSubmission } from "./submission.types.js";

type SubmissionDocument = IFormSubmission & Document;

const submissionSchema = new Schema<SubmissionDocument>(
  {
    formId: { type: Schema.Types.ObjectId, ref: "Form", required: true },
    formSlug: { type: String, required: true },
    // lowercase + trim here as a safety net.
    // The service already normalizes this before write,
    // but the index must match exactly so we enforce it at both layers.
    submitterEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    // Schema.Types.Mixed = Mongoose treats this as a black box.
    // strict: true (default) still protects the top-level document shape —
    // Mixed only opens the door for the contents of this one field.
    // If you ever modify data on an existing doc, call markModified("data")
    // before save — Mongoose can't detect nested changes in Mixed fields.
    // In practice, submissions are immutable, so this won't come up.
    data: { type: Schema.Types.Mixed, required: true },
    submittedAt: { type: Date, required: true, default: Date.now },
  },
  {
    // Submissions are write-once. No updatedAt.
    timestamps: false,
  },
);

// -----------------------------------------------------------------------
// Indexes
// -----------------------------------------------------------------------

// Core duplicate prevention.
// The service checks this before write, but the index is the hard guarantee.
// If the service check races (two concurrent requests), the index kills the duplicate.
submissionSchema.index({ formId: 1, submitterEmail: 1 }, { unique: true });

// Admin: list submissions for a form ordered by newest first
submissionSchema.index({ formId: 1, submittedAt: -1 });

// Admin export: fetch all submissions by slug without needing to
// resolve the formId first (slug comes from the URL param)
submissionSchema.index({ formSlug: 1 });

export const SubmissionModel = model<SubmissionDocument>(
  "Submission",
  submissionSchema,
);
