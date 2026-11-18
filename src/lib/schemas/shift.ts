import { z } from "zod";
import type { RecurringShift, Shift } from "@/generated/prisma/browser";
import {
  Language,
  RecurrenceFrequency,
  ShiftLocation,
} from "@/generated/prisma/enums";

/** An ISO date string with a timezone (e.g. from `toISOString()`), as a Date. */
const isoDate = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

export const shiftIdSchema = z.uuid();

/** The `?start=…&end=…` range GET /api/shifts filters by */
export const shiftRangeSchema = z.object({ start: isoDate, end: isoDate });

export const MAX_VOLUNTEERS_NEEDED = 50;

/** A shift's own columns, as POST and PATCH accept them */
const shiftFields = z.object({
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
  volunteersNeeded: z.int().min(1).max(MAX_VOLUNTEERS_NEEDED).default(1),
});

function isTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** How a new or changed series repeats */
export const recurrenceInputSchema = z.object({
  frequency: z.enum(RecurrenceFrequency),
  interval: z.int().min(1).max(12).default(1),
  // ISO weekdays, 1 = Monday … 7 = Sunday. Only used by Weekly.
  byWeekday: z.array(z.int().min(1).max(7)).max(7).default([]),
  // Inclusive, as YYYY-MM-DD in `timeZone`
  endDate: z.iso.date(),
  timeZone: z.string().refine(isTimeZone, "unknown time zone"),
});

/** Which shifts of a series a change or delete applies to */
export const seriesScopeSchema = z.enum(["this", "following", "all"]);

function endNotBeforeStart(shift: { startTime: Date; endTime: Date }) {
  return shift.endTime >= shift.startTime;
}
const endBeforeStartError = {
  message: "endTime must not be before startTime",
  path: ["endTime"],
};

/** The body POST /api/shifts accepts. Without `recurrence` it's a one-off shift. */
export const createShiftSchema = shiftFields
  .extend({ recurrence: recurrenceInputSchema.optional() })
  .refine(endNotBeforeStart, endBeforeStartError);

/**
 * The body PATCH /api/shifts/[id] accepts. `recurrence` is only sent when the
 * repeat rule changes: a rule starts or replaces the series, null stops it.
 */
export const updateShiftSchema = shiftFields
  .extend({
    scope: seriesScopeSchema.default("this"),
    recurrence: recurrenceInputSchema.nullable().optional(),
  })
  .refine(endNotBeforeStart, endBeforeStartError);

/** A shift's own columns, parsed */
export type ShiftFields = z.output<typeof shiftFields>;

/** The request bodies, before parsing (dates as ISO strings) */
export type ShiftInput = z.input<typeof shiftFields>;
export type RecurrenceInput = z.input<typeof recurrenceInputSchema>;
export type Recurrence = z.output<typeof recurrenceInputSchema>;
export type SeriesScope = z.infer<typeof seriesScopeSchema>;

/** JSON turns Dates into ISO strings */
type Serialized<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] };

/** A shift as the API returns it (dates as ISO strings), with its series' rule */
export type ShiftRecord = Serialized<Shift> & {
  recurrence: Serialized<RecurringShift> | null;
};
