"use client";

import { useState, type ReactNode } from "react";
import { toast } from "@/components/toast";
import {
  formatAvailabilityWindow,
  type VolunteerRecord,
} from "@/lib/volunteers";
import VolunteersToolbar from "./toolbar";
import SelectionBanner from "./selection-banner";
import DeleteConfirmationModal from "./delete-confirmation-modal";
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

// Unnamed volunteers sort last, matching the server's order.
function byName(a: VolunteerRecord, b: VolunteerRecord) {
  if (a.name === b.name) return 0;
  if (a.name === null) return 1;
  if (b.name === null) return -1;
  return a.name.localeCompare(b.name);
}

const includesIgnoringCase = (values: string[], value: string) =>
  values.some((current) => current.toLowerCase() === value.toLowerCase());

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
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    name: [],
    languages: [],
    positions: [],
  });

  const filteredVolunteers = volunteers.filter((volunteer) => {
    const volunteerName = (volunteer.name ?? "").toLowerCase();
    const volunteerPositions = volunteer.positions.map(({ name }) => name);

    const matchesSearch = volunteerName.includes(
      searchQuery.toLowerCase().trim(),
    );
    const matchesName =
      selectedFilters.name.length === 0 ||
      selectedFilters.name.some((name) =>
        volunteerName.includes(name.toLowerCase()),
      );
    // A volunteer matches when they have at least one selected value.
    const matchesLanguages =
      selectedFilters.languages.length === 0 ||
      selectedFilters.languages.some((language) =>
        includesIgnoringCase(volunteer.languages, language),
      );
    const matchesPositions =
      selectedFilters.positions.length === 0 ||
      selectedFilters.positions.some((position) =>
        includesIgnoringCase(volunteerPositions, position),
      );

    return matchesSearch && matchesName && matchesLanguages && matchesPositions;
  });

  const visibleIds = filteredVolunteers.map((volunteer) => volunteer.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((currentId) => currentId !== id)
        : [...prev, id],
    );
  };

  const handleToggleFilter = (field: FilterField, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  // Selections hidden by the search or filters are kept.
  const handleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleConfirmDelete = () => {
    const deleted = volunteers.filter((volunteer) =>
      selectedIds.includes(volunteer.id),
    );
    setVolunteers((prev) =>
      prev.filter((volunteer) => !selectedIds.includes(volunteer.id)),
    );
    setSelectedIds([]);
    setShowDeleteModal(false);

    toast.info(
      deleted.length === 1
        ? `${deleted[0].name ?? "Unnamed volunteer"} removed`
        : `${deleted.length} volunteers removed`,
      {
        action: {
          label: "Undo",
          onClick: () =>
            setVolunteers((prev) => [...prev, ...deleted].sort(byName)),
        },
      },
    );
  };

  return (
    <div className="relative flex-1 w-full">
      <VolunteersToolbar
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        setSearchQuery={setSearchQuery}
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
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        selectedCount={selectedIds.length}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
