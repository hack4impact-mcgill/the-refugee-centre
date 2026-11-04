import { Temporal } from "temporal-polyfill";
import type { DayOfWeek, DayPeriod } from "@/generated/prisma/enums";
import type { RankingConfig } from "./config";
import type { AvailabilitySlot, RankingShift } from "./types";

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

export function wholeWeeksBetween(from: Date, to: Date, timeZone: string) {
  return Math.max(0, Math.floor(calendarDaysBetween(from, to, timeZone) / 7));
}

export function isSameWeek(a: Date, b: Date, timeZone: string) {
  const monday = (date: Temporal.PlainDate) =>
    date.subtract({ days: date.dayOfWeek - 1 });
  return monday(toPlainDate(a, timeZone)).equals(
    monday(toPlainDate(b, timeZone)),
  );
}

/** Compares local dates, including both ends. */
export function isWithinDates(
  date: Date,
  start: Date,
  end: Date,
  timeZone: string,
) {
  const day = toPlainDate(date, timeZone);
  return (
    Temporal.PlainDate.compare(toPlainDate(start, timeZone), day) <= 0 &&
    Temporal.PlainDate.compare(day, toPlainDate(end, timeZone)) <= 0
  );
}

/** Every day and period the shift overlaps, so an all-day shift covers all three. */
export function shiftSlots(
  shift: RankingShift,
  config: RankingConfig,
): AvailabilitySlot[] {
  const { timeZone, afternoonStartHour, eveningStartHour } = config;
  const start = toZoned(shift.startTime, timeZone).toPlainDateTime();
  const zonedEnd = toZoned(shift.endTime, timeZone).toPlainDateTime();
  // A zero-length shift still falls in the period it starts in.
  const end =
    Temporal.PlainDateTime.compare(zonedEnd, start) > 0
      ? zonedEnd
      : start.add({ minutes: 1 });

  const slots: AvailabilitySlot[] = [];
  for (
    let date = start.toPlainDate();
    Temporal.PlainDate.compare(date, end.toPlainDate()) <= 0;
    date = date.add({ days: 1 })
  ) {
    const afternoon = date.toPlainDateTime({ hour: afternoonStartHour });
    const evening = date.toPlainDateTime({ hour: eveningStartHour });
    const periods: [
      DayPeriod,
      Temporal.PlainDateTime,
      Temporal.PlainDateTime,
    ][] = [
      ["MORNING", date.toPlainDateTime(), afternoon],
      ["AFTERNOON", afternoon, evening],
      ["EVENING", evening, date.add({ days: 1 }).toPlainDateTime()],
    ];

    for (const [period, periodStart, periodEnd] of periods) {
      if (
        Temporal.PlainDateTime.compare(periodStart, end) < 0 &&
        Temporal.PlainDateTime.compare(start, periodEnd) < 0
      ) {
        slots.push({ day: DAYS_OF_WEEK[date.dayOfWeek - 1], period });
      }
    }
  }
  return slots;
}
