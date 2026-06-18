import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]),
    DATABASE_URL: z.url(),
  })
  .readonly();

export const env = Object.freeze(envSchema.parse(process.env));

export type Env = typeof env;
