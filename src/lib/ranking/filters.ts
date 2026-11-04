import type { RankingConfig } from "./config";
import { isSameWeek, isWithinDates, shiftSlots } from "./time";
import type { RankingOffer, RankingShift, RankingVolunteer } from "./types";

export type FilterFailure =
  | "not-approved-for-position"
  | "unavailable"
  | "missing-required-language"
  | "not-enrolled"
  | "paused"
  | "already-offered-this-shift"
  | "has-pending-offer"
  | "weekly-cap-reached";

export function enrollmentForShift(
  volunteer: RankingVolunteer,
  shift: RankingShift,
  config: RankingConfig,
) {
  return volunteer.enrollments.find(({ semester }) =>
    isWithinDates(
      shift.startTime,
      semester.startDate,
      semester.endDate,
      config.timeZone,
    ),
  );
}

/**
 * Pass only this volunteer's offers. `semesterActive` is whether any semester
 * covers the shift; without one, enrollment isn't checked.
 */
export function hardFilterFailures(
  volunteer: RankingVolunteer,
  offers: RankingOffer[],
  shift: RankingShift,
  semesterActive: boolean,
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
    shift.requiredLanguages.length > 0 &&
    !shift.requiredLanguages.some((language) =>
      volunteer.languages.includes(language),
    )
  ) {
    failures.push("missing-required-language");
  }

  if (semesterActive) {
    const enrollment = enrollmentForShift(volunteer, shift, config);
    if (!enrollment) {
      failures.push("not-enrolled");
    } else if (
      enrollment.pausedUntil &&
      shift.startTime < enrollment.pausedUntil
    ) {
      failures.push("paused");
    }
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
