import { BsInfoCircleFill, BsX } from "react-icons/bs";

type DeleteToastProps = {
  isOpen: boolean;
  deletedNames: string[];
  onUndo: () => void;
  onClose: () => void;
};

export default function DeleteToast({
  isOpen,
  deletedNames,
  onUndo,
  onClose,
}: DeleteToastProps) {
  if (!isOpen) return null;

  const message =
    deletedNames.length === 1
      ? `${deletedNames[0]} removed`
      : `${deletedNames.length} volunteers removed`;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex min-h-[64px] min-w-[300px] max-w-[400px] items-center justify-between gap-3 rounded-lg border border-navy-700 bg-navy-200 px-4 shadow-[-4px_4px_20px_0_#0000000D]">
      {/* Icon and message */}
      <div className="flex min-w-0 items-center gap-2">
        <BsInfoCircleFill className="h-6 w-6 shrink-0 text-navy-700" />

        <span className="text-[16px] leading-[18px] tracking-[-0.006em] text-sandstone-900">
          {message}
        </span>
      </div>

      {/* Undo and close */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          className="rounded px-1 py-[2px] text-[11px] text-sandstone-600 cursor-pointer"
        >
          Undo
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="cursor-pointer"
        >
          <BsX className="h-[22px] w-[22px] text-sandstone-600" />
        </button>
      </div>
    </div>
  );
}
