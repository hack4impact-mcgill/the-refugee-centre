import { defineConfig } from "prisma/config";
import baseConfig from "./prisma.config";

// Same as prisma.config.ts, but points the Prisma CLI at the hosted Supabase
// database instead of local Postgres. Used by `npm run db:push:supabase`.
// Only people who have the Supabase database password can set this.
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  throw new Error(
    "SUPABASE_DB_URL is not set. Add the Supabase session pooler URL (port 5432) to .env.local.",
  );
}

export default defineConfig({
  ...baseConfig,
  datasource: { url },
});
