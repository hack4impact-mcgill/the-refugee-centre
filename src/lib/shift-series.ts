import "server-only";

import {
  Prisma,
  type RecurringShift,
  type Shift,
} from "@/generated/prisma/client";
import { Temporal } from "temporal-polyfill";
import { prisma } from "@/lib/prisma";
import {
  clockTimes,
  endDateProblem,
  fromDbDate,
  plainDateOf,
  seriesDates,
  timesOnDate,
  TIME_ZONE,
  toDbDate,
} from "@/lib/recurrence";
import type { Recurrence, SeriesScope, ShiftFields } from "@/lib/schemas/shift";

/**
 * Creating, editing and deleting shifts, including repeating ones. A series is
 * one `recurring_shifts` row holding the rule, plus a full `shifts` row for
 * every date, each pointing back to it through `recurrence_id`.
 */

type Tx = Prisma.TransactionClient;

/** A request that can't be applied, e.g. an end date too far out (a 400) */
export class SeriesError extends Error {}

/** What the API returns for each shift */
export const shiftInclude = {
  recurrence: true,
} satisfies Prisma.ShiftInclude;

/** The columns each shift in a series has its own copy of */
function fieldsOf(shift: Shift): ShiftFields {
  return {
    title: shift.title,
    startTime: shift.startTime,
    endTime: shift.endTime,
    allDay: shift.allDay,
    location: shift.location,
    address: shift.address,
    requiredLanguages: shift.requiredLanguages,
    preferredLanguages: shift.preferredLanguages,
    volunteersNeeded: shift.volunteersNeeded,
  };
}

/** The date a shift falls on, the day before */
function dayBefore(shift: Shift) {
  return toDbDate(plainDateOf(shift.startTime).subtract({ days: 1 }));
}

/** The series columns for `rule`, with its first shift on `first` */
function ruleData(rule: Recurrence, first: Temporal.PlainDate) {
  return {
    frequency: rule.frequency,
    interval: rule.interval,
    byWeekday: rule.frequency === "Weekly" ? rule.byWeekday : [],
    startDate: toDbDate(first),
    endDate: toDbDate(rule.endDate),
  };
}

/** Copies of `template` on each of `dates`, at the same time of day */
async function copyShift(
  tx: Tx,
  template: Shift,
  dates: Temporal.PlainDate[],
  recurrenceId: string,
) {
  if (!dates.length) return;
  const fields = fieldsOf(template);
  await tx.shift.createMany({
    data: dates.map((date) => ({
      ...fields,
      ...timesOnDate(fields, date),
      recurrenceId,
    })),
  });
}

/**
 * Saves `rule` as a new series starting from `anchor` (already saved), and
 * creates a copy of `anchor` for each of the rule's later dates.
 */
async function startSeries(tx: Tx, anchor: Shift, rule: Recurrence) {
  const first = plainDateOf(anchor.startTime);
  const problem = endDateProblem(first, rule.endDate);
  if (problem) throw new SeriesError(problem);

  const series = await tx.recurringShift.create({
    data: ruleData(rule, first),
  });
  await tx.shift.update({
    where: { id: anchor.id },
    data: { recurrenceId: series.id },
  });
  await copyShift(tx, anchor, seriesDates(first, rule).slice(1), series.id);
}

/** Creates a shift, and the rest of its series when `rule` is given */
export function createShift(fields: ShiftFields, rule?: Recurrence) {
  return prisma.$transaction(async (tx) => {
    const shift = await tx.shift.create({ data: fields });
    if (rule) await startSeries(tx, shift, rule);
    return tx.shift.findUniqueOrThrow({
      where: { id: shift.id },
      include: shiftInclude,
    });
  });
}

/**
 * Copies an edit of `current` onto the shifts with `ids`. Only the fields the
 * edit changed are copied, so the others keep their own differences (e.g. one
 * date needing more volunteers). A new time of day moves each shift to that
 * time on its own date. The shifts are updated in place, so they keep their
 * ids and anything linked to them.
 */
async function applyEdit(
  tx: Tx,
  current: Shift,
  fields: ShiftFields,
  ids: string[],
) {
  if (!ids.length) return;

  const { startTime, endTime, ...shared } = fields;
  const before: Record<string, unknown> = fieldsOf(current);
  const changed = Object.fromEntries(
    Object.entries(shared).filter(
      ([key, value]) => JSON.stringify(value) !== JSON.stringify(before[key]),
    ),
  ) as Partial<typeof shared>;
  if (Object.keys(changed).length) {
    await tx.shift.updateMany({ where: { id: { in: ids } }, data: changed });
  }

  const next = clockTimes({ startTime, endTime });
  const previous = clockTimes(current);
  if (
    next.start !== previous.start ||
    next.end !== previous.end ||
    next.days !== previous.days
  ) {
    // One statement for all of them. The right-hand sides all read the row's
    // old start_time, so each shift keeps its own date.
    await tx.$executeRaw`
      UPDATE shifts SET
        start_time = ((start_time AT TIME ZONE ${TIME_ZONE})::date
          + ${next.start}::time) AT TIME ZONE ${TIME_ZONE},
        end_time = ((start_time AT TIME ZONE ${TIME_ZONE})::date
          + ${next.days}::int + ${next.end}::time) AT TIME ZONE ${TIME_ZONE}
      WHERE id = ANY(${ids}::uuid[])`;
  }
}

