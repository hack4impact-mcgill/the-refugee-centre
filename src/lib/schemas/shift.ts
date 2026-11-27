import { z } from "zod";
import type { Shift } from "@/generated/prisma/browser";
import { Language, ShiftLocation } from "@/generated/prisma/enums";

/** An ISO date string with a timezone (e.g. from `toISOString()`), as a Date. */
const isoDate = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

/** Shifts at TRC always take place here, so the address isn't editable. */
export const TRC_ADDRESS = "2107 Rue Sainte-Catherine Ouest, Montréal, QC";

/**
 * The address stored for a shift: fixed at TRC, typed in for Offsite, and
 * none for Remote (it has a video call instead).
 */
export function addressFor(location: ShiftLocation, address: string | null) {
  if (location === ShiftLocation.TRC) return TRC_ADDRESS;
  if (location === ShiftLocation.Remote) return null;
  return address;
}

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
  })
  .transform((shift) => ({
    ...shift,
    address: addressFor(shift.location, shift.address),
  }));

/** The request body, before parsing (dates as ISO strings). */
export type ShiftInput = z.input<typeof shiftInputSchema>;

/** JSON turns Dates into ISO strings */
type Serialized<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] };

/** A shift as the API returns it (dates as ISO strings) */
export type ShiftRecord = Serialized<Shift>;
