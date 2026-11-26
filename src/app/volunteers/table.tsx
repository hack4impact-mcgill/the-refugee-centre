"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BsPlusCircleFill } from "react-icons/bs";
import ConfirmDialog from "@/components/confirm-dialog";
import DataTable, { type DataTableColumn } from "@/components/data-table";
import FilterMenu, {
  type FilterFieldConfig,
  type SelectedFilters,
} from "@/components/filter-menu";
import SelectionBanner from "@/components/selection-banner";
import TableToolbar, {
  toolbarButtonClassName,
  toolbarPrimaryButtonClassName,
} from "@/components/table-toolbar";
import { toast } from "@/components/toast";
import { Language } from "@/generated/prisma/enums";
import type { VolunteerRecord } from "@/lib/schemas/volunteer";
import { formatAvailabilityWindow } from "@/lib/volunteers";
import { deleteVolunteers } from "./actions";

/** A shift count that opens the volunteer's accepted and refused shifts. */
function ShiftHistoryLink({
  volunteer,
  count,
}: {
  volunteer: VolunteerRecord;
  count: number;
}) {
  return (
    <Link
      href={`/volunteers/${volunteer.id}/shifts`}
      aria-label={`${count}, view shift history for ${volunteer.name}`}
      className="text-navy-900 underline decoration-sandstone-400 underline-offset-2 hover:decoration-navy-900"
    >
      {count}
    </Link>
  );
}

type VolunteersTableProps = {
  initialVolunteers: VolunteerRecord[];
  positionNames: string[];
};

const COLUMNS: DataTableColumn<VolunteerRecord>[] = [
  {
    label: "Name",
    width: "w-[117px]",
    // The row opens the profile on click; this link is the same for keyboards.
    render: (v) => (
      <Link href={`/volunteers/${v.id}`} className="hover:underline">
        {v.name}
      </Link>
    ),
  },
  { label: "Email", width: "w-[198.67px]", render: (v) => v.email },
  { label: "Phone Number", width: "w-[133px]", render: (v) => v.phone },
  {
    label: "Spoken Languages",
    width: "w-[156px]",
    render: (v) => v.languages.join(", "),
  },
  {
    label: "Positions",
    width: "w-[198.67px]",
    render: (v) => v.positions.map((position) => position.name).join(", "),
  },
  {
    label: "# Approved Shifts",
    width: "w-[149px]",
    render: (v) => <ShiftHistoryLink volunteer={v} count={v.approvedShifts} />,
  },
  {
    label: "# Refused Shifts",
    width: "w-[149px]",
    render: (v) => <ShiftHistoryLink volunteer={v} count={v.refusedShifts} />,
  },
  {
    label: "Availability",
    width: "w-[149px]",
    render: (v) => v.availability.map(formatAvailabilityWindow).join(", "),
  },
  { label: "Notes", width: "w-[198.67px]", render: (v) => v.notes },
];

type FilterField = "name" | "languages" | "positions";

const LANGUAGES = Object.values(Language).sort((a, b) => a.localeCompare(b));

const filterFields = (
  positionNames: string[],
): FilterFieldConfig<FilterField>[] => [
  { field: "name", label: "Name" },
  {
    field: "languages",
    label: "Spoken Languages",
    chipLabel: "Spoken Language",
    options: LANGUAGES,
  },
  { field: "positions", label: "Positions", options: positionNames },
];

const includesIgnoringCase = (values: string[], value: string) =>
  values.some((current) => current.toLowerCase() === value.toLowerCase());

function matchesFilters(
  volunteer: VolunteerRecord,
  searchQuery: string,
  filters: SelectedFilters<FilterField>,
) {
  const volunteerName = volunteer.name.toLowerCase();
  const volunteerPositions = volunteer.positions.map(({ name }) => name);

  const matchesSearch = volunteerName.includes(
    searchQuery.toLowerCase().trim(),
  );
  const matchesName =
    filters.name.length === 0 ||
    filters.name.some((name) => volunteerName.includes(name.toLowerCase()));
  // A volunteer matches when they have at least one selected value.
  const matchesLanguages =
    filters.languages.length === 0 ||
    filters.languages.some((language) =>
      includesIgnoringCase(volunteer.languages, language),
    );
  const matchesPositions =
    filters.positions.length === 0 ||
    filters.positions.some((position) =>
      includesIgnoringCase(volunteerPositions, position),
    );

  return matchesSearch && matchesName && matchesLanguages && matchesPositions;
}

