"use client";

import DataTable, { type DataTableColumn } from "@/components/data-table";
import {
  formatHours,
  formatShiftStart,
  historyStatusLabel,
  type ShiftHistoryRow,
} from "@/lib/shift-history";

const COLUMNS: DataTableColumn<ShiftHistoryRow>[] = [
  { label: "Name", width: "w-[214px]", render: (r) => r.volunteerName },
  { label: "Position", width: "w-[214px]", render: (r) => r.position ?? "—" },
  {
    label: "Shift Date",
    width: "w-[214px]",
    render: (r) => formatShiftStart(r),
  },
  {
    label: "Status",
    width: "w-[214px]",
    render: (r) => historyStatusLabel(r.status, r.attendance),
  },
  {
    label: "Hours",
    width: "w-[100px]",
    render: (r) => (r.hours === null ? "—" : formatHours(r.hours)),
  },
];

type ShiftHistoryTableProps = {
  rows: ShiftHistoryRow[];
  /** For the position filter, added with search and sorting. */
  positionNames: string[];
};

export default function ShiftHistoryTable({ rows }: ShiftHistoryTableProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <DataTable rows={rows} columns={COLUMNS} getRowId={(r) => r.id} />
    </div>
  );
}
