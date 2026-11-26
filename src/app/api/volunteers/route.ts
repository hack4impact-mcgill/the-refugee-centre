import { prisma } from "@/lib/prisma";
import { isSignedIn, unauthorized } from "@/lib/supabase/server";

// list all volunteers alphabetically, with their availability and positions
export async function GET() {
  if (!(await isSignedIn())) return unauthorized();

  const volunteers = await prisma.volunteer.findMany({
    include: {
      availability: true,
      positions: { include: { position: true } },
    },
    orderBy: { name: "asc" },
  });

  return Response.json(volunteers);
}
