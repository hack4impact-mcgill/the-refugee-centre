import type { AssignmentStatus, Attendance } from "@/generated/prisma/enums";
import { RANKING_CONFIG } from "@/lib/ranking/config";

/** One row of the History page: one volunteer offered one shift. */
export type ShiftHistoryRow = {
  /** The shift assignment's id. */
  id: string;
  volunteerId: string;
  volunteerName: string;
  /** The shift's position; null when the shift has none. */
  position: string | null;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  status: AssignmentStatus;
  attendance: Attendance;
  /** Null unless the volunteer attended. */
  hours: number | null;
};

type ShiftTimes = { startTime: Date; endTime: Date; allDay: boolean };

const ATTENDANCE_LABELS: Record<Attendance, string> = {
  ATTENDED: "Showed Up",
  NO_SHOW: "No-Show",
  EXCUSED: "Excused",
  UNMARKED: "Not Marked",
};

const STATUS_LABELS: Record<Exclude<AssignmentStatus, "ACCEPTED">, string> = {
  PENDING: "Pending",
  REJECTED: "Declined",
  EXPIRED: "Expired",
  WITHDRAWN: "Withdrawn",
  CANCELLED_BY_VOLUNTEER: "Cancelled",
};

/** Every label `historyStatusLabel` can return, for filters. */
export const HISTORY_STATUS_LABELS = [
  ...Object.values(ATTENDANCE_LABELS),
  ...Object.values(STATUS_LABELS),
];

/**
 * Accepted shifts are described by their attendance ("Showed Up"), and every
 * other offer by how it ended ("Declined").
 */
export function historyStatusLabel(
  status: AssignmentStatus,
  attendance: Attendance,
) {
  return status === "ACCEPTED"
    ? ATTENDANCE_LABELS[attendance]
    : STATUS_LABELS[status];
}

/** What an all-day shift counts as, per day, until real hours are recorded. */
const ALL_DAY_SHIFT_HOURS = 8;

const HOUR_MS = 60 * 60 * 1000;

/** A shift's length in hours, counted only when the volunteer attended. */
export function attendedHours(
  { startTime, endTime, allDay }: ShiftTimes,
  attendance: Attendance,
) {
  if (attendance !== "ATTENDED") return null;
  const hours = (endTime.getTime() - startTime.getTime()) / HOUR_MS;
  if (!allDay) return hours;
  // All-day shifts run midnight to midnight; rounding absorbs DST's 23/25 h days.
  const days = Math.round(hours / 24) || 1;
  return days * ALL_DAY_SHIFT_HOURS;
}

const hoursFormat = new Intl.NumberFormat("en-CA", {
  maximumFractionDigits: 2,
});

/** Formats hours as e.g. "3" or "2.5". */
export function formatHours(hours: number) {
  return hoursFormat.format(hours);
}

// Shifts are rendered on the server and in the browser, so the centre's time
// zone and the locale are always set explicitly.
const { timeZone } = RANKING_CONFIG;

const shortDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone,
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const shortTimeFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone,
  hour: "numeric",
  minute: "2-digit",
});

/** Formats a shift as e.g. "Tue, Feb 3, 2026 · 3:00 p.m. – 6:00 p.m.". */
export function formatShiftWhen({ startTime, endTime, allDay }: ShiftTimes) {
  const date = shortDateFormat.format(startTime);
  if (allDay) return `${date} · All day`;
  return `${date} · ${shortTimeFormat.format(startTime)} – ${shortTimeFormat.format(endTime)}`;
}

const longDateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone,
  month: "long",
  day: "numeric",
  year: "numeric",
});
const longTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone,
  hour: "numeric",
  minute: "2-digit",
});

/** Formats a shift's start as e.g. "February 3, 2026 3:00 PM". */
export function formatShiftStart({ startTime, allDay }: ShiftTimes) {
  const date = longDateFormat.format(startTime);
  if (allDay) return `${date} · All day`;
  return `${date} ${longTimeFormat.format(startTime)}`;
}
