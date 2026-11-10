type DeleteConfirmationModalProps = {
  isOpen: boolean;
  selectedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DeleteConfirmationModal({
  isOpen,
  selectedCount,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="flex w-[303px] flex-col gap-6 rounded-lg border border-sandstone-400 bg-white p-4 shadow-[0_4px_10px_0_#0000001A]"
      >
        {/* Title and description */}
        <div className="flex flex-col gap-2 text-center">
          <h2
            id="delete-dialog-title"
            className="text-[24px] font-semibold leading-none tracking-[-0.006em] text-black"
          >
            {selectedCount === 1
              ? "Delete this profile?"
              : "Delete these profiles?"}
          </h2>

          <p className="text-[16px] leading-[18px] tracking-[-0.006em] text-black">
            Are you sure you want to delete{" "}
            {selectedCount === 1
              ? "this profile"
              : `these ${selectedCount} profiles`}
            ? This action cannot be reversed.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-[26px] items-center justify-center whitespace-nowrap rounded-[4px] border border-[#163445] px-[10px] text-[14px] text-[#163445] cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex h-[26px] items-center justify-center whitespace-nowrap rounded-[4px] bg-[#E84545] px-[10px] text-[14px] text-white cursor-pointer"
          >
            {selectedCount === 1
              ? "Yes, delete profile"
              : "Yes, delete profiles"}
          </button>
        </div>
      </div>
    </div>
  );
}
