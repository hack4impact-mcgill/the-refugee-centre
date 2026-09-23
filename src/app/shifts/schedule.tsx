"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  useCalendarController,
  type DateSelectInfo,
  type EventClickInfo,
  type EventDropInfo,
  type EventInput,
  type EventResizeDoneInfo,
} from "@fullcalendar/react";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { FaPaperPlane } from "react-icons/fa";

import ShiftPopup, {
  EMPTY_SHIFT_DETAILS,
  shiftEventClass,
  type AnchorRect,
  type ShiftDetails,
  type ShiftDraft,
} from "./shift-popup";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "./calendar-palette.css";

const VIEWS = [
  { type: "timeGridWeek", label: "Week" },
  { type: "dayGridMonth", label: "Month" },
];

const actionButtonClassName =
  "flex h-9.5 cursor-pointer items-center gap-3 rounded-lg bg-navy-400 px-3 py-2 text-body1 leading-5.5 text-navy-900 transition-colors hover:bg-navy-500";

const navButtonClassName =
  "flex h-9.5 cursor-pointer items-center rounded-lg px-3 py-2 text-navy-900 transition-colors hover:bg-sandstone-300";

// Highlights today's date label: the day header in week view and the day
// number in month view. FullCalendar adds it alongside the theme's own classes.
function todayLabelClass({ isToday }: { isToday: boolean }) {
  return isToday
    ? "rounded-full bg-navy-700 px-2 font-bold text-sandstone-200"
    : "";
}

// Client components are still prerendered on the server. FullCalendar renders
// from "today", which differs between build time and the visitor's browser, so
// skip it on the server to avoid a hydration mismatch.
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

// View docs for FullCalendar callback functions: https://fullcalendar.io/docs/event-dragging-resizing

function anchorFromPointer(event: MouseEvent | null): AnchorRect {
  if (!event) {
    return {
      top: window.innerHeight / 2,
      left: window.innerWidth / 2,
      width: 0,
      height: 0,
    };
  }
  return { top: event.clientY, left: event.clientX, width: 0, height: 0 };
}

/** Splits a draft into the calendar's own fields and the popup's extra ones. */
function detailsOf(draft: ShiftDraft): ShiftDetails {
  return {
    location: draft.location,
    address: draft.address,
    requiredLanguages: draft.requiredLanguages,
    preferredLanguages: draft.preferredLanguages,
  };
}

/** Reads the popup's fields back off a saved shift, tolerating older events. */
function detailsFromEvent(props: Record<string, unknown> | undefined) {
  return { ...EMPTY_SHIFT_DETAILS, ...(props as Partial<ShiftDetails>) };
}

