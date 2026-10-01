import type { Language, ShiftLocation } from "@/generated/prisma/enums";

/** The fields the popup collects, carried on the saved shift's extendedProps. */
export type ShiftDetails = {
  location: ShiftLocation;
  address: string;
  requiredLanguages: Language[];
  preferredLanguages: Language[];
};

export const EMPTY_SHIFT_DETAILS: ShiftDetails = {
  location: "TRC",
  address: "",
  requiredLanguages: [],
  preferredLanguages: [],
};

export type ShiftDraft = ShiftDetails & {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  /** True while the shift only exists in the draft, i.e. drawn but not saved. */
  isNew: boolean;
  /** Undoes FullCalendar's drag/resize when the draft is discarded. */
  revert: (() => void) | null;
};

/**
 * Tags every shift's element on the calendar so the popup can measure the one
 * it belongs to. FullCalendar's own class names are hashed, and the element it
 * hands to the drag callbacks is a mirror it has already detached.
 */
export function shiftEventClass(id: string) {
  return `shift-${id}`;
}

/** Splits a draft into the calendar's own fields and the popup's extra ones. */
export function detailsOf(draft: ShiftDraft): ShiftDetails {
  return {
    location: draft.location,
    address: draft.address,
    requiredLanguages: draft.requiredLanguages,
    preferredLanguages: draft.preferredLanguages,
  };
}

/** Reads the popup's fields back off a saved shift, tolerating older events. */
export function detailsFromEvent(props: Record<string, unknown> | undefined) {
  return { ...EMPTY_SHIFT_DETAILS, ...(props as Partial<ShiftDetails>) };
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
