import "server-only";

import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isSignedIn } from "@/lib/supabase/server";
import {
  volunteerIdSchema,
  type VolunteerRecord,
} from "@/lib/schemas/volunteer";

/** The fields a `VolunteerRecord` is built from, besides the shift counts. */
const volunteerSelect = {
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
} satisfies Prisma.VolunteerSelect;

type SelectedVolunteer = Prisma.VolunteerGetPayload<{
  select: typeof volunteerSelect;
}>;

type ShiftCountOf = (
  volunteerId: string,
  status: "ACCEPTED" | "REJECTED",
) => number;

/** Counts accepted and refused shift offers, per volunteer. */
async function countShifts(
  where: Prisma.ShiftAssignmentWhereInput = {},
): Promise<ShiftCountOf> {
  const counts = await prisma.shiftAssignment.groupBy({
    by: ["volunteerId", "status"],
    where: { ...where, status: { in: ["ACCEPTED", "REJECTED"] } },
    _count: { _all: true },
  });
  return (volunteerId, status) =>
    counts.find(
      (count) => count.volunteerId === volunteerId && count.status === status,
    )?._count._all ?? 0;
}

function toRecord(
  volunteer: SelectedVolunteer,
  countOf: ShiftCountOf,
): VolunteerRecord {
  return {
    ...volunteer,
    positions: volunteer.positions.map(({ position }) => position),
    approvedShifts: countOf(volunteer.id, "ACCEPTED"),
    refusedShifts: countOf(volunteer.id, "REJECTED"),
  };
}

/** Every position, alphabetically, for pickers and filters. */
export async function getPositionOptions() {
  if (!(await isSignedIn())) redirect("/login");

  return prisma.position.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/**
 * Loads everything the volunteers table needs: all volunteers alphabetically,
 * and the position names to filter by. Redirects signed-out users to /login.
 */
export async function getVolunteerTableData(): Promise<{
  volunteers: VolunteerRecord[];
  positionNames: string[];
}> {
  if (!(await isSignedIn())) redirect("/login");

  const [volunteers, countOf, positions] = await Promise.all([
    prisma.volunteer.findMany({
      orderBy: { name: "asc" },
      select: volunteerSelect,
    }),
    countShifts(),
    getPositionOptions(),
  ]);

  return {
    volunteers: volunteers.map((volunteer) => toRecord(volunteer, countOf)),
    positionNames: positions.map(({ name }) => name),
  };
}

/**
 * Volunteer ids are UUIDs, and Postgres rejects anything else in a uuid
 * column, so other ids (e.g. a mistyped URL) are treated as not found.
 */
const isVolunteerId = (id: string) => volunteerIdSchema.safeParse(id).success;

/**
 * One volunteer, for their profile and edit pages. Returns null when there is
 * no such volunteer. Redirects signed-out users to /login.
 */
export async function getVolunteerProfile(
  volunteerId: string,
): Promise<VolunteerRecord | null> {
  if (!(await isSignedIn())) redirect("/login");
  if (!isVolunteerId(volunteerId)) return null;

  const [volunteer, countOf] = await Promise.all([
    prisma.volunteer.findUnique({
      where: { id: volunteerId },
      select: volunteerSelect,
    }),
    countShifts({ volunteerId }),
  ]);
  return volunteer && toRecord(volunteer, countOf);
}

export type ShiftHistoryEntry = {
  shiftId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  respondedAt: Date | null;
};

/**
 * The shifts a volunteer accepted and refused, most recent first. Returns null
 * when there is no such volunteer. Redirects signed-out users to /login.
 */
export async function getVolunteerShiftHistory(volunteerId: string): Promise<{
  name: string | null;
  accepted: ShiftHistoryEntry[];
  refused: ShiftHistoryEntry[];
} | null> {
  if (!(await isSignedIn())) redirect("/login");
  if (!isVolunteerId(volunteerId)) return null;

  const volunteer = await prisma.volunteer.findUnique({
    where: { id: volunteerId },
    select: {
      name: true,
      assignments: {
        where: { status: { in: ["ACCEPTED", "REJECTED"] } },
        orderBy: { shift: { startTime: "desc" } },
        select: {
          status: true,
          respondedAt: true,
          shift: {
            select: {
              id: true,
              title: true,
              startTime: true,
              endTime: true,
              allDay: true,
            },
          },
        },
      },
    },
  });
  if (!volunteer) return null;

  const entries = volunteer.assignments.map(
    ({ status, respondedAt, shift }) => ({
      status,
      entry: {
        shiftId: shift.id,
        title: shift.title,
        startTime: shift.startTime,
        endTime: shift.endTime,
        allDay: shift.allDay,
        respondedAt,
      },
    }),
  );

  return {
    name: volunteer.name,
    accepted: entries
      .filter((e) => e.status === "ACCEPTED")
      .map((e) => e.entry),
    refused: entries.filter((e) => e.status === "REJECTED").map((e) => e.entry),
  };
}
