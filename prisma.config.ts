import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Load env files the same way `next dev` does (.env.development, then .env.local overrides)
// true flag selects development mode
loadEnvConfig(process.cwd(), true);

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
