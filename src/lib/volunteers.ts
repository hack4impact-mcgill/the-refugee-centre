import type { DayOfWeek, Language } from "@/generated/prisma/enums";

/** One weekly window; minutes are counted from midnight. */
export type VolunteerAvailabilityWindow = {
  day: DayOfWeek;
  startMinute: number;
  endMinute: number;
};

/** A volunteer as returned by `GET /api/volunteers`. */
export type VolunteerRecord = {
  id: string;
  createdAt: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  languages: Language[];
  positions: { id: string; name: string }[];
  approvedShifts: number | null;
  refusedShifts: number | null;
  availability: VolunteerAvailabilityWindow[];
  notes: string | null;
};
