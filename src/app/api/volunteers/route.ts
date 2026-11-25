import { prisma } from "@/lib/prisma";
import { isSignedIn, unauthorized } from "@/lib/supabase/server";

// list all volunteers alphabetically, and their availabilities
export async function GET() {
  if (!(await isSignedIn())) return unauthorized();

  const volunteers = await prisma.volunteer.findMany({
    include: { availabilities: true },
    orderBy: { name: "asc" },
  });

  return Response.json(volunteers);
}
