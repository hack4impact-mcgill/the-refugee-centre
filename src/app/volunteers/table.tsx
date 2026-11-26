"use client";

import { useState, useTransition, type ReactNode } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import { toast } from "@/components/toast";
import {
  formatAvailabilityWindow,
  type VolunteerRecord,
} from "@/lib/volunteers";
import { deleteVolunteers } from "./actions";
import VolunteersToolbar from "./toolbar";
import SelectionBanner from "./selection-banner";
import type { FilterField, SelectedFilters } from "./volunteer-filter-menu";

type VolunteersTableProps = {
  initialVolunteers: VolunteerRecord[];
  positionNames: string[];
};

const COLUMNS: {
  label: string;
  width: string;
  render: (volunteer: VolunteerRecord) => ReactNode;
}[] = [
  { label: "Name", width: "w-[117px]", render: (v) => v.name },
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
    render: (v) => v.approvedShifts,
  },
  {
    label: "# Refused Shifts",
    width: "w-[149px]",
    render: (v) => v.refusedShifts,
  },
  {
    label: "Availability",
    width: "w-[149px]",
    render: (v) => v.availability.map(formatAvailabilityWindow).join(", "),
  },
  { label: "Notes", width: "w-[198.67px]", render: (v) => v.notes },
];

const checkboxClassName =
  "h-3.5 w-3.5 rounded border border-sandstone-400 bg-white accent-navy-800 cursor-pointer";

const includesIgnoringCase = (values: string[], value: string) =>
  values.some((current) => current.toLowerCase() === value.toLowerCase());

function matchesFilters(
  volunteer: VolunteerRecord,
  searchQuery: string,
  filters: SelectedFilters,
) {
  const volunteerName = (volunteer.name ?? "").toLowerCase();
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
  // The search only applies on Enter, so the typed text and the applied query
  // are kept apart.
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, startDeleting] = useTransition();
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    name: [],
    languages: [],
    positions: [],
  });

  const filteredVolunteers = volunteers.filter((volunteer) =>
    matchesFilters(volunteer, searchQuery, selectedFilters),
  );

  const visibleIds = filteredVolunteers.map((volunteer) => volunteer.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

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

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((currentId) => currentId !== id)
        : [...prev, id],
    );
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

  const handleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? [] : visibleIds);
  };

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
          ? `${deleted[0].name ?? "Unnamed volunteer"} was deleted`
          : `${deleted.length} volunteers were deleted`,
      );
    });
  };

  const isSingle = selectedIds.length === 1;

  return (
    <div className="relative flex-1 w-full">
      <VolunteersToolbar
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        setSearchQuery={handleSearch}
        selectedFilters={selectedFilters}
        onToggleFilter={handleToggleFilter}
        positionNames={positionNames}
      />

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse table-fixed text-sm">
          <thead>
            <tr className="border-b border-sandstone-300 h-[35px]">
              <th className="w-[32px]"></th>
              <th className="w-[30px] p-2 text-left">
                <input
                  type="checkbox"
                  aria-label="Select all volunteers"
                  className={checkboxClassName}
                  checked={allVisibleSelected}
                  onChange={handleSelectAll}
                />
              </th>
              {COLUMNS.map(({ label, width }) => (
                <th
                  key={label}
                  className={`${width} p-2 text-left font-bold text-[#162022] border-r border-sandstone-300`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredVolunteers.map((volunteer) => {
              const isChecked = selectedIds.includes(volunteer.id);
              return (
                <tr
                  key={volunteer.id}
                  className={`border-b border-sandstone-300 h-[35px] transition-colors ${
                    isChecked ? "bg-[#C4D5E0]" : "bg-white hover:bg-navy-200"
                  }`}
                >
                  <td></td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${volunteer.name ?? "unnamed volunteer"}`}
                      className={checkboxClassName}
                      checked={isChecked}
                      onChange={() => handleSelectRow(volunteer.id)}
                    />
                  </td>
                  {COLUMNS.map(({ label, render }) => (
                    <td
                      key={label}
                      className="border-r border-sandstone-300 p-2 truncate"
                    >
                      {render(volunteer)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
