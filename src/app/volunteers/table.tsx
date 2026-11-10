"use client";

import { useState } from "react";
import VolunteersToolbar from "./toolbar";
import SelectionBanner from "./selection-banner";
import DeleteConfirmationModal from "./delete-confirmation-modal";
import DeleteToast from "./delete-toast";

const MOCK_VOLUNTEERS = [
    {
        id: 1,
        name: "Leticia Huang",
        email: "leticia.huang@mail.mcgill.ca",
        phone: "+1 (XXX) XXX-XXXX",
        languages: ["English"],
        positions: ["Receptionist", "Portal Worker"],
        approvedShifts: 1,
        refusedShifts: 3,
        availability: ["Monday (9 AM-12 PM)"],
        notes: "Text",
    },
    {
    id: 2,
    name: "Amine Saoudi",
    email: "amine.saoudi@mail.mcgill.ca",
    phone: "+1 (XXX) XXX-XXXX",
    languages: ["French", "English"],
    positions: ["Receptionist"],
    approvedShifts: 1,
    refusedShifts: 3,
    availability: ["Monday (9 AM-12 PM)"],
    notes: "Text",
  },
  {
    id: 3,
    name: "Emily Wang",
    email: "emily.wang@mail.mcgill.ca",
    phone: "+1 (XXX) XXX-XXXX",
    languages: ["French", "English"],
    positions: ["Receptionist", "Portal Worker"],
    approvedShifts: 1,
    refusedShifts: 3,
    availability: ["Monday (9 AM-12 PM)"],
    notes: "Text",
  },
];

type FilterField = "name" | "languages" | "positions";

