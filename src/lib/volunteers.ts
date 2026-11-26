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

/** Formats a window as e.g. "Monday (9 AM-12 PM)". */
export function formatAvailabilityWindow({
  day,
  startMinute,
  endMinute,
}: AvailabilityWindow) {
  const dayName = day.charAt(0) + day.slice(1).toLowerCase();
  return `${dayName} (${formatMinute(startMinute)}-${formatMinute(endMinute)})`;
}
