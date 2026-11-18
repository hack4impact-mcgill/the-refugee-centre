import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createShiftSchema, shiftRangeSchema } from "@/lib/schemas/shift";
import { createShift, SeriesError, shiftInclude } from "@/lib/shift-series";
import { isSignedIn, unauthorized } from "@/lib/supabase/server";

/** Lists the shifts overlapping `?start=…&end=…` (ISO dates). */
export async function GET(request: NextRequest) {
  if (!(await isSignedIn())) return unauthorized();

  const range = shiftRangeSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!range.success) {
    return Response.json(
      { error: z.prettifyError(range.error) },
      { status: 400 },
    );
  }

  const { start, end } = range.data;
  const shifts = await prisma.shift.findMany({
    where: { startTime: { lt: end }, endTime: { gt: start } },
    include: shiftInclude,
    orderBy: { startTime: "asc" },
  });
  return Response.json(shifts);
}

/**
 * Creates a shift from a `ShiftInput` body. With `recurrence`, it also creates
 * the rest of the series, and returns the first shift.
 */
export async function POST(request: NextRequest) {
  if (!(await isSignedIn())) return unauthorized();

  const body = await request.json().catch(() => null);
  const input = createShiftSchema.safeParse(body);
  if (!input.success) {
    return Response.json(
      { error: z.prettifyError(input.error) },
      { status: 400 },
    );
  }

  const { recurrence, ...fields } = input.data;
  try {
    const shift = await createShift(fields, recurrence);
    return Response.json(shift, { status: 201 });
  } catch (err) {
    if (err instanceof SeriesError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
