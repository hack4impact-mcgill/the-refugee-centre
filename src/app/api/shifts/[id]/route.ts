import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  seriesScopeSchema,
  shiftIdSchema,
  updateShiftSchema,
} from "@/lib/schemas/shift";
import { deleteShift, SeriesError, updateShift } from "@/lib/shift-series";
import { isSignedIn, unauthorized } from "@/lib/supabase/server";

const NOT_FOUND = { error: "Shift not found" };

/**
 * Replaces a shift's fields with a `ShiftInput` body. For a shift in a series,
 * `scope` (this | following | all, default this) picks which shifts the edit
 * applies to, and `recurrence` changes how they repeat. Returns the edited
 * shift, or the series' new first shift when the rule changed with "all".
 */
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
  const input = updateShiftSchema.safeParse(body);
  if (!input.success) {
    return Response.json(
      { error: z.prettifyError(input.error) },
      { status: 400 },
    );
  }

  const { scope, recurrence, ...fields } = input.data;
  try {
    const shift = await updateShift(id, fields, scope, recurrence);
    if (!shift) return Response.json(NOT_FOUND, { status: 404 });
    return Response.json(shift);
  } catch (err) {
    if (err instanceof SeriesError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}

/**
 * Deletes a shift. For a shift in a series, `?scope=following` also deletes
 * the shifts after it, and `?scope=all` the whole series, past shifts included.
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

  const scope = seriesScopeSchema.safeParse(
    request.nextUrl.searchParams.get("scope") ?? "this",
  );
  if (!scope.success) {
    return Response.json(
      { error: z.prettifyError(scope.error) },
      { status: 400 },
    );
  }

  if (!(await deleteShift(id, scope.data))) {
    return Response.json(NOT_FOUND, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
