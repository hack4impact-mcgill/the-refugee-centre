"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  volunteerInputSchema,
  type VolunteerField,
  type VolunteerInput,
} from "@/lib/schemas/volunteer";
import { isSignedIn } from "@/lib/supabase/server";

// Every server action for volunteers. Reads live in @/lib/volunteers.server.

/** What the add and edit forms get back from `createVolunteer`/`updateVolunteer`. */
export type VolunteerFormState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Partial<Record<VolunteerField, string>>;
};

function errorState(
  message: string,
  fieldErrors: VolunteerFormState["fieldErrors"] = {},
): VolunteerFormState {
  return { status: "error", message, fieldErrors };
}

function parseJsonArray(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string") return [];
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Validates the add/edit form. It sends `languages` and `positionIds` as
 * repeated fields and `availability` as a JSON array of
 * `{ day, startMinute, endMinute }`.
 */
function parseVolunteerForm(
  formData: FormData,
): { data: VolunteerInput } | { error: VolunteerFormState } {
  const parsed = volunteerInputSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    languages: formData.getAll("languages"),
    positionIds: formData.getAll("positionIds"),
    availability: parseJsonArray(formData.get("availability")),
    notes: formData.get("notes") ?? "",
  });
  if (parsed.success) return { data: parsed.data };

  const fieldErrors: VolunteerFormState["fieldErrors"] = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as VolunteerField;
    fieldErrors[field] ??= issue.message;
  }
  return {
    error: errorState(
      "Check the highlighted fields and try again.",
      fieldErrors,
    ),
  };
}

/** Turns a failed create or update into a message for the form. */
function writeErrorState(
  error: unknown,
  email: string | null,
  action: "add" | "update",
): VolunteerFormState {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return errorState("Check the highlighted fields and try again.", {
        email: `A volunteer with ${email} already exists.`,
      });
    }
    // P2003: a position was deleted while the form was open.
    if (error.code === "P2003") {
      return errorState(
        "One of the selected positions no longer exists. Reload the page and try again.",
      );
    }
    // P2025: the volunteer was deleted while the form was open.
    if (error.code === "P2025") {
      return errorState("This volunteer no longer exists.");
    }
  }
  console.error(`Failed to ${action} volunteer`, error);
  return errorState(
    `Unable to ${action} the volunteer right now. Please try again.`,
  );
}

/** The create/update payload: the volunteer's fields plus their new rows. */
const volunteerWriteData = ({
  positionIds,
  availability,
  ...fields
}: VolunteerInput) => ({
  ...fields,
  positions: {
    createMany: { data: positionIds.map((positionId) => ({ positionId })) },
  },
  availability: { createMany: { data: availability } },
});

export async function createVolunteer(
  _prevState: VolunteerFormState,
  formData: FormData,
): Promise<VolunteerFormState> {
  // Server Actions can be called without going through the proxy.
  if (!(await isSignedIn())) {
    return errorState(
      "Your session has expired. Sign in again to add a volunteer.",
    );
  }

  const parsed = parseVolunteerForm(formData);
  if ("error" in parsed) return parsed.error;
  const volunteer = parsed.data;

  try {
    await prisma.volunteer.create({ data: volunteerWriteData(volunteer) });
  } catch (error) {
    return writeErrorState(error, volunteer.email, "add");
  }

  // "layout" also refreshes the profile pages under /volunteers.
  revalidatePath("/volunteers", "layout");
  return {
    status: "success",
    message: `${volunteer.name} was added.`,
    fieldErrors: {},
  };
}

/**
 * Replaces a volunteer's details, positions and availability with the form's.
 * Bind the id first: `updateVolunteer.bind(null, id)`.
 */
export async function updateVolunteer(
  volunteerId: string,
  _prevState: VolunteerFormState,
  formData: FormData,
): Promise<VolunteerFormState> {
  // Server Actions can be called without going through the proxy.
  if (!(await isSignedIn())) {
    return errorState(
      "Your session has expired. Sign in again to update this volunteer.",
    );
  }
  if (!z.uuid().safeParse(volunteerId).success) {
    return errorState("This volunteer no longer exists.");
  }

  const parsed = parseVolunteerForm(formData);
  if ("error" in parsed) return parsed.error;
  const volunteer = parsed.data;

  try {
    // Positions and availability are keyed by their values, so the old rows
    // are cleared before the new ones go in, all in one transaction.
    await prisma.$transaction([
      prisma.volunteerPosition.deleteMany({ where: { volunteerId } }),
      prisma.volunteerAvailability.deleteMany({ where: { volunteerId } }),
      prisma.volunteer.update({
        where: { id: volunteerId },
        data: volunteerWriteData(volunteer),
      }),
    ]);
  } catch (error) {
    return writeErrorState(error, volunteer.email, "update");
  }

  revalidatePath("/volunteers", "layout");
  return {
    status: "success",
    message: `${volunteer.name}'s profile was updated.`,
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
    revalidatePath("/volunteers", "layout");
    return { status: "success", deletedCount: count };
  } catch (error) {
    console.error("Failed to delete volunteers", error);
    return {
      status: "error",
      message: "Unable to delete the volunteers right now. Please try again.",
    };
  }
}
