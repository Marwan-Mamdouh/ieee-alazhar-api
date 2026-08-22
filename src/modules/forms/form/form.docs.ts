import z from "../../../util/zod.config.js";
import { registry } from "../../../util/registry.js";
import { FIELD_TYPES, FORM_STATUSES } from "./form.types.js";
import { slugParamsSchema } from "./form.schema.js";

// -----------------------------------------------------------------------
// Output schemas — mirrors the public DTO (no validation/errorMessages)
// -----------------------------------------------------------------------

const fieldSchema = z.object({
  key: z.string().openapi({ example: "university_id" }),
  type: z.enum(FIELD_TYPES),
  label: z.string().openapi({ example: "University ID" }),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean(),
  order: z.number().int().min(0),
  options: z.array(z.string()),
  isSystem: z.boolean(),
});

const publicFormSchema = z.object({
  slug: z.string().openapi({ example: "ieee-spring-2025" }),
  title: z.string().openapi({ example: "IEEE Spring 2025" }),
  description: z.string().optional(),
  status: z.enum(FORM_STATUSES),
  opensAt: z.coerce.date().optional(),
  closesAt: z.coerce.date().optional(),
  fields: z.array(fieldSchema),
  submittable: z.boolean(),
  capacityReached: z.boolean(),
});

// -----------------------------------------------------------------------
// Routes — public only
// -----------------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/api/v1/forms/{slug}",
  tags: ["Forms"],
  summary: "Get a form's public definition for rendering",
  request: {
    params: slugParamsSchema,
  },
  responses: {
    200: {
      description: "Public form definition with computed submittable state",
      content: {
        "application/json": {
          schema: z.object({ data: publicFormSchema }),
        },
      },
    },
    404: { description: "Form not found" },
    500: { description: "Internal server error" },
  },
});
