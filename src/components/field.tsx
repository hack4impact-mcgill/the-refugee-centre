import type { ReactNode } from "react";

export const fieldClassName =
  "flex w-full items-center justify-between gap-2 rounded-lg border border-sandstone-300 bg-white px-3 py-2";

/** An overline label above a control */
export default function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      {htmlFor ? (
        <label
          className="text-overline uppercase text-navy-700"
          htmlFor={htmlFor}
        >
          {label}
        </label>
      ) : (
        <span className="text-overline uppercase text-navy-700">{label}</span>
      )}
      {children}
    </div>
  );
}
