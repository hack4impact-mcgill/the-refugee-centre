import type { RankingTier } from "@/generated/prisma/enums";
import type { RankingConfig } from "./config";
import { calendarDaysBetween } from "./time";
import type { ScoreComponents } from "./types";

export const TIER_LABELS: Record<RankingTier, string> = {
  A: "Tier A",
  B: "Tier B",
  C: "Tier C",
};

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function describeLastShift(
  lastShiftAt: Date | null,
  now: Date,
  config: RankingConfig,
) {
  if (!lastShiftAt) return "no shifts yet";
  if (lastShiftAt > now) return "has a shift booked";
  const days = calendarDaysBetween(lastShiftAt, now, config.timeZone);
  return days === 0
    ? "last came today"
    : `last came ${plural(days, "day")} ago`;
}

export function buildReason(
  tier: RankingTier,
  components: ScoreComponents,
  lastShiftAt: Date | null,
  now: Date,
  config: RankingConfig,
) {
  const parts = [
    TIER_LABELS[tier],
    describeLastShift(lastShiftAt, now, config),
  ];
  if (components.weekLoad > 0) {
    parts.push(`${plural(components.weekLoad, "shift")} accepted this week`);
  }
  if (tier === "C") parts.push("flagged for staff review");
  return parts.join(" · ");
}
