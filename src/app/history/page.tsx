import type { Metadata } from "next";
import { getShiftHistoryTableData } from "@/lib/volunteers.server";
import ShiftHistoryTable from "./table";

export const metadata: Metadata = {
  title: "Shift History | The Refugee Centre",
};

export default async function HistoryPage() {
  const { rows, positionNames } = await getShiftHistoryTableData();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-[#b2b2b2] px-8 pt-8 pb-4">
        <h1 className="text-h4">Shift History</h1>
      </header>

      <ShiftHistoryTable rows={rows} positionNames={positionNames} />
    </div>
  );
}
