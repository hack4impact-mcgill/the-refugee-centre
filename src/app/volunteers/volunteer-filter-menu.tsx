"use client";

import { useState } from "react";
import {
    BsPlusLg,
    BsArrowRightShort,
    BsCheck2,
    BsXCircleFill,
} from "react-icons/bs";
import { FaFilter } from "react-icons/fa";

type FilterField = "name" | "languages" | "positions";
type VolunteerFilterMenuProps = {
    selectedFilters: Record<FilterField, string[]>;
    onToggleFilter: (field: FilterField, value: string) => void;
};

const FILTER_FIELDS: { field: FilterField; label: string }[] = [
    { field: "name", label: "Name" },
    { field: "languages", label: "Spoken Languages" },
    { field: "positions", label: "Positions" },
];

const LANGUAGES = [
    "Acehnese",
    "Acholi",
    "Afar",
    "Afrikaans",
    "Akan",
    "Albanian",
    "Amharic",
    "Arabic",
    "Aramaic",
    "English",
    "French",
];

const POSITIONS = [
    "Receptionist",
    "Portal Worker",
];

export default function VolunteerFilterMenu({
    selectedFilters,
    onToggleFilter,
}: VolunteerFilterMenuProps) {
    // is the dropdown visible
    const [isOpen, setIsOpen] = useState(false);
    // which filter category is open (main menu, languages, or positions)
    const [activeField, setActiveField] = useState<FilterField | null>(null);
    // what the user types inside the dropdown
    const [filterSearch, setFilterSearch] = useState("");

    const openField = (field: FilterField) => {
        setActiveField(field);
        setFilterSearch("");
        setIsOpen(true);
    };

    const options = activeField === "languages"
        ? LANGUAGES
        : activeField === "positions"
        ? POSITIONS
        : [];

    const visibleOptions = options.filter((option) =>
        option.toLowerCase().includes(filterSearch.toLowerCase())
    );

    return (
        <div className="relative flex items-center gap-2">

            {/* selected filters */}
            {FILTER_FIELDS.map(({ field, label }) => {
                const values = selectedFilters[field];

                if (values.length === 0) return null;

                return (
                    <div
                        key={field}
                        className="flex h-[28px] items-center gap-[6px] rounded-full bg-sandstone-400 pl-[10px] pr-1"
                    >
                        <button
                            type="button"
                            onClick={() => openField(field)}
                            className="flex items-center gap-[6px] text-[14px] text-navy-900 cursor-pointer"
                        >
                            <FaFilter className="h-[10px] w-[10px]" />
                            <span>
                                {field === "languages"
                                    ? "Spoken Language"
                                    : label}
                            </span>
                        </button>

                        {values.map((value) => (
                            <div
                                key={value}
                                className="flex h-[26px] items-center gap-[6px] rounded-full border border-sandstone-500 bg-sandstone-200 px-2"
                            >
                                <span className="text-[14px] text-navy-900">
                                    {value}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => onToggleFilter(field, value)}
                                    aria-label={`Remove ${value} filter`}
                                    className="cursor-pointer"
                                >
                                    <BsXCircleFill className="h-[14px] w-[14px] text-sandstone-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                );
            })}

            {/* add filter button */}
            <button
                type="button"
                onClick={() => {
                    // opens or closes the dropdown
                    setIsOpen(!isOpen);
                    // ret to main category menu
                    setActiveField(null);
                    // clear the dropdown search 
                    setFilterSearch("");
                }}
                className={`flex h-[28px] items-center justify-center gap-[6px] rounded-full px-[10px] text-[14px] text-navy-900 cursor-pointer ${
                    isOpen ? "bg-sandstone-700 text-white" : "bg-sandstone-200"
                }`}
            >
                <BsPlusLg className="h-[10px] w-[10px]" />
                <span>Add filter</span>
            </button>

            {/* dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 z-40 w-[458px] max-w-[calc(100vw-64px)] pt-1">

                    {/* search field */}
                    <div className="flex h-[40px] items-center rounded-t-lg border border-sandstone-300 bg-white px-3 py-2">
                        <input
                            type="text"
                            placeholder="Start typing to find a filter"
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (
                                    e.key === "Enter" &&
                                    activeField === "name" &&
                                    filterSearch.trim()
                                ) {
                                    const name = filterSearch.trim();

                                    if (!selectedFilters.name.includes(name)) {
                                        onToggleFilter("name", name);
                                    }
                                    setFilterSearch("");
                                }
                            }}
                            className="w-full bg-transparent text-[16px] leading-[18px] tracking-[-0.006em] text-navy-900 placeholder:text-sandstone-500 outline-none"
                        />
                    </div>

                    {/* menu */}
                    <div className="max-h-[350px] overflow-y-auto rounded-b-lg border-x border-b border-sandstone-300 bg-white py-1">

                        {activeField === null ? (
                            FILTER_FIELDS
                                .filter(({ label }) =>
                                    label.toLowerCase().includes(filterSearch.toLowerCase())
                                )
                                .map(({ field, label }) => (
                                    <button
                                        key={field}
                                        type="button"
                                        onClick={() => openField(field)}
                                        className="flex h-[38px] w-full items-center justify-between px-3 py-2 text-left text-[16px] leading-[18px] tracking-[-0.006em] text-navy-900 hover:bg-sandstone-200 cursor-pointer"
                                    >
                                        {label}
                                        {field !== "name" && (
                                            <BsArrowRightShort className="h-5 w-5" />
                                        )}
                                    </button>
                                ))
                        ) : activeField === "name" ? (
                            <div className="px-3 py-2 text-[14px] text-navy-900">
                                Type a name above and press Enter to add it.
                            </div>
                        ) : (
                            visibleOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => onToggleFilter(activeField, option)}
                                    className="flex h-[38px] w-full items-center justify-between px-3 py-2 text-left text-[16px] leading-[18px] tracking-[-0.006em] text-navy-900 hover:bg-sandstone-200 cursor-pointer"
                                >
                                    <span>{option}</span>

                                    {selectedFilters[activeField].includes(option) && (
                                        <BsCheck2 className="h-5 w-5 shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}