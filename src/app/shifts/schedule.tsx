"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  useCalendarController,
  type DateSelectInfo,
  type DatesSetInfo,
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

import {
  EMPTY_SHIFT_DETAILS,
  detailsFromEvent,
  detailsOf,
  eventOf,
  inputOf,
  shiftEventClass,
  type ShiftDraft,
  type ShiftRecord,
} from "@/lib/shifts";
import ShiftPopup from "./shift-popup";

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

export default function Schedule() {
  const calendar = useCalendarController();
  const [shifts, setShifts] = useState<EventInput[]>([]);
  const [draft, setDraft] = useState<ShiftDraft | null>(null);
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Aborts the previous range's request when the user pages past it
  const loadController = useRef<AbortController | null>(null);

  async function loadShifts(info: DatesSetInfo) {
    loadController.current?.abort();
    const controller = new AbortController();
    loadController.current = controller;

    const params = new URLSearchParams({
      start: info.start.toISOString(),
      end: info.end.toISOString(),
    });
    try {
      const response = await fetch(`/api/shifts?${params}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(await response.text());
      const records: ShiftRecord[] = await response.json();
      setShifts(records.map(eventOf));
      setError(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error(err);
      setError("Couldn't load shifts.");
    }
  }

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
    });
  }

  // Dragging or resizing a shift reports its new times. Hold them in the draft
  // and keep FullCalendar's `revert` around so discarding puts the shift back.
  function handleShiftChange(info: EventDropInfo | EventResizeDoneInfo) {
    const { event } = info;
    const start = event.start ?? new Date();

    setDraft((current) => {
      // The draft already belongs to this shift, e.g. the popup is open on it.
      const sameShift = current?.id === event.id;
      // A shift that hasn't been saved yet is still new after being moved: it
      // is only on the calendar because the draft puts it there, so there is
      // nothing to revert to and it still has to be appended on save.
      const isNew = sameShift && current.isNew;

      return {
        // Keep whatever the popup already collected for this shift; fall back
        // to the fields stored on the saved event.
        ...(sameShift
          ? detailsOf(current)
          : detailsFromEvent(event.extendedProps)),
        id: event.id,
        title: event.title,
        start,
        end: event.end ?? start,
        allDay: event.allDay,
        isNew,
        // Dragging the same shift twice before saving: the first revert undoes
        // the whole thing, later ones only undo the last move.
        // Opening the popup by clicking leaves `revert` null, so fall through
        // to this move's revert in that case.
        revert: isNew ? null : (sameShift && current.revert) || info.revert,
      };
    });
  }

  const discardDraft = useCallback(() => {
    draft?.revert?.();
    setDraft(null);
  }, [draft]);

  async function saveDraft() {
    if (!draft || pending) return;
    setPending("save");
    try {
      const response = await fetch(
        draft.isNew ? "/api/shifts" : `/api/shifts/${draft.id}`,
        {
          method: draft.isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputOf(draft)),
        },
      );
      if (!response.ok) throw new Error(await response.text());
      const saved = eventOf(await response.json());

      // A new shift gets its id from the database, so it replaces the draft
      // rather than matching it.
      setShifts((current) =>
        draft.isNew
          ? [...current, saved]
          : current.map((shift) => (shift.id === draft.id ? saved : shift)),
      );
      setDraft(null);
      setError(null);
    } catch (err) {
      // Keep the popup open so nothing typed is lost; Cancel still reverts.
      console.error(err);
      setError("Couldn't save the shift. Try again.");
    } finally {
      setPending(null);
    }
  }

  async function deleteDraft() {
    if (!draft || draft.isNew || pending) return;
    setPending("delete");
    try {
      const response = await fetch(`/api/shifts/${draft.id}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 404) {
        throw new Error(await response.text());
      }
      setShifts((current) => current.filter((shift) => shift.id !== draft.id));
      setDraft(null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Couldn't delete the shift. Try again.");
    } finally {
      setPending(null);
    }
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
          {error && (
            <p role="alert" className="text-body2 text-red-700">
              {error}
            </p>
          )}
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
            datesSet={loadShifts}
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
          pending={pending}
          onSave={saveDraft}
          onDelete={deleteDraft}
          onDiscard={discardDraft}
        />
      )}
    </>
  );
}
