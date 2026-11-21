import { BsSearch, BsPlusCircleFill } from "react-icons/bs";
import VolunteerFilterMenu from "./volunteer-filter-menu";

type VolunteersToolbarProps = {
  searchInput: string;
  setSearchInput: (value: string) => void;
  setSearchQuery: (value: string) => void;
  selectedFilters: Record<"name" | "languages" | "positions", string[]>;
  onToggleFilter: (
    field: "name" | "languages" | "positions",
    value: string,
  ) => void;
};

export default function VolunteersToolbar({
  searchInput,
  setSearchInput,
  setSearchQuery,
  selectedFilters,
  onToggleFilter,
}: VolunteersToolbarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between h-[70px] px-8 py-4 bg-sandstone-100 border-b border-sandstone-300">
        <div className="flex items-center gap-3 w-[458px] h-[38px] px-3 py-2 bg-white border border-sandstone-300 rounded-lg">
          <BsSearch className="w-5 h-5 shrink-0 text-sandstone-500" />

          <input
            type="text"
            placeholder="Search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchQuery(searchInput);
              }
            }}
            className="w-full bg-transparent outline-none text-[16px] leading-[18px] tracking-[-0.006em] text-navy-900 placeholder:text-sandstone-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center justify-center h-[38px] px-[10px] py-2 rounded-lg text-[16px] leading-[22px] tracking-[-0.006em] text-navy-900 cursor-pointer"
          >
            Export
          </button>

          <button
            type="button"
            className="flex items-center justify-center gap-3 h-[38px] px-[10px] py-2 bg-navy-900 text-white rounded-lg text-[16px] leading-[22px] tracking-[-0.006em] cursor-pointer"
          >
            <BsPlusCircleFill className="w-[22px] h-[22px] shrink-0" />
            <span>Add profile</span>
          </button>
        </div>
      </div>

      <div className="flex items-center h-[40px] px-8 py-[6px] bg-sandstone-100 border-b border-sandstone-300">
        <VolunteerFilterMenu
          selectedFilters={selectedFilters}
          onToggleFilter={onToggleFilter}
        />
      </div>
    </div>
  );
}
