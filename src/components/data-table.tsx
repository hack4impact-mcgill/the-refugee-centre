"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

export type DataTableColumn<T> = {
  label: string;
  /** A fixed Tailwind width, e.g. "w-[149px]"; the table layout is fixed. */
  width: string;
  render: (row: T) => ReactNode;
};

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

  const rowIds = rows.map(getRowId);
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
            {columns.map(({ label, width }) => (
              <th
                key={label}
                className={`${width} p-2 text-left font-bold text-[#162022] border-r border-sandstone-300`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
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
