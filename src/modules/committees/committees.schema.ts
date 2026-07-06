import z from "../../util/zod.config.js";

const committeeImageSchema = z.object({
  asset: z.object({
    url: z.url().openapi({ example: "https://cdn.sanity.io/.../logo.png" }),
  }),
});

const committeeSchema = z
  .object({
    _id: z.string().openapi({ example: "drafts.committee-123" }),
    name: z.string().openapi({ example: "Web Development" }),
    type: z.string().openapi({ example: "technical" }),
    description: z
      .string()
      .openapi({ example: "Responsible for building Web projects." }),
    logo: committeeImageSchema,
  })
  .openapi("Committee");

export const groupedCommitteesSchema = z
  .record(z.string(), z.array(committeeSchema))
  .openapi("GroupedCommittees");
