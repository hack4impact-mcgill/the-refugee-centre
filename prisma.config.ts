import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Load .env.local the same way `next dev` does, so the CLI can read the same environment variables as app
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // The CLI (migrate, db pull, studio) needs a non-pooled session, so it
    // can't go through Supabase's transaction pooler like the app does.
    url: process.env.POSTGRES_URL_NON_POOLING,
  },
});
