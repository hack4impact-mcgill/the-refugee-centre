"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  volunteerInputSchema,
  type VolunteerField,
} from "@/lib/schemas/volunteer";
import { isSignedIn } from "@/lib/supabase/server";

// Every server action for volunteers. Reads live in @/lib/volunteers.server.

export type CreateVolunteerState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Partial<Record<VolunteerField, string>>;
};

function parseJsonArray(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string") return [];
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * The form sends `languages` and `positionIds` as repeated fields and
 * `availability` as a JSON array of `{ day, startMinute, endMinute }`.
 */
export async function createVolunteer(
  _prevState: CreateVolunteerState,
  formData: FormData,
): Promise<CreateVolunteerState> {
  // Server Actions can be called without going through the proxy.
  if (!(await isSignedIn())) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again to add a volunteer.",
      fieldErrors: {},
    };
  }

  const parsed = volunteerInputSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    languages: formData.getAll("languages"),
    positionIds: formData.getAll("positionIds"),
    availability: parseJsonArray(formData.get("availability")),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: CreateVolunteerState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as VolunteerField;
      fieldErrors[field] ??= issue.message;
    }
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors,
    };
  }

  const { positionIds, availability, ...volunteer } = parsed.data;

  try {
    await prisma.volunteer.create({
      data: {
        ...volunteer,
        positions: {
          createMany: {
            data: positionIds.map((positionId) => ({ positionId })),
          },
        },
        availability: { createMany: { data: availability } },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          status: "error",
          message: "Check the highlighted fields and try again.",
          fieldErrors: {
            email: `A volunteer with ${volunteer.email} already exists.`,
          },
        };
      }
      // P2003: a position was deleted while the form was open.
      if (error.code === "P2003") {
        return {
          status: "error",
          message:
            "One of the selected positions no longer exists. Reload the page and try again.",
          fieldErrors: {},
        };
      }
    }
    console.error("Failed to create volunteer", error);
    return {
      status: "error",
      message: "Unable to add the volunteer right now. Please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/volunteers");
  return {
    status: "success",
    message: `${volunteer.name} was added.`,
    fieldErrors: {},
  };
}

export type DeleteVolunteersResult =
  | { status: "success"; deletedCount: number }
  | { status: "error"; message: string };

const idsSchema = z.array(z.uuid()).min(1);

/**
 * Permanently deletes the volunteers. Their positions, availability and shift
 * assignments go with them (the relations cascade).
 */
export async function deleteVolunteers(
  ids: string[],
): Promise<DeleteVolunteersResult> {
  // Server Actions can be called without going through the proxy.
  if (!(await isSignedIn())) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again to delete volunteers.",
    };
  }

  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) {
    return { status: "error", message: "Select at least one volunteer." };
  }

  try {
    const { count } = await prisma.volunteer.deleteMany({
      where: { id: { in: [...new Set(parsed.data)] } },
    });
    revalidatePath("/volunteers");
    return { status: "success", deletedCount: count };
  } catch (error) {
    console.error("Failed to delete volunteers", error);
    return {
      status: "error",
      message: "Unable to delete the volunteers right now. Please try again.",
    };
  }
}