export default function VolunteersTable({
  initialVolunteers,
  positionNames,
}: VolunteersTableProps) {
  const [volunteers, setVolunteers] = useState(initialVolunteers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, startDeleting] = useTransition();
  const [selectedFilters, setSelectedFilters] = useState<
    SelectedFilters<FilterField>
  >({
    name: [],
    languages: [],
    positions: [],
  });

  const filteredVolunteers = volunteers.filter((volunteer) =>
    matchesFilters(volunteer, searchQuery, selectedFilters),
  );

  // The selection only ever holds visible rows, so the banner count and the
  // delete never include volunteers the search or filters hide.
  const applySearchAndFilters = (
    query: string,
    filters: SelectedFilters<FilterField>,
  ) => {
    setSearchQuery(query);
    setSelectedFilters(filters);
    const stillVisible = new Set(
      volunteers
        .filter((volunteer) => matchesFilters(volunteer, query, filters))
        .map((volunteer) => volunteer.id),
    );
    setSelectedIds((prev) => prev.filter((id) => stillVisible.has(id)));
  };

  const handleToggleFilter = (field: FilterField, value: string) => {
    const values = selectedFilters[field];
    applySearchAndFilters(searchQuery, {
      ...selectedFilters,
      [field]: values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    });
  };

  const handleSearch = (query: string) =>
    applySearchAndFilters(query, selectedFilters);

  // Deletes on the server first; rows only leave the table once that succeeds.
  const handleConfirmDelete = () => {
    const ids = selectedIds;
    const deleted = volunteers.filter((volunteer) =>
      ids.includes(volunteer.id),
    );

    startDeleting(async () => {
      const result = await deleteVolunteers(ids);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }

      setVolunteers((prev) =>
        prev.filter((volunteer) => !ids.includes(volunteer.id)),
      );
      setSelectedIds([]);
      setShowDeleteModal(false);
      toast.success(
        deleted.length === 1
          ? `${deleted[0].name} was deleted`
          : `${deleted.length} volunteers were deleted`,
      );
    });
  };

  const isSingle = selectedIds.length === 1;

  return (
    <div className="relative flex-1 w-full">
      <TableToolbar
        onSearch={handleSearch}
        actions={
          <>
            <button type="button" className={toolbarButtonClassName}>
              Export
            </button>
            <Link
              href="/volunteers/new"
              className={toolbarPrimaryButtonClassName}
            >
              <BsPlusCircleFill className="w-[22px] h-[22px] shrink-0" />
              <span>Add profile</span>
            </Link>
          </>
        }
        filters={
          <FilterMenu
            fields={filterFields(positionNames)}
            selectedFilters={selectedFilters}
            onToggleFilter={handleToggleFilter}
          />
        }
      />

      <DataTable
        rows={filteredVolunteers}
        columns={COLUMNS}
        getRowId={(volunteer) => volunteer.id}
        getRowHref={(volunteer) => `/volunteers/${volunteer.id}`}
        selection={{
          selectedIds,
          onChange: setSelectedIds,
          selectAllLabel: "Select all volunteers",
          getRowLabel: (volunteer) => `Select ${volunteer.name}`,
        }}
      />

      <SelectionBanner
        selectedCount={selectedIds.length}
        onDelete={() => setShowDeleteModal(true)}
      />
      <ConfirmDialog
        isOpen={showDeleteModal}
        variant="danger"
        title={isSingle ? "Delete this profile?" : "Delete these profiles?"}
        message={`Are you sure you want to delete ${
          isSingle ? "this profile" : `these ${selectedIds.length} profiles`
        }? This action cannot be reversed.`}
        confirmLabel={isSingle ? "Yes, delete profile" : "Yes, delete profiles"}
        pendingLabel="Deleting…"
        pending={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
