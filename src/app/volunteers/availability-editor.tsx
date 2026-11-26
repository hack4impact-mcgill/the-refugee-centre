"use client";

import { BsPlusCircle, BsX } from "react-icons/bs";
import { DayOfWeek } from "@/generated/prisma/enums";
import { formatDayName } from "@/lib/volunteers";

const MINUTES_PER_DAY = 24 * 60;

/** One editable window; times are "HH:MM" as the time inputs hold them. */
export type DraftWindow = { key: number; start: string; end: string };

export type DraftAvailability = Record<DayOfWeek, DraftWindow[]>;

export const DAYS = Object.values(DayOfWeek);

export const emptyAvailability = (): DraftAvailability => ({
  MONDAY: [],
  TUESDAY: [],
  WEDNESDAY: [],
  THURSDAY: [],
  FRIDAY: [],
  SATURDAY: [],
  SUNDAY: [],
});

export function minutesToTime(minute: number) {
  const hours = Math.floor(minute / 60) % 24;
  return `${String(hours).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

export function timeToMinutes(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** An end of 00:00 means midnight at the end of the day. */
export function toAvailabilityWindows(availability: DraftAvailability) {
  const windows = [];
  for (const day of DAYS) {
    for (const draft of availability[day]) {
      const startMinute = timeToMinutes(draft.start);
      const endMinute = timeToMinutes(draft.end);
      if (startMinute === null || endMinute === null) return null;
      windows.push({
        day,
        startMinute,
        endMinute: endMinute === 0 ? MINUTES_PER_DAY : endMinute,
      });
    }
  }
  return windows;
}

let nextKey = 0;

/** The reverse of `toAvailabilityWindows`, to edit saved windows. */
export function fromAvailabilityWindows(
  windows: { day: DayOfWeek; startMinute: number; endMinute: number }[],
): DraftAvailability {
  const availability = emptyAvailability();
  for (const { day, startMinute, endMinute } of windows) {
    availability[day].push({
      key: nextKey++,
      start: minutesToTime(startMinute),
      // Midnight at the end of the day shows as 00:00, which saving reads back.
      end: minutesToTime(endMinute),
    });
  }
  for (const day of DAYS) {
    availability[day].sort((a, b) => a.start.localeCompare(b.start));
  }
  return availability;
}

function nextWindowTimes(windows: DraftWindow[]) {
  const last = windows.at(-1);
  if (!last) return { start: "09:00", end: "17:00" };

  const lastEnd = timeToMinutes(last.end) || MINUTES_PER_DAY;
  if (lastEnd >= MINUTES_PER_DAY) return null;
  return {
    start: minutesToTime(lastEnd),
    end: minutesToTime(Math.min(lastEnd + 60, MINUTES_PER_DAY)),
  };
}

const iconButtonClassName =
  "flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-navy-900 transition-colors hover:bg-sandstone-300 disabled:cursor-not-allowed disabled:opacity-40";

const timeInputClassName =
  "rounded border border-sandstone-400 bg-white px-2 py-1 text-body2 text-navy-900 outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-300";

export default function AvailabilityEditor({
  value,
  onChange,
  error,
}: {
  value: DraftAvailability;
  onChange: (value: DraftAvailability) => void;
  error?: string;
}) {
  const setDay = (day: DayOfWeek, windows: DraftWindow[]) =>
    onChange({ ...value, [day]: windows });

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1.5 text-body2 text-navy-900">
        Availabilities
      </legend>

      {DAYS.map((day) => {
        const windows = value[day];
        const dayName = formatDayName(day);
        const added = nextWindowTimes(windows);
        const addWindow = () => {
          if (added) setDay(day, [...windows, { key: nextKey++, ...added }]);
        };
        const canAdd = added !== null;
        const addButton = (
          <button
            type="button"
            onClick={addWindow}
            disabled={!canAdd}
            aria-label={`Add availability on ${dayName}`}
            className={iconButtonClassName}
          >
            <BsPlusCircle aria-hidden className="size-4" />
          </button>
        );

        return (
          <div key={day} className="flex items-start gap-4">
            <span className="w-24 shrink-0 pt-1 text-body2 font-bold">
              {dayName}
            </span>

            {windows.length === 0 ? (
              <div className="flex items-center gap-3 py-0.5">
                <span className="text-body2 text-sandstone-600">
                  Unavailable
                </span>
                {addButton}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {windows.map((window, index) => {
                  const update = (patch: Partial<DraftWindow>) =>
                    setDay(
                      day,
                      windows.map((current) =>
                        current.key === window.key
                          ? { ...current, ...patch }
                          : current,
                      ),
                    );
                  const position = windows.length > 1 ? ` (${index + 1})` : "";

                  return (
                    <li key={window.key} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={window.start}
                        onChange={(event) =>
                          update({ start: event.target.value })
                        }
                        aria-label={`${dayName}${position} start time`}
                        className={timeInputClassName}
                      />
                      <span aria-hidden>–</span>
                      <input
                        type="time"
                        value={window.end}
                        onChange={(event) =>
                          update({ end: event.target.value })
                        }
                        aria-label={`${dayName}${position} end time`}
                        className={timeInputClassName}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDay(
                            day,
                            windows.filter(
                              (current) => current.key !== window.key,
                            ),
                          )
                        }
                        aria-label={`Remove ${dayName}${position} availability`}
                        className={`${iconButtonClassName} ml-2`}
                      >
                        <BsX aria-hidden className="size-5" />
                      </button>
                      {addButton}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}

      {error && (
        <p role="alert" className="text-body2 text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
