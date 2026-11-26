import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BsArrowLeft } from "react-icons/bs";
import { z } from "zod";
import { RANKING_CONFIG } from "@/lib/ranking/config";
import {
  getVolunteerShiftHistory,
  type ShiftHistoryEntry,
} from "@/lib/volunteers.server";

export const metadata: Metadata = {
  title: "Shift history | The Refugee Centre",
};

// Rendered on the server, so the centre's time zone is set explicitly.
const dateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: RANKING_CONFIG.timeZone,
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: RANKING_CONFIG.timeZone,
  hour: "numeric",
  minute: "2-digit",
});

function formatWhen({ startTime, endTime, allDay }: ShiftHistoryEntry) {
  const date = dateFormat.format(startTime);
  if (allDay) return `${date} · All day`;
  return `${date} · ${timeFormat.format(startTime)} – ${timeFormat.format(endTime)}`;
}

function ShiftList({
  title,
  shifts,
  empty,
}: {
  title: string;
  shifts: ShiftHistoryEntry[];
  empty: string;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h3 className="text-h6">
        {title} <span className="text-sandstone-600">({shifts.length})</span>
      </h3>
      {shifts.length === 0 ? (
        <p className="text-body2 text-sandstone-600">{empty}</p>
      ) : (
        <ul className="flex max-w-2xl flex-col divide-y divide-sandstone-300 rounded-lg border border-sandstone-300 bg-white">
          {shifts.map((shift) => (
            <li key={shift.shiftId} className="flex flex-col px-4 py-3">
              <span className="truncate text-body1 text-navy-900">
                {shift.title}
              </span>
              <span className="text-body2 text-sandstone-600">
                {formatWhen(shift)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function VolunteerShiftsPage({
  params,
}: PageProps<"/volunteers/[id]/shifts">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const history = await getVolunteerShiftHistory(id);
  if (!history) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[#b2b2b2] px-8 pt-8 pb-4">
        <h1 className="text-h4">Volunteers</h1>
      </header>

      <div className="flex items-center gap-3 border-b border-sandstone-300 px-8 py-4">
        <Link
          href="/volunteers"
          aria-label="Back to volunteers"
          className="flex size-8 items-center justify-center rounded-full text-navy-900 transition-colors hover:bg-sandstone-200"
        >
          <BsArrowLeft aria-hidden className="size-5" />
        </Link>
        <h2 className="truncate text-h5">
          {history.name ?? "Unnamed volunteer"}: shift history
        </h2>
      </div>

      <div className="flex flex-col gap-8 px-8 py-6">
        <ShiftList
          title="Accepted shifts"
          shifts={history.accepted}
          empty="No accepted shifts yet."
        />
        <ShiftList
          title="Refused shifts"
          shifts={history.refused}
          empty="No refused shifts."
        />
      </div>
    </div>
  );
}
