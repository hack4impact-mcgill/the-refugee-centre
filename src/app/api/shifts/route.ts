import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDate, parseShiftInput } from "@/lib/shift-input";

/** Lists the shifts overlapping `?start=…&end=…` (ISO dates). */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const start = parseDate(searchParams.get("start"));
  const end = parseDate(searchParams.get("end"));
  if (!start || !end) {
    return Response.json(
      { error: "start and end query parameters must be ISO dates" },
      { status: 400 },
    );
  }

  const shifts = await prisma.shift.findMany({
    where: { startTime: { lt: end }, endTime: { gt: start } },
    orderBy: { startTime: "asc" },
  });
  return Response.json(shifts);
}

/** Creates a shift from a `ShiftInput` body. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const input = parseShiftInput(body);
  if (!input.data) {
    return Response.json({ error: input.error }, { status: 400 });
  }

  const shift = await prisma.shift.create({ data: input.data });
  return Response.json(shift, { status: 201 });
}
