import { FaTrashAlt } from "react-icons/fa";

type SelectionBannerProps = {
    selectedCount: number;
    onDelete: () => void;
};

export default function SelectionBanner({
    selectedCount,
    onDelete,
}: SelectionBannerProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="absolute bottom-0 left-0 right-0 z-30 flex h-[64px] items-center justify-between bg-sandstone-500 px-8 py-4">
            <div className="text-[14px] leading-none text-sandstone-100">
                <span className="font-bold">{selectedCount}</span>
                {" "}selected
            </div>

            <button
                type="button"
                onClick={onDelete}
                className="flex h-[32px] items-center justify-center gap-[6px] rounded-[4px] bg-[#E84545] px-[10px] text-[14px] leading-none text-white cursor-pointer"
            >
                <FaTrashAlt className="h-4 w-4" />
                <span>Delete</span>
            </button>
        </div>
    );
}