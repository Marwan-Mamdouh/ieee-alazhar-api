import { createClient } from "@sanity/client";
import env from "./env.js";

export const sanityClient = createClient({
  projectId: env.SANITY_PROJECT_ID,
  apiVersion: "2026-05-15",
  dataset: env.SANITY_DATASET,
  useCdn: env.SANITY_USE_CDN,
});
