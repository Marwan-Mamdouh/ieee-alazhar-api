import z from "../../../util/zod.config.js";
import { registry } from "../../../util/registry.js";
import { slugParamsSchema } from "../form/form.schema.js";

// -----------------------------------------------------------------------
// Output schemas — mirror the submission document / service return shapes
// -----------------------------------------------------------------------

const submissionSchema = z.object({
  formId: z.string().openapi({ example: "64a7b9c8e1f2a3b4c5d6e7f" }),
  formSlug: z.string().openapi({ example: "ieee-spring-2025" }),
  submitterEmail: z.string().email(),
  // The shape mirrors the form's fields array — arbitrary by design.
  data: z.record(z.string(), z.unknown()),
  submittedAt: z.coerce.date(),
});

const submissionListSchema = z.object({
  submissions: z.array(submissionSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

const exportSchema = z.object({
  formTitle: z.string(),
  columns: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      isSystem: z.boolean(),
    }),
  ),
  submissions: z.array(submissionSchema),
  total: z.number().int(),
});

// -----------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------

registry.registerPath({
  method: "post",
  path: "/api/v1/forms/{slug}/submissions",
  tags: ["Form Submissions"],
  summary: "Submit a form response",
  description:
    "The request body must match the form's dynamic field schema. Field-level error messages from the form definition are surfaced in 400 validation errors.",
  request: {
    params: slugParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: z.record(z.string(), z.unknown()),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Submission recorded",
      content: {
        "application/json": {
          schema: z.object({ data: submissionSchema }),
        },
      },
    },
    400: { description: "Validation failed (field-level error messages)" },
    403: { description: "Registration has not opened yet" },
    404: { description: "Form not found" },
    409: { description: "Registration is full or email already submitted" },
    410: { description: "Form is closed or deadline passed" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/forms/{slug}/submissions",
  tags: ["Form Submissions"],
  summary: "List submissions for a form (admin, paginated)",
  security: [{ cookieAuth: [] }],
  request: {
    params: slugParamsSchema,
  },
  responses: {
    200: {
      description: "Paginated submissions, newest first",
      content: {
        "application/json": { schema: submissionListSchema },
      },
    },
    401: { description: "Unauthorized" },
    403: { description: "Admin access required" },
    404: { description: "Form not found" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/forms/{slug}/submissions/export",
  tags: ["Form Submissions"],
  summary: "Export all submissions for a form (admin, CSV-friendly)",
  security: [{ cookieAuth: [] }],
  request: {
    params: slugParamsSchema,
  },
  responses: {
    200: {
      description: "Column definitions plus all submissions keyed by field.key",
      content: {
        "application/json": { schema: exportSchema },
      },
    },
    401: { description: "Unauthorized" },
    403: { description: "Admin access required" },
    404: { description: "Form not found" },
    500: { description: "Internal server error" },
  },
});
