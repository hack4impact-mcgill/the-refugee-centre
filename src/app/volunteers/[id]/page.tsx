import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BsPencilSquare } from "react-icons/bs";
import { formatAvailabilityWindow } from "@/lib/volunteers";
import { getVolunteerProfile } from "@/lib/volunteers.server";

export const metadata: Metadata = {
  title: "Volunteer profile | The Refugee Centre",
};

const editLinkClassName =
  "flex h-9.5 shrink-0 cursor-pointer items-center gap-3 rounded-lg bg-navy-900 px-2.5 py-2 text-body1 text-white transition-colors hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700 disabled:cursor-wait disabled:opacity-70";

const shiftsLinkClassName =
  "underline decoration-sandstone-400 underline-offset-2 hover:decoration-navy-900";

/** A read-only label and value, as in the design's TextField. */
function ProfileField({ label, value }: { label: string; value: ReactNode }) {
  const isEmpty = value === null || value === "";
  return (
    <div className="flex flex-col">
      <dt className="text-overline text-navy-700 uppercase">{label}</dt>
      <dd className="text-body1 text-navy-900">
        {isEmpty ? <span className="text-sandstone-500">—</span> : value}
      </dd>
    </div>
  );
}

export default async function VolunteerProfilePage({
  params,
}: PageProps<"/volunteers/[id]">) {
  const volunteer = await getVolunteerProfile((await params).id);
  if (!volunteer) notFound();
  const shiftsHref = `/volunteers/${volunteer.id}/shifts`;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[#b2b2b2] px-8 pt-8 pb-4">
        <h1 className="text-h4">Volunteers</h1>
      </header>

      <div className="flex items-center justify-between gap-4 border-b border-[#b2b2b2] px-8 py-4">
        <h2 className="truncate text-h5">
          {volunteer.name ?? "Unnamed volunteer"}
        </h2>
        <Link
          href={`/volunteers/${volunteer.id}/edit`}
          className={editLinkClassName}
        >
          <BsPencilSquare aria-hidden className="size-5.5" />
          Edit profile
        </Link>
      </div>

      <dl className="flex flex-col gap-4 px-8 py-4">
        <ProfileField label="Name" value={volunteer.name} />
        <ProfileField label="Email" value={volunteer.email} />
        <ProfileField label="Phone Number" value={volunteer.phone} />
        <ProfileField
          label="Spoken Languages"
          value={volunteer.languages.join(", ")}
        />
        <ProfileField
          label="Positions"
          value={volunteer.positions.map(({ name }) => name).join(", ")}
        />
        <ProfileField
          label="Approved Shifts"
          value={
            <Link href={shiftsHref} className={shiftsLinkClassName}>
              {volunteer.approvedShifts}
            </Link>
          }
        />
        <ProfileField
          label="Refused Shifts"
          value={
            <Link href={shiftsHref} className={shiftsLinkClassName}>
              {volunteer.refusedShifts}
            </Link>
          }
        />
        <ProfileField
          label="Availability"
          value={volunteer.availability
            .map(formatAvailabilityWindow)
            .join(", ")}
        />
        <ProfileField label="Notes" value={volunteer.notes} />
      </dl>
    </div>
  );
}
