"use client";

import { useEffect, useRef, useState } from "react";
import {
  BsCaretDownFill,
  BsCheck2,
  BsSortDown,
  BsSortUp,
  BsXCircleFill,
} from "react-icons/bs";
import { FaFilter } from "react-icons/fa";

export type SortDirection = "asc" | "desc";

/** A column's filter. The parent owns the selected values. */
export type ColumnFilter = {
  /** The values to pick from. Left out, the user types a value and presses Enter. */
  options?: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
};

type ColumnHeaderMenuProps = {
  label: string;
  /** Left out, the column can't be sorted. */
  sortDirection?: SortDirection | null;
  onSort?: (direction: SortDirection | null) => void;
  filter?: ColumnFilter;
};

const MENU_WIDTH = 260;

const itemClassName =
  "flex h-[34px] w-full items-center gap-2 px-3 text-left text-[14px] text-navy-900 hover:bg-sandstone-200 cursor-pointer";

/** A table header that opens a menu to sort and filter its column. */
export default function ColumnHeaderMenu({
  label,
  sortDirection,
  onSort,
  filter,
}: ColumnHeaderMenuProps) {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [search, setSearch] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOpen = position !== null;
  const canSort = onSort !== undefined;
  const isFiltered = (filter?.selected.length ?? 0) > 0;

  const close = () => {
    setPosition(null);
    setSearch("");
  };

  const open = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Fixed, so the table's horizontal scroll container doesn't clip the menu.
    setPosition({
      top: rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8),
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    // The menu is fixed, so it would drift away from the header on scroll.
    const onScroll = (event: Event) => {
      if (!menuRef.current?.contains(event.target as Node)) close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  if (!canSort && !filter) {
    return <span className="block truncate">{label}</span>;
  }

  const visibleOptions = (filter?.options ?? []).filter((option) =>
    option.toLowerCase().includes(search.toLowerCase()),
  );

  const sortItem = (direction: SortDirection, text: string) => {
    const Icon = direction === "asc" ? BsSortUp : BsSortDown;
    const active = sortDirection === direction;
    return (
      <button
        type="button"
        className={itemClassName}
        onClick={() => {
          onSort?.(active ? null : direction);
          close();
        }}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{text}</span>
        {active && <BsCheck2 className="h-4 w-4 shrink-0" />}
      </button>
    );
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? close() : open())}
        className="flex w-full items-center gap-1 font-bold text-left cursor-pointer"
      >
        <span className="truncate">{label}</span>
        {sortDirection === "asc" && (
          <BsSortUp
            aria-label="sorted ascending"
            className="h-4 w-4 shrink-0"
          />
        )}
        {sortDirection === "desc" && (
          <BsSortDown
            aria-label="sorted descending"
            className="h-4 w-4 shrink-0"
          />
        )}
        {isFiltered && (
          <FaFilter
            aria-label="filtered"
            className="h-[10px] w-[10px] shrink-0"
          />
        )}
        <BsCaretDownFill
          className={`ml-auto h-[10px] w-[10px] shrink-0 text-sandstone-500 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
          className="fixed z-50 rounded-lg border border-sandstone-300 bg-white py-1 font-normal shadow-md"
        >
          {canSort && (
            <>
              {sortItem("asc", "Sort ascending")}
              {sortItem("desc", "Sort descending")}
            </>
          )}

          {canSort && filter && (
            <div className="my-1 border-t border-sandstone-300" />
          )}

          {filter && (
            <div>
              <div className="flex items-center justify-between px-3 pt-1 pb-1">
                <span className="text-[12px] font-bold uppercase tracking-wide text-sandstone-700">
                  Filter
                </span>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={filter.onClear}
                    className="text-[12px] text-navy-900 underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="px-3 pb-1">
                <input
                  type="text"
                  autoFocus
                  placeholder={
                    filter.options
                      ? `Search ${label.toLowerCase()}`
                      : `Type and press Enter`
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    const value = search.trim();
                    if (filter.options) {
                      // Enter picks the only match left.
                      if (visibleOptions.length === 1) {
                        filter.onToggle(visibleOptions[0]);
                        setSearch("");
                      }
                      return;
                    }
                    if (value && !filter.selected.includes(value)) {
                      filter.onToggle(value);
                    }
                    setSearch("");
                  }}
                  className="h-[32px] w-full rounded-md border border-sandstone-300 px-2 text-[14px] text-navy-900 outline-none placeholder:text-sandstone-500 focus:border-navy-800"
                />
              </div>

              <div className="max-h-[260px] overflow-y-auto">
                {filter.options
                  ? visibleOptions.map((option) => {
                      const checked = filter.selected.includes(option);
                      return (
                        <label key={option} className={itemClassName}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => filter.onToggle(option)}
                            className="h-3.5 w-3.5 accent-navy-800 cursor-pointer"
                          />
                          <span className="truncate">{option}</span>
                        </label>
                      );
                    })
                  : filter.selected.map((value) => (
                      <div
                        key={value}
                        className="flex h-[34px] items-center justify-between px-3 text-[14px] text-navy-900"
                      >
                        <span className="truncate">Contains “{value}”</span>
                        <button
                          type="button"
                          aria-label={`Remove ${value}`}
                          onClick={() => filter.onToggle(value)}
                          className="cursor-pointer"
                        >
                          <BsXCircleFill className="h-[14px] w-[14px] text-sandstone-500" />
                        </button>
                      </div>
                    ))}
                {filter.options && visibleOptions.length === 0 && (
                  <div className="px-3 py-2 text-[14px] text-sandstone-500">
                    No matches
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
