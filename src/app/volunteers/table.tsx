"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BsPlusCircleFill } from "react-icons/bs";
import ConfirmDialog from "@/components/confirm-dialog";
import ActiveFilters from "@/components/active-filters";
import type { ColumnFilter } from "@/components/column-header-menu";
import DataTable, { type DataTableColumn } from "@/components/data-table";
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

type FilterField = "name" | "languages" | "positions";
type SelectedFilters = Record<FilterField, string[]>;

const NO_FILTERS: SelectedFilters = { name: [], languages: [], positions: [] };

const LANGUAGES = Object.values(Language).sort((a, b) => a.localeCompare(b));

const FILTER_CHIP_LABELS: Record<FilterField, string> = {
  name: "Name",
  languages: "Spoken Language",
  positions: "Position",
};

const buildColumns = (
  filterFor: (field: FilterField, options?: string[]) => ColumnFilter,
  positionNames: string[],
): DataTableColumn<VolunteerRecord>[] => [
  {
    label: "Name",
    width: "w-[117px]",
    // The row opens the profile on click; this link is the same for keyboards.
    render: (v) => (
      <Link href={`/volunteers/${v.id}`} className="hover:underline">
        {v.name}
      </Link>
    ),
    sortValue: (v) => v.name,
    filter: filterFor("name"),
  },
  {
    label: "Email",
    width: "w-[198.67px]",
    render: (v) => v.email,
    sortValue: (v) => v.email,
  },
  {
    label: "Phone Number",
    width: "w-[133px]",
    render: (v) => v.phone,
    sortValue: (v) => v.phone,
  },
  {
    label: "Spoken Languages",
    width: "w-[156px]",
    render: (v) => v.languages.join(", "),
    filter: filterFor("languages", LANGUAGES),
  },
  {
    label: "Positions",
    width: "w-[198.67px]",
    render: (v) => v.positions.map((position) => position.name).join(", "),
    filter: filterFor("positions", positionNames),
  },
  {
    label: "# Approved Shifts",
    width: "w-[149px]",
    render: (v) => <ShiftHistoryLink volunteer={v} count={v.approvedShifts} />,
    sortValue: (v) => v.approvedShifts,
  },
  {
    label: "# Refused Shifts",
    width: "w-[149px]",
    render: (v) => <ShiftHistoryLink volunteer={v} count={v.refusedShifts} />,
    sortValue: (v) => v.refusedShifts,
  },
  {
    label: "Availability",
    width: "w-[149px]",
    render: (v) => v.availability.map(formatAvailabilityWindow).join(", "),
  },
  {
    label: "Notes",
    width: "w-[198.67px]",
    render: (v) => v.notes,
    sortValue: (v) => v.notes,
  },
];

const includesIgnoringCase = (values: string[], value: string) =>
  values.some((current) => current.toLowerCase() === value.toLowerCase());

function matchesFilters(
  volunteer: VolunteerRecord,
  searchQuery: string,
  filters: SelectedFilters,
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
  const [selectedFilters, setSelectedFilters] =
    useState<SelectedFilters>(NO_FILTERS);

  const filteredVolunteers = volunteers.filter((volunteer) =>
    matchesFilters(volunteer, searchQuery, selectedFilters),
  );

  // The selection only ever holds visible rows, so the banner count and the
  // delete never include volunteers the search or filters hide.
  const applySearchAndFilters = (query: string, filters: SelectedFilters) => {
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

  const filterFor = (field: FilterField, options?: string[]): ColumnFilter => ({
    options,
    selected: selectedFilters[field],
    onToggle: (value) => handleToggleFilter(field, value),
    onClear: () =>
      applySearchAndFilters(searchQuery, { ...selectedFilters, [field]: [] }),
  });

  const hasFilters = Object.values(selectedFilters).some(
    (values) => values.length > 0,
  );

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
          hasFilters && (
            <ActiveFilters
              filters={(Object.keys(FILTER_CHIP_LABELS) as FilterField[]).map(
                (field) => ({
                  label: FILTER_CHIP_LABELS[field],
                  values: selectedFilters[field],
                  onRemove: (value) => handleToggleFilter(field, value),
                }),
              )}
              onClearAll={() => applySearchAndFilters(searchQuery, NO_FILTERS)}
            />
          )
        }
      />

      <DataTable
        rows={filteredVolunteers}
        columns={buildColumns(filterFor, positionNames)}
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
