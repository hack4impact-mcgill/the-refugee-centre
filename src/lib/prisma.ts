import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Supabase's connection strings ask for `sslmode=require`, which newer `pg`
 * treats as `verify-full` and then rejects Supabase's certificate chain.
 * Opting into libpq semantics makes it mean "encrypted" again, as intended.
 */
function withLibpqSsl(connectionString: string) {
  const url = new URL(connectionString);
  if (url.searchParams.has("sslmode")) {
    url.searchParams.set("uselibpqcompat", "true");
  }
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
    connectionString: withLibpqSsl(connectionString),
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
