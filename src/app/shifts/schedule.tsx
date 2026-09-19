"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  useCalendarController,
  type DateSelectInfo,
  type EventChangeInfo,
  type EventInput,
} from "@fullcalendar/react";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import {
  BsChevronLeft,
  BsChevronRight,
  BsPlusLg,
  BsSearch,
} from "react-icons/bs";
import { FaPaperPlane } from "react-icons/fa";

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

  // Click-and-drag on empty space creates a shift for that time range.
  function handleSelect(info: DateSelectInfo) {
    setShifts((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: "New shift",
        start: info.start,
        end: info.end,
        allDay: info.allDay,
      },
    ]);
    info.view.calendar.unselect();
  }

  // Dragging or resizing a shift reports its new times; store them so the
  // calendar re-renders from our state.
  function handleShiftChange({ event }: EventChangeInfo) {
    setShifts((current) =>
      current.map((shift) =>
        shift.id === event.id
          ? {
              ...shift,
              start: event.start ?? undefined,
              end: event.end ?? undefined,
              allDay: event.allDay,
            }
          : shift,
      ),
    );
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

      <div className="flex flex-1">
        <div className="flex w-62 shrink-0 flex-col gap-2.5 border-r border-sandstone-300 p-2.5">
          <label className="flex h-9.5 items-center gap-3 rounded-lg border border-sandstone-300 bg-white px-3 py-2">
            <BsSearch
              aria-hidden
              className="size-5 shrink-0 text-sandstone-500"
            />
            <span className="sr-only">Search shifts</span>
            <input
              type="search"
              placeholder="Search"
              className="min-w-0 flex-1 text-body1 outline-none placeholder:text-sandstone-500"
            />
          </label>
          <button
            type="button"
            className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-sandstone-500 bg-sandstone-200 p-3 text-body1 leading-5.5 transition-colors hover:bg-sandstone-300"
          >
            <BsPlusLg aria-hidden className="size-5.5" />
            New shift
          </button>
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
              events={shifts}
              editable
              selectable
              selectMirror
              select={handleSelect}
              eventDrop={handleShiftChange}
              eventResize={handleShiftChange}
            />
          </div>
        </div>
      </div>
    </>
  );
}
