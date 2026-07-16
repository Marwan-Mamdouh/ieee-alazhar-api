import z from "../../util/zod.config.js";

const committeeImageSchema = z.object({
  asset: z.object({
    url: z.url().openapi({ example: "https://cdn.sanity.io/.../logo.png" }),
  }),
});

const committeeSchema = z
  .object({
    _id: z
      .string()
      .openapi({ example: "3a8b8046-78cf-4a4c-87d1-efc03b825ca0" }),
    name: z.string().openapi({ example: "Back End" }),
    type: z.string().openapi({ example: "technical" }),
    description: z.string().openapi({
      example: "Responsible for building back end systems.",
    }),
    logo: committeeImageSchema,
  })
  .openapi("Committee");

const technicalGroupedSchema = z.object({
  "cs-fundamentals": z.array(committeeSchema),
  "software-development": z.array(committeeSchema),
  "systems-and-data": z.array(committeeSchema),
  engineering: z.array(committeeSchema),
});

export const groupedCommitteesSchema = z
  .object({
    technical: technicalGroupedSchema,
    branding: z.array(committeeSchema),
    operation: z.array(committeeSchema),
  })
  .openapi("GroupedCommittees");
