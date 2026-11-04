import type { RankingConfig } from "./config";
import { acceptedInShiftWeek } from "./filters";
import { calendarDaysBetween } from "./time";
import type { RankingOffer, RankingShift, ScoreComponents } from "./types";

/** Includes upcoming shifts. */
function committedOffers(offers: RankingOffer[]) {
  return offers.filter(
    (offer) =>
      offer.status === "ACCEPTED" &&
      (offer.attendance === "ATTENDED" || offer.attendance === "UNMARKED"),
  );
}

export function lastShiftDate(offers: RankingOffer[]) {
  return committedOffers(offers).reduce<Date | null>(
    (latest, { shift }) =>
      !latest || shift.startTime > latest ? shift.startTime : latest,
    null,
  );
}

function calculateOverdue(
  lastShiftAt: Date | null,
  now: Date,
  config: RankingConfig,
) {
  if (!lastShiftAt) return config.newVolunteerOverdue ? config.overdueBonus : 0;
  const daysSince = calendarDaysBetween(lastShiftAt, now, config.timeZone);
  return daysSince >= config.overdueAfterDays ? config.overdueBonus : 0;
}

/** Pass only this volunteer's offers. */
export function calculateScore(
  offers: RankingOffer[],
  shift: RankingShift,
  now: Date,
  config: RankingConfig,
) {
  const lastShiftAt = lastShiftDate(offers);
  const components: ScoreComponents = {
    overdue: calculateOverdue(lastShiftAt, now, config),
    weekLoad: acceptedInShiftWeek(offers, shift, config),
  };
  const score =
    components.overdue - config.weekLoadWeight * components.weekLoad;

  return { score, components, lastShiftAt };
}
