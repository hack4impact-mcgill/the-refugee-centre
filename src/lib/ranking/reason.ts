import type { RankingTier } from "@/generated/prisma/enums";
import type { RankingConfig } from "./config";
import { calendarDaysBetween } from "./time";

export const TIER_LABELS: Record<RankingTier, string> = {
  A: "Tier A",
  B: "Tier B",
  C: "Tier C",
};

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function describeLastAttended(
  lastAttendedAt: Date | null,
  now: Date,
  config: RankingConfig,
) {
  if (!lastAttendedAt) return "hasn't attended yet";
  const days = calendarDaysBetween(lastAttendedAt, now, config.timeZone);
  return days === 0
    ? "last came today"
    : `last came ${plural(days, "day")} ago`;
}

export function buildReason(
  tier: RankingTier,
  shiftsAttended: number,
  lastAttendedAt: Date | null,
  now: Date,
  config: RankingConfig,
) {
  const parts = [
    TIER_LABELS[tier],
    `${plural(shiftsAttended, "shift")} in the last ${config.attendanceWindowDays} days`,
    describeLastAttended(lastAttendedAt, now, config),
  ];
  if (tier === "C") parts.push("flagged for staff review");
  return parts.join(" · ");
}
