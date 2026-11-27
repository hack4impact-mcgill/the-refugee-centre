"use client";

import { useState } from "react";
import Link from "next/link";
import DataTable, { type DataTableColumn } from "@/components/data-table";
import FilterMenu, {
  toggleFilterValue,
  type FilterFieldConfig,
  type SelectedFilters,
} from "@/components/filter-menu";
import TableToolbar from "@/components/table-toolbar";
import {
  formatHours,
  formatShiftStart,
  HISTORY_STATUS_LABELS,
  type ShiftHistoryRow,
} from "@/lib/shift-history";

const COLUMNS: DataTableColumn<ShiftHistoryRow>[] = [
  {
    label: "Name",
    width: "w-[214px]",
    render: (r) => (
      <Link href={`/volunteers/${r.volunteerId}`} className="hover:underline">
        {r.volunteerName}
      </Link>
    ),
    sortValue: (r) => r.volunteerName,
  },
  {
    label: "Position",
    width: "w-[214px]",
    render: (r) => r.position ?? "—",
    sortValue: (r) => r.position,
  },
  {
    label: "Shift Date",
    width: "w-[214px]",
    render: formatShiftStart,
    sortValue: (r) => r.startTime,
    defaultSort: "desc",
  },
  {
    label: "Status",
    width: "w-[214px]",
    render: (r) => r.statusLabel,
    sortValue: (r) => r.statusLabel,
  },
  {
    label: "Hours",
    width: "w-[100px]",
    render: (r) => (r.hours === null ? "—" : formatHours(r.hours)),
    sortValue: (r) => r.hours,
  },
];

type FilterField = "position" | "status";

const filterFields = (
  positionNames: string[],
): FilterFieldConfig<FilterField>[] => [
  { field: "position", label: "Position", options: positionNames },
  { field: "status", label: "Status", options: HISTORY_STATUS_LABELS },
];

/** `nameQuery` is already lowercased and trimmed. */
function matchesFilters(
  row: ShiftHistoryRow,
  nameQuery: string,
  filters: SelectedFilters<FilterField>,
) {
  const matchesSearch =
    !nameQuery || row.volunteerName.toLowerCase().includes(nameQuery);
  // A row matches a field when it has any of the selected values.
  const matchesPosition =
    filters.position.length === 0 ||
    (row.position !== null && filters.position.includes(row.position));
  const matchesStatus =
    filters.status.length === 0 || filters.status.includes(row.statusLabel);

  return matchesSearch && matchesPosition && matchesStatus;
}

type ShiftHistoryTableProps = {
  /** Rows on the same Shift Date keep this order, so pass them by name. */
  rows: ShiftHistoryRow[];
  positionNames: string[];
};

export default function ShiftHistoryTable({
  rows,
  positionNames,
}: ShiftHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<
    SelectedFilters<FilterField>
  >({ position: [], status: [] });

  const nameQuery = searchQuery.toLowerCase().trim();
  const visibleRows = rows.filter((row) =>
    matchesFilters(row, nameQuery, selectedFilters),
  );

  const handleToggleFilter = (field: FilterField, value: string) =>
    setSelectedFilters(toggleFilterValue(selectedFilters, field, value));

  return (
    <div className="flex-1 w-full">
      <TableToolbar
        onSearch={setSearchQuery}
        filters={
          <FilterMenu
            fields={filterFields(positionNames)}
            selectedFilters={selectedFilters}
            onToggleFilter={handleToggleFilter}
          />
        }
      />

      <DataTable rows={visibleRows} columns={COLUMNS} getRowId={(r) => r.id} />

      {visibleRows.length === 0 && (
        <p className="px-8 py-6 text-body2 text-sandstone-600">
          {rows.length === 0
            ? "No past shifts yet."
            : "No shifts match your search and filters."}
        </p>
      )}
    </div>
  );
}
