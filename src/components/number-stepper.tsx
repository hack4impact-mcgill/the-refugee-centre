"use client";

import { BsDash, BsPlus } from "react-icons/bs";

const stepButtonClassName =
  "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded border border-navy-900 text-navy-900 transition-colors hover:bg-sandstone-300 disabled:cursor-not-allowed disabled:border-sandstone-400 disabled:text-sandstone-500 disabled:hover:bg-transparent";

/** A whole number with − and + buttons either side */
export default function NumberStepper({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  /** What one unit is, for the buttons' labels (e.g. "volunteer") */
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`One less ${label}`}
        aria-controls={id}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className={stepButtonClassName}
      >
        <BsDash aria-hidden className="size-5" />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => {
          // Ignores a cleared field, so it always holds a valid number.
          const next = event.target.valueAsNumber;
          if (Number.isInteger(next)) onChange(clamp(next));
        }}
        className="h-8 w-20 rounded border border-sandstone-300 bg-white text-center text-body1 outline-none focus:border-navy-700"
      />
      <button
        type="button"
        aria-label={`One more ${label}`}
        aria-controls={id}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className={stepButtonClassName}
      >
        <BsPlus aria-hidden className="size-5" />
      </button>
    </div>
  );
}
