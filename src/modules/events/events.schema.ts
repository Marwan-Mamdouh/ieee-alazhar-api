import z from "../../util/zod.config.js";

const sanityImageSchema = z.object({
  asset: z.object({
    url: z.url().openapi({ example: "https://cdn.sanity.io/.../image.jpg" }),
  }),
});

const speakerSchema = z
  .object({
    name: z.string().openapi({ example: "Alice Johnson" }),
    title: z.string().openapi({ example: "Senior Engineer" }),
    photo: sanityImageSchema.optional(),
  })
  .openapi("Speaker");

export const sanityEventSummarySchema = z
  .object({
    _id: z.uuid().openapi({ example: "189bc292-e41b-42a0-91b5-bfaa33a34af2" }),
    title: z.string().openapi({ example: "Introduction to Cloud Computing" }),
    slug: z.object({
      current: z.string().openapi({ example: "intro-to-cloud-computing" }),
    }),
    startDate: z.string().openapi({ example: "2026-07-05T10:00:00Z" }),
    endDate: z.string().openapi({ example: "2026-07-05T12:00:00Z" }),
    location: z.string().optional().openapi({ example: "Hall B" }),
    subtitle: z
      .string()
      .optional()
      .openapi({ example: "A beginner friendly session." }),
    registrationLink: z
      .url()
      .optional()
      .openapi({ example: "https://forms.gle/..." }),
    formSlug: z
      .string()
      .optional()
      .openapi({ example: "ieee-spring-2026" }),
    coverImage: sanityImageSchema.optional(),
  })
  .openapi("SanityEventSummary");

export const sanityEventSchema = sanityEventSummarySchema
  .extend({
    speakers: z.array(speakerSchema).optional(),
    memories: z.array(z.object({ photo: sanityImageSchema })).optional(),
  })
  .openapi("SanityEvent");

/**
 * Validates the :id path parameter for GET /events/:id.
 */
export const eventIdSchema = z.object({
  id: z.uuid().openapi({
    description: "Sanity document _id (UUID format)",
    example: "189bc292-e41b-42a0-91b5-bfaa33a34af2",
  }),
});

export type EventId = z.infer<typeof eventIdSchema>;
