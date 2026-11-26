"use client";

import { BsXCircleFill } from "react-icons/bs";
import { FaFilter } from "react-icons/fa";

export type ActiveFilter = {
  /** Shown on the chip, e.g. "Spoken Language". */
  label: string;
  values: string[];
  onRemove: (value: string) => void;
};

type ActiveFiltersProps = {
  filters: ActiveFilter[];
  onClearAll: () => void;
};

/** A chip per filtered column, set from the column headers. */
export default function ActiveFilters({
  filters,
  onClearAll,
}: ActiveFiltersProps) {
  const active = filters.filter(({ values }) => values.length > 0);
  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {active.map(({ label, values, onRemove }) => (
        <div
          key={label}
          className="flex h-[28px] items-center gap-[6px] rounded-full bg-sandstone-400 pl-[10px] pr-1"
        >
          <span className="flex items-center gap-[6px] text-[14px] text-navy-900">
            <FaFilter className="h-[10px] w-[10px]" />
            {label}
          </span>

          {values.map((value) => (
            <div
              key={value}
              className="flex h-[26px] items-center gap-[6px] rounded-full border border-sandstone-500 bg-sandstone-200 px-2"
            >
              <span className="text-[14px] text-navy-900">{value}</span>
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() => onRemove(value)}
                className="cursor-pointer"
              >
                <BsXCircleFill className="h-[14px] w-[14px] text-sandstone-500" />
              </button>
            </div>
          ))}
        </div>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="text-[14px] text-navy-900 underline cursor-pointer"
      >
        Clear all
      </button>
    </div>
  );
}
