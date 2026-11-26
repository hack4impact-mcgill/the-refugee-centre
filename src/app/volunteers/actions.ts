"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isSignedIn } from "@/lib/supabase/server";

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
