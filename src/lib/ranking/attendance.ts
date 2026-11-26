import type { RankingConfig } from "./config";
import { daysElapsed } from "./time";
import type { RankingAssignment } from "./types";

function attendedBefore(assignments: RankingAssignment[], now: Date) {
  return assignments.filter(
    ({ status, attendance, shift }) =>
      status === "ACCEPTED" &&
      attendance === "ATTENDED" &&
      shift.startTime <= now,
  );
}

/** Pass only this volunteer's assignments. */
export function summarizeAttendance(
  assignments: RankingAssignment[],
  now: Date,
  config: RankingConfig,
) {
  const attended = attendedBefore(assignments, now);
  const shiftsAttended = attended.filter(
    ({ shift }) =>
      daysElapsed(shift.startTime, now, config.timeZone) <=
      config.attendanceWindowDays,
  ).length;
  const lastAttendedAt = attended.reduce<Date | null>(
    (latest, { shift }) =>
      !latest || shift.startTime > latest ? shift.startTime : latest,
    null,
  );
  return { shiftsAttended, lastAttendedAt };
}