export default function VolunteersTable(){
    const [volunteers, setVolunteers] = useState(MOCK_VOLUNTEERS);
    // for the main search bar
    const [searchInput, setSearchInput] = useState("");
    // submitted submitted search term
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletedVolunteers, setDeletedVolunteers] = useState<typeof MOCK_VOLUNTEERS>([]);
    const [showDeleteToast, setShowDeleteToast] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState<
        Record<FilterField, string[]>
    >({
        name: [],
        languages: [],
        positions: [],
    });

    const handleSelectRow = (id: number) => {
        setSelectedIds((prevBox) =>
            prevBox.includes(id) ? prevBox.filter((currentId) => currentId !== id) : [...prevBox, id]
        );
    };
    // currently only for the main search
    const filteredVolunteers = volunteers.filter((volunteer) => {
        // main search
        const matchesSearch = volunteer.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase().trim());

        // name filter
        const matchesName =
            selectedFilters.name.length === 0 ||
            selectedFilters.name.some((name) =>
                volunteer.name.toLowerCase().includes(name.toLowerCase())
            );

        // spoken languages filter (volunteer has at least one of the selected languages)
        const matchesLanguages =
            selectedFilters.languages.length === 0 ||
            selectedFilters.languages.some((language) =>
                volunteer.languages.some((spokenLanguage) =>
                    spokenLanguage.toLowerCase() === language.toLowerCase()
                )
            );

        // positions filter (volunteer has at least one of the selected positions)
        const matchesPositions =
            selectedFilters.positions.length === 0 ||
            selectedFilters.positions.some((position) =>
                volunteer.positions.some((volunteerPosition) =>
                    volunteerPosition.toLowerCase() === position.toLowerCase()
                )
            );

        return (
            matchesSearch &&
            matchesName &&
            matchesLanguages &&
            matchesPositions
        );
    });
    const handleToggleFilter = (field: FilterField, value: string) => {
        setSelectedFilters((prev) => {
            const current = prev[field];

            return {
                ...prev,
                [field]: current.includes(value)
                    ? current.filter((item) => item !== value)
                    : [...current, value],
            };
        });
    };
    const handleSelectAll = () => {
        // get id of all visible volunteers
        const visibleIds = filteredVolunteers.map((volunteer) => volunteer.id);
        // nothing to do if the table is empty
        if (visibleIds.length === 0) return;

        // check if all visible volunteers are selected
        const allVisibleSelected = visibleIds.every((id) =>
            selectedIds.includes(id)
        );

        if (allVisibleSelected) {
            // deselect all visible volunteers
            setSelectedIds((prev) =>
                prev.filter((id) => !visibleIds.includes(id))
            );
        } else {
            // select all visible ids and keep the previous ones
            setSelectedIds((prev) => [
                ...new Set([...prev, ...visibleIds])
            ]);
        }
    };
    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };
    const handleConfirmDelete = () => {
        setDeletedVolunteers(
            volunteers.filter((volunteer) => selectedIds.includes(volunteer.id))
        );

        // new volunteer list is all volunteers - currently selected  
        setVolunteers((prev) =>
            prev.filter((volunteer) => !selectedIds.includes(volunteer.id))
        );
        

        setSelectedIds([]);
        setShowDeleteModal(false);
        setShowDeleteToast(true);
    };
    const handleUndo = () => {
        setVolunteers((prev) => {
            // new array with current + deleted volunteers
            const restored = [...prev, ...deletedVolunteers];

            // Restore the original order of the volunteers
            return restored.sort((a, b) => a.id - b.id);
        });

        setDeletedVolunteers([]);
        setShowDeleteToast(false);
    };

    
    
    return (
        <div className="relative flex-1 w-full">
            <VolunteersToolbar
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            setSearchQuery={setSearchQuery}
            selectedFilters={selectedFilters}
            onToggleFilter={handleToggleFilter}
            />

            <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse table-fixed text-sm">
                    <thead>
                        <tr className="border-b border-sandstone-300 h-[35px]">
                            <th className="w-[32px]"></th>
                            <th className="w-[30px] p-2 text-left">
                                <input
                                    type="checkbox"
                                    className="h-3.5 w-3.5 rounded border border-sandstone-400 bg-white accent-navy-800 cursor-pointer"
                                    checked={
                                        filteredVolunteers.length > 0 &&
                                        filteredVolunteers.every((volunteer) =>
                                            selectedIds.includes(volunteer.id)
                                        )
                                    }
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="w-[117px] p-2 text-left font-bold text-[#162022] border-r border-sandstone-300">
                                Name
                            </th>
                            <th className="w-[198.67px] p-2 text-left font-bold text-[#162022] border-r border-sandstone-300">
                                Email
                            </th> 
                            <th className="w-[133px] p-2 text-left font-bold text-[#162022] border-r border-sandstone-300">
                                Phone Number
                            </th> 
                            <th className="w-[156px] p-2 text-left font-bold text-[#162022] border-r border-sandstone-300">
                                Spoken Languages
                            </th> 
                            <th className="w-[198.67px] p-2 text-left font-bold text-[#162022] border-r border-sandstone-300">
                                Positions
                            </th> 
                            <th className="w-[149px] p-2 text-left font-bold text-[#162022] border-r border-sandstone-300">
                                # Approved Shifts
                            </th> 
                            <th className="w-[149px] p-2 text-left font-bold text-[#162022] border-r border-sandstone-300">
                                # Refused Shifts
                            </th> 
                            <th className="w-[149px] p-2 text-left font-bold text-[#162022] border-r border-sandstone-300">
                                Availability
                            </th>
                            <th className="w-[198.67px] p-2 text-left font-bold text-[#162022] border-r border-sandstone-300">
                                Notes
                            </th> 
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
                                            className="h-3.5 w-3.5 rounded border border-sandstone-400 bg-white accent-navy-800 cursor-pointer"
                                            checked={isChecked}
                                            onChange={() => handleSelectRow(volunteer.id)}
                                        />
                                    </td>

                                    <td className="border-r border-sandstone-300 p-2 truncate">
                                        {volunteer.name}
                                    </td>

                                    <td className="border-r border-sandstone-300 p-2 truncate">
                                        {volunteer.email}
                                    </td>

                                    <td className="border-r border-sandstone-300 p-2 truncate">
                                        {volunteer.phone}
                                    </td>

                                    <td className="border-r border-sandstone-300 p-2 truncate">
                                        {volunteer.languages.join(", ")}
                                    </td>

                                    <td className="border-r border-sandstone-300 p-2 truncate">
                                        {volunteer.positions.join(", ")}
                                    </td>

                                    <td className="border-r border-sandstone-300 p-2">
                                        {volunteer.approvedShifts}
                                    </td>

                                    <td className="border-r border-sandstone-300 p-2">
                                        {volunteer.refusedShifts}
                                    </td>

                                    <td className="border-r border-sandstone-300 p-2 truncate">
                                        {volunteer.availability.join(", ")}
                                    </td>

                                    <td className="border border-sandstone-300 p-2 truncate">
                                        {volunteer.notes}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <SelectionBanner
                selectedCount={selectedIds.length}
                onDelete={handleDeleteClick}
            />
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                selectedCount={selectedIds.length}
                onConfirm={handleConfirmDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
            <DeleteToast
                isOpen={showDeleteToast}
                deletedNames={deletedVolunteers.map((volunteer) => volunteer.name)}
                onUndo={handleUndo}
                onClose={() => setShowDeleteToast(false)}
            />

        </div>
        
    );


}