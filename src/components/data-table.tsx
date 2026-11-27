"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BsArrowDown, BsArrowDownUp, BsArrowUp } from "react-icons/bs";

/** What a column sorts by. Null values always sort last. */
export type SortValue = string | number | Date | null;

type SortDirection = "asc" | "desc";

export type DataTableColumn<T> = {
  label: string;
  /** A fixed Tailwind width, e.g. "w-[149px]"; the table layout is fixed. */
  width: string;
  render: (row: T) => ReactNode;
  /** Given, the column's header sorts the rows by this value when clicked. */
  sortValue?: (row: T) => SortValue;
  /** Given, the table starts sorted by this column in this direction. */
  defaultSort?: SortDirection;
};

/** Sorts by the column with this label. */
type DataTableSort = { label: string; direction: SortDirection };

const SORT_UI = {
  asc: { Icon: BsArrowUp, ariaSort: "ascending" },
  desc: { Icon: BsArrowDown, ariaSort: "descending" },
} as const;

const collator = new Intl.Collator("en-CA", {
  sensitivity: "base",
  numeric: true,
});

const toNumber = (value: NonNullable<SortValue>) =>
  value instanceof Date ? value.getTime() : Number(value);

function compareSortValues(
  a: NonNullable<SortValue>,
  b: NonNullable<SortValue>,
) {
  if (typeof a === "string" && typeof b === "string") {
    return collator.compare(a, b);
  }
  return toNumber(a) - toNumber(b);
}

/** `Array.prototype.sort` is stable, so rows that tie keep their order. */
function sortRows<T>(
  rows: T[],
  columns: DataTableColumn<T>[],
  sort: DataTableSort | null,
) {
  const sortValue =
    sort && columns.find(({ label }) => label === sort.label)?.sortValue;
  if (!sort || !sortValue) return rows;

  const sign = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((rowA, rowB) => {
    const a = sortValue(rowA);
    const b = sortValue(rowB);
    // Nulls last in both directions.
    if (a === null || b === null)
      return Number(a === null) - Number(b === null);
    return sign * compareSortValues(a, b);
  });
}

function initialSort<T>(columns: DataTableColumn<T>[]): DataTableSort | null {
  const column = columns.find(({ defaultSort }) => defaultSort);
  return column?.defaultSort
    ? { label: column.label, direction: column.defaultSort }
    : null;
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
};

const checkboxClassName =
  "h-3.5 w-3.5 rounded border border-sandstone-400 bg-white accent-navy-800 cursor-pointer";

export default function DataTable<T>({
  rows,
  columns,
  getRowId,
  getRowHref,
  selection,
}: DataTableProps<T>) {
  const router = useRouter();
  const [sort, setSort] = useState(() => initialSort(columns));

  const sortedRows = sortRows(rows, columns, sort);
  const rowIds = selection ? rows.map(getRowId) : [];

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
              const sortUi =
                sort?.label === label ? SORT_UI[sort.direction] : undefined;
              const SortIcon = sortUi?.Icon ?? BsArrowDownUp;
              return (
                <th
                  key={label}
                  aria-sort={
                    sortValue ? (sortUi?.ariaSort ?? "none") : undefined
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
                          sortUi ? "text-navy-900" : "text-sandstone-500"
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
