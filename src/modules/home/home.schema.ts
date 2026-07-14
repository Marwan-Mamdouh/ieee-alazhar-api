import z from "../../util/zod.config.js";

const sanityImageSchema = z.object({
  asset: z.object({
    url: z.url().openapi({ example: "https://cdn.sanity.io/.../image.jpg" }),
  }),
});

const homeImageSchema = z.object({
  image: sanityImageSchema,
}).openapi("HomeImage");

export const homePageDataSchema = z.object({
  home_images: z.array(homeImageSchema),
}).openapi("HomePageData");
