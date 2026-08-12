import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
  OPENAI_INTERPRETATIONS_PER_HOUR: z.coerce.number().int().min(1).max(100).default(10),
  MANDATE_MAX_MONTHLY_BUDGET_CENTS: z.coerce.number().int().positive().default(10_000_000),
  MANDATE_MAX_TRANSACTION_CENTS: z.coerce.number().int().positive().default(1_000_000),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
});

export const env = schema.parse(process.env);