/** Applies an edit of `current` to the other shifts in `scope` too */
async function updateSeries(
  tx: Tx,
  current: Shift,
  series: RecurringShift,
  fields: ShiftFields,
  scope: "following" | "all",
) {
  const others = await tx.shift.findMany({
    where: {
      recurrenceId: series.id,
      id: { not: current.id },
      ...(scope === "following" && { startTime: { gte: current.startTime } }),
    },
    select: { id: true },
  });
  await applyEdit(
    tx,
    current,
    fields,
    others.map((shift) => shift.id),
  );
  await tx.shift.update({ where: { id: current.id }, data: fields });
}

/** Whether `rule` repeats the same way as `series`, ignoring the end date */
function sameRepeat(series: RecurringShift, rule: Recurrence) {
  const weekdays = (days: number[]) => [...new Set(days)].sort().join();
  return (
    series.frequency === rule.frequency &&
    series.interval === rule.interval &&
    (rule.frequency !== "Weekly" ||
      weekdays(series.byWeekday) === weekdays(rule.byWeekday))
  );
}

/**
 * Moves a series' end date without touching the shifts before it: an earlier
 * date deletes the shifts after it, a later one adds shifts for the rule's
 * dates after the old end date, copied from the series' last shift.
 */
async function changeEndDate(
  tx: Tx,
  series: RecurringShift,
  current: Shift,
  fields: ShiftFields,
  endDate: string,
) {
  const start = fromDbDate(series.startDate);
  const problem =
    endDateProblem(start, endDate) ??
    endDateProblem(plainDateOf(fields.startTime), endDate);
  if (problem) throw new SeriesError(problem);

  const oldEnd = fromDbDate(series.endDate);
  const newEnd = fromDbDate(endDate);
  const dayAfter = (date: Temporal.PlainDate) =>
    new Date(
      date.add({ days: 1 }).toZonedDateTime(TIME_ZONE).epochMilliseconds,
    );

  if (Temporal.PlainDate.compare(newEnd, oldEnd) < 0) {
    await tx.shift.deleteMany({
      where: {
        recurrenceId: series.id,
        id: { not: current.id },
        startTime: { gte: dayAfter(newEnd) },
      },
    });
  } else if (Temporal.PlainDate.compare(newEnd, oldEnd) > 0) {
    const last = await tx.shift.findFirstOrThrow({
      where: { recurrenceId: series.id },
      orderBy: { startTime: "desc" },
    });
    const dates = seriesDates(start, {
      frequency: series.frequency,
      interval: series.interval,
      byWeekday: series.byWeekday,
      endDate,
    }).filter((date) => Temporal.PlainDate.compare(date, oldEnd) > 0);
    await copyShift(tx, last, dates, series.id);
  }

  await tx.recurringShift.update({
    where: { id: series.id },
    data: { endDate: toDbDate(newEnd) },
  });
}

/**
 * Changes how `current` repeats: starts a series from a one-off shift, or
 * changes the rule from this shift on ("following") or from the first shift
 * ("all"). A new end date only adds or removes shifts at the end (see
 * `changeEndDate`). Otherwise, "following" from a later shift splits it into
 * a new series.
 *
 * Shifts already on one of the new rule's dates are kept and edited in place
 * (see `applyEdit`), so they keep their ids. Shifts on dates the rule no
 * longer includes are deleted, and dates without a shift get a copy of the
 * shift the rule starts from. A null rule leaves the anchor as a one-off shift.
 * Returns the anchor's id.
 */
