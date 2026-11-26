import { z } from "zod";
import { DayOfWeek, Language } from "@/generated/prisma/enums";
import type { AvailabilityWindow } from "@/lib/ranking/types";

const MINUTES_PER_DAY = 24 * 60;

export const volunteerIdSchema = z.uuid();

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

/**
 * Accepts a phone number in any common format and stores it as
 * `+1 (514) 555-0101`. Numbers with a country code other than +1 are kept as
 * `+` followed by their digits, since their grouping differs by country.
 */
const phoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return null;
    const phone = formatPhone(value);
    if (!phone) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a 10-digit phone number, e.g. +1 (514) 555-0101.",
      });
      return z.NEVER;
    }
    return phone;
  });

function formatPhone(value: string): string | null {
  if (/[^\d\s()+.\-]/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  const international = value.startsWith("+") || value.startsWith("00");
  const local = digits.startsWith("00") ? digits.slice(2) : digits;

  const nanp =
    local.length === 10 && !international
      ? local
      : local.length === 11 && local.startsWith("1")
        ? local.slice(1)
        : null;
  if (nanp) {
    return `+1 (${nanp.slice(0, 3)}) ${nanp.slice(3, 6)}-${nanp.slice(6)}`;
  }
  if (
    international &&
    !local.startsWith("1") &&
    local.length >= 8 &&
    local.length <= 15
  ) {
    return `+${local}`;
  }
  return null;
}

const availabilityWindowSchema = z
  .object({
    day: z.enum(DayOfWeek),
    startMinute: z
      .int()
      .min(0)
      .max(MINUTES_PER_DAY - 1),
    endMinute: z.int().min(1).max(MINUTES_PER_DAY),
  })
  .refine((window) => window.endMinute > window.startMinute, {
    message: "Each availability must end after it starts.",
  });

export const volunteerInputSchema = z.object({
  name: z.string().trim().min(1, "Enter the volunteer's name."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.union([z.literal(""), z.email("Enter a valid email address.")]))
    .transform((email) => email || null),
  phone: phoneSchema,
  languages: z
    .array(z.enum(Language))
    .transform((languages) => [...new Set(languages)]),
  positionIds: z
    .array(z.uuid())
    .transform((positionIds) => [...new Set(positionIds)]),
  availability: z
    .array(availabilityWindowSchema)
    .refine((windows) => !hasOverlap(windows), {
      message: "Availabilities on the same day can't overlap.",
    }),
  notes: optionalText,
});

export type VolunteerInput = z.output<typeof volunteerInputSchema>;

export type VolunteerField = keyof z.input<typeof volunteerInputSchema>;

/** A volunteer as the table, profile and edit pages show it. */
export type VolunteerRecord = {
  id: string;
  createdAt: Date;
  name: string;
  email: string | null;
  phone: string | null;
  languages: Language[];
  positions: { id: string; name: string }[];
  /** Shift offers the volunteer accepted. */
  approvedShifts: number;
  /** Shift offers the volunteer rejected. */
  refusedShifts: number;
  /** Weekly windows; minutes are counted from midnight. */
  availability: AvailabilityWindow[];
  notes: string | null;
};

function hasOverlap(windows: z.output<typeof availabilityWindowSchema>[]) {
  const sorted = [...windows].sort(
    (a, b) => a.day.localeCompare(b.day) || a.startMinute - b.startMinute,
  );
  return sorted.some(
    (window, index) =>
      index > 0 &&
      sorted[index - 1].day === window.day &&
      window.startMinute < sorted[index - 1].endMinute,
  );
}
