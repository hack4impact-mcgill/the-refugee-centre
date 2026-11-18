import "server-only";

import {
  Prisma,
  type RecurringShift,
  type Shift,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  clockTimes,
  endDateProblem,
  plainDateOf,
  seriesDates,
  timesOnDate,
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

/** The date a shift falls on, the day before, in the series' time zone */
function dayBefore(shift: Shift, series: RecurringShift) {
  return toDbDate(
    plainDateOf(shift.startTime, series.timeZone).subtract({ days: 1 }),
  );
}

/**
 * Saves `rule` as a new series starting from `anchor` (already saved), and
 * creates a copy of `anchor` for each of the rule's later dates.
 */
async function startSeries(tx: Tx, anchor: Shift, rule: Recurrence) {
  const first = plainDateOf(anchor.startTime, rule.timeZone);
  const problem = endDateProblem(first, rule.endDate);
  if (problem) throw new SeriesError(problem);

  const series = await tx.recurringShift.create({
    data: {
      frequency: rule.frequency,
      interval: rule.interval,
      byWeekday: rule.frequency === "Weekly" ? rule.byWeekday : [],
      startDate: toDbDate(first),
      endDate: toDbDate(rule.endDate),
      timeZone: rule.timeZone,
    },
  });
  await tx.shift.update({
    where: { id: anchor.id },
    data: { recurrenceId: series.id },
  });

  const fields = fieldsOf(anchor);
  await tx.shift.createMany({
    data: seriesDates(first, rule)
      .slice(1)
      .map((date) => ({
        ...fields,
        ...timesOnDate(fields, date, rule.timeZone),
        recurrenceId: series.id,
      })),
  });
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
 * Applies an edit of `current` to the other shifts in `scope` too. Only the
 * fields the edit changed are copied, so the others keep their own
 * differences (e.g. one date needing more volunteers). A new time of day
 * moves each shift to that time on its own date.
 */
async function updateSeries(
  tx: Tx,
  current: Shift,
  series: RecurringShift,
  fields: ShiftFields,
  scope: "following" | "all",
) {
  const others = {
    recurrenceId: series.id,
    id: { not: current.id },
    ...(scope === "following" && { startTime: { gte: current.startTime } }),
  } satisfies Prisma.ShiftWhereInput;

  const { startTime, endTime, ...shared } = fields;
  const before: Record<string, unknown> = fieldsOf(current);
  const changed = Object.fromEntries(
    Object.entries(shared).filter(
      ([key, value]) => JSON.stringify(value) !== JSON.stringify(before[key]),
    ),
  ) as Partial<typeof shared>;
  if (Object.keys(changed).length) {
    await tx.shift.updateMany({ where: others, data: changed });
  }

  const timeZone = series.timeZone;
  const next = clockTimes({ startTime, endTime }, timeZone);
  const previous = clockTimes(current, timeZone);
  if (
    next.start !== previous.start ||
    next.end !== previous.end ||
    next.days !== previous.days
  ) {
    // One statement for the whole series. The right-hand sides all read the
    // row's old start_time, so each shift keeps its own date.
    await tx.$executeRaw`
      UPDATE shifts SET
        start_time = ((start_time AT TIME ZONE ${timeZone})::date
          + ${next.start}::time) AT TIME ZONE ${timeZone},
        end_time = ((start_time AT TIME ZONE ${timeZone})::date
          + ${next.days}::int + ${next.end}::time) AT TIME ZONE ${timeZone}
      WHERE recurrence_id = ${series.id}::uuid
        AND id <> ${current.id}::uuid
        ${scope === "following" ? Prisma.sql`AND start_time >= ${current.startTime}` : Prisma.empty}`;
  }

  await tx.shift.update({ where: { id: current.id }, data: fields });
}

/**
 * Changes how `current` repeats: starts a series from a one-off shift, or
 * replaces the rule from this shift on ("following") or from the first shift
 * ("all"). The replaced shifts are recreated from the edit, with new ids.
 * A null rule leaves the anchor as a one-off shift. Returns the anchor's id.
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

  const first = await tx.shift.findFirstOrThrow({
    where: { recurrenceId: series.id },
    orderBy: { startTime: "asc" },
  });
  const anchor = scope === "all" ? first : current;
  // The first shift keeps its date and takes the edit's time of day.
  const data =
    anchor.id === current.id
      ? fields
      : {
          ...fields,
          ...timesOnDate(
            fields,
            plainDateOf(anchor.startTime, series.timeZone),
            series.timeZone,
          ),
        };

  await tx.shift.deleteMany({
    where: {
      recurrenceId: series.id,
      startTime: { gte: anchor.startTime },
      id: { not: anchor.id },
    },
  });
  const updated = await tx.shift.update({
    where: { id: anchor.id },
    data: { ...data, recurrenceId: null },
  });

  if (anchor.id === first.id) {
    // No shifts are left in the old series.
    await tx.recurringShift.delete({ where: { id: series.id } });
  } else {
    await tx.recurringShift.update({
      where: { id: series.id },
      data: { endDate: dayBefore(anchor, series) },
    });
  }

  if (rule) await startSeries(tx, updated, rule);
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
        data: { endDate: dayBefore(current, series) },
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
