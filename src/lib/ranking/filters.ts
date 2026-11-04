import type { RankingConfig } from "./config";
import { isSameWeek, shiftSlots } from "./time";
import type { RankingOffer, RankingShift, RankingVolunteer } from "./types";

export type FilterFailure =
  | "not-approved-for-position"
  | "unavailable"
  | "missing-required-language"
  | "already-offered-this-shift"
  | "has-pending-offer"
  | "weekly-cap-reached";

/** Pass only this volunteer's offers. */
export function hardFilterFailures(
  volunteer: RankingVolunteer,
  offers: RankingOffer[],
  shift: RankingShift,
  config: RankingConfig,
): FilterFailure[] {
  const failures: FilterFailure[] = [];

  // A shift with no position fails here, so it has no candidates.
  if (!shift.positionId || !volunteer.positionIds.includes(shift.positionId)) {
    failures.push("not-approved-for-position");
  }

  const isAvailable = shiftSlots(shift, config).every((slot) =>
    volunteer.availability.some(
      ({ day, period }) => day === slot.day && period === slot.period,
    ),
  );
  if (!isAvailable) failures.push("unavailable");

  if (
    !shift.requiredLanguages.every((language) =>
      volunteer.languages.includes(language),
    )
  ) {
    failures.push("missing-required-language");
  }

  if (offers.some((offer) => offer.shiftId === shift.id)) {
    failures.push("already-offered-this-shift");
  }

  if (
    offers.some(
      (offer) => offer.shiftId !== shift.id && offer.status === "PENDING",
    )
  ) {
    failures.push("has-pending-offer");
  }

  if (acceptedInShiftWeek(offers, shift, config) >= config.weeklyCap) {
    failures.push("weekly-cap-reached");
  }

  return failures;
}

/** No-shows count, since they stay accepted. */
export function acceptedInShiftWeek(
  offers: RankingOffer[],
  shift: RankingShift,
  config: RankingConfig,
) {
  return offers.filter(
    (offer) =>
      offer.status === "ACCEPTED" &&
      isSameWeek(offer.shift.startTime, shift.startTime, config.timeZone),
  ).length;
}
