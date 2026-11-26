import type { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { shiftIdSchema, shiftInputSchema } from "@/lib/schemas/shift";
import { isSignedIn, unauthorized } from "@/lib/supabase/server";

const NOT_FOUND = { error: "Shift not found" };

/** Replaces a shift's fields with a `ShiftInput` body. */
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/shifts/[id]">,
) {
  if (!(await isSignedIn())) return unauthorized();

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

/** Body of the 409 DELETE returns when it needs `?confirm=true`. */
export type DeleteConfirmationRequired = {
  error: string;
  code: "confirmation_required";
  /** Volunteers who accepted or refused the shift. */
  affectedVolunteers: number;
};

/** Body of a successful DELETE. */
export type ShiftDeleted = {
  /** Volunteers who had accepted or refused the deleted shift. */
  affectedVolunteers: number;
};

/**
 * Deletes a shift, with its assignments, and responds with a `ShiftDeleted`
 * body. A shift that has started and that volunteers accepted or refused is
 * only deleted with `?confirm=true`, since that also removes it from their
 * accepted and refused counts; without it, responds 409 with a
 * `DeleteConfirmationRequired` body.
 */
export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/shifts/[id]">,
) {
  if (!(await isSignedIn())) return unauthorized();

  const { id } = await ctx.params;
  if (!shiftIdSchema.safeParse(id).success) {
    return Response.json(NOT_FOUND, { status: 404 });
  }

  const shift = await prisma.shift.findUnique({
    where: { id },
    select: {
      startTime: true,
      _count: {
        select: {
          assignments: {
            where: { status: { in: ["ACCEPTED", "REJECTED"] } },
          },
        },
      },
    },
  });
  if (!shift) return Response.json(NOT_FOUND, { status: 404 });

  const affectedVolunteers = shift._count.assignments;
  if (
    request.nextUrl.searchParams.get("confirm") !== "true" &&
    shift.startTime <= new Date() &&
    affectedVolunteers > 0
  ) {
    return Response.json(
      {
        error: "This shift has started and volunteers responded to it.",
        code: "confirmation_required",
        affectedVolunteers,
      } satisfies DeleteConfirmationRequired,
      { status: 409 },
    );
  }

  // deleteMany reports a count instead of throwing when nothing matched.
  const { count } = await prisma.shift.deleteMany({ where: { id } });
  if (count === 0) return Response.json(NOT_FOUND, { status: 404 });
  return Response.json({ affectedVolunteers } satisfies ShiftDeleted);
}
