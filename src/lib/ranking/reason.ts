import type { Language, RankingTier } from "@/generated/prisma/enums";
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

function describeDeficit(deficit: number) {
  if (deficit > 0) return `${plural(deficit, "shift")} behind`;
  if (deficit < 0) return `${plural(-deficit, "shift")} ahead`;
  return "on target";
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
  scarceSpoken: Language[],
  now: Date,
  config: RankingConfig,
) {
  const parts = [
    TIER_LABELS[tier],
    describeDeficit(components.deficit),
    describeLastShift(lastShiftAt, now, config),
  ];
  if (scarceSpoken.length > 0) {
    parts.push(`speaks ${scarceSpoken.join(", ")} (scarce)`);
  }
  if (components.weekLoad > 0) {
    parts.push(`${plural(components.weekLoad, "shift")} accepted this week`);
  }
  if (tier === "C") parts.push("flagged for staff review");
  return parts.join(" · ");
}
