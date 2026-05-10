import { config } from "dotenv";
import z from "zod";

config();

const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  FRONTEND_URL: z.string().optional(),
  MONGO_URI: z.string().optional(),
  MONGO_DB_NAME: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  NODE_ENV: z
    .enum(["production", "development", "test"])
    .optional()
    .default("development"),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error(`invalid env: ${env.error}`);
  process.exit(1);
}

export default env.data;