async function changeRule(
  tx: Tx,
  current: Shift & { recurrence: RecurringShift | null },
  fields: ShiftFields,
  scope: SeriesScope,
  rule: Recurrence | null,
) {
  const series = current.recurrence;
  if (!series) {
    const shift = await tx.shift.update({
      where: { id: current.id },
      data: fields,
    });
    if (rule) await startSeries(tx, shift, rule);
    return shift.id;
  }

  if (scope === "this") {
    throw new SeriesError(
      "Changing how shifts repeat applies to this and following shifts, or all of them.",
    );
  }

  // Only the end date changed: the existing shifts stay as they are (apart
  // from the edit), and shifts are only added or removed at the end.
  if (rule && sameRepeat(series, rule)) {
    await updateSeries(tx, current, series, fields, scope);
    await changeEndDate(tx, series, current, fields, rule.endDate);
    return current.id;
  }

  const first = await tx.shift.findFirstOrThrow({
    where: { recurrenceId: series.id },
    orderBy: { startTime: "asc" },
  });
  // The shift the new rule starts from. When it isn't the edited shift (the
  // first one, for "all"), it keeps its own date like the other shifts.
  const anchor = scope === "all" ? first : current;
  const anchorDate = plainDateOf(
    anchor.id === current.id ? fields.startTime : anchor.startTime,
  );
  if (rule) {
    const problem = endDateProblem(anchorDate, rule.endDate);
    if (problem) throw new SeriesError(problem);
  }

  // The shifts in scope, matched to the new rule's later dates by the date
  // they're on (the earliest one, if several share a date).
  const dates = rule ? seriesDates(anchorDate, rule).slice(1) : [];
  const others = await tx.shift.findMany({
    where: {
      recurrenceId: series.id,
      startTime: { gte: anchor.startTime },
      id: { not: anchor.id },
    },
    orderBy: { startTime: "asc" },
  });
  const onDate = new Map<string, Shift>();
  for (const shift of others) {
    const date = plainDateOf(shift.startTime).toString();
    if (!onDate.has(date)) onDate.set(date, shift);
  }
  const kept = dates.flatMap((date) => onDate.get(date.toString()) ?? []);
  const keptIds = new Set(kept.map((shift) => shift.id));
  const missing = dates.filter((date) => !onDate.has(date.toString()));

  await tx.shift.deleteMany({
    where: {
      id: { in: others.flatMap((s) => (keptIds.has(s.id) ? [] : [s.id])) },
    },
  });
  await applyEdit(tx, current, fields, [
    ...keptIds,
    ...(anchor.id === current.id ? [] : [anchor.id]),
  ]);

  // Starting from the first shift, the series itself changes. From a later
  // one, the old series ends the day before and a new one takes over.
  let recurrenceId: string | null = null;
  if (rule && anchor.id === first.id) {
    await tx.recurringShift.update({
      where: { id: series.id },
      data: ruleData(rule, anchorDate),
    });
    recurrenceId = series.id;
  } else if (rule) {
    const next = await tx.recurringShift.create({
      data: ruleData(rule, anchorDate),
    });
    recurrenceId = next.id;
    await tx.shift.updateMany({
      where: { id: { in: [...keptIds] } },
      data: { recurrenceId },
    });
  }

  const updated = await tx.shift.update({
    where: { id: anchor.id },
    data: {
      ...(anchor.id === current.id && fields),
      recurrenceId,
    },
  });

  if (recurrenceId !== series.id) {
    if (anchor.id === first.id) {
      // No shifts are left in the old series.
      await tx.recurringShift.delete({ where: { id: series.id } });
    } else {
      await tx.recurringShift.update({
        where: { id: series.id },
        data: { endDate: dayBefore(anchor) },
      });
    }
  }

  if (recurrenceId) await copyShift(tx, updated, missing, recurrenceId);
  return updated.id;
}

/**
 * Edits a shift, and the other shifts in `scope` when it's part of a series.
 * `rule` is undefined when the repeat rule didn't change. Returns null when
 * the shift doesn't exist.
 */
export function updateShift(
  id: string,
  fields: ShiftFields,
  scope: SeriesScope,
  rule: Recurrence | null | undefined,
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.shift.findUnique({
      where: { id },
      include: shiftInclude,
    });
    if (!current) return null;

    let resultId = id;
    if (rule !== undefined) {
      resultId = await changeRule(tx, current, fields, scope, rule);
    } else if (current.recurrence && scope !== "this") {
      await updateSeries(tx, current, current.recurrence, fields, scope);
    } else {
      await tx.shift.update({ where: { id }, data: fields });
    }

    return tx.shift.findUniqueOrThrow({
      where: { id: resultId },
      include: shiftInclude,
    });
  });
}

/**
 * Deletes a shift, and the other shifts in `scope` when it's part of a
 * series. Returns false when the shift doesn't exist.
 */
export function deleteShift(id: string, scope: SeriesScope) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.shift.findUnique({
      where: { id },
      include: shiftInclude,
    });
    if (!current) return false;

    const series = current.recurrence;
    if (!series || scope === "this") {
      await tx.shift.deleteMany({ where: { id } });
    } else if (scope === "all") {
      // Deletes every shift in it too (ON DELETE CASCADE).
      await tx.recurringShift.delete({ where: { id: series.id } });
      return true;
    } else {
      await tx.shift.deleteMany({
        where: {
          recurrenceId: series.id,
          startTime: { gte: current.startTime },
        },
      });
      await tx.recurringShift.update({
        where: { id: series.id },
        data: { endDate: dayBefore(current) },
      });
    }

    // A series with no shifts left goes too.
    if (
      series &&
      (await tx.shift.count({ where: { recurrenceId: series.id } })) === 0
    ) {
      await tx.recurringShift.delete({ where: { id: series.id } });
    }
    return true;
  });
}
