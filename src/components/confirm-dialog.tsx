"use client";

import { useEffect, useId } from "react";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Shown on the confirm button while `pending`. */
  pendingLabel?: string;
  cancelLabel?: string;
  /** "danger" for destructive actions such as deleting. */
  variant?: "danger" | "primary";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const confirmClassNames = {
  danger: "bg-danger",
  primary: "bg-navy-900",
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  pendingLabel = confirmLabel,
  cancelLabel = "Cancel",
  variant = "primary",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();

  // Escape cancels, except while the action is running.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pending, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="flex w-[303px] flex-col gap-6 rounded-lg border border-sandstone-400 bg-white p-4 shadow-[0_4px_10px_0_#0000001A]"
      >
        <div className="flex flex-col gap-2 text-center">
          <h2
            id={titleId}
            className="text-[24px] font-semibold leading-none tracking-[-0.006em] text-black"
          >
            {title}
          </h2>
          <p id={messageId} className="text-body1 text-black">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            autoFocus
            className="flex h-[26px] cursor-pointer items-center justify-center whitespace-nowrap rounded-[4px] border border-navy-900 px-[10px] text-[14px] text-navy-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`flex h-[26px] cursor-pointer items-center justify-center whitespace-nowrap rounded-[4px] px-[10px] text-[14px] text-white disabled:cursor-wait disabled:opacity-70 ${confirmClassNames[variant]}`}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
