"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BsArrowDown, BsArrowDownUp, BsArrowUp } from "react-icons/bs";

/** What a column sorts by. Null values always sort last. */
export type SortValue = string | number | Date | null;

export type DataTableColumn<T> = {
  label: string;
  /** A fixed Tailwind width, e.g. "w-[149px]"; the table layout is fixed. */
  width: string;
  render: (row: T) => ReactNode;
  /** Given, the column's header sorts the rows by this value when clicked. */
  sortValue?: (row: T) => SortValue;
};

/** Sorts by the column with this label. */
export type DataTableSort = {
  label: string;
  direction: "asc" | "desc";
};

const collator = new Intl.Collator("en-CA", {
  sensitivity: "base",
  numeric: true,
});

function compareSortValues(a: SortValue, b: SortValue) {
  if (typeof a === "string" && typeof b === "string") {
    return collator.compare(a, b);
  }
  const toNumber = (value: SortValue) =>
    value instanceof Date ? value.getTime() : Number(value);
  return toNumber(a) - toNumber(b);
}

/** A stable sort, so rows that tie keep the order they were passed in. */
function sortRows<T>(
  rows: T[],
  columns: DataTableColumn<T>[],
  sort: DataTableSort | null,
) {
  const sortValue = columns.find(
    ({ label }) => label === sort?.label,
  )?.sortValue;
  if (!sort || !sortValue) return rows;

  const sign = sort.direction === "asc" ? 1 : -1;
  return rows
    .map((row) => ({ row, value: sortValue(row) }))
    .sort((a, b) => {
      if (a.value === null || b.value === null) {
        // Nulls last in both directions.
        return Number(a.value === null) - Number(b.value === null);
      }
      return sign * compareSortValues(a.value, b.value);
    })
    .map(({ row }) => row);
}

/** Turns on the checkbox column. Only the rows passed in can be selected. */
export type DataTableSelection<T> = {
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  /** The select-all checkbox's label, e.g. "Select all volunteers". */
  selectAllLabel: string;
  /** A row checkbox's label, e.g. "Select Jane Doe". */
  getRowLabel: (row: T) => string;
};

type DataTableProps<T> = {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  /**
   * Where clicking a row goes. Links, buttons and checkboxes in the row keep
   * their own behaviour, so give one cell a link to the same place for
   * keyboard users.
   */
  getRowHref?: (row: T) => string;
  selection?: DataTableSelection<T>;
  /** The sort before any header is clicked. Left out, rows keep their order. */
  defaultSort?: DataTableSort;
};

const checkboxClassName =
  "h-3.5 w-3.5 rounded border border-sandstone-400 bg-white accent-navy-800 cursor-pointer";

export default function DataTable<T>({
  rows,
  columns,
  getRowId,
  getRowHref,
  selection,
  defaultSort,
}: DataTableProps<T>) {
  const router = useRouter();
  const [sort, setSort] = useState<DataTableSort | null>(defaultSort ?? null);

  const sortedRows = sortRows(rows, columns, sort);
  const rowIds = rows.map(getRowId);

  const toggleSort = (label: string) =>
    setSort((current) => ({
      label,
      direction:
        current?.label === label && current.direction === "asc"
          ? "desc"
          : "asc",
    }));
  const allSelected =
    selection !== undefined &&
    rowIds.length > 0 &&
    rowIds.every((id) => selection.selectedIds.includes(id));

  const toggleRow = (id: string) => {
    if (!selection) return;
    const { selectedIds, onChange } = selection;
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((currentId) => currentId !== id)
        : [...selectedIds, id],
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse table-fixed text-sm">
        <thead>
          <tr className="border-b border-sandstone-300 h-[35px]">
            <th className="w-[32px]"></th>
            {selection && (
              <th className="w-[30px] p-2 text-left">
                <input
                  type="checkbox"
                  aria-label={selection.selectAllLabel}
                  className={checkboxClassName}
                  checked={allSelected}
                  onChange={() => selection.onChange(allSelected ? [] : rowIds)}
                />
              </th>
            )}
            {columns.map(({ label, width, sortValue }) => {
              const direction =
                sort?.label === label ? sort.direction : undefined;
              const SortIcon =
                direction === "asc"
                  ? BsArrowUp
                  : direction === "desc"
                    ? BsArrowDown
                    : BsArrowDownUp;
              return (
                <th
                  key={label}
                  aria-sort={
                    sortValue
                      ? direction === "asc"
                        ? "ascending"
                        : direction === "desc"
                          ? "descending"
                          : "none"
                      : undefined
                  }
                  className={`${width} p-2 text-left font-bold text-[#162022] border-r border-sandstone-300`}
                >
                  {sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(label)}
                      className="flex w-full items-center justify-between gap-1 text-left font-bold cursor-pointer"
                    >
                      <span className="truncate">{label}</span>
                      <SortIcon
                        aria-hidden
                        className={`h-3.5 w-3.5 shrink-0 ${
                          direction ? "text-navy-900" : "text-sandstone-500"
                        }`}
                      />
                    </button>
                  ) : (
                    label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {sortedRows.map((row) => {
            const id = getRowId(row);
            const isChecked = selection?.selectedIds.includes(id) ?? false;
            const href = getRowHref?.(row);
            return (
              <tr
                key={id}
                onClick={
                  href
                    ? (event) => {
                        // Links, the checkbox and its cell keep their own behaviour.
                        const target = event.target as HTMLElement;
                        if (
                          target.closest(
                            "a, input, button, [data-no-row-click]",
                          )
                        )
                          return;
                        router.push(href);
                      }
                    : undefined
                }
                className={`border-b border-sandstone-300 h-[35px] transition-colors ${
                  href ? "cursor-pointer" : ""
                } ${isChecked ? "bg-[#C4D5E0]" : "bg-white hover:bg-navy-200"}`}
              >
                <td data-no-row-click></td>
                {selection && (
                  <td data-no-row-click className="p-2">
                    <input
                      type="checkbox"
                      aria-label={selection.getRowLabel(row)}
                      className={checkboxClassName}
                      checked={isChecked}
                      onChange={() => toggleRow(id)}
                    />
                  </td>
                )}
                {columns.map(({ label, render }) => (
                  <td
                    key={label}
                    className="border-r border-sandstone-300 p-2 truncate"
                  >
                    {render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