export default function Schedule() {
  const calendar = useCalendarController();
  const [shifts, setShifts] = useState<EventInput[]>([]);
  // The pending shift: drawn or moved on the calendar, but not committed to
  // `shifts` until the popup is saved.
  const [draft, setDraft] = useState<ShiftDraft | null>(null);

  // A brand new shift has no event on the calendar yet, so render it from the
  // draft. While an existing shift is being edited this returns `shifts`
  // untouched, which keeps FullCalendar's own drag preview in place.
  const events = useMemo<EventInput[]>(() => {
    if (!draft?.isNew) return shifts;
    return [
      ...shifts,
      {
        id: draft.id,
        title: draft.title,
        start: draft.start,
        end: draft.end,
        allDay: draft.allDay,
        className: shiftEventClass(draft.id),
        extendedProps: detailsOf(draft),
      },
    ];
  }, [shifts, draft]);

  // Click-and-drag on empty space drafts a shift for that time range.
  function handleSelect(info: DateSelectInfo) {
    setDraft({
      ...EMPTY_SHIFT_DETAILS,
      id: crypto.randomUUID(),
      title: "New shift",
      start: info.start,
      end: info.end,
      allDay: info.allDay,
      isNew: true,
      revert: null,
      anchor: anchorFromPointer(info.jsEvent),
    });
    info.view.calendar.unselect();
  }

  // Clicking a saved shift reopens the popup on it. Nothing has moved, so
  // there is nothing to revert when the draft is discarded.
  function handleShiftClick(info: EventClickInfo) {
    const { event } = info;
    const start = event.start ?? new Date();

    setDraft({
      ...detailsFromEvent(event.extendedProps),
      id: event.id,
      title: event.title,
      start,
      end: event.end ?? start,
      allDay: event.allDay,
      isNew: false,
      revert: null,
      anchor: anchorFromPointer(info.jsEvent),
    });
  }

  // Dragging or resizing a shift reports its new times. Hold them in the draft
  // and keep FullCalendar's `revert` around so discarding puts the shift back.
  function handleShiftChange(info: EventDropInfo | EventResizeDoneInfo) {
    const { event } = info;
    const start = event.start ?? new Date();

    setDraft((current) => ({
      // Keep whatever the popup already collected for this shift; fall back to
      // the fields stored on the saved event.
      ...(current && current.id === event.id
        ? detailsOf(current)
        : detailsFromEvent(event.extendedProps)),
      id: event.id,
      title: event.title,
      start,
      end: event.end ?? start,
      allDay: event.allDay,
      isNew: false,
      // Dragging the same shift twice before saving: the first revert undoes
      // the whole thing, later ones only undo the last move.
      revert:
        current && !current.isNew && current.id === event.id
          ? current.revert
          : info.revert,
      anchor: anchorFromPointer(info.jsEvent),
    }));
  }

  const discardDraft = useCallback(() => {
    draft?.revert?.();
    setDraft(null);
  }, [draft]);

  function saveDraft() {
    if (!draft) return;
    const saved: EventInput = {
      id: draft.id,
      title: draft.title.trim() || "Untitled shift",
      start: draft.start,
      end: draft.end,
      allDay: draft.allDay,
      className: shiftEventClass(draft.id),
      extendedProps: detailsOf(draft),
    };

    setShifts((current) =>
      draft.isNew
        ? [...current, saved]
        : current.map((shift) =>
            shift.id === draft.id ? { ...shift, ...saved } : shift,
          ),
    );
    setDraft(null);
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-sandstone-300 px-8 py-4">
        <div className="flex items-center gap-2.5">
          <h2 className="min-h-5 min-w-60 text-h6" aria-live="polite">
            {calendar.view?.title}
          </h2>
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => calendar.prev()}
              className={navButtonClassName}
            >
              <BsChevronLeft aria-hidden className="size-5.5" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => calendar.next()}
              className={navButtonClassName}
            >
              <BsChevronRight aria-hidden className="size-5.5" />
            </button>
          </div>
          <div
            role="group"
            aria-label="Calendar view"
            className="flex rounded-lg border border-sandstone-300 p-0.5"
          >
            {VIEWS.map(({ type, label }) => {
              const isActive = calendar.view?.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => calendar.changeView(type)}
                  className={`cursor-pointer rounded-md px-3 py-1 text-body1 transition-colors ${
                    isActive
                      ? "bg-navy-700 text-sandstone-200"
                      : "text-navy-900 hover:bg-sandstone-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <button type="button" className={actionButtonClassName}>
            <FaPaperPlane aria-hidden className="size-5.5" />
            Assign shifts
          </button>
          <button type="button" className={actionButtonClassName}>
            <FaPaperPlane aria-hidden className="size-5.5" />
            Send emails
          </button>
        </div>
      </div>

      {/* The absolute wrapper gives the calendar a fixed size (the space
          left below the header), so it fills the screen and scrolls inside
          itself instead of growing the page. */}
      <div className="relative min-w-0 flex-1">
        <div className="absolute inset-0">
          <FullCalendar
            controller={calendar}
            plugins={[
              classicThemePlugin,
              timeGridPlugin,
              dayGridPlugin,
              interactionPlugin,
            ]}
            initialView="timeGridWeek"
            headerToolbar={false}
            weekends={false}
            height="100%"
            dayHeaderInnerClass={todayLabelClass}
            dayCellTopInnerClass={todayLabelClass}
            views={{
              timeGridWeek: {
                titleFormat: {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                },
                allDaySlot: false,
                slotMinTime: "08:00",
                slotMaxTime: "18:00",
                nowIndicator: true,
                // Stretch the time slots to fill the height.
                expandRows: true,
              },
            }}
            events={events}
            editable
            selectable
            selectMirror
            select={handleSelect}
            eventClick={handleShiftClick}
            eventDrop={handleShiftChange}
            eventResize={handleShiftChange}
          />
        </div>
      </div>

      {draft && (
        <ShiftPopup
          key={draft.id}
          draft={draft}
          onChange={(patch) =>
            setDraft((current) =>
              current ? { ...current, ...patch } : current,
            )
          }
          onSave={saveDraft}
          onDiscard={discardDraft}
        />
      )}
    </>
  );
}
