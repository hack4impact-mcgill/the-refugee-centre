import { Temporal } from "temporal-polyfill";
import type { DayOfWeek } from "@/generated/prisma/enums";
import type { AvailabilityWindow, RankingShift } from "./types";

const MINUTES_PER_DAY = 24 * 60;

/** In Temporal's order, where Monday is day 1. */
const DAYS_OF_WEEK: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function toZoned(date: Date, timeZone: string) {
  return Temporal.Instant.fromEpochMilliseconds(
    date.getTime(),
  ).toZonedDateTimeISO(timeZone);
}

function toPlainDate(date: Date, timeZone: string) {
  return toZoned(date, timeZone).toPlainDate();
}

/** Fractional days from `from` to `to`, counting a daylight-saving day as one day. Never negative. */
export function daysElapsed(from: Date, to: Date, timeZone: string) {
  const start = toZoned(from, timeZone);
  const days = toZoned(to, timeZone)
    .since(start)
    .total({ unit: "day", relativeTo: start });
  return Math.max(0, days);
}

/** Local dates crossed from `from` to `to`. Negative if `to` is earlier. */
export function calendarDaysBetween(from: Date, to: Date, timeZone: string) {
  return toPlainDate(from, timeZone).until(toPlainDate(to, timeZone)).days;
}

export function isSameWeek(a: Date, b: Date, timeZone: string) {
  const monday = (date: Temporal.PlainDate) =>
    date.subtract({ days: date.dayOfWeek - 1 });
  return monday(toPlainDate(a, timeZone)).equals(
    monday(toPlainDate(b, timeZone)),
  );
}

/** The part of each local day the shift covers, in minutes after midnight. */
export function shiftTimeRanges(
  shift: RankingShift,
  timeZone: string,
): AvailabilityWindow[] {
  const start = toZoned(shift.startTime, timeZone).toPlainDateTime();
  const zonedEnd = toZoned(shift.endTime, timeZone).toPlainDateTime();
  // A zero-length shift still needs its start minute to be available.
  const end =
    Temporal.PlainDateTime.compare(zonedEnd, start) > 0
      ? zonedEnd
      : start.add({ minutes: 1 });
  const minuteOf = (time: Temporal.PlainDateTime) =>
    time.hour * 60 + time.minute;

  const ranges: AvailabilityWindow[] = [];
  for (
    let date = start.toPlainDate();
    Temporal.PlainDate.compare(date, end.toPlainDate()) <= 0;
    date = date.add({ days: 1 })
  ) {
    const startMinute = date.equals(start.toPlainDate()) ? minuteOf(start) : 0;
    const endMinute = date.equals(end.toPlainDate())
      ? minuteOf(end)
      : MINUTES_PER_DAY;
    if (endMinute > startMinute) {
      ranges.push({
        day: DAYS_OF_WEEK[date.dayOfWeek - 1],
        startMinute,
        endMinute,
      });
    }
  }
  return ranges;
}
