import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * `pg` lets SSL settings in the connection string override the `ssl` option,
 * and newer versions read `sslmode=require` as `verify-full`, which rejects
 * Supabase's certificate chain. Dropping `sslmode` lets the explicit `ssl`
 * option below decide.
 */
function withoutSslMode(connectionString: string) {
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  return url.toString();
}

function createPrismaClient() {
  // Supabase's transaction pooler, set by the Vercel integration. Serverless
  // functions open many short-lived connections, which a pooler absorbs.
  const connectionString = process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_PRISMA_URL is not set");
  }
  const adapter = new PrismaPg({
    connectionString: withoutSslMode(connectionString),
    // Encrypt the connection without verifying Supabase's certificate chain.
    ssl: { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter });
}

// Reuse one client across hot reloads so dev doesn't exhaust connections.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
