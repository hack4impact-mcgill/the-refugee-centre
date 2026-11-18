import type { EventInput } from "@fullcalendar/react";
import type { Language, ShiftLocation } from "@/generated/prisma/enums";
import { defaultEndDate, type RepeatRule } from "@/lib/recurrence";
import type { ShiftInput, ShiftRecord } from "@/lib/schemas/shift";

/** The rule of the series a shift belongs to, as saved */
export type SavedRecurrence = RepeatRule & { id: string; timeZone: string };

/** Saved in extendedProps */
export type ShiftDetails = {
  location: ShiftLocation;
  address: string;
  requiredLanguages: Language[];
  preferredLanguages: Language[];
  volunteersNeeded: number;
  recurrence: SavedRecurrence | null;
};

export const EMPTY_SHIFT_DETAILS: ShiftDetails = {
  location: "TRC",
  address: "",
  requiredLanguages: [],
  preferredLanguages: [],
  volunteersNeeded: 1,
  recurrence: null,
};

export type ShiftDraft = ShiftDetails & {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  isNew: boolean;
  revert: (() => void) | null;
  /** How the shift should repeat, as edited in the popup (null: it doesn't) */
  repeat: RepeatRule | null;
};

export function inputOf(draft: ShiftDraft): ShiftInput {
  return {
    location: draft.location,
    address: draft.address,
    requiredLanguages: draft.requiredLanguages,
    preferredLanguages: draft.preferredLanguages,
    volunteersNeeded: draft.volunteersNeeded,
    title: draft.title.trim() || "Untitled shift",
    startTime: draft.start.toISOString(),
    endTime: draft.end.toISOString(),
    allDay: draft.allDay,
  };
}

export type ShiftEvent = EventInput & {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  extendedProps: ShiftDetails;
};

export function eventOf(shift: ShiftRecord): ShiftEvent {
  const { recurrence } = shift;
  const details: ShiftDetails = {
    location: shift.location,
    address: shift.address ?? "",
    requiredLanguages: shift.requiredLanguages,
    preferredLanguages: shift.preferredLanguages,
    volunteersNeeded: shift.volunteersNeeded,
    recurrence: recurrence && {
      id: recurrence.id,
      frequency: recurrence.frequency,
      interval: recurrence.interval,
      byWeekday: recurrence.byWeekday,
      // A `date` column comes back as midnight UTC.
      endDate: recurrence.endDate.slice(0, 10),
      timeZone: recurrence.timeZone,
    },
  };
  return {
    id: shift.id,
    title: shift.title,
    start: shift.startTime,
    end: shift.endTime,
    allDay: shift.allDay,
    className: shiftEventClass(shift.id),
    extendedProps: details,
  };
}

export function inputOfEvent(event: ShiftEvent): ShiftInput {
  const details = event.extendedProps;
  return {
    location: details.location,
    address: details.address,
    requiredLanguages: details.requiredLanguages,
    preferredLanguages: details.preferredLanguages,
    volunteersNeeded: details.volunteersNeeded,
    title: event.title,
    startTime: event.start,
    endTime: event.end,
    allDay: event.allDay,
  };
}

/** The editable copy of a saved series' rule */
export function repeatOf(
  recurrence: SavedRecurrence | null,
): RepeatRule | null {
  if (!recurrence) return null;
  const { frequency, interval, byWeekday, endDate } = recurrence;
  return { frequency, interval, byWeekday, endDate };
}

export function sameRule(a: RepeatRule | null, b: RepeatRule | null) {
  if (!a || !b) return a === b;
  return (
    a.frequency === b.frequency &&
    a.interval === b.interval &&
    a.endDate === b.endDate &&
    [...a.byWeekday].sort().join() === [...b.byWeekday].sort().join()
  );
}

/** Whether the popup changed how the shift repeats */
export function repeatChanged(draft: ShiftDraft) {
  return !sameRule(draft.repeat, repeatOf(draft.recurrence));
}

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const WORK_WEEK = [1, 2, 3, 4, 5];

