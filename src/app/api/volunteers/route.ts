import type { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { volunteerInputSchema } from "@/lib/schemas/volunteer";

/** Creates a new volunteer. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const input = volunteerInputSchema.safeParse(body);

  if (!input.success) {
    return Response.json(
      { error: z.prettifyError(input.error) },
      { status: 400 },
    );
  }

  try {
    const volunteer = await prisma.volunteer.create({
      data: input.data,
    });

    return Response.json(volunteer, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return Response.json(
        { error: "A volunteer with this email already exists" },
        { status: 409 },
      );
    }

    throw err;
  }
}