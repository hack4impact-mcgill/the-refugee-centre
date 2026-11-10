"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { BsClock, BsCalendarEvent, BsTrash } from "react-icons/bs";
import Field, { fieldClassName } from "@/components/field";
import LanguagePicker from "@/components/language-picker";
import { ShiftLocation } from "@/generated/prisma/enums";
import {
  formatDateLine,
  formatTimeLine,
  shiftEventClass,
  type ShiftDraft,
} from "@/lib/shifts";

const POPUP_GAP = 8;

/** Keeps a popup coordinate at least POPUP_GAP inside the viewport. */
function clampToViewport(value: number, max: number) {
  return Math.min(
    Math.max(POPUP_GAP, value),
    Math.max(POPUP_GAP, max - POPUP_GAP),
  );
}

type ShiftPopupProps = {
  draft: ShiftDraft;
  pending: "save" | "delete" | null;
  onChange: (patch: Partial<ShiftDraft>) => void;
  onSave: () => void;
  onDelete: () => void;
  onDiscard: () => void;
};

export default function ShiftPopup({
  draft,
  pending,
  onChange,
  onSave,
  onDelete,
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

  const { id, start, end } = draft;

  // Re-measures whenever the shift moves: a drag hands us new start/end dates,
  // while typing in the fields keeps the same ones.
  useLayoutEffect(() => {
    const popup = popupRef.current;
    if (!popup) return;

    // Measure the shift on the calendar so the popup sits beside it rather
    // than on top of it. It is drawn by now in both cases: a new shift renders
    // from the draft, an edited one has already moved. Centre on screen if not.
    const anchor =
      document
        .querySelector(`.${shiftEventClass(id)}`)
        ?.getBoundingClientRect() ??
      new DOMRect(window.innerWidth / 2, window.innerHeight / 2);

    const { width, height } = popup.getBoundingClientRect();

    // Prefer the right of the shift, flip to the left when it doesn't fit.
    let left = anchor.right + POPUP_GAP;
    if (left + width > window.innerWidth - POPUP_GAP) {
      left = anchor.left - width - POPUP_GAP;
    }

    setPosition({
      left: clampToViewport(left, window.innerWidth - width),
      top: clampToViewport(
        anchor.top + anchor.height / 2 - height / 2,
        window.innerHeight - height,
      ),
    });
  }, [id, start, end]);

  // FullCalendar's drag cleanup blurs the page right after the drop, so wait a
  // frame before taking focus, otherwise the title field loses it again.
  // No dependencies: schedule.tsx remounts the popup (key={id}) for each shift.
  useEffect(() => {
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

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
              {Object.values(ShiftLocation).map((location) => {
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
            disabled={pending !== null}
            className="h-9.5 flex-1 cursor-pointer rounded-lg bg-navy-900 px-3 py-2 text-body1 leading-5.5 text-white transition-colors hover:bg-navy-800 disabled:cursor-wait disabled:opacity-70"
          >
            {pending === "save"
              ? "Saving…"
              : draft.isNew
                ? "Create shift"
                : "Save shift"}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="h-9.5 cursor-pointer rounded-lg border border-navy-900 px-3 py-2 text-body1 leading-5.5 text-navy-900 transition-colors hover:bg-sandstone-300"
          >
            Cancel
          </button>
          {!draft.isNew && (
            <button
              type="button"
              onClick={onDelete}
              disabled={pending !== null}
              aria-label={
                pending === "delete" ? "Deleting shift" : "Delete shift"
              }
              title="Delete shift"
              className="flex h-9.5 cursor-pointer items-center rounded-lg px-2.5 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-wait disabled:opacity-70"
            >
              <BsTrash aria-hidden className="size-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
