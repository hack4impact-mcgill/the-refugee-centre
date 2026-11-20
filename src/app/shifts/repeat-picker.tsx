"use client";

import { Temporal } from "temporal-polyfill";
import { MAX_SERIES_YEARS, plainDateOf } from "@/lib/recurrence";
import {
  describeRepeat,
  repeatChoices,
  sameRule,
  type ShiftDraft,
} from "@/lib/shifts";

const pillClassName =
  "cursor-pointer rounded-md bg-sandstone-200 px-2.5 py-1 text-body2 text-navy-900 outline-none transition-colors hover:bg-sandstone-300 focus-visible:ring-2 focus-visible:ring-navy-500";

/** "Does not repeat / Daily / Weekly on … " and, when repeating, the end date */
export default function RepeatPicker({
  draft,
  onChange,
}: {
  draft: ShiftDraft;
  onChange: (patch: Partial<ShiftDraft>) => void;
}) {
  const choices = repeatChoices(draft);
  const selected = choices.findIndex((choice) =>
    sameRule(choice, draft.repeat),
  );
  const { repeat } = draft;

  const firstDate = plainDateOf(draft.start);
  const lastDate = firstDate.add({ years: MAX_SERIES_YEARS });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Repeat"
        value={selected}
        onChange={(event) =>
          onChange({ repeat: choices[Number(event.target.value)] })
        }
        className={pillClassName}
      >
        {choices.map((choice, index) => (
          <option key={index} value={index}>
            {choice ? describeRepeat(choice, draft.start) : "Does not repeat"}
          </option>
        ))}
      </select>
      {repeat && (
        <label className="flex items-center gap-2 text-body2 text-navy-700">
          until
          <input
            type="date"
            value={repeat.endDate}
            min={firstDate.toString()}
            max={lastDate.toString()}
            required
            onChange={(event) => {
              const { value } = event.target;
              // Ignore a half-typed or cleared date.
              if (!value) return;
              try {
                Temporal.PlainDate.from(value);
              } catch {
                return;
              }
              onChange({ repeat: { ...repeat, endDate: value } });
            }}
            className={pillClassName}
          />
        </label>
      )}
    </div>
  );
}
