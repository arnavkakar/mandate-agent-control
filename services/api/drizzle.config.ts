import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./services/api/src/schema.ts",
  out: "./services/api/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgresql://mandate:mandate@localhost:5432/mandate" },
});
