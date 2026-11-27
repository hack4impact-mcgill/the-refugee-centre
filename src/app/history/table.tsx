"use client";

import { useState } from "react";
import Link from "next/link";
import DataTable, { type DataTableColumn } from "@/components/data-table";
import FilterMenu, {
  type FilterFieldConfig,
  type SelectedFilters,
} from "@/components/filter-menu";
import TableToolbar from "@/components/table-toolbar";
import {
  formatHours,
  formatShiftStart,
  HISTORY_STATUS_LABELS,
  historyStatusLabel,
  type ShiftHistoryRow,
} from "@/lib/shift-history";

const statusOf = (r: ShiftHistoryRow) =>
  historyStatusLabel(r.status, r.attendance);

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
  },
  {
    label: "Status",
    width: "w-[214px]",
    render: statusOf,
    sortValue: statusOf,
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

function matchesFilters(
  row: ShiftHistoryRow,
  searchQuery: string,
  filters: SelectedFilters<FilterField>,
) {
  const matchesSearch = row.volunteerName
    .toLowerCase()
    .includes(searchQuery.toLowerCase().trim());
  // A row matches a field when it has any of the selected values.
  const matchesPosition =
    filters.position.length === 0 ||
    (row.position !== null && filters.position.includes(row.position));
  const matchesStatus =
    filters.status.length === 0 || filters.status.includes(statusOf(row));

  return matchesSearch && matchesPosition && matchesStatus;
}

type ShiftHistoryTableProps = {
  /** Newest shift first. */
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

  const visibleRows = rows.filter((row) =>
    matchesFilters(row, searchQuery, selectedFilters),
  );

  const handleToggleFilter = (field: FilterField, value: string) => {
    const values = selectedFilters[field];
    setSelectedFilters({
      ...selectedFilters,
      [field]: values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    });
  };

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

      <DataTable
        rows={visibleRows}
        columns={COLUMNS}
        getRowId={(r) => r.id}
        defaultSort={{ label: "Shift Date", direction: "desc" }}
      />

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
