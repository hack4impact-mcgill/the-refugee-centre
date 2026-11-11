import type { RankingConfig } from "./config";
import { isSameWeek, shiftTimeRanges } from "./time";
import type {
  AvailabilityWindow,
  RankingOffer,
  RankingShift,
  RankingVolunteer,
} from "./types";

export type FilterFailure =
  | "not-approved-for-position"
  | "unavailable"
  | "missing-required-language"
  | "already-offered-this-shift"
  | "has-pending-offer"
  | "weekly-cap-reached";

/** Back-to-back windows count as one, so 9-11 and 11-13 cover a 10-12 shift. */
function isCovered(range: AvailabilityWindow, windows: AvailabilityWindow[]) {
  let reach = range.startMinute;
  for (const window of windows
    .filter(({ day }) => day === range.day)
    .sort((a, b) => a.startMinute - b.startMinute)) {
    if (window.startMinute > reach) break;
    reach = Math.max(reach, window.endMinute);
  }
  return reach >= range.endMinute;
}

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

  const isAvailable = shiftTimeRanges(shift, config.timeZone).every((range) =>
    isCovered(range, volunteer.availability),
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
