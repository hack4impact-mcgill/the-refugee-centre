import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Load .env.local the same way `next dev` does, so the CLI and the app agree.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // The CLI (migrate, db pull, studio) needs a non-pooled session, so it
    // can't go through Supabase's transaction pooler like the app does.
    // Left unset during `prisma generate`, which never connects.
    url: process.env.POSTGRES_URL_NON_POOLING,
  },
});
