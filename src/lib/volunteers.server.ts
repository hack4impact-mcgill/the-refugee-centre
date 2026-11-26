import "server-only";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isSignedIn } from "@/lib/supabase/server";
import type { VolunteerRecord } from "@/lib/volunteers";

/**
 * Loads everything the volunteers table needs: all volunteers alphabetically,
 * and the position names to filter by. Redirects signed-out users to /login.
 */
export async function getVolunteerTableData(): Promise<{
  volunteers: VolunteerRecord[];
  positionNames: string[];
}> {
  if (!(await isSignedIn())) redirect("/login");

  const [volunteers, shiftCounts, positions] = await Promise.all([
    prisma.volunteer.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        createdAt: true,
        name: true,
        email: true,
        phone: true,
        languages: true,
        notes: true,
        positions: {
          select: { position: { select: { id: true, name: true } } },
          orderBy: { position: { name: "asc" } },
        },
        availability: {
          select: { day: true, startMinute: true, endMinute: true },
          orderBy: [{ day: "asc" }, { startMinute: "asc" }],
        },
      },
    }),
    prisma.shiftAssignment.groupBy({
      by: ["volunteerId", "status"],
      where: { status: { in: ["ACCEPTED", "REJECTED"] } },
      _count: { _all: true },
    }),
    prisma.position.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  const countOf = (volunteerId: string, status: "ACCEPTED" | "REJECTED") =>
    shiftCounts.find(
      (count) => count.volunteerId === volunteerId && count.status === status,
    )?._count._all ?? 0;

  return {
    volunteers: volunteers.map((volunteer) => ({
      ...volunteer,
      positions: volunteer.positions.map(({ position }) => position),
      approvedShifts: countOf(volunteer.id, "ACCEPTED"),
      refusedShifts: countOf(volunteer.id, "REJECTED"),
    })),
    positionNames: positions.map(({ name }) => name),
  };
}
