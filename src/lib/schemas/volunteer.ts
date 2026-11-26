import { z } from "zod";
import { DayOfWeek, Language } from "@/generated/prisma/enums";

const MINUTES_PER_DAY = 24 * 60;

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

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
  phone: optionalText,
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
