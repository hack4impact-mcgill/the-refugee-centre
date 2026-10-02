import "server-only";

import { z } from "zod";
import { Language, ShiftLocation } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

/** An ISO date string with a timezone (e.g. from `toISOString()`), as a Date. */
const isoDate = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

export const shiftIdSchema = z.uuid();

/** The `?start=…&end=…` range GET /api/shifts filters by */
export const shiftRangeSchema = z.object({ start: isoDate, end: isoDate });

/**
 * The body POST /api/shifts and PATCH /api/shifts/[id] accept, mapped onto the
 * database columns.
 */
export const shiftInputSchema = z
  .object({
    title: z.string().trim().min(1, "title is required"),
    start: isoDate,
    end: isoDate,
    allDay: z.boolean(),
    location: z.enum(ShiftLocation),
    address: z.string().trim().optional(),
    requiredLanguages: z.array(z.enum(Language)),
    preferredLanguages: z.array(z.enum(Language)),
  })
  .refine((shift) => shift.end >= shift.start, {
    message: "end must not be before start",
    path: ["end"],
  })
  .transform(({ start, end, address, ...rest }): Prisma.ShiftCreateInput => ({
    ...rest,
    startTime: start,
    endTime: end,
    address: address || null,
  }));

/** The request body, before parsing (dates as ISO strings). */
export type ShiftInput = z.input<typeof shiftInputSchema>;
