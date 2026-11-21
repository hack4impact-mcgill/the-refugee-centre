import type { RankingConfig } from "./config";
import { daysElapsed } from "./time";
import type { RankingOffer } from "./types";

function attendedBefore(offers: RankingOffer[], now: Date) {
  return offers.filter(
    (offer) =>
      offer.status === "ACCEPTED" &&
      offer.attendance === "ATTENDED" &&
      offer.shift.startTime <= now,
  );
}

/** Pass only this volunteer's offers. */
export function summarizeAttendance(
  offers: RankingOffer[],
  now: Date,
  config: RankingConfig,
) {
  const attended = attendedBefore(offers, now);
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
