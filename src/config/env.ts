import { config } from "dotenv";
import z from "zod";

config();

const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  FRONTEND_URL: z.url(),
  MONGO_URI: z.string(),
  MONGO_DB_NAME: z.string().optional(),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  NODE_ENV: z
    .enum(["production", "development", "test"])
    .optional()
    .default("development"),
  MAIL_USER: z.string().optional(),
  MAIL_APP_PASSWORD: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  SANITY_PROJECT_ID: z.string(),
  SANITY_DATASET: z.string(),
  SANITY_USE_CDN: z.coerce.boolean().default(false),
  SANITY_WEBHOOK_SECRET: z.string(),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error(`invalid env: ${env.error}`);
  process.exit(1);
}

export default env.data;
