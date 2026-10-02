import "server-only";

import { z } from "zod";
import { Language, ShiftLocation } from "@/generated/prisma/enums";

/** An ISO date string with a timezone (e.g. from `toISOString()`), as a Date. */
const isoDate = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

export const shiftIdSchema = z.uuid();

/** The `?start=…&end=…` range GET /api/shifts filters by */
export const shiftRangeSchema = z.object({ start: isoDate, end: isoDate });

/**
 * The body POST /api/shifts and PATCH /api/shifts/[id] accept. Its fields are
 * the database columns, so the parsed result can go straight to Prisma.
 */
export const shiftInputSchema = z
  .object({
    title: z.string().trim().min(1, "title is required"),
    startTime: isoDate,
    endTime: isoDate,
    allDay: z.boolean(),
    location: z.enum(ShiftLocation),
    // Blank or missing is stored as null.
    address: z
      .string()
      .trim()
      .optional()
      .transform((address) => address || null),
    requiredLanguages: z.array(z.enum(Language)),
    preferredLanguages: z.array(z.enum(Language)),
  })
  .refine((shift) => shift.endTime >= shift.startTime, {
    message: "endTime must not be before startTime",
    path: ["endTime"],
  });

/** The request body, before parsing (dates as ISO strings). */
export type ShiftInput = z.input<typeof shiftInputSchema>;
