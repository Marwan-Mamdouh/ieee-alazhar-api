import z from "../../../util/zod.config.js";
import { registry } from "../../../util/registry.js";
import { FIELD_TYPES, FORM_STATUSES } from "../../forms/form/form.types.js";
import {
  createFormSchema,
  updateFormMetaSchema,
  addFieldSchema,
  updateFieldSchema,
  transitionStatusSchema,
  slugParamsSchema,
  fieldKeyParamsSchema,
  reorderFieldsSchema,
} from "../../forms/form/form.schema.js";
import { paginationSchema } from "../../../util/zod.config.js";

// -----------------------------------------------------------------------
// Output schemas — admin field includes validation and errorMessages
// -----------------------------------------------------------------------

const adminFieldSchema = z.object({
  key: z.string().openapi({ example: "university_id" }),
  type: z.enum(FIELD_TYPES),
  label: z.string().openapi({ example: "University ID" }),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean(),
  order: z.number().int().min(0),
  options: z.array(z.string()),
  validation: z
    .object({
      minLength: z.number().int().min(0).optional(),
      maxLength: z.number().int().min(1).optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
  errorMessages: z
    .object({
      required: z.string().optional(),
      pattern: z.string().optional(),
      minLength: z.string().optional(),
      maxLength: z.string().optional(),
      min: z.string().optional(),
      max: z.string().optional(),
    })
    .optional(),
  isSystem: z.boolean(),
});

const adminFormSchema = z.object({
  id: z.string().openapi({ example: "64a7b9c8e1f2a3b4c5d6e7f" }),
  slug: z.string(),
  sanityEventId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(FORM_STATUSES),
  opensAt: z.coerce.date().optional(),
  closesAt: z.coerce.date().optional(),
  submissionLimit: z.number().int().nullable(),
  currentSubmissionCount: z.number().int().min(0),
  fields: z.array(adminFieldSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const adminListSchema = z.object({
  data: z.array(adminFormSchema),
});

// -----------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/forms",
  tags: ["Admin · Forms"],
  summary: "Create a form (metadata only)",
  description:
    "The slug is derived automatically from the title by the server. The _email system field is injected on creation.",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: createFormSchema },
      },
    },
  },
  responses: {
    201: {
      description: "Form created",
      content: {
        "application/json": {
          schema: z.object({ data: adminFormSchema }),
        },
      },
    },
    400: { description: "Bad request due to invalid payload" },
    401: { description: "Unauthorized" },
    403: { description: "Admin access required" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/forms",
  tags: ["Admin · Forms"],
  summary: "List all forms (admin)",
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: "All forms, newest first",
      content: {
        "application/json": { schema: adminListSchema },
      },
    },
    401: { description: "Unauthorized" },
    403: { description: "Admin access required" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/forms/{slug}",
  tags: ["Admin · Forms"],
  summary: "Get form detail with full field data (admin)",
  description:
    "Returns the form with validation and errorMessages on each field — unlike the public endpoint which strips them.",
  security: [{ cookieAuth: [] }],
  request: {
    params: slugParamsSchema,
  },
  responses: {
    200: {
      description: "Form detail with full field validation data",
      content: {
        "application/json": {
          schema: z.object({ data: adminFormSchema }),
        },
      },
    },
    401: { description: "Unauthorized" },
    403: { description: "Admin access required" },
    404: { description: "Form not found" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/forms/{slug}",
  tags: ["Admin · Forms"],
  summary: "Update form metadata",
  security: [{ cookieAuth: [] }],
  request: {
    params: slugParamsSchema,
    body: {
      content: {
        "application/json": { schema: updateFormMetaSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Form metadata updated",
      content: {
        "application/json": {
          schema: z.object({ data: adminFormSchema }),
        },
      },
    },
    400: { description: "Bad request due to invalid payload" },
    401: { description: "Unauthorized" },
    403: { description: "Admin access required" },
    404: { description: "Form not found" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/forms/{slug}",
  tags: ["Admin · Forms"],
  summary: "Delete a form (blocked once it has submissions)",
  security: [{ cookieAuth: [] }],
  request: {
    params: slugParamsSchema,
  },
  responses: {
    204: { description: "Form deleted" },
    401: { description: "Unauthorized" },
    403: { description: "Admin access required" },
    404: { description: "Form not found" },
    409: { description: "Cannot delete a form that has submissions" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/forms/{slug}/status",
  tags: ["Admin · Forms"],
  summary: "Transition form status (draft → active → closed)",
  security: [{ cookieAuth: [] }],
  request: {
    params: slugParamsSchema,
    body: {
      content: {
        "application/json": { schema: transitionStatusSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Status transitioned",
      content: {
        "application/json": {
          schema: z.object({ data: adminFormSchema }),
        },
      },
    },
    400: { description: "Bad request due to invalid payload" },
    401: { description: "Unauthorized" },
    403: { description: "Admin access required" },
    404: { description: "Form not found" },
    422: { description: "Illegal transition" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/forms/{slug}/fields",
  tags: ["Admin · Forms"],
  summary: "Add a field to a form",
  security: [{ cookieAuth: [] }],
  request: {
    params: slugParamsSchema,
    body: {
      content: {
        "application/json": { schema: addFieldSchema },
      },
    },
  },
  responses: {
    201: {
      description: "Field added",
      content: {
        "application/json": {
          schema: z.object({ data: adminFormSchema }),
        },
      },
    },
    400: { description: "Bad request due to invalid payload" },
    401: { description: "Unauthorized" },
    403: { description: "Admin access required" },
    404: { description: "Form not found" },
    409: { description: "Field key collision or form already has submissions" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/forms/{slug}/fields/{fieldKey}",
  tags: ["Admin · Forms"],
  summary: "Update a field's display properties",
  security: [{ cookieAuth: [] }],
  request: {
    params: fieldKeyParamsSchema,
    body: {
      content: {
        "application/json": { schema: updateFieldSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Field updated",
      content: {
        "application/json": {
          schema: z.object({
            data: adminFormSchema,
            warnings: z.array(z.string()),
          }),
        },
      },
    },
    400: { description: "Bad request due to invalid payload" },
    401: { description: "Unauthorized" },
    403: { description: "Admin access required" },
    404: { description: "Form or field not found" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/forms/{slug}/fields/{fieldKey}",
  tags: ["Admin · Forms"],
  summary: "Remove a field",
  security: [{ cookieAuth: [] }],
  request: {
    params: fieldKeyParamsSchema,
  },
  responses: {
    200: {
      description: "Field removed",
      content: {
        "application/json": {
          schema: z.object({ data: adminFormSchema }),
        },
      },
    },
    401: { description: "Unauthorized" },
    403: { description: "System fields cannot be removed" },
    404: { description: "Form or field not found" },
    409: { description: "Form already has submissions" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/forms/{slug}/fields/reorder",
  tags: ["Admin · Forms"],
  summary: "Reorder all fields",
  security: [{ cookieAuth: [] }],
  request: {
    params: slugParamsSchema,
    body: {
      content: {
        "application/json": { schema: reorderFieldsSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Fields reordered",
      content: {
        "application/json": {
          schema: z.object({ data: adminFormSchema }),
        },
      },
    },
    400: { description: "Bad request due to invalid payload" },
    401: { description: "Unauthorized" },
    403: { description: "Admin access required" },
    404: { description: "Form not found" },
    422: {
      description: "Email field must stay first or payload has unknown keys",
    },
    500: { description: "Internal server error" },
  },
});

// -----------------------------------------------------------------------
// Admin submissions
// -----------------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/forms/{slug}/submissions",
  tags: ["Admin · Submissions"],
  summary: "List submissions for a form (paginated)",
  security: [{ cookieAuth: [] }],
  request: {
    params: slugParamsSchema,
    query: paginationSchema,
  },
  responses: {
    200: {
      description: "Paginated submission list",
    },
    401: { description: "Unauthorized" },
    403: { description: "Admin access required" },
    404: { description: "Form not found" },
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/forms/{slug}/submissions/export",
  tags: ["Admin · Submissions"],
  summary: "Export all submissions for a form",
  security: [{ cookieAuth: [] }],
  request: {
    params: slugParamsSchema,
  },
  responses: {
    200: {
      description: "Full submission export with columns and rows",
    },
    401: { description: "Unauthorized" },
    403: { description: "Admin access required" },
    404: { description: "Form not found" },
    500: { description: "Internal server error" },
  },
});
