import { summarizeAttendance } from "./attendance";
import type { RankingConfig } from "./config";
import { isEligible } from "./filters";
import type {
  RankedCandidate,
  RankingAssignment,
  RankingShift,
  RankingVolunteer,
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

/** Most recent first, with "never" last. */
function compareLastAttended(a: Date | null, b: Date | null) {
  if (!a || !b) return Number(Boolean(b)) - Number(Boolean(a));
  return b.getTime() - a.getTime();
}

/**
 * Suggested replacements for a shift, best first. `assignments` should hold
 * every assignment for these volunteers, since no-shows count however old.
 */
export function rankVolunteers(
  volunteers: RankingVolunteer[],
  assignments: RankingAssignment[],
  shift: RankingShift,
  now: Date,
  config: RankingConfig,
): RankedCandidate[] {
  const assignmentsOf = (volunteer: RankingVolunteer) =>
    assignments.filter(({ volunteerId }) => volunteerId === volunteer.id);
  const tiebreak = (volunteerId: string) =>
    hash(`${config.tiebreakSeed}:${shift.id}:${volunteerId}`);

  return volunteers
    .filter((volunteer) =>
      isEligible(volunteer, assignmentsOf(volunteer), shift, config),
    )
    .map((volunteer) => {
      const { shiftsAttended, lastAttendedAt } = summarizeAttendance(
        assignmentsOf(volunteer),
        now,
        config,
      );
      return { volunteerId: volunteer.id, shiftsAttended, lastAttendedAt };
    })
    .sort(
      (a, b) =>
        b.shiftsAttended - a.shiftsAttended ||
        compareLastAttended(a.lastAttendedAt, b.lastAttendedAt) ||
        tiebreak(a.volunteerId) - tiebreak(b.volunteerId) ||
        a.volunteerId.localeCompare(b.volunteerId),
    )
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}
