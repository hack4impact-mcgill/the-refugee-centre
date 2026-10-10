"use client";

import { useMemo, useRef, useState } from "react";
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
} from "@/lib/shifts";
import type { ShiftRecord } from "@/lib/schemas/shift";
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

const todayButtonClassName =
  "flex h-9.5 cursor-pointer items-center rounded-lg border border-sandstone-300 px-3 py-2 text-body1 text-navy-900 transition-colors hover:bg-sandstone-300";

function todayLabelClass({ isToday }: { isToday: boolean }) {
  return isToday
    ? "rounded-full bg-navy-700 px-2 font-bold text-sandstone-200"
    : "";
}

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

// View docs for FullCalendar callback functions: https://fullcalendar.io/docs/event-dragging-resizing

export default function Schedule() {
  const calendar = useCalendarController();
  const todayButton = calendar.getButtonState().today;
  const [shifts, setShifts] = useState<EventInput[]>([]);
  const [draft, setDraft] = useState<ShiftDraft | null>(null);
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  // A brand new shift isn't in `shifts` yet, so it is appended here from the
  // draft to make it show up on the calendar.
  //
  // useMemo keeps the array's identity stable between renders. FullCalendar
  // only treats `events` as unchanged when it gets the same array, or one whose
  // items are all === to the previous ones. The appended draft event is a new
  // object every time this runs, so without useMemo any re-render (e.g.
  // `pending` flipping while saving) would look like an event change and make
  // FullCalendar process every shift again. With it, the array is only rebuilt
  // when `shifts` or `draft` actually change.
  //
  // When no new shift is being drafted, `shifts` is returned as is: it comes
  // straight from state, so its identity is already stable.
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

  function handleShiftChange(info: EventDropInfo | EventResizeDoneInfo) {
    const { event } = info;
    const start = event.start ?? new Date();

    setDraft((current) => {
      const sameShift = current?.id === event.id;
      const isNew = sameShift && current.isNew;

      return {
        ...(sameShift
          ? detailsOf(current)
          : detailsFromEvent(event.extendedProps)),
        id: event.id,
        title: event.title,
        start,
        end: event.end ?? start,
        allDay: event.allDay,
        isNew,
        revert: isNew ? null : (sameShift && current.revert) || info.revert,
      };
    });
  }

  function discardDraft() {
    draft?.revert?.();
    setDraft(null);
  }

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

      setShifts((current) =>
        draft.isNew
          ? [...current, saved]
          : current.map((shift) => (shift.id === draft.id ? saved : shift)),
      );
      setDraft(null);
      setError(null);
    } catch (err) {
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
          <button
            type="button"
            title={todayButton.hint || undefined}
            onClick={() => calendar.today()}
            className={todayButtonClassName}
          >
            Today
          </button>
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
          <h2 className="min-h-5 min-w-60 text-h6" aria-live="polite">
            {calendar.view?.title}
          </h2>
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
