import type { AvailabilityWindow } from "@/lib/ranking/types";

function formatMinute(minute: number) {
  const hours = Math.floor(minute / 60) % 24;
  const minutes = minute % 60;
  const suffix = hours < 12 ? "AM" : "PM";
  const hour = hours % 12 || 12;
  return minutes === 0
    ? `${hour} ${suffix}`
    : `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** Formats a day as e.g. "Monday". */
export function formatDayName(day: AvailabilityWindow["day"]) {
  return day.charAt(0) + day.slice(1).toLowerCase();
}

/** Formats a window's times as e.g. "9 AM–12 PM". */
export function formatTimeRange({
  startMinute,
  endMinute,
}: Pick<AvailabilityWindow, "startMinute" | "endMinute">) {
  return `${formatMinute(startMinute)}–${formatMinute(endMinute)}`;
}

/** Formats a window as e.g. "Monday (9 AM-12 PM)". */
export function formatAvailabilityWindow({
  day,
  startMinute,
  endMinute,
}: AvailabilityWindow) {
  return `${formatDayName(day)} (${formatMinute(startMinute)}-${formatMinute(endMinute)})`;
}
