import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPositionOptions,
  getVolunteerProfile,
} from "@/lib/volunteers.server";
import VolunteerForm from "../../volunteer-form";

export const metadata: Metadata = {
  title: "Edit volunteer | The Refugee Centre",
};

export default async function EditVolunteerPage({
  params,
}: PageProps<"/volunteers/[id]/edit">) {
  const { id } = await params;
  const [volunteer, positions] = await Promise.all([
    getVolunteerProfile(id),
    getPositionOptions(),
  ]);
  if (!volunteer) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[#b2b2b2] px-8 pt-8 pb-4">
        <h1 className="text-h4">Volunteers</h1>
      </header>

      <VolunteerForm positions={positions} volunteer={volunteer} />
    </div>
  );
}
