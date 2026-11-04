import type { RankingConfig } from "./config";
import { hardFilterFailures } from "./filters";
import { calculatePenalty, tierForPenalty } from "./penalty";
import { buildReason } from "./reason";
import { calculateScore } from "./score";
import type {
  RankingOffer,
  RankingShift,
  RankingVolunteer,
  RankedCandidate,
} from "./types";

/** For tiebreakers */
function hash(text: string) {
  let value = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/** Oldest first, with "never" ahead of everything. */
function compareLastShift(a: Date | null, b: Date | null) {
  if (!a || !b) return Number(Boolean(a)) - Number(Boolean(b));
  return a.getTime() - b.getTime();
}

/**
 * `offers` should hold every offer for these volunteers, not just recent ones,
 * since an older shift can still be their last.
 */
export function rankVolunteers(
  volunteers: RankingVolunteer[],
  offers: RankingOffer[],
  shift: RankingShift,
  now: Date,
  config: RankingConfig,
): RankedCandidate[] {
  const offersOf = (volunteer: RankingVolunteer) =>
    offers.filter((offer) => offer.volunteerId === volunteer.id);
  const tiebreak = (volunteerId: string) =>
    hash(`${config.tiebreakSeed}:${shift.id}:${volunteerId}`);

  const candidates = volunteers.filter(
    (volunteer) =>
      hardFilterFailures(volunteer, offersOf(volunteer), shift, config)
        .length === 0,
  );

  return candidates
    .map((volunteer) => {
      const own = offersOf(volunteer);
      const penalty = calculatePenalty(own, now, config);
      const tier = tierForPenalty(penalty, config);
      const { score, components, lastShiftAt } = calculateScore(
        own,
        shift,
        now,
        config,
      );
      return {
        volunteerId: volunteer.id,
        tier,
        penalty,
        flaggedForReview: tier === "C",
        score,
        components,
        lastShiftAt,
        reason: buildReason(tier, components, lastShiftAt, now, config),
      };
    })
    .sort(
      (a, b) =>
        a.tier.localeCompare(b.tier) ||
        b.score - a.score ||
        compareLastShift(a.lastShiftAt, b.lastShiftAt) ||
        tiebreak(a.volunteerId) - tiebreak(b.volunteerId) ||
        a.volunteerId.localeCompare(b.volunteerId),
    )
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}
