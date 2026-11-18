import { Temporal } from "temporal-polyfill";
import type { RecurrenceFrequency } from "@/generated/prisma/enums";

/**
 * Date logic for repeating shifts, shared by the popup and the API. Dates are
 * worked out as wall-clock dates in the series' time zone, so a 9am shift
 * stays at 9am across daylight saving changes.
 */

/** A series can run at most this long after its first shift. */
export const MAX_SERIES_YEARS = 2;

/** How a series repeats (`endDate` is inclusive, YYYY-MM-DD) */
export type RepeatRule = {
  frequency: RecurrenceFrequency;
  interval: number;
  byWeekday: number[];
  endDate: string;
};

export function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function zonedOf(date: Date, timeZone: string) {
  return Temporal.Instant.fromEpochMilliseconds(
    date.getTime(),
  ).toZonedDateTimeISO(timeZone);
}

export function plainDateOf(date: Date, timeZone: string) {
  return zonedOf(date, timeZone).toPlainDate();
}

/** A `date` column value (Prisma reads and writes them as UTC midnight) */
export function toDbDate(date: Temporal.PlainDate | string) {
  return new Date(`${date.toString()}T00:00:00Z`);
}

export function fromDbDate(date: Date | string) {
  return Temporal.PlainDate.from(
    (typeof date === "string" ? date : date.toISOString()).slice(0, 10),
  );
}

/** The default end date: a year after the first shift */
export function defaultEndDate(start: Date, timeZone = browserTimeZone()) {
  return plainDateOf(start, timeZone).add({ years: 1 }).toString();
}

/** Why `endDate` can't end a series starting on `first`, or null if it can */
export function endDateProblem(first: Temporal.PlainDate, endDate: string) {
  const end = Temporal.PlainDate.from(endDate);
  if (Temporal.PlainDate.compare(end, first) < 0) {
    return "The repeat end date is before the shift.";
  }
  if (
    Temporal.PlainDate.compare(end, first.add({ years: MAX_SERIES_YEARS })) > 0
  ) {
    return `Repeating shifts can run at most ${MAX_SERIES_YEARS} years.`;
  }
  return null;
}

/**
 * Every date of a series starting on `first`, up to the rule's end date.
 * `first` is always included, even when it isn't one of the rule's weekdays.
 * Each date is counted from `first` rather than the previous one, so monthly
 * on the 31st falls back to the 28th in February but returns to the 31st.
 */
export function seriesDates(first: Temporal.PlainDate, rule: RepeatRule) {
  const end = Temporal.PlainDate.from(rule.endDate);
  const interval = Math.max(1, rule.interval);
  const isAfterFirst = (date: Temporal.PlainDate) =>
    Temporal.PlainDate.compare(date, first) > 0;
  const isPastEnd = (date: Temporal.PlainDate) =>
    Temporal.PlainDate.compare(date, end) > 0;

  const dates = [first];
  if (rule.frequency === "Weekly") {
    const weekdays = rule.byWeekday.length
      ? [...new Set(rule.byWeekday)].sort((a, b) => a - b)
      : [first.dayOfWeek];
    const monday = first.subtract({ days: first.dayOfWeek - 1 });
    for (let week = 0; ; week += interval) {
      const weekStart = monday.add({ weeks: week });
      if (isPastEnd(weekStart)) break;
      for (const weekday of weekdays) {
        const date = weekStart.add({ days: weekday - 1 });
        if (isAfterFirst(date) && !isPastEnd(date)) dates.push(date);
      }
    }
    return dates;
  }

  for (let step = interval; ; step += interval) {
    const date = first.add(
      rule.frequency === "Daily" ? { days: step } : { months: step },
    );
    if (isPastEnd(date)) break;
    dates.push(date);
  }
  return dates;
}

/**
 * `startTime`–`endTime` moved to `date`, keeping their wall-clock times (and
 * the number of days between them) in `timeZone`.
 */
export function timesOnDate(
  times: { startTime: Date; endTime: Date },
  date: Temporal.PlainDate,
  timeZone: string,
) {
  const start = zonedOf(times.startTime, timeZone);
  const end = zonedOf(times.endTime, timeZone);
  const days = start.toPlainDate().until(end.toPlainDate()).days;
  const at = (day: Temporal.PlainDate, time: Temporal.ZonedDateTime) =>
    new Date(
      day.toZonedDateTime({ timeZone, plainTime: time.toPlainTime() })
        .epochMilliseconds,
    );
  return {
    startTime: at(date, start),
    endTime: at(date.add({ days }), end),
  };
}

/** The wall-clock shape of a shift: start time, end time, days between */
export function clockTimes(
  times: { startTime: Date; endTime: Date },
  timeZone: string,
) {
  const start = zonedOf(times.startTime, timeZone);
  const end = zonedOf(times.endTime, timeZone);
  return {
    start: start.toPlainTime().toString(),
    end: end.toPlainTime().toString(),
    days: start.toPlainDate().until(end.toPlainDate()).days,
  };
}
