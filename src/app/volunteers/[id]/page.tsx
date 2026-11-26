import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BsPencilSquare } from "react-icons/bs";
import { DayOfWeek } from "@/generated/prisma/enums";
import type { AvailabilityWindow } from "@/lib/ranking/types";
import { formatDayName, formatTimeRange } from "@/lib/volunteers";
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

/** The week, one row per day, with each window as a time chip. */
function AvailabilitySchedule({ windows }: { windows: AvailabilityWindow[] }) {
  return (
    <ul className="flex w-fit min-w-80 flex-col divide-y divide-sandstone-300 rounded-lg border border-sandstone-400 bg-white">
      {Object.values(DayOfWeek).map((day) => {
        const dayWindows = windows
          .filter((window) => window.day === day)
          .sort((a, b) => a.startMinute - b.startMinute);
        return (
          <li
            key={day}
            className="flex min-h-10 items-center gap-4 px-4 py-1.5"
          >
            <span className="w-24 shrink-0 text-body2 font-bold text-navy-900">
              {formatDayName(day)}
            </span>
            {dayWindows.length === 0 ? (
              <span className="text-body2 text-sandstone-600">Unavailable</span>
            ) : (
              <span className="flex flex-wrap gap-1.5">
                {dayWindows.map((window) => (
                  <span
                    key={window.startMinute}
                    className="rounded-full bg-navy-200 px-2.5 py-0.5 text-body2 whitespace-nowrap text-navy-900"
                  >
                    {formatTimeRange(window)}
                  </span>
                ))}
              </span>
            )}
          </li>
        );
      })}
    </ul>
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
        <div className="flex flex-col gap-1.5">
          <dt className="text-overline text-navy-700 uppercase">
            Availability
          </dt>
          <dd>
            <AvailabilitySchedule windows={volunteer.availability} />
          </dd>
        </div>
        <ProfileField label="Notes" value={volunteer.notes} />
      </dl>
    </div>
  );
}
