"use client";

import { useState } from "react";
import {
  BsPlusLg,
  BsArrowRightShort,
  BsCheck2,
  BsXCircleFill,
} from "react-icons/bs";
import { FaFilter } from "react-icons/fa";

export type FilterFieldConfig<F extends string> = {
  field: F;
  /** Shown in the menu, e.g. "Spoken Languages". */
  label: string;
  /** Shown on the chip when it differs, e.g. "Spoken Language". */
  chipLabel?: string;
  /** The values to pick from. Left out, the user types a value and presses Enter. */
  options?: string[];
};

export type SelectedFilters<F extends string> = Record<F, string[]>;

/** Adds `value` to `field`'s selected values, or removes it if it's there. */
export function toggleFilterValue<F extends string>(
  filters: SelectedFilters<F>,
  field: F,
  value: string,
): SelectedFilters<F> {
  const values = filters[field];
  return {
    ...filters,
    [field]: values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value],
  };
}

type FilterMenuProps<F extends string> = {
  fields: FilterFieldConfig<F>[];
  selectedFilters: SelectedFilters<F>;
  onToggleFilter: (field: F, value: string) => void;
};

/** The "Add filter" button, its menu, and a chip per filtered field. */
export default function FilterMenu<F extends string>({
  fields,
  selectedFilters,
  onToggleFilter,
}: FilterMenuProps<F>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeField, setActiveField] = useState<F | null>(null);
  const [filterSearch, setFilterSearch] = useState("");

  const active = fields.find(({ field }) => field === activeField);

  const openField = (field: F) => {
    setActiveField(field);
    setFilterSearch("");
    setIsOpen(true);
  };

  const visibleOptions = (active?.options ?? []).filter((option) =>
    option.toLowerCase().includes(filterSearch.toLowerCase()),
  );

  return (
    <div className="relative flex items-center gap-2">
      {fields.map(({ field, label, chipLabel }) => {
        const values = selectedFilters[field];

        if (values.length === 0) return null;

        return (
          <div
            key={field}
            className="flex h-[28px] items-center gap-[6px] rounded-full bg-sandstone-400 pl-[10px] pr-1"
          >
            <button
              type="button"
              onClick={() => openField(field)}
              className="flex items-center gap-[6px] text-[14px] text-navy-900 cursor-pointer"
            >
              <FaFilter className="h-[10px] w-[10px]" />
              <span>{chipLabel ?? label}</span>
            </button>

            {values.map((value) => (
              <div
                key={value}
                className="flex h-[26px] items-center gap-[6px] rounded-full border border-sandstone-500 bg-sandstone-200 px-2"
              >
                <span className="text-[14px] text-navy-900">{value}</span>

                <button
                  type="button"
                  onClick={() => onToggleFilter(field, value)}
                  aria-label={`Remove ${value} filter`}
                  className="cursor-pointer"
                >
                  <BsXCircleFill className="h-[14px] w-[14px] text-sandstone-500" />
                </button>
              </div>
            ))}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setActiveField(null);
          setFilterSearch("");
        }}
        className={`flex h-[28px] items-center justify-center gap-[6px] rounded-full px-[10px] text-[14px] text-navy-900 cursor-pointer ${
          isOpen ? "bg-sandstone-700 text-white" : "bg-sandstone-200"
        }`}
      >
        <BsPlusLg className="h-[10px] w-[10px]" />
        <span>Add filter</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-40 w-[458px] max-w-[calc(100vw-64px)] pt-1">
          <div className="flex h-[40px] items-center rounded-t-lg border border-sandstone-300 bg-white px-3 py-2">
            <input
              type="text"
              placeholder="Start typing to find a filter"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  active &&
                  !active.options &&
                  filterSearch.trim()
                ) {
                  const value = filterSearch.trim();

                  if (!selectedFilters[active.field].includes(value)) {
                    onToggleFilter(active.field, value);
                  }
                  setFilterSearch("");
                }
              }}
              className="w-full bg-transparent text-body1 text-navy-900 placeholder:text-sandstone-500 outline-none"
            />
          </div>

          <div className="max-h-[350px] overflow-y-auto rounded-b-lg border-x border-b border-sandstone-300 bg-white py-1">
            {!active ? (
              fields
                .filter(({ label }) =>
                  label.toLowerCase().includes(filterSearch.toLowerCase()),
                )
                .map(({ field, label, options }) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => openField(field)}
                    className="flex h-[38px] w-full items-center justify-between px-3 py-2 text-left text-body1 text-navy-900 hover:bg-sandstone-200 cursor-pointer"
                  >
                    {label}
                    {options && <BsArrowRightShort className="h-5 w-5" />}
                  </button>
                ))
            ) : !active.options ? (
              <div className="px-3 py-2 text-[14px] text-navy-900">
                Type a {active.label.toLowerCase()} above and press Enter to add
                it.
              </div>
            ) : (
              visibleOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onToggleFilter(active.field, option)}
                  className="flex h-[38px] w-full items-center justify-between px-3 py-2 text-left text-body1 text-navy-900 hover:bg-sandstone-200 cursor-pointer"
                >
                  <span>{option}</span>

                  {selectedFilters[active.field].includes(option) && (
                    <BsCheck2 className="h-5 w-5 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
