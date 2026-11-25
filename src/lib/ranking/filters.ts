import type { RankingConfig } from "./config";
import { isSameWeek, shiftTimeRanges } from "./time";
import type {
  AvailabilityWindow,
  RankingAssignment,
  RankingShift,
  RankingVolunteer,
} from "./types";

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

export function noShowCount(assignments: RankingAssignment[]) {
  return assignments.filter(
    ({ status, attendance }) =>
      status === "ACCEPTED" && attendance === "NO_SHOW",
  ).length;
}

/** Whether the volunteer passes every hard filter. Pass only their assignments. */
export function isEligible(
  volunteer: RankingVolunteer,
  assignments: RankingAssignment[],
  shift: RankingShift,
  config: RankingConfig,
) {
  const accepted = assignments.filter(({ status }) => status === "ACCEPTED");

  // A shift with no position has no candidates.
  const isApproved =
    shift.positionId !== null &&
    volunteer.positionIds.includes(shift.positionId);
  const isAvailable = shiftTimeRanges(shift, config.timeZone).every((range) =>
    isCovered(range, volunteer.availability),
  );
  const speaksAll = shift.requiredLanguages.every((language) =>
    volunteer.languages.includes(language),
  );
  const isOnThisShift = assignments.some(({ shiftId }) => shiftId === shift.id);
  const hasOverlap = accepted.some(
    (assignment) =>
      assignment.shiftId !== shift.id &&
      assignment.shift.startTime < shift.endTime &&
      shift.startTime < assignment.shift.endTime,
  );
  const hasPendingOffer = assignments.some(
    ({ shiftId, status }) => shiftId !== shift.id && status === "PENDING",
  );
  const shiftsThatWeek = accepted.filter((assignment) =>
    isSameWeek(assignment.shift.startTime, shift.startTime, config.timeZone),
  ).length;

  return (
    isApproved &&
    isAvailable &&
    speaksAll &&
    noShowCount(assignments) < config.maxNoShows &&
    !isOnThisShift &&
    !hasOverlap &&
    !hasPendingOffer &&
    shiftsThatWeek < config.weeklyCap
  );
}
