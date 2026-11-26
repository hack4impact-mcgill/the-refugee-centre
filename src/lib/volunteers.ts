import type { Language } from "@/generated/prisma/enums";
import type { AvailabilityWindow } from "@/lib/ranking/types";

/** A volunteer as shown in the volunteers table. */
export type VolunteerRecord = {
  id: string;
  createdAt: Date;
  name: string | null;
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

function formatMinute(minute: number) {
  const hours = Math.floor(minute / 60) % 24;
  const minutes = minute % 60;
  const suffix = hours < 12 ? "AM" : "PM";
  const hour = hours % 12 || 12;
  return minutes === 0
    ? `${hour} ${suffix}`
    : `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** Formats a window as e.g. "Monday (9 AM-12 PM)". */
export function formatAvailabilityWindow({
  day,
  startMinute,
  endMinute,
}: AvailabilityWindow) {
  const dayName = day.charAt(0) + day.slice(1).toLowerCase();
  return `${dayName} (${formatMinute(startMinute)}-${formatMinute(endMinute)})`;
}
