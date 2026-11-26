"use client";

import { useState, type ReactNode } from "react";
import { BsSearch } from "react-icons/bs";

/** A plain toolbar action, e.g. "Export". */
export const toolbarButtonClassName =
  "flex items-center justify-center h-[38px] px-[10px] py-2 rounded-lg text-[16px] leading-[22px] tracking-[-0.006em] text-navy-900 cursor-pointer";

/** The navy toolbar action, e.g. "Add profile". */
export const toolbarPrimaryButtonClassName =
  "flex items-center justify-center gap-3 h-[38px] px-[10px] py-2 bg-navy-900 text-white rounded-lg text-[16px] leading-[22px] tracking-[-0.006em] cursor-pointer";

type TableToolbarProps = {
  /** Called with the typed text when the user presses Enter. */
  onSearch: (query: string) => void;
  /** The buttons on the right, styled with the classes above. */
  actions?: ReactNode;
  /** The second row, usually a `FilterMenu`. Left out, there is no second row. */
  filters?: ReactNode;
};

/** The search box, actions and filters above a `DataTable`. */
export default function TableToolbar({
  onSearch,
  actions,
  filters,
}: TableToolbarProps) {
  const [searchInput, setSearchInput] = useState("");

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
                onSearch(searchInput);
              }
            }}
            className="w-full bg-transparent outline-none text-body1 text-navy-900 placeholder:text-sandstone-500"
          />
        </div>

        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {filters && (
        <div className="flex items-center h-[40px] px-8 py-[6px] bg-sandstone-100 border-b border-sandstone-300">
          {filters}
        </div>
      )}
    </div>
  );
}
