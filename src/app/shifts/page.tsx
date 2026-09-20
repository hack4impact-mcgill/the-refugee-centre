import type { Metadata } from "next";
import Schedule from "./schedule";

export const metadata: Metadata = {
  title: "Shift Management | The Refugee Centre",
};

export default function ShiftManagementPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[#b2b2b2] px-8 pt-8 pb-4">
        <h1 className="text-h4">Schedule</h1>
      </header>

      <Schedule />
    </div>
  );
}
