import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { shiftInputSchema, shiftRangeSchema } from "@/lib/shift-input";

/** Lists the shifts overlapping `?start=…&end=…` (ISO dates). */
export async function GET(request: NextRequest) {
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
    orderBy: { startTime: "asc" },
  });
  return Response.json(shifts);
}

/** Creates a shift from a `ShiftInput` body. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const input = shiftInputSchema.safeParse(body);
  if (!input.success) {
    return Response.json(
      { error: z.prettifyError(input.error) },
      { status: 400 },
    );
  }

  const shift = await prisma.shift.create({ data: input.data });
  return Response.json(shift, { status: 201 });
}
