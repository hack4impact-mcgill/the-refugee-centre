"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { BsCheckLg, BsClock, BsCalendarEvent, BsX } from "react-icons/bs";

// A plain rectangle instead of a live DOMRect: the anchor is kept in state, and
// FullCalendar recycles the elements it hands us once the drag settles.
export type AnchorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type ShiftDraft = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  /** True while the shift only exists in the draft, i.e. drawn but not saved. */
  isNew: boolean;
  /** Undoes FullCalendar's drag/resize when the draft is discarded. */
  revert: (() => void) | null;
  anchor: AnchorRect;
};

const POPUP_GAP = 8;

/**
 * Tags every shift's element on the calendar so the popup can measure the one
 * it belongs to. FullCalendar's own class names are hashed, and the element it
 * hands to the drag callbacks is a mirror it has already detached.
 */
export function shiftEventClass(id: string) {
  return `shift-${id}`;
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

type ShiftPopupProps = {
  draft: ShiftDraft;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onDiscard: () => void;
};

export default function ShiftPopup({
  draft,
  onTitleChange,
  onSave,
  onDiscard,
}: ShiftPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  // Hidden for the first paint: the popup has to be measured before it can be
  // placed next to the shift without running off screen.
  const [position, setPosition] = useState<CSSProperties>({
    top: 0,
    left: 0,
    visibility: "hidden",
  });

  const { id, anchor: pointerAnchor } = draft;

  useLayoutEffect(() => {
    const popup = popupRef.current;
    if (!popup) return;

    // Measure the shift on the calendar so the popup sits beside it rather
    // than on top of it. It is drawn by now in both cases: a new shift renders
    // from the draft, an edited one has already moved.
    const anchor =
      document
        .querySelector(`.${shiftEventClass(id)}`)
        ?.getBoundingClientRect() ?? pointerAnchor;

    const { width, height } = popup.getBoundingClientRect();

    // Prefer the right of the shift, flip to the left when it doesn't fit.
    let left = anchor.left + anchor.width + POPUP_GAP;
    if (left + width > window.innerWidth - POPUP_GAP) {
      left = anchor.left - width - POPUP_GAP;
    }
    left = Math.min(
      Math.max(POPUP_GAP, left),
      Math.max(POPUP_GAP, window.innerWidth - width - POPUP_GAP),
    );

    const top = Math.min(
      Math.max(POPUP_GAP, anchor.top + anchor.height / 2 - height / 2),
      Math.max(POPUP_GAP, window.innerHeight - height - POPUP_GAP),
    );

    setPosition({ top, left });
  }, [id, pointerAnchor]);

  // FullCalendar's drag cleanup blurs the page right after the drop, so wait a
  // frame before taking focus, otherwise the title field loses it again.
  useEffect(() => {
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [id]);

  // Escape or a click anywhere else discards the draft, like Google Calendar.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDiscard();
    }
    function handlePointerDown(event: PointerEvent) {
      if (!popupRef.current?.contains(event.target as Node)) onDiscard();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onDiscard]);

  return (
    <div
      ref={popupRef}
      role="dialog"
      aria-modal="false"
      aria-label={draft.isNew ? "New shift" : "Edit shift"}
      style={position}
      className="fixed z-50 w-80 rounded-lg border border-sandstone-300 bg-white shadow-lg"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div className="flex items-start justify-between gap-2 px-4 pt-3">
          <span className="pt-1 text-body2 text-sandstone-600">
            {draft.isNew ? "New shift" : "Edit shift"}
          </span>
          <button
            type="button"
            aria-label="Discard changes"
            onClick={onDiscard}
            className="-mr-1.5 flex cursor-pointer items-center rounded-md p-1 text-navy-900 transition-colors hover:bg-sandstone-300"
          >
            <BsX aria-hidden className="size-5.5" />
          </button>
        </div>

        <div className="px-4 pb-3">
          <label className="sr-only" htmlFor="shift-title">
            Shift title
          </label>
          <input
            id="shift-title"
            ref={titleRef}
            value={draft.title}
            onChange={(event) => onTitleChange(event.target.value)}
            onFocus={(event) => {
              if (draft.isNew) event.target.select();
            }}
            placeholder="Add a title"
            className="w-full border-b border-transparent pb-1 text-h6 outline-none placeholder:text-sandstone-500 focus:border-navy-700"
          />
        </div>

        <dl className="flex flex-col gap-2 px-4 pb-4 text-body2">
          <div className="flex items-center gap-3">
            <dt>
              <BsCalendarEvent
                aria-label="Date"
                className="size-4 shrink-0 text-sandstone-600"
              />
            </dt>
            <dd>{formatDateLine(draft)}</dd>
          </div>
          <div className="flex items-center gap-3">
            <dt>
              <BsClock
                aria-label="Time"
                className="size-4 shrink-0 text-sandstone-600"
              />
            </dt>
            <dd>{formatTimeLine(draft)}</dd>
          </div>
        </dl>

        <div className="flex justify-end gap-2 border-t border-sandstone-300 px-4 py-3">
          <button
            type="button"
            onClick={onDiscard}
            className="cursor-pointer rounded-lg px-3 py-2 text-body1 leading-5.5 text-navy-900 transition-colors hover:bg-sandstone-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-navy-400 px-3 py-2 text-body1 leading-5.5 text-navy-900 transition-colors hover:bg-navy-500"
          >
            <BsCheckLg aria-hidden className="size-4" />
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
