import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function adapterOptions(connectionString: string) {
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  return {
    connectionString: url.toString(),
    ssl: LOCAL_HOSTS.has(url.hostname) ? false : { rejectUnauthorized: false },
  };
}

function createPrismaClient() {
  // Locally: the Docker Postgres. On Vercel: Supabase's transaction pooler
  const connectionString = process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_PRISMA_URL is not set");
  }
  const adapter = new PrismaPg(adapterOptions(connectionString));
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
