import type { Metadata } from "next";
import VolunteersTable from "./table";

export const metadata: Metadata = {
  title: "Volunteers | The Refugee Centre",
};

export default function VolunteersPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
          <header className="border-b border-[#b2b2b2] px-8 pt-8 pb-4">
            <h1 className="text-h4">Volunteers</h1>
          </header>
    
          <VolunteersTable />
        </div>
  );
}
