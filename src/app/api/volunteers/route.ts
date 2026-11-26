import { prisma } from "@/lib/prisma";
import { isSignedIn, unauthorized } from "@/lib/supabase/server";
import type { VolunteerRecord } from "@/lib/volunteers";

/** Lists all volunteers alphabetically as `VolunteerRecord`s. */
export async function GET() {
  if (!(await isSignedIn())) return unauthorized();

  const volunteers = await prisma.volunteer.findMany({
    orderBy: { name: "asc" },
    include: {
      positions: {
        select: { position: { select: { id: true, name: true } } },
        orderBy: { position: { name: "asc" } },
      },
      availability: {
        select: { day: true, startMinute: true, endMinute: true },
        orderBy: [{ day: "asc" }, { startMinute: "asc" }],
      },
    },
  });

  const records: VolunteerRecord[] = volunteers.map((volunteer) => ({
    ...volunteer,
    createdAt: volunteer.createdAt.toISOString(),
    positions: volunteer.positions.map(({ position }) => position),
  }));

  return Response.json(records);
}
