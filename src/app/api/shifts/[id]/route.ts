import type { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { shiftIdSchema, shiftInputSchema } from "@/lib/shift-input";

const NOT_FOUND = { error: "Shift not found" };

/** Replaces a shift's fields with a `ShiftInput` body. */
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/shifts/[id]">,
) {
  const { id } = await ctx.params;
  if (!shiftIdSchema.safeParse(id).success) {
    return Response.json(NOT_FOUND, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const input = shiftInputSchema.safeParse(body);
  if (!input.success) {
    return Response.json(
      { error: z.prettifyError(input.error) },
      { status: 400 },
    );
  }

  try {
    const shift = await prisma.shift.update({
      where: { id },
      data: input.data,
    });
    return Response.json(shift);
  } catch (err) {
    // P2025: no row matched the `where`.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return Response.json(NOT_FOUND, { status: 404 });
    }
    throw err;
  }
}

/** Deletes a shift. */
export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/shifts/[id]">,
) {
  const { id } = await ctx.params;
  if (!shiftIdSchema.safeParse(id).success) {
    return Response.json(NOT_FOUND, { status: 404 });
  }

  // deleteMany reports a count instead of throwing when nothing matched.
  const { count } = await prisma.shift.deleteMany({ where: { id } });
  if (count === 0) return Response.json(NOT_FOUND, { status: 404 });
  return new Response(null, { status: 204 });
}
