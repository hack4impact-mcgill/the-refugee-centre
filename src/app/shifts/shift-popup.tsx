"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { BsClock, BsCalendarEvent, BsX } from "react-icons/bs";

// A plain rectangle instead of a live DOMRect: the anchor is kept in state, and
// FullCalendar recycles the elements it hands us once the drag settles.
export type AnchorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export const SHIFT_LOCATIONS = ["TRC", "Offsite", "Remote"] as const;

export const SHIFT_LANGUAGES = [
  "English",
  "French",
  "Arabic",
  "Spanish",
  "Ukrainian",
  "Russian",
  "Farsi",
  "Mandarin",
] as const;

export type ShiftLocation = (typeof SHIFT_LOCATIONS)[number];
export type ShiftLanguage = (typeof SHIFT_LANGUAGES)[number];

/** The fields the popup collects, carried on the saved shift's extendedProps. */
export type ShiftDetails = {
  location: ShiftLocation;
  address: string;
  requiredLanguages: ShiftLanguage[];
  preferredLanguages: ShiftLanguage[];
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

const fieldClassName =
  "flex w-full items-center justify-between gap-2 rounded-lg border border-sandstone-300 bg-white px-3 py-2";

const clearButtonClassName =
  "flex shrink-0 cursor-pointer items-center rounded-md text-sandstone-700 transition-colors hover:bg-sandstone-300";

/** An overline label above a control, as in the design. */
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      {htmlFor ? (
        <label
          className="text-overline uppercase text-navy-700"
          htmlFor={htmlFor}
        >
          {label}
        </label>
      ) : (
        <span className="text-overline uppercase text-navy-700">{label}</span>
      )}
      {children}
    </div>
  );
}

/** The languages already picked, each removable, plus a picker for the rest. */
function LanguagePicker({
  id,
  label,
  values,
  onChange,
}: {
  id: string;
  label: string;
  values: ShiftLanguage[];
  onChange: (languages: ShiftLanguage[]) => void;
}) {
  const remaining = SHIFT_LANGUAGES.filter(
    (language) => !values.includes(language),
  );

  return (
    <Field label={label} htmlFor={id}>
      <div className={fieldClassName}>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {values.map((language) => (
            <span
              key={language}
              className="flex items-center gap-1 rounded-full bg-sandstone-200 py-0.5 pl-2 pr-1 text-body2"
            >
              {language}
              <button
                type="button"
                aria-label={`Remove ${language}`}
                onClick={() =>
                  onChange(values.filter((current) => current !== language))
                }
                className="flex cursor-pointer items-center rounded-full text-sandstone-700 transition-colors hover:bg-sandstone-400"
              >
                <BsX aria-hidden className="size-4" />
              </button>
            </span>
          ))}
          {/* Resets to the placeholder after each pick, so it keeps reading
              "Enter languages" however many are already listed. */}
          <select
            id={id}
            value=""
            disabled={!remaining.length}
            onChange={(event) =>
              onChange([...values, event.target.value as ShiftLanguage])
            }
            className="min-w-32 flex-1 cursor-pointer bg-transparent text-body1 text-sandstone-500 outline-none"
          >
            <option value="" disabled>
              Enter languages
            </option>
            {remaining.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
        {values.length > 0 && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => onChange([])}
            className={clearButtonClassName}
          >
            <BsX aria-hidden className="size-5.5" />
          </button>
        )}
      </div>
    </Field>
  );
}

type ShiftPopupProps = {
  draft: ShiftDraft;
  onChange: (patch: Partial<ShiftDraft>) => void;
  onSave: () => void;
  onDiscard: () => void;
};

export default function ShiftPopup({
  draft,
  onChange,
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
      className="fixed z-50 flex max-h-[calc(100vh-2rem)] w-100 flex-col rounded-lg border border-sandstone-400 bg-white shadow-[-4px_4px_10px_0_rgba(0,0,0,0.05)]"
    >
      <form
        className="flex min-h-0 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        {/* The name doubles as the popup's heading: it reads as a title and
            edits in place, underlined by the rule from the design. */}
        <div className="flex flex-col gap-1 px-3 pb-3 pt-6">
          <label className="sr-only" htmlFor="shift-title">
            Shift name
          </label>
          <input
            id="shift-title"
            ref={titleRef}
            value={draft.title}
            onChange={(event) => onChange({ title: event.target.value })}
            onFocus={(event) => {
              if (draft.isNew) event.target.select();
            }}
            placeholder="Enter shift name"
            className="w-full text-h5 text-navy-900 outline-none placeholder:text-sandstone-500"
          />
          <div className="h-px w-full rounded-full bg-sandstone-800" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-3">
          <dl className="flex flex-col gap-2 text-body2">
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

          <Field label="Location">
            <div
              role="group"
              aria-label="Location"
              className="flex overflow-clip rounded border border-sandstone-400"
            >
              {SHIFT_LOCATIONS.map((location) => {
                const isActive = draft.location === location;
                return (
                  <button
                    key={location}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onChange({ location })}
                    className={`flex-1 cursor-pointer px-2.5 py-2 text-caption leading-none transition-colors not-last:border-r not-last:border-sandstone-400 ${
                      isActive
                        ? "bg-sandstone-800 text-white"
                        : "bg-white text-sandstone-900 hover:bg-sandstone-200"
                    }`}
                  >
                    {location}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className={fieldClassName}>
            <label className="sr-only" htmlFor="shift-address">
              Address
            </label>
            <input
              id="shift-address"
              value={draft.address}
              onChange={(event) => onChange({ address: event.target.value })}
              placeholder="Enter address"
              className="min-w-0 flex-1 text-body1 outline-none placeholder:text-sandstone-500"
            />
          </div>

          <LanguagePicker
            id="shift-required-languages"
            label="Required languages"
            values={draft.requiredLanguages}
            onChange={(requiredLanguages) => onChange({ requiredLanguages })}
          />

          <LanguagePicker
            id="shift-preferred-languages"
            label="Preferred languages"
            values={draft.preferredLanguages}
            onChange={(preferredLanguages) => onChange({ preferredLanguages })}
          />
        </div>

        <div className="flex items-center gap-2.5 p-3">
          <button
            type="submit"
            className="h-9.5 flex-1 cursor-pointer rounded-lg bg-navy-900 px-3 py-2 text-body1 leading-5.5 text-white transition-colors hover:bg-navy-800"
          >
            {draft.isNew ? "Create shift" : "Save shift"}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="h-9.5 cursor-pointer rounded-lg border border-navy-900 px-3 py-2 text-body1 leading-5.5 text-navy-900 transition-colors hover:bg-sandstone-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
