import { FormModel } from "../form/form.model.js";
import { SYSTEM_EMAIL_KEY } from "../form/form.types.js";
import { buildFormZodSchema } from "../form/form.schema.js";
import { SubmissionModel } from "./submission.model.js";
import {
  ConflictError,
  ForbiddenError,
  GoneError,
  NotFoundError,
  UnprocessableEntityError,
} from "../../../errors/app.error.js";

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === 11000
  );
}

// -----------------------------------------------------------------------
// Input types
// Will be replaced by Zod inferred types once form.schema.ts is built.
// -----------------------------------------------------------------------

export interface SubmitFormInput {
  data: Record<string, unknown>;
}

// -----------------------------------------------------------------------
// Submission flow
// -----------------------------------------------------------------------

async function submit(slug: string, input: SubmitFormInput) {
  // ── 1. Fetch form ──────────────────────────────────────────────────────
  // Deliberately a direct DB read — NOT the Redis cache.
  // submit() needs a fresh document for the atomic capacity check and the
  // current status/time window. The public GET /forms/:slug route serves the
  // cached copy; this endpoint is rate-limited at the router layer instead.
  const form = await FormModel.findOne({ slug }).lean();
  if (!form) throw new NotFoundError("Form");

  // ── 2. Status check ────────────────────────────────────────────────────
  if (form.status !== "active") {
    const message =
      form.status === "closed"
        ? "Registration for this event is closed"
        : "This form is not currently accepting submissions";
    // 410 Gone is more accurate than 403 — the resource existed but is no longer available
    throw new GoneError(message);
  }

  // ── 3. Time window check ───────────────────────────────────────────────
  const now = new Date();

  if (form.opensAt && form.opensAt > now) {
    throw new ForbiddenError("Registration has not opened yet");
  }

  if (form.closesAt && form.closesAt < now) {
    throw new GoneError("The registration deadline has passed");
  }

  // ── 4. Validate submission body ────────────────────────────────────────
  // The compiler walks form.fields and builds a Zod object schema at runtime.
  // Field-level error messages from field.errorMessages are surfaced in the
  // ZodError. It propagates to the global error handler, which normalizes it
  // to a 400 ValidationError. Unknown keys are rejected by .strict().
  const validatedData = buildFormZodSchema(form.fields).parse(input.data);

  // ── 5. Atomic capacity check + increment ───────────────────────────────
  // The $or handles both cases in one atomic operation:
  //
  //   submissionLimit: null  → "{ submissionLimit: null }" branch always matches → unlimited
  //   submissionLimit: 100   → "$expr: $lt" branch matches only if count < 100
  //
  // Why not branch in application code?
  // If you do (submissionLimit === null ? skip check : check), you lose atomicity
  // for the null path — two concurrent requests on the last slot both pass
  // and you get an over-count. The $or keeps both paths inside a single
  // findOneAndUpdate so MongoDB's document-level locking covers both.
  const capacityUpdated = await FormModel.findOneAndUpdate(
    {
      _id: form._id,
      $or: [
        { submissionLimit: null },
        { $expr: { $lt: ["$currentSubmissionCount", "$submissionLimit"] } },
      ],
    },
    { $inc: { currentSubmissionCount: 1 } },
    { returnDocument: "after" },
  );

  if (!capacityUpdated) {
    // submissionLimit: null always matches, so null here means we have a
    // numeric limit and $expr came back false — the event is full.
    throw new ConflictError("Registration is full");
  }

  // ── 6. Extract submitter email ─────────────────────────────────────────
  // SYSTEM_EMAIL_KEY (_email) is always present and required — the Zod
  // compiler guarantees it is a valid email string. This check is purely
  // defensive; the capacity rollback keeps the count accurate if it ever
  // fires.
  const rawEmail = validatedData[SYSTEM_EMAIL_KEY];

  if (typeof rawEmail !== "string" || rawEmail.trim().length === 0) {
    // We incremented the count for a submission we are about to reject.
    // Roll back before throwing so capacity stays accurate.
    await FormModel.findByIdAndUpdate(form._id, {
      $inc: { currentSubmissionCount: -1 },
    });
    throw new UnprocessableEntityError(
      "Submission is missing the required email field",
    );
  }

  const submitterEmail = rawEmail.toLowerCase().trim();

  // ── 7. Write submission ────────────────────────────────────────────────
  // We do NOT do a pre-check read for duplicate email here.
  // A pre-check has a race window: two requests pass the read, both attempt
  // to write, one fails the unique index. The index is the hard guarantee.
  // We catch the duplicate key error and handle it explicitly below.
  try {
    const submission = await SubmissionModel.create({
      formId: form._id,
      formSlug: form.slug,
      submitterEmail,
      data: validatedData,
    });

    return submission;
  } catch (err: unknown) {
    if (isDuplicateKeyError(err)) {
      // This slot was consumed by a duplicate, not a real new submission.
      // Roll back the capacity increment so the count stays accurate.
      await FormModel.findByIdAndUpdate(form._id, {
        $inc: { currentSubmissionCount: -1 },
      });

      throw new ConflictError(
        "You have already registered with this email address",
      );
    }

    // Unknown error — roll back and rethrow for the global error handler.
    await FormModel.findByIdAndUpdate(form._id, {
      $inc: { currentSubmissionCount: -1 },
    });

    throw err;
  }
}

// -----------------------------------------------------------------------
// Admin queries
// -----------------------------------------------------------------------

async function getSubmissionsByForm(
  slug: string,
  page: number = 1,
  limit: number = 50,
) {
  // 404 for unknown slugs instead of an empty list — consistent with export.
  const formExists = await FormModel.exists({ slug });
  if (!formExists) throw new NotFoundError("Form");

  const skip = (page - 1) * limit;

  const [submissions, total] = await Promise.all([
    // formSlug is denormalized on every submission and indexed,
    // so we can query by the URL slug without resolving the formId first.
    SubmissionModel.find({ formSlug: slug })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SubmissionModel.countDocuments({ formSlug: slug }),
  ]);

  return {
    submissions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Returns everything the admin needs to render a submissions table or generate a CSV.
// Columns come from the form's field definitions (ordered, labeled).
// Rows come from submission documents (keyed by field.key).
// The consumer pairs them: columns[n].key → row.data[columns[n].key]
async function exportSubmissions(slug: string) {
  // Fetch only the fields we need from the form — no need for the full document.
  const form = await FormModel.findOne(
    { slug },
    { title: 1, fields: 1 },
  ).lean();

  if (!form) throw new NotFoundError("Form");

  const submissions = await SubmissionModel.find({ formSlug: slug })
    .sort({ submittedAt: 1 }) // oldest first — natural reading order for a CSV
    .lean();

  // Build column headers from field definitions, sorted by render order.
  // key is what you look up in submission.data.
  // label is what you display as the column header.
  // isSystem flags the email column so the consumer can style it differently.
  const columns = [...form.fields]
    .sort((a, b) => a.order - b.order)
    .map((f) => ({ key: f.key, label: f.label, isSystem: f.isSystem }));

  return {
    formTitle: form.title,
    columns,
    submissions,
    total: submissions.length,
  };
}

// -----------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------

export const SubmissionService = {
  submit,
  getSubmissionsByForm,
  exportSubmissions,
} as const;