/** ISO weekday (1 = Monday … 7 = Sunday) of a local date */
function isoWeekday(date: Date) {
  return date.getDay() || 7;
}

/** E.g. "Weekly on Tuesday", for a series whose first shift is on `start` */
export function describeRepeat(rule: RepeatRule, start: Date) {
  const every = (unit: string) =>
    rule.interval === 1 ? null : `Every ${rule.interval} ${unit}s`;
  switch (rule.frequency) {
    case "Daily":
      return every("day") ?? "Daily";
    case "Weekly": {
      const days = rule.byWeekday.length
        ? [...rule.byWeekday].sort()
        : [isoWeekday(start)];
      if (rule.interval === 1 && days.join() === WORK_WEEK.join()) {
        return "Every weekday (Mon–Fri)";
      }
      const names = days.map((day) => WEEKDAYS[day - 1]).join(", ");
      return `${every("week") ?? "Weekly"} on ${names}`;
    }
    case "Monthly":
      return `${every("month") ?? "Monthly"} on day ${start.getDate()}`;
  }
}

/**
 * The repeat dropdown's choices for a shift starting on `start`: "Does not
 * repeat" (null), then the presets. A saved rule none of them matches (e.g.
 * weekly on another day, after the shift was moved) is listed too.
 */
export function repeatChoices(draft: ShiftDraft): (RepeatRule | null)[] {
  const endDate = draft.repeat?.endDate ?? defaultEndDate(draft.start);
  const rule = (frequency: RepeatRule["frequency"], byWeekday: number[] = []) =>
    ({ frequency, interval: 1, byWeekday, endDate }) satisfies RepeatRule;
  const presets = [
    rule("Daily"),
    rule("Weekly", [isoWeekday(draft.start)]),
    rule("Weekly", WORK_WEEK),
    rule("Monthly"),
  ];
  const current = draft.repeat;
  const isPreset = presets.some((preset) => sameRule(preset, current));
  return [null, ...(current && !isPreset ? [current] : []), ...presets];
}

/** Used in shift pop up to find event on the page for anchoring */
export function shiftEventClass(id: string) {
  return `shift-${id}`;
}

/** Get draft popup extra fields (not from FullCalendar) */
export function detailsOf(draft: ShiftDraft): ShiftDetails {
  return {
    location: draft.location,
    address: draft.address,
    requiredLanguages: draft.requiredLanguages,
    preferredLanguages: draft.preferredLanguages,
    volunteersNeeded: draft.volunteersNeeded,
    recurrence: draft.recurrence,
  };
}

export function detailsFromEvent(props: Record<string, unknown>) {
  return props as ShiftDetails;
}

const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const shortDayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** All-day ranges end at midnight of the day *after* the last day they cover. */
function lastAllDayDate(end: Date) {
  const inclusive = new Date(end);
  inclusive.setDate(inclusive.getDate() - 1);
  return inclusive;
}

function formatDuration(start: Date, end: Date) {
  const totalMinutes = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60000),
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours} hr ${minutes} min`;
  if (hours) return `${hours} hr`;
  return `${minutes} min`;
}

export function summarizeShift(event: ShiftEvent) {
  return `${event.title} · ${shortDayFormat.format(new Date(event.start))}`;
}

export function formatDateLine(draft: ShiftDraft) {
  if (!draft.allDay) return dayFormat.format(draft.start);

  const last = lastAllDayDate(draft.end);
  if (isSameDay(draft.start, last)) return dayFormat.format(draft.start);
  return `${shortDayFormat.format(draft.start)} – ${shortDayFormat.format(last)}`;
}

export function formatTimeLine(draft: ShiftDraft) {
  if (draft.allDay) {
    const days =
      Math.round(
        (draft.end.getTime() - draft.start.getTime()) / (24 * 60 * 60 * 1000),
      ) || 1;
    return `All day · ${days} ${days === 1 ? "day" : "days"}`;
  }

  const range = `${timeFormat.format(draft.start)} – ${timeFormat.format(draft.end)}`;
  return `${range} · ${formatDuration(draft.start, draft.end)}`;
}
